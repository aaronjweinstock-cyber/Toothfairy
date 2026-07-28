import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { GiftForm } from "./gift-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      family: {
        include: {
          children: {
            include: {
              toothPosts: {
                include: { gifts: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!invite || invite.status === "REVOKED") {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <Logo />

      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {invite.family.name}
        </h1>
        <p className="text-sm text-muted">
          You&apos;ve been invited to send a tooth fairy gift.
        </p>
      </div>

      {invite.family.children.flatMap((child) =>
        child.toothPosts.map((post) => {
          const total = post.gifts
            .filter((g) => g.status === "SUCCEEDED")
            .reduce((sum, g) => sum + g.amountCents, 0);
          return (
            <div
              key={post.id}
              className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar label={child.name} size="lg" />
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {child.name} lost a tooth
                    {post.note ? ` — ${post.note}` : ""}
                  </h2>
                </div>
                <span className="whitespace-nowrap rounded-full bg-gold-500/20 px-3 py-1 font-display text-xs font-bold text-gold-600">
                  {(total / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}{" "}
                  received
                </span>
              </div>
              {post.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external Blob URL, not worth next/image config for a scaffold
                <img
                  src={post.photoUrl}
                  alt="The lost tooth"
                  className="max-h-64 w-auto rounded-xl object-contain"
                />
              )}
              <GiftForm toothPostId={post.id} inviteToken={token} />
            </div>
          );
        })
      )}

      {invite.family.children.every((c) => c.toothPosts.length === 0) && (
        <p className="text-sm text-muted">No tooth posts yet — check back soon.</p>
      )}
    </main>
  );
}
