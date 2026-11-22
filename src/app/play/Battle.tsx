"use client";

import { useEffect, useState } from "react";
import { GameCard, type CardData } from "@/components/GameCard";
import { SPOT_NAMES, STANDARD_DECK, battle } from "@/lib/game";

type Round = { a: CardData; b: CardData; spotA: number; spotB: number; winner: 1 | -1 | 0; reason: string; ta: string; tb: string };

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Free online battle against the computer: a random pack each, spin like a bottle, most wins out of 10. */
export function Battle({ pool }: { pool: CardData[] }) {
  const deal = () => {
    const mixed = shuffle(pool);
    return { mine: mixed.slice(0, STANDARD_DECK), theirs: mixed.slice(STANDARD_DECK, STANDARD_DECK * 2) };
  };
  // Deal after the page loads so the server and browser don't shuffle differently.
  const [decks, setDecks] = useState<{ mine: CardData[]; theirs: CardData[] } | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  useEffect(() => {
    setDecks(deal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pool.length < 2) return <div className="narrow"><p className="lead">Not enough cards to play yet.</p></div>;
  if (!decks) return <div className="narrow"><p className="lead">Shuffling the decks...</p></div>;

  const n = rounds.length;
  const over = n >= STANDARD_DECK || n >= decks.mine.length || n >= decks.theirs.length;
  const me = rounds.filter((r) => r.winner === 1).length;
  const them = rounds.filter((r) => r.winner === -1).length;
  const last = rounds[n - 1];
  const showA = last ? last.a : decks.mine[0];
  const showB = last ? last.b : decks.theirs[0];

  function spin() {
    if (over || !decks) return;
    const a = decks.mine[n];
    const b = decks.theirs[n];
    const spotA = Math.floor(Math.random() * 8);
    const spotB = Math.floor(Math.random() * 8);
    const r = battle(a, spotA, b, spotB);
    setRounds([...rounds, { a, b, spotA, spotB, winner: r.winner, reason: r.reason, ta: r.ta, tb: r.tb }]);
  }

  function again() {
    setDecks(deal());
    setRounds([]);
  }

  let message = "Press spin to start the battle.";
  if (last) {
    message = (last.winner === 1 ? "You win the round. " : last.winner === -1 ? "The computer wins the round. " : "Draw. ") + last.reason + ".";
    if (over) message += me > them ? " You win the game!" : me < them ? " The computer wins the game." : " The game is a tie.";
  }

  return (
    <div className="wrap stack-lg" style={{ alignItems: "center", paddingBottom: 48 }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <h1>Battle</h1>
        <p className="muted" style={{ maxWidth: 620 }}>Every card has a bit of all 8 types, one on each spot. Each card spins like a bottle, and the two spots facing the middle line fight. Type advantage always wins, otherwise the bigger number wins.</p>
      </div>
      <div className="row" style={{ gap: 28, fontFamily: "var(--display)", justifyContent: "center" }}>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>YOU</span><span style={{ fontSize: 44, color: "var(--orange)" }}>{me}</span></div>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>ROUND</span><span style={{ fontSize: 28 }}>{Math.min(n + (over ? 0 : 1), STANDARD_DECK)} / {STANDARD_DECK}</span></div>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>COMPUTER</span><span style={{ fontSize: 44, color: "#60A5FA" }}>{them}</span></div>
      </div>
      <div className="row" style={{ justifyContent: "center", alignItems: "center", gap: 28 }}>
        <div className="stack" style={{ alignItems: "center" }}>
          <GameCard card={showA} width={260} highlight={last?.spotA} />
          <span className="faint">{last ? `${SPOT_NAMES[last.spotA]}: ${last.ta} ${last.a.spots[last.spotA]}` : "Your card"}</span>
        </div>
        <div className="stack" style={{ alignItems: "center", minWidth: 220, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 32, color: "var(--purple)" }}>VS</div>
          {over ? (
            <button className="btn btn-lg btn-yellow" onClick={again}>Play again</button>
          ) : (
            <button className="btn btn-lg" onClick={spin}>Spin and flip</button>
          )}
          <p aria-live="polite" style={{ fontWeight: 800, maxWidth: 240, color: last?.winner === 1 ? "var(--orange)" : last?.winner === -1 ? "#60A5FA" : "var(--muted)" }}>{message}</p>
        </div>
        <div className="stack" style={{ alignItems: "center" }}>
          <GameCard card={showB} width={260} highlight={last?.spotB} />
          <span className="faint">{last ? `${SPOT_NAMES[last.spotB]}: ${last.tb} ${last.b.spots[last.spotB]}` : "Computer's card"}</span>
        </div>
      </div>
    </div>
  );
}
