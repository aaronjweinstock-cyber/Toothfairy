import Link from "next/link";
import { ToothIcon } from "@/components/logo";
import { AvatarStack } from "@/components/avatar";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500 shadow-lg shadow-brand-500/30">
        <ToothIcon className="h-11 w-11 text-white" />
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Toothfairy
        </h1>
        <p className="text-lg text-muted">
          Crowdsource the tooth fairy. When your kid loses a tooth, invite the
          people who love them &mdash; grandparents, family, friends &mdash;
          to send a little something. A closed circle, not a public feed.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AvatarStack labels={["Grandma", "Uncle Joe", "Aunt Mia", "+"]} />
        <span className="text-sm text-muted">your circle, invited by name</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-full bg-brand-500 px-6 py-3 font-display font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-card-border px-6 py-3 font-display font-semibold text-foreground transition hover:bg-brand-50"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
