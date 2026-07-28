"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

const inputClass =
  "w-full rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email,
        password,
        familyName: form.get("familyName"),
      }),
    });

    if (!res.ok) {
      setSubmitting(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Account created, but logging in failed — try logging in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <Link href="/" className="self-center">
        <Logo />
      </Link>
      <div className="rounded-3xl border border-card-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Create your account
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Your name
            <input name="name" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Family / kid name (e.g. &quot;Emma&apos;s Circle&quot;)
            <input name="familyName" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-brand-500 px-6 py-3 font-display font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
