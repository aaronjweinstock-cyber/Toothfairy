import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { addChild, addToothPost, createInvite, revokeInvite } from "./actions";

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const family = await db.family.findFirst({
    where: { ownerId: user.id },
    include: {
      children: {
        include: {
          toothPosts: {
            include: { gifts: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      invites: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!family) {
    redirect("/signup");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{family.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Signed in as {user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm underline" type="submit">
            Log out
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Payouts</h2>
          {!user.stripeOnboardingComplete && (
            <a
              href="/api/stripe/connect"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Set up payouts with Stripe
            </a>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {user.stripeOnboardingComplete
            ? "Payouts are set up. Gifts land in your Stripe balance until you withdraw."
            : "Set up Stripe Connect so gifted money can be paid out to you."}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Kids</h2>
        {family.children.map((child) => (
          <div
            key={child.id}
            className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/20"
          >
            <h3 className="font-medium">{child.name}</h3>

            <form
              action={addToothPost.bind(null, family.id)}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="childId" value={child.id} />
              <div className="flex gap-2">
                <input
                  name="note"
                  placeholder="Lost a tooth! (optional note)"
                  className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
                />
                <button
                  type="submit"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
                >
                  Post
                </button>
              </div>
              <label className="flex flex-col gap-1 text-xs text-gray-500">
                Photo of the tooth (optional) — please don&apos;t include
                photos of your child, just the tooth or note works great!
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="text-xs"
                />
              </label>
            </form>

            <ul className="flex flex-col gap-2">
              {child.toothPosts.map((post) => {
                const total = post.gifts
                  .filter((g) => g.status === "SUCCEEDED")
                  .reduce((sum, g) => sum + g.amountCents, 0);
                return (
                  <li
                    key={post.id}
                    className="flex flex-col gap-2 rounded bg-black/5 p-3 text-sm dark:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span>{post.note || "Lost a tooth"}</span>
                      <span className="font-medium">{formatCents(total)} received</span>
                    </div>
                    {post.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- external Blob URL, not worth next/image config for a scaffold
                      <img
                        src={post.photoUrl}
                        alt="The lost tooth"
                        className="max-h-48 w-auto rounded object-contain"
                      />
                    )}
                  </li>
                );
              })}
              {child.toothPosts.length === 0 && (
                <li className="text-sm text-gray-500">No tooth posts yet.</li>
              )}
            </ul>
          </div>
        ))}

        <form
          action={addChild.bind(null, family.id)}
          className="flex gap-2 rounded border border-dashed border-black/20 p-4 dark:border-white/20"
        >
          <input
            name="name"
            placeholder="Add a kid's name"
            required
            className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
          />
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Add
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Invite your circle</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Invite specific people by email. Only people you invite can see
          this circle and send gifts &mdash; there&apos;s no public link.
        </p>

        <form
          action={createInvite.bind(null, family.id)}
          className="flex gap-2"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="grandma@example.com"
            className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/20"
          />
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/20"
          >
            Invite
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {family.invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-2 rounded bg-black/5 p-3 text-sm dark:bg-white/10"
            >
              <div>
                <div>{invite.email}</div>
                {invite.status === "PENDING" && (
                  <code className="text-xs break-all text-gray-500">
                    {appUrl}/invite/{invite.token}
                  </code>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase text-gray-500">
                  {invite.status}
                </span>
                {invite.status === "PENDING" && (
                  <form action={revokeInvite.bind(null, family.id, invite.id)}>
                    <button type="submit" className="text-xs underline">
                      Revoke
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {family.invites.length === 0 && (
            <li className="text-sm text-gray-500">
              No invites sent yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
