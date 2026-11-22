"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShareToggle({ heroId, initial }: { heroId: string; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function change(next: boolean) {
    setBusy(true);
    setOn(next);
    const res = await fetch(`/api/heroes/${heroId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ share: next }) });
    setBusy(false);
    if (!res.ok) setOn(!next);
    router.refresh();
  }

  return (
    <label className="check">
      <input type="checkbox" checked={on} disabled={busy} onChange={(e) => change(e.target.checked)} />
      <span>Include in other kids&apos; packs</span>
    </label>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: text }) });
    if (res.ok) {
      window.location.href = "/";
      return;
    }
    setBusy(false);
    setError((await res.json().catch(() => ({}))).error || "Could not delete the account.");
  }

  if (!open) {
    return <div><button className="btn btn-danger" onClick={() => setOpen(true)}>Delete account and all data</button></div>;
  }
  return (
    <div className="stack" style={{ maxWidth: 480 }}>
      <p className="muted">This removes your account, heroes, cartoons and order history, and takes your heroes out of new packs. Printed cards already mailed stay with their owners.</p>
      <label className="field">
        Type DELETE to confirm
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="row">
        <button className="btn btn-danger" disabled={text !== "DELETE" || busy} onClick={remove}>{busy ? "Deleting..." : "Delete everything"}</button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
