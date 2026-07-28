import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripe, refreshStripeOnboardingStatus } from "@/lib/stripe";
import { giftSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = giftSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { toothPostId, inviteToken, senderName, senderEmail, amountCents } =
    parsed.data;

  const invite = await db.invite.findUnique({
    where: { token: inviteToken },
    include: { family: { include: { owner: true } } },
  });

  if (!invite || invite.status === "REVOKED") {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  const toothPost = await db.toothPost.findFirst({
    where: { id: toothPostId, child: { familyId: invite.familyId } },
    include: { child: true },
  });

  if (!toothPost) {
    return NextResponse.json({ error: "Tooth post not found" }, { status: 404 });
  }

  const owner = invite.family.owner;
  const ownerOnboardingComplete = await refreshStripeOnboardingStatus(owner);
  if (!ownerOnboardingComplete || !owner.stripeAccountId) {
    return NextResponse.json(
      { error: "This family hasn't finished setting up payouts yet" },
      { status: 422 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const gift = await db.gift.create({
    data: {
      toothPostId: toothPost.id,
      senderName,
      senderEmail,
      amountCents,
    },
  });

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: senderEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Tooth fairy gift for ${toothPost.child.name}`,
          },
        },
      },
    ],
    payment_intent_data: {
      transfer_data: { destination: owner.stripeAccountId },
    },
    success_url: `${appUrl}/invite/${inviteToken}?gift=success`,
    cancel_url: `${appUrl}/invite/${inviteToken}?gift=cancelled`,
    metadata: { giftId: gift.id },
  });

  await db.gift.update({
    where: { id: gift.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
