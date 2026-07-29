import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Avatar, AvatarStack } from "@/components/avatar";
import { createInvite, revokeInvite } from "../actions";
import { SendInviteButton } from "../send-invite-button";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gold-500/15 text-gold-600",
  ACCEPTED: "bg-success-light text-success",
  REVOKED: "bg-black/5 text-muted dark:bg-white/10",
};

const inputClass =
  "w-full sm:flex-1 rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default async function InvitesPage() {
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
    include: { invites: { orderBy: { createdAt: "desc" } } },
  });

  if (!family) {
    redirect("/signup");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const circleLabels = family.invites
    .filter((invite) => invite.status !== "REVOKED")
    .map((invite) => invite.email);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Invite your circle
        </h1>
        <AvatarStack labels={circleLabels} />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6">
        <p className="text-sm text-muted">
          Invite specific people by email. Only people you invite can see
          this circle and send gifts &mdash; there&apos;s no public link.
        </p>

        <form
          action={createInvite.bind(null, family.id)}
          className="flex flex-col gap-2 sm:flex-row"
        >
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
              className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar label={invite.email} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-foreground">{invite.email}</div>
                  {invite.status === "PENDING" && (
                    <code className="block text-xs break-all text-muted">
                      {appUrl}/invite/{invite.token}
                    </code>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
      </div>
    </div>
  );
}
