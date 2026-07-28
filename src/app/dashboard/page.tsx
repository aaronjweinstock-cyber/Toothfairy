import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { refreshStripeOnboardingStatus } from "@/lib/stripe";
import { Logo } from "@/components/logo";
import { Avatar, AvatarStack } from "@/components/avatar";
import { addChild, addToothPost, createInvite, revokeInvite } from "./actions";
import { SendInviteButton } from "./send-invite-button";

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gold-500/15 text-gold-600",
  ACCEPTED: "bg-success-light text-success",
  REVOKED: "bg-black/5 text-muted dark:bg-white/10",
};

const inputClass =
  "flex-1 rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

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

  const stripeOnboardingComplete = await refreshStripeOnboardingStatus(user);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const circleLabels = family.invites
    .filter((invite) => invite.status !== "REVOKED")
    .map((invite) => invite.email);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            className="rounded-full border border-card-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-brand-50"
            type="submit"
          >
            Log out
          </button>
        </form>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {family.name}
        </h1>
        <p className="text-sm text-muted">Signed in as {user.email}</p>
      </div>

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

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-foreground">Kids</h2>
        {family.children.map((child) => (
          <div
            key={child.id}
            className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <Avatar label={child.name} size="lg" />
              <h3 className="font-display text-lg font-bold text-foreground">
                {child.name}
              </h3>
            </div>

            <form
              action={addToothPost.bind(null, family.id)}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="childId" value={child.id} />
              <div className="flex gap-2">
                <input
                  name="note"
                  placeholder="Lost a tooth! (optional note)"
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand-100 px-4 py-2 text-sm font-display font-semibold text-brand-700 transition hover:bg-brand-200"
                >
                  Post
                </button>
              </div>
              <label className="flex flex-col gap-1 text-xs text-muted">
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

            <ul className="flex flex-col gap-3">
              {child.toothPosts.map((post) => {
                const total = post.gifts
                  .filter((g) => g.status === "SUCCEEDED")
                  .reduce((sum, g) => sum + g.amountCents, 0);
                return (
                  <li
                    key={post.id}
                    className="flex flex-col gap-2 rounded-2xl bg-brand-50 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground">
                        {post.note || "Lost a tooth"}
                      </span>
                      <span className="whitespace-nowrap rounded-full bg-gold-500/20 px-3 py-1 font-display text-xs font-bold text-gold-600">
                        {formatCents(total)} received
                      </span>
                    </div>
                    {post.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- external Blob URL, not worth next/image config for a scaffold
                      <img
                        src={post.photoUrl}
                        alt="The lost tooth"
                        className="max-h-48 w-auto rounded-xl object-contain"
                      />
                    )}
                  </li>
                );
              })}
              {child.toothPosts.length === 0 && (
                <li className="text-sm text-muted">No tooth posts yet.</li>
              )}
            </ul>
          </div>
        ))}

        <form
          action={addChild.bind(null, family.id)}
          className="flex gap-2 rounded-3xl border border-dashed border-card-border p-5"
        >
          <input
            name="name"
            placeholder="Add a kid's name"
            required
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-full bg-brand-100 px-4 py-2 text-sm font-display font-semibold text-brand-700 transition hover:bg-brand-200"
          >
            Add
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            Invite your circle
          </h2>
          <AvatarStack labels={circleLabels} />
        </div>
        <p className="text-sm text-muted">
          Invite specific people by email. Only people you invite can see
          this circle and send gifts &mdash; there&apos;s no public link.
        </p>

        <form action={createInvite.bind(null, family.id)} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="grandma@example.com"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-full bg-brand-100 px-4 py-2 text-sm font-display font-semibold text-brand-700 transition hover:bg-brand-200"
          >
            Invite
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {family.invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4 text-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar label={invite.email} size="sm" />
                <div>
                  <div className="text-foreground">{invite.email}</div>
                  {invite.status === "PENDING" && (
                    <code className="text-xs break-all text-muted">
                      {appUrl}/invite/{invite.token}
                    </code>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                    STATUS_STYLES[invite.status] ?? STATUS_STYLES.REVOKED
                  }`}
                >
                  {invite.status}
                </span>
                {invite.status === "PENDING" && (
                  <SendInviteButton familyId={family.id} inviteId={invite.id} />
                )}
                {invite.status === "PENDING" && (
                  <form action={revokeInvite.bind(null, family.id, invite.id)}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-muted underline"
                    >
                      Revoke
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {family.invites.length === 0 && (
            <li className="text-sm text-muted">No invites sent yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
