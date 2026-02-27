import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type CreateDonationIntentRequest = {
  amount?: number | string;
  currency?: string;
  campaignId?: string;
};

const DEFAULT_CURRENCY = (process.env.STRIPE_DONATION_CURRENCY || "usd").toLowerCase();

function parseAmountLimit(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

const MIN_DONATION_AMOUNT = parseAmountLimit(process.env.STRIPE_MIN_DONATION_AMOUNT, 1);
const MAX_DONATION_AMOUNT = parseAmountLimit(process.env.STRIPE_MAX_DONATION_AMOUNT, 10000);

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key is missing.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function parseAmount(value: CreateDonationIntentRequest["amount"]) {
  const normalized = typeof value === "string" ? Number(value) : value;
  if (typeof normalized !== "number" || !Number.isFinite(normalized)) {
    return null;
  }

  const cents = toCents(normalized);
  if (Math.abs(normalized * 100 - cents) > 0.00001) {
    return null;
  }

  return cents;
}

function parseCurrency(value: CreateDonationIntentRequest["currency"]) {
  const normalized = (value || DEFAULT_CURRENCY).toLowerCase().trim();
  if (!/^[a-z]{3}$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    let payload: CreateDonationIntentRequest;
    try {
      payload = (await request.json()) as CreateDonationIntentRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const amountInCents = parseAmount(payload.amount);
    const currency = parseCurrency(payload.currency);

    if (!amountInCents || amountInCents <= 0) {
      return NextResponse.json(
        { error: "Donation amount must be a positive number with up to two decimals." },
        { status: 400 }
      );
    }

    if (!currency) {
      return NextResponse.json({ error: "Currency must be a valid ISO code." }, { status: 400 });
    }

    const minDonationAmount = Math.min(MIN_DONATION_AMOUNT, MAX_DONATION_AMOUNT);
    const maxDonationAmount = Math.max(MIN_DONATION_AMOUNT, MAX_DONATION_AMOUNT);
    const minAmountInCents = toCents(minDonationAmount);
    const maxAmountInCents = toCents(maxDonationAmount);
    if (amountInCents < minAmountInCents || amountInCents > maxAmountInCents) {
      return NextResponse.json(
        {
          error: `Donation amount must be between ${minDonationAmount} and ${maxDonationAmount}.`,
        },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: payload.campaignId
        ? {
            campaignId: payload.campaignId.slice(0, 100),
          }
        : undefined,
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client secret.");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to initialize donation payment intent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
