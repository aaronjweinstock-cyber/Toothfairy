export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 4c-4.5 0-8 2.8-8 7.2 0 2.1.6 3.6 1.3 5.6.8 2.4 1.7 5.1 2.6 7.7.5 1.4 1.2 2.5 2.6 2.5s2-1.3 2.2-2.8c.1-.9.2-1.7.3-1.7s.2.8.3 1.7c.2 1.5.8 2.8 2.2 2.8s2.1-1.1 2.6-2.5c.9-2.6 1.8-5.3 2.6-7.7.7-2 1.3-3.5 1.3-5.6 0-4.4-3.5-7.2-8-7.2z"
        fill="currentColor"
      />
      <path
        d="M25 2.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z"
        fill="#F5B942"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <ToothIcon className="h-7 w-7 text-brand-500" />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Toothfairy
      </span>
    </span>
  );
}
