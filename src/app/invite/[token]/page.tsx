import { notFound } from "next/navigation";
import { db } from "@/lib/db";
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
      <div>
        <h1 className="text-2xl font-semibold">{invite.family.name}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
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
              className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">
                  {child.name} lost a tooth{post.note ? ` — ${post.note}` : ""}
                </h2>
                <span className="text-sm text-gray-500">
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
                  className="max-h-64 w-auto rounded object-contain"
                />
              )}
              <GiftForm toothPostId={post.id} inviteToken={token} />
            </div>
          );
        })
      )}

      {invite.family.children.every((c) => c.toothPosts.length === 0) && (
        <p className="text-sm text-gray-500">
          No tooth posts yet — check back soon.
        </p>
      )}
    </main>
  );
}
