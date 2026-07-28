import Stripe from "stripe";
import { db } from "@/lib/db";

let stripeClient: Stripe | undefined;

// Lazily constructed so importing this module (e.g. during `next build`'s
// route analysis) doesn't require STRIPE_SECRET_KEY to be set.
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return stripeClient;
}

/**
 * Best-effort fallback for onboarding status: with "Accounts v1 support"
 * enabled, this Stripe account emits v2-style events (e.g.
 * `v2.core.account[configuration.recipient].capability_status_updated`)
 * instead of the classic v1 `account.updated` event our webhook listens
 * for, so the webhook never fires. Until the Connect integration is
 * properly migrated to Accounts v2 (see README), check the account
 * directly via the v1 read API -- still supported alongside v1 creation --
 * and self-heal the DB flag if it's actually done. Never throws; falls
 * back to the existing DB value on any error.
 */
export async function refreshStripeOnboardingStatus(user: {
  id: string;
  stripeAccountId: string;
  stripeOnboardingComplete: boolean;
}): Promise<boolean> {
  if (user.stripeOnboardingComplete || !user.stripeAccountId) {
    return user.stripeOnboardingComplete;
  }

  try {
    const account = await getStripe().accounts.retrieve(user.stripeAccountId);
    const complete = account.details_submitted ?? false;
    if (complete) {
      await db.user.update({
        where: { id: user.id },
        data: { stripeOnboardingComplete: true },
      });
    }
    return complete;
  } catch (error) {
    console.error("Failed to refresh Stripe onboarding status", error);
    return user.stripeOnboardingComplete;
  }
}
