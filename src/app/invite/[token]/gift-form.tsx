"use client";

import { useState } from "react";

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
      <div className="flex gap-2">
        <input
          name="senderName"
          placeholder="Your name"
          required
          className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
        />
        <input
          name="senderEmail"
          type="email"
          placeholder="Your email"
          required
          className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
        />
      </div>
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          placeholder="Amount ($)"
          required
          className="w-32 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {submitting ? "Redirecting…" : "Send a gift"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
