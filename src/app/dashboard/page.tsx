import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { Avatar } from "@/components/avatar";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-card-border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}

export default async function OverviewPage() {
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
      invites: true,
    },
  });

  if (!family) {
    redirect("/signup");
  }

  const allPosts = family.children.flatMap((child) =>
    child.toothPosts.map((post) => ({ ...post, childName: child.name }))
  );
  const totalReceivedCents = allPosts
    .flatMap((post) => post.gifts)
    .filter((gift) => gift.status === "SUCCEEDED")
    .reduce((sum, gift) => sum + gift.amountCents, 0);
  const circleSize = family.invites.filter((i) => i.status !== "REVOKED").length;
  const recentPosts = allPosts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {family.name}
        </h1>
        <p className="text-sm text-muted">Signed in as {user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Kids" value={family.children.length} />
        <StatCard label="Circle size" value={circleSize} />
        <StatCard label="Total received" value={formatCents(totalReceivedCents)} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-foreground">
          Recent tooth posts
        </h2>
        {recentPosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-card-border p-10 text-center">
            <p className="text-sm text-muted">No tooth posts yet.</p>
            <Link
              href="/dashboard/kids"
              className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-display font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
            >
              Add a kid and post one
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentPosts.map((post) => {
              const total = post.gifts
                .filter((g) => g.status === "SUCCEEDED")
                .reduce((sum, g) => sum + g.amountCents, 0);
              return (
                <li
                  key={post.id}
                  className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-4"
                >
                  <Avatar label={post.childName} />
                  <p className="flex-1 text-sm text-foreground">
                    <span className="font-medium">{post.childName}</span>{" "}
                    {post.note ? `— ${post.note}` : "lost a tooth"}
                  </p>
                  <span className="whitespace-nowrap rounded-full bg-gold-500/20 px-3 py-1 font-display text-xs font-bold text-gold-600">
                    {formatCents(total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
