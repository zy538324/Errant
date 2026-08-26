"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApiResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
  error?: string;
};

export function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function requestCode() {
    setRunning(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to request a login code.");
        return;
      }

      setCodeRequested(true);
      setMessage(
        payload?.message ??
          "Check your email for a 6-digit login code. Don’t forget to check your junk or spam folder.",
      );
    } catch {
      setError("Unable to request a login code.");
    } finally {
      setRunning(false);
    }
  }

  async function verifyCode() {
    setRunning(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/login/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to verify the login code.");
        return;
      }

      router.push(payload?.redirectTo ?? "/account/downloads");
      router.refresh();
    } catch {
      setError("Unable to verify the login code.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-stone-100">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-3xl text-stone-50">Email code login</h2>
          <p className="mt-2 text-sm leading-7 text-stone-300">
            Enter the email used at checkout. If it has previous purchases, a 6-digit code will be sent so you can access your downloads.
          </p>
          {codeRequested ? (
            <p className="mt-2 text-sm leading-7 text-amber-100">
              Don’t forget to check your junk or spam folder if the code does not arrive within a minute or two.
            </p>
          ) : null}
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (codeRequested) {
            void verifyCode();
          } else {
            void requestCode();
          }
        }}
      >
        <label className="block text-sm text-stone-300">
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
          />
        </label>

        {codeRequested ? (
          <label className="block text-sm text-stone-300">
            6-digit code
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
            />
          </label>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={running || !email.trim() || (codeRequested && code.length !== 6)}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {codeRequested ? "Verify code" : "Send login code"}
          </Button>
          {codeRequested ? (
            <Button
              type="button"
              variant="ghost"
              disabled={running}
              onClick={() => {
                setCode("");
                void requestCode();
              }}
            >
              Send another code
            </Button>
          ) : null}
        </div>
      </form>

      {message ? <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
    </div>
  );
}
