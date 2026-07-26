import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const stripe = getStripe();
  let accountId = user.stripeAccountId || undefined;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    accountId = account.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/stripe/connect`,
    return_url: `${appUrl}/dashboard`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}
