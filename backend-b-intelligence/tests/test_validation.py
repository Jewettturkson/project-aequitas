"""Unit tests for request validation and mock embeddings.

These run without a database or OpenAI key: app.py initializes its
connection pool and OpenAI client lazily, so importing it is side-effect free.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("MOCK_EMBEDDINGS", "true")

from app import _mock_embedding, _validate_payload, _validate_volunteer_index_payload  # noqa: E402


class TestMatchPayloadValidation:
    def test_valid_payload(self):
        result, error = _validate_payload(
            {"projectDescription": "Need volunteers skilled in solar microgrid design.", "topK": 5}
        )
        assert error is None
        assert result["top_k"] == 5

    def test_description_is_normalized(self):
        result, error = _validate_payload({"projectDescription": "  Need   GIS mapping\n support urgently.  "})
        assert error is None
        assert result["description"] == "Need GIS mapping support urgently."

    def test_missing_description(self):
        result, error = _validate_payload({"topK": 5})
        assert result is None and error is not None

    def test_short_description_rejected(self):
        result, error = _validate_payload({"projectDescription": "too short"})
        assert result is None and error is not None

    def test_non_dict_payload(self):
        result, error = _validate_payload(None)
        assert result is None and error is not None

    def test_invalid_top_k(self):
        result, error = _validate_payload(
            {"projectDescription": "A perfectly valid project description.", "topK": "many"}
        )
        assert result is None and error is not None

    def test_top_k_out_of_range(self):
        result, error = _validate_payload(
            {"projectDescription": "A perfectly valid project description.", "topK": 21}
        )
        assert result is None and error is not None


class TestVolunteerIndexValidation:
    def test_valid_payload(self):
        result, error = _validate_volunteer_index_payload(
            {
                "userId": "550e8400-e29b-41d4-a716-446655440000",
                "skillSummary": "GIS mapping and rapid field deployment experience.",
            }
        )
        assert error is None
        assert result["user_id"] == "550e8400-e29b-41d4-a716-446655440000"

    def test_invalid_uuid(self):
        result, error = _validate_volunteer_index_payload(
            {"userId": "not-a-uuid", "skillSummary": "GIS mapping and rapid field deployment."}
        )
        assert result is None and error is not None

    def test_missing_skill_summary(self):
        result, error = _validate_volunteer_index_payload(
            {"userId": "550e8400-e29b-41d4-a716-446655440000"}
        )
        assert result is None and error is not None


class TestMockEmbedding:
    def test_deterministic(self):
        assert _mock_embedding("solar microgrid design") == _mock_embedding("solar microgrid design")

    def test_different_inputs_differ(self):
        assert _mock_embedding("solar power") != _mock_embedding("water sanitation")

    def test_dimension_and_normalization(self):
        vec = _mock_embedding("anything at all")
        assert len(vec) == 1536
        norm = sum(v * v for v in vec) ** 0.5
        assert abs(norm - 1.0) < 1e-9
