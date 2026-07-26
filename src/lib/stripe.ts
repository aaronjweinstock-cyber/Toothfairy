import Stripe from "stripe";

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
