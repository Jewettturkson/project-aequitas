"use client";

import { FormEvent, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

type CreatePaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
};

type PaymentFormProps = {
  onStatusChange: (message: string) => void;
  onPaymentSuccess: () => void;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const donationCurrency = (process.env.NEXT_PUBLIC_STRIPE_DONATION_CURRENCY || "usd").toLowerCase();
const defaultDonation = process.env.NEXT_PUBLIC_DEFAULT_DONATION_AMOUNT || "25";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function formatCurrency(amountInCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

function StripePaymentForm({ onStatusChange, onPaymentSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!stripe || !elements) {
      setErrorMessage("Stripe is still loading. Please wait and try again.");
      return;
    }

    setIsSubmitting(true);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setIsSubmitting(false);

    if (result.error) {
      const message = result.error.message || "Payment confirmation failed.";
      setErrorMessage(message);
      onStatusChange(message);
      return;
    }

    const status = result.paymentIntent?.status;
    if (status === "succeeded") {
      onStatusChange("Donation completed successfully.");
      onPaymentSuccess();
      return;
    }

    if (status === "processing") {
      onStatusChange("Donation is processing. Stripe will update status shortly.");
      return;
    }

    onStatusChange(`Payment status: ${status || "unknown"}.`);
  };

  return (
    <form onSubmit={handleConfirm} className="mt-4 space-y-3">
      <div className="rounded-lg border border-blue-200 bg-white p-3">
        <PaymentElement />
      </div>
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Donation"}
      </button>
    </form>
  );
}

export default function DonationPanel() {
  const [amountInput, setAmountInput] = useState(defaultDonation);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [summary, setSummary] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const parsedAmount = useMemo(() => Number(amountInput), [amountInput]);

  const beginDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Enter a valid donation amount.");
      return;
    }

    const roundedAmount = Math.round(parsedAmount * 100) / 100;
    if (Math.abs(roundedAmount - parsedAmount) > 0.00001) {
      setErrorMessage("Donation amount can have at most two decimals.");
      return;
    }

    setIsCreatingIntent(true);

    try {
      const response = await fetch("/api/donations/payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: roundedAmount,
          currency: donationCurrency,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | CreatePaymentIntentResponse
        | { error?: string };

      if (!response.ok || !("clientSecret" in payload) || !payload.clientSecret) {
        const message =
          "error" in payload && payload.error ? payload.error : "Unable to start donation.";
        setErrorMessage(message);
        return;
      }

      setClientSecret(payload.clientSecret);
      setSummary(formatCurrency(payload.amount, payload.currency));
    } catch {
      setErrorMessage("Network error while starting donation.");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const resetFlow = () => {
    setClientSecret("");
    setSummary("");
    setStatusMessage("");
    setErrorMessage("");
  };

  if (!publishableKey || !stripePromise) {
    return (
      <section className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <h3 className="text-base font-semibold text-amber-900">Donations</h3>
        <p className="mt-2 text-sm text-amber-800">
          Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable Stripe donations.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-blue-900">Support With A Donation</h3>
      <p className="mt-2 text-sm text-slate-600">
        Donations are processed securely through Stripe Payment Intents.
      </p>

      {!clientSecret ? (
        <form onSubmit={beginDonation} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-blue-900" htmlFor="donation-amount">
            Donation Amount ({donationCurrency.toUpperCase()})
          </label>
          <input
            id="donation-amount"
            type="number"
            min="1"
            step="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            placeholder="25.00"
            required
          />
          <button
            type="submit"
            disabled={isCreatingIntent}
            className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-200"
          >
            {isCreatingIntent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue To Payment"}
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-sm font-medium text-blue-900">Ready to confirm: {summary}</p>
          <Elements
            key={clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret,
            }}
          >
            <StripePaymentForm
              onStatusChange={(message) => {
                setStatusMessage(message);
                setErrorMessage("");
              }}
              onPaymentSuccess={() => {
                setClientSecret("");
                setSummary("");
              }}
            />
          </Elements>

          <button
            type="button"
            onClick={resetFlow}
            className="mt-3 text-sm font-semibold text-blue-900 underline underline-offset-2"
          >
            Change amount
          </button>
        </div>
      )}

      {statusMessage ? <p className="mt-3 text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
    </section>
  );
}
