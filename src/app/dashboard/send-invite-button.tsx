"use client";

import { useState, useTransition } from "react";
import { sendInvite } from "./actions";

export function SendInviteButton({
  familyId,
  inviteId,
}: {
  familyId: string;
  inviteId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: boolean } | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        className="text-xs font-medium text-brand-600 underline disabled:opacity-50"
        onClick={() => {
          startTransition(async () => {
            setResult(await sendInvite(familyId, inviteId));
          });
        }}
      >
        {isPending ? "Sending…" : "Send invite"}
      </button>
      {result && (
        <span className="text-right text-xs text-muted">
          {result.sent
            ? "Email sent!"
            : "Email sending isn't set up yet — copy the link above."}
        </span>
      )}
    </div>
  );
}
