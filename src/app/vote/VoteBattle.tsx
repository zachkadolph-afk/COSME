"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameCard, type CardData } from "@/components/GameCard";
import { VOTES_TO_LOCK } from "@/lib/game";

export function VoteBattle({ card, opponent, remaining }: { card: CardData & { vote_count: number; vote_score: number }; opponent: CardData; remaining: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function vote(newCardWon: boolean) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: card.id, newCardWon }) });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not save your vote.");
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }

  const pct = Math.round((card.vote_count / VOTES_TO_LOCK) * 100);
  return (
    <div className="wrap stack-lg" style={{ alignItems: "center", textAlign: "center", paddingBottom: 48 }}>
      <div className="stack" style={{ alignItems: "center" }}>
        <h1>Who wins this battle?</h1>
        <p className="lead" style={{ maxWidth: 640 }}>
          New heroes need {VOTES_TO_LOCK} votes before they join the packs. Each win adds a point and each loss takes one away.
        </p>
      </div>
      <div className="row" style={{ justifyContent: "center", alignItems: "center", gap: 28 }}>
        <div className="stack" style={{ alignItems: "center" }}>
          <span className="eyebrow">New hero</span>
          <GameCard card={card} width={260} />
          <button className="btn" disabled={busy} onClick={() => vote(true)}>{card.name} wins</button>
        </div>
        <div style={{ fontFamily: "var(--display)", fontSize: 36, color: "var(--purple)" }}>VS</div>
        <div className="stack" style={{ alignItems: "center" }}>
          <span className="eyebrow" style={{ color: "var(--muted)" }}>In the game</span>
          <GameCard card={opponent} width={260} />
          <button className="btn" disabled={busy} onClick={() => vote(false)}>{opponent.name} wins</button>
        </div>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="stack" style={{ width: "100%", maxWidth: 560, gap: 8 }}>
        <div className="row" style={{ justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
          <span>{card.name}: {card.vote_count} of {VOTES_TO_LOCK} votes</span>
          <span style={{ color: "var(--yellow)" }}>Power so far: {200 + card.vote_score}</span>
        </div>
        <div style={{ height: 12, background: "var(--line)", borderRadius: 999, overflow: "hidden" }} role="progressbar" aria-valuenow={card.vote_count} aria-valuemin={0} aria-valuemax={VOTES_TO_LOCK}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #FF8A3D, #FFD23F)" }} />
        </div>
        <span className="faint">{remaining} new {remaining === 1 ? "hero" : "heroes"} waiting for your vote</span>
      </div>
    </div>
  );
}
