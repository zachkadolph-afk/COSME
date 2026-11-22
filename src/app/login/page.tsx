"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/parents";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <div className="narrow stack-lg" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="stack">
        <h1>Grown-ups sign in here</h1>
        <p className="lead">COSME accounts belong to a parent or guardian. Enter your email and we&apos;ll send you a sign-in link. No password needed.</p>
      </div>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <div className="notice notice-info">Sign-in isn&apos;t connected yet. Add the Supabase keys to turn it on.</div>
      )}
      {state === "sent" ? (
        <div className="notice notice-ok">Check your email for a sign-in link. You can close this tab.</div>
      ) : (
        <form onSubmit={send} className="stack">
          <label className="field">
            Parent email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>
          {state === "error" && <div className="notice notice-error" role="alert">{error}</div>}
          <div>
            <button className="btn btn-lg" disabled={state === "sending"}>{state === "sending" ? "Sending..." : "Email me a sign-in link"}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
