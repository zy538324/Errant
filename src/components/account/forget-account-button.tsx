"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ForgetAccountButton() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-3xl border border-red-400/20 bg-red-950/20 p-6">
      <div className="flex gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-200" />
        <div>
          <h2 className="font-serif text-3xl text-red-50">Forget my customer account</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-red-100/90">
            This will anonymise your customer account, log you out, and remove your future access to purchased downloads through this website. We may retain order records where required for accounting, dispute handling, fraud prevention or legal obligations.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-black/20 p-4 text-sm leading-6 text-red-50">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>
          I understand that this action anonymises my customer account and that I will lose website access to my purchased downloads.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-red-400/40 text-red-50 hover:border-red-200 hover:bg-red-500/10"
          disabled={!confirmed || running}
          onClick={async () => {
            setError(null);
            setRunning(true);

            try {
              const response = await fetch("/api/account/forget", {
                method: "POST",
              });
              const payload = (await response.json().catch(() => null)) as
                | { error?: string }
                | null;

              if (!response.ok) {
                setError(payload?.error ?? "Unable to anonymise your account.");
                return;
              }

              router.push("/shop?account=forgotten");
              router.refresh();
            } catch {
              setError("Unable to anonymise your account.");
            } finally {
              setRunning(false);
            }
          }}
        >
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Anonymise account and remove download access
        </Button>
      </div>

      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}
