"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="content-shell py-20">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-brand-panel p-8 shadow-soft">
        <div className="flex items-center gap-3 text-stone-100">
          <ShieldCheck className="h-5 w-5 text-brand-accent" />
          <span className="text-xs uppercase tracking-[0.3em] text-stone-400">Admin access</span>
        </div>
        <h1 className="mt-4 font-serif text-4xl text-stone-50">Sign in to the dashboard</h1>
        <p className="mt-4 text-sm leading-7 text-stone-300">
          Enter your admin username and password. If MFA is enabled, you will also need your six-digit authenticator code.
        </p>
        {children}
      </div>
    </main>
  );
}

export function AdminLoginLoading() {
  return (
    <AdminLoginShell>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
        Preparing secure sign-in…
      </div>
    </AdminLoginShell>
  );
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function getSafeNextPath(candidate: string | null | undefined) {
    if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return null;
    return candidate;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, token: token || undefined }),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "Login failed.");
      setRequiresMfa(Boolean(result.requiresMfa));
      return;
    }

    if (result.requiresMfaEnrollment) {
      setMfaSecret(result.mfaSecret);
      setMfaQrCode(result.qrCodeDataUrl ?? null);
      setRequiresMfa(true);
      setMessage(result.message);
      return;
    }

    router.push(getSafeNextPath(searchParams?.get("next")) ?? result.redirectTo ?? "/admin");
    router.refresh();
  }

  return (
    <AdminLoginShell>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-stone-300">
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        <label className="block text-sm text-stone-300">
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        {requiresMfa && (
          <label className="block text-sm text-stone-300">
            MFA token
            <input value={token} onChange={(event) => setToken(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" placeholder="123456" required />
          </label>
        )}

        {mfaSecret && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <div className="font-medium">MFA enrolment required</div>
            <p className="mt-2 leading-6">Scan this QR code with an authenticator app, then enter the 6-digit code above and press continue.</p>
            {mfaQrCode ? (
              <div className="mt-4 rounded-2xl bg-white p-4">
                <img src={mfaQrCode} alt="MFA QR code" className="mx-auto h-48 w-48" />
              </div>
            ) : null}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.2em]">Manual setup key</summary>
              <div className="mt-2 break-all font-mono text-xs">{mfaSecret}</div>
            </details>
          </div>
        )}

        {message && <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Continue to dashboard"}
        </Button>
      </form>
    </AdminLoginShell>
  );
}
