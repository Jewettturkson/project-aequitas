import os
import logging
import hashlib
import math
import random

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from openai import OpenAI, APIConnectionError, APITimeoutError, APIStatusError, RateLimitError
import psycopg2
from psycopg2 import OperationalError
from psycopg2.errors import UndefinedTable
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
from pgvector.psycopg2 import register_vector

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("enturk-intelligence")

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
MOCK_EMBEDDINGS = os.getenv("MOCK_EMBEDDINGS", "false").lower() == "true"

if not DATABASE_URL:
  raise RuntimeError("DATABASE_URL is required")
if not MOCK_EMBEDDINGS and not OPENAI_API_KEY:
  raise RuntimeError("OPENAI_API_KEY is required")

db_pool = ThreadedConnectionPool(
  minconn=int(os.getenv("DB_POOL_MIN", "1")),
  maxconn=int(os.getenv("DB_POOL_MAX", "10")),
  dsn=DATABASE_URL
)

bootstrap_conn = db_pool.getconn()
try:
  register_vector(bootstrap_conn)
finally:
  db_pool.putconn(bootstrap_conn)

openai_client = None if MOCK_EMBEDDINGS else OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
  return response


def _validate_payload(payload):
  if not isinstance(payload, dict):
    return None, "Request body must be a JSON object."

  description = payload.get("projectDescription") or payload.get("project_description")
  if not isinstance(description, str):
    return None, "projectDescription must be a string."

  normalized = " ".join(description.strip().split())
  if len(normalized) < 20:
    return None, "projectDescription must be at least 20 characters."

  top_k = payload.get("topK", 5)
  if not isinstance(top_k, int) or top_k < 1 or top_k > 20:
    return None, "topK must be an integer between 1 and 20."

  return {"description": normalized, "top_k": top_k}, None


def _embed_description(description):
  if MOCK_EMBEDDINGS:
    return _mock_embedding(description)

  response = openai_client.embeddings.create(
    model=EMBED_MODEL,
    input=description,
  )
  vector = response.data[0].embedding
  if len(vector) != 1536:
    raise ValueError(f"Expected 1536-dimensional embedding, got {len(vector)}")
  return vector


def _mock_embedding(description):
  seed = int.from_bytes(hashlib.sha256(description.encode("utf-8")).digest()[:8], "big")
  generator = random.Random(seed)
  values = [generator.uniform(-1.0, 1.0) for _ in range(1536)]
  norm = math.sqrt(sum(value * value for value in values)) or 1.0
  return [value / norm for value in values]


def _query_top_volunteers(embedding, top_k):
  vector_literal = "[" + ",".join(f"{value:.8f}" for value in embedding) + "]"

  sql = """
    SELECT
      u.id AS volunteer_id,
      u.full_name,
      u.email,
      vv.skill_summary,
      GREATEST(
        0::numeric,
        LEAST(1::numeric, ROUND((1 - (vv.embedding <=> %s::vector))::numeric, 6))
      ) AS cosine_similarity
    FROM volunteer_vectors vv
    JOIN users u ON u.id = vv.user_id
    WHERE u.is_active = TRUE
    ORDER BY vv.embedding <=> %s::vector
    LIMIT %s
  """

  conn = db_pool.getconn()
  try:
    register_vector(conn)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
      cur.execute(sql, (vector_literal, vector_literal, top_k))
      return cur.fetchall()
  finally:
    db_pool.putconn(conn)


@app.get("/healthz")
def healthz():
  return jsonify({
    "status": "ok",
    "embedding_mode": "mock" if MOCK_EMBEDDINGS else "openai",
    "embedding_model": EMBED_MODEL
  }), 200


@app.route("/api/v1/match", methods=["POST", "OPTIONS"])
def match():
  if request.method == "OPTIONS":
    return ("", 204)

  payload = request.get_json(silent=True)
  validated, error = _validate_payload(payload)
  if error:
    return jsonify({"error": {"code": "VALIDATION_ERROR", "message": error}}), 400

  try:
    embedding = _embed_description(validated["description"])
    matches = _query_top_volunteers(embedding, validated["top_k"])

    return jsonify({
      "data": matches[:5],
      "meta": {
        "embedding_model": EMBED_MODEL,
        "requested_top_k": validated["top_k"],
        "returned": min(5, len(matches))
      }
    }), 200

  except (RateLimitError, APITimeoutError, APIConnectionError):
    return jsonify({
      "error": {
        "code": "EMBEDDING_UNAVAILABLE",
        "message": "Embedding provider temporarily unavailable. Retry shortly."
      }
    }), 503

  except APIStatusError:
    return jsonify({
      "error": {
        "code": "EMBEDDING_PROVIDER_ERROR",
        "message": "Embedding provider returned an error."
      }
    }), 502

  except UndefinedTable:
    return jsonify({
      "error": {
        "code": "SCHEMA_NOT_READY",
        "message": "volunteer_vectors table is missing. Run database bootstrap first."
      }
    }), 503

  except OperationalError:
    return jsonify({
      "error": {
        "code": "DB_UNAVAILABLE",
        "message": "Database connection is unavailable."
      }
    }), 503

  except Exception as exc:
    logger.exception("Matching flow failed: %s", exc)
    return jsonify({
      "error": {
        "code": "MATCHING_INTERNAL_ERROR",
        "message": "Unexpected internal matching failure."
      }
    }), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
