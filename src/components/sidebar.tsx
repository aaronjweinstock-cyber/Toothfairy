"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KidsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9 10h.01M15 10h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 14c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InvitesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.75" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", Icon: OverviewIcon },
  { href: "/dashboard/kids", label: "Kids", Icon: KidsIcon },
  { href: "/dashboard/invites", label: "Invites", Icon: InvitesIcon },
  { href: "/dashboard/payments", label: "Payments", Icon: PaymentsIcon },
];

export function Sidebar({
  familyName,
  userEmail,
  signOutAction,
}: {
  familyName: string;
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-card-border bg-card px-5 py-6">
      <div className="flex flex-col gap-8">
        <Link href="/dashboard">
          <Logo />
        </Link>

        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {familyName}
          </p>
          <nav className="mt-3 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const isActive =
                href === "/dashboard" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-100 text-brand-700"
                      : "text-muted hover:bg-brand-50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-card-border pt-4">
        <div className="truncate px-1 text-xs text-muted">{userEmail}</div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-full border border-card-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-brand-50"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
