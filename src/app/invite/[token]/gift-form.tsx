"use client";

import { useState } from "react";

const inputClass =
  "w-full sm:flex-1 rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function GiftForm({
  toothPostId,
  inviteToken,
}: {
  toothPostId: string;
  inviteToken: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const dollars = Number(form.get("amount"));

    const res = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toothPostId,
        inviteToken,
        senderName: form.get("senderName"),
        senderEmail: form.get("senderEmail"),
        amountCents: Math.round(dollars * 100),
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="senderName"
          placeholder="Your name"
          required
          className={inputClass}
        />
        <input
          name="senderEmail"
          type="email"
          placeholder="Your email"
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="Amount ($)"
          required
          className={`w-full sm:w-32 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-display font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "Redirecting…" : "Send a gift"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
