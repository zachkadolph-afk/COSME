"use client";

import { useMemo, useState } from "react";
import { GameCard, type CardData } from "@/components/GameCard";
import { TYPES } from "@/lib/game";

const STATUS_LABEL: Record<string, string> = { starter: "Starter", voting: "Being voted on", locked: "Community" };

export function CardLibrary({ cards }: { cards: CardData[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("All");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return cards.filter((c) => {
      if (type !== "All" && c.type !== type) return false;
      if (!q) return true;
      const num = String(c.number ?? "").padStart(3, "0");
      return c.name.toLowerCase().includes(q) || num.includes(q) || String(c.number) === q;
    });
  }, [cards, query, type]);

  return (
    <div className="stack-lg">
      <label className="field" style={{ maxWidth: 520 }}>
        Search by name or card number
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try 002 or Blaze" />
      </label>
      <div className="row" role="group" aria-label="Filter by type" style={{ gap: 8 }}>
        {["All", ...TYPES].map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>
      <p className="faint" aria-live="polite">{shown.length} of {cards.length} cards</p>
      <div className="grid-cards" style={{ justifyItems: "center" }}>
        {shown.map((c) => (
          <div key={c.id} className="stack" style={{ alignItems: "center", gap: 8 }}>
            <GameCard card={c} width={220} />
            <span className="faint">{STATUS_LABEL[c.status ?? "starter"] ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
