import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Toothfairy</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Crowdsource the tooth fairy. When your kid loses a tooth, invite the
        people who love them &mdash; grandparents, family, friends &mdash; to
        send a little something. A closed circle, not a public feed.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-black/10 px-6 py-3 font-medium dark:border-white/20"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
