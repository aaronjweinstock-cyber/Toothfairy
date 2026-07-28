import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { addChild, addToothPost } from "../actions";

const inputClass =
  "flex-1 rounded-xl border border-card-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default async function KidsPage() {
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
    },
  });

  if (!family) {
    redirect("/signup");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Kids</h1>

      {family.children.map((child) => (
        <div
          key={child.id}
          className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <Avatar label={child.name} size="lg" />
            <h2 className="font-display text-lg font-bold text-foreground">
              {child.name}
            </h2>
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
              Photo of the tooth (optional) — please don&apos;t include photos
              of your child, just the tooth or note works great!
              <input type="file" name="photo" accept="image/*" className="text-xs" />
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
    </div>
  );
}
