const PALETTE = [
  "bg-brand-500",
  "bg-gold-500",
  "bg-success",
  "bg-brand-700",
  "bg-brand-300",
];

// Deterministic color pick so the same name always renders the same color.
function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

export function Avatar({
  label,
  size = "md",
}: {
  label: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      title={label}
      className={`inline-flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ring-2 ring-[var(--background)] ${colorFor(label)}`}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {labels.map((label, i) => (
        <Avatar key={`${label}-${i}`} label={label} size="sm" />
      ))}
    </div>
  );
}
