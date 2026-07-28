import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    redirect("/login");
  }

  const family = await db.family.findFirst({ where: { ownerId: user.id } });
  if (!family) {
    redirect("/signup");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        familyName={family.name}
        userEmail={user.email}
        signOutAction={signOutAction}
      />
      <main className="flex-1 px-8 py-10 lg:px-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
