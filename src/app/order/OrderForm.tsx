"use client";

import { useState } from "react";

export function OrderForm({ heroId, heroName, checkoutReady }: { heroId: string; heroName: string; checkoutReady: boolean }) {
  const [packs, setPacks] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heroId, surprisePacks: packs }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      window.location.href = json.url;
      return;
    }
    setBusy(false);
    setError(json.error || "Could not start checkout.");
  }

  return (
    <div className="stack-lg">
      <div className="panel row" style={{ border: "3px solid var(--orange)", justifyContent: "space-between" }}>
        <div className="stack" style={{ gap: 4, flex: "1 1 240px" }}>
          <b style={{ fontSize: 18 }}>Hero pack: {heroName}</b>
          <span className="muted">2 copies of your 8,000 hero card + 8 surprise community cards</span>
        </div>
      </div>

      <div className="panel row" style={{ justifyContent: "space-between" }}>
        <div className="stack" style={{ gap: 4, flex: "1 1 240px" }}>
          <b style={{ fontSize: 18 }}>Add surprise packs</b>
          <span className="muted">10 random community cards each. More cards to trade.</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn btn-ghost" aria-label="One fewer surprise pack" onClick={() => setPacks((p) => Math.max(0, p - 1))} style={{ width: 48, padding: 0, fontSize: 22 }}>−</button>
          <span style={{ minWidth: 28, textAlign: "center", fontFamily: "var(--display)", fontSize: 22 }} aria-live="polite">{packs}</span>
          <button type="button" className="btn btn-ghost" aria-label="One more surprise pack" onClick={() => setPacks((p) => Math.min(9, p + 1))} style={{ width: 48, padding: 0, fontSize: 22 }}>+</button>
        </div>
      </div>

      <p className="muted">{10 + packs * 10} cards in this order. Prices, shipping and your address are shown on the secure checkout page.</p>
      {!checkoutReady && <div className="notice notice-info">Checkout isn&apos;t switched on yet. Add the Stripe keys to turn it on.</div>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div>
        <button className="btn btn-lg" disabled={busy || !checkoutReady} onClick={checkout}>{busy ? "Opening checkout..." : "Go to secure checkout"}</button>
      </div>
    </div>
  );
}
