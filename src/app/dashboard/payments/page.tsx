import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { refreshStripeOnboardingStatus } from "@/lib/stripe";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const stripeOnboardingComplete = await refreshStripeOnboardingStatus(user);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Payments</h1>

      <section
        className={`flex flex-col gap-3 rounded-3xl border p-6 ${
          stripeOnboardingComplete
            ? "border-success/20 bg-success-light"
            : "border-card-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-foreground">Payouts</h2>
          {!stripeOnboardingComplete && (
            <a
              href="/api/stripe/connect"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-display font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
            >
              Set up payouts with Stripe
            </a>
          )}
        </div>
        <p className="text-sm text-muted">
          {stripeOnboardingComplete
            ? "Payouts are set up. Gifts land in your Stripe balance until you withdraw."
            : "Set up Stripe Connect so gifted money can be paid out to you."}
        </p>
      </section>
    </div>
  );
}
