"use client";

import { useEffect, useRef, useState } from "react";
import { GameCard, type CardData } from "@/components/GameCard";
import { Logo } from "@/components/Logo";
import { SPOT_NAMES, STANDARD_DECK, battle } from "@/lib/game";

type Round = { a: CardData; b: CardData; spotA: number; spotB: number; winner: 1 | -1 | 0; reason: string; ta: string; tb: string };
type Phase = "idle" | "spinning" | "flipping" | "done";

const CARD_W = 220;
const CARD_H = Math.round((CARD_W * 7) / 5);
const BOX = CARD_H + 16; // room for the card to turn without hitting anything

// Direction of each of the 8 spots from the card's center, in degrees clockwise from straight up.
// Spots go clockwise from the top-left corner. Corners follow the card's real shape (5 by 7).
const CORNER = (Math.atan(5 / 7) * 180) / Math.PI;
const SPOT_ANGLE = [360 - CORNER, 0, CORNER, 90, 180 - CORNER, 180, 180 + CORNER, 270];

/** How far to turn so `spot` ends up pointing at `facing` (90 = right, 270 = left), after several full spins. */
function spinTo(current: number, spot: number, facing: number, turns: number) {
  const target = (((facing - SPOT_ANGLE[spot]) % 360) + 360) % 360;
  const now = ((current % 360) + 360) % 360;
  const extra = ((target - now) + 360) % 360;
  return current + turns * 360 + extra;
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CardBack() {
  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 18, padding: 7, background: "#FF8A3D" }}>
      <div style={{ height: "100%", borderRadius: 13, background: "radial-gradient(circle at 50% 50%, #2A1450, #0A0A0F 72%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
        <span style={{ fontFamily: "var(--display)", fontSize: 26, color: "#FF8A3D", transform: "rotate(180deg)" }}>COSME</span>
        <Logo size={150} full />
        <span style={{ fontFamily: "var(--display)", fontSize: 26, color: "#FF8A3D" }}>COSME</span>
      </div>
    </div>
  );
}

/** A card that spins like a wheel (face down), slows to a stop, then flips over. */
function SpinningCard({ card, rotation, faceUp, spinMs, highlight }: { card: CardData; rotation: number; faceUp: boolean; spinMs: number; highlight?: number }) {
  return (
    <div style={{ width: BOX, height: BOX, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200 }}>
      <div style={{ transform: `rotate(${rotation}deg)`, transition: `transform ${spinMs}ms cubic-bezier(0.12, 0.7, 0.18, 1)` }}>
        <div style={{ position: "relative", width: CARD_W, height: CARD_H, transformStyle: "preserve-3d", transition: "transform 550ms ease", transform: `rotateY(${faceUp ? 0 : 180}deg)` }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <GameCard card={card} width={CARD_W} highlight={highlight} />
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <CardBack />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Free online battle against the computer: a random pack each, spin like a wheel, most wins out of 10. */
export function Battle({ pool }: { pool: CardData[] }) {
  const deal = () => {
    const mixed = shuffle(pool);
    return { mine: mixed.slice(0, STANDARD_DECK), theirs: mixed.slice(STANDARD_DECK, STANDARD_DECK * 2) };
  };
  // Deal after the page loads so the server and browser don't shuffle differently.
  const [decks, setDecks] = useState<{ mine: CardData[]; theirs: CardData[] } | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<Round | null>(null);
  const [rotA, setRotA] = useState(0);
  const [rotB, setRotB] = useState(0);
  const [faceUp, setFaceUp] = useState(true);
  const [spinMs, setSpinMs] = useState({ a: 4200, b: 4800 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setDecks(deal());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSpinMs({ a: 400, b: 400 });
    const t = timers.current;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pool.length < 2) return <div className="narrow"><p className="lead">Not enough cards to play yet.</p></div>;
  if (!decks) return <div className="narrow"><p className="lead">Shuffling the decks...</p></div>;

  const n = rounds.length;
  const over = n >= STANDARD_DECK || n >= decks.mine.length || n >= decks.theirs.length;
  const busy = phase === "spinning" || phase === "flipping";
  const me = rounds.filter((r) => r.winner === 1).length;
  const them = rounds.filter((r) => r.winner === -1).length;
  const last = rounds[n - 1];
  const shown = pending ?? last;
  const showA = shown ? shown.a : decks.mine[0];
  const showB = shown ? shown.b : decks.theirs[0];
  const settled = phase === "done" && last;

  function spin() {
    if (over || busy || !decks) return;
    const a = decks.mine[n];
    const b = decks.theirs[n];
    const spotA = Math.floor(Math.random() * 8);
    const spotB = Math.floor(Math.random() * 8);
    const r = battle(a, spotA, b, spotB);
    const round: Round = { a, b, spotA, spotB, winner: r.winner, reason: r.reason, ta: r.ta, tb: r.tb };

    // 1. Turn the cards face down. 2. Spin them (slowing down like a prize wheel).
    // 3. Flip them over. 4. The spots facing the middle line fight.
    setPending(round);
    setFaceUp(false);
    setPhase("spinning");
    const flipFirst = spinMs.a > 1000 ? 450 : 50;
    timers.current.push(
      setTimeout(() => {
        // My card's spot ends up pointing right (90°) at the middle line; the computer's points left (270°).
        setRotA((cur) => spinTo(cur, spotA, 90, 5 + Math.floor(Math.random() * 2)));
        setRotB((cur) => spinTo(cur, spotB, 270, 6 + Math.floor(Math.random() * 2)));
      }, flipFirst),
      setTimeout(() => {
        setPhase("flipping");
        setFaceUp(true);
      }, flipFirst + Math.max(spinMs.a, spinMs.b) + 150),
      setTimeout(() => {
        setRounds((rs) => [...rs, round]);
        setPending(null);
        setPhase("done");
      }, flipFirst + Math.max(spinMs.a, spinMs.b) + 750),
    );
  }

  function again() {
    setDecks(deal());
    setRounds([]);
    setPending(null);
    setPhase("idle");
    setRotA(0);
    setRotB(0);
    setFaceUp(true);
  }

  let message = "Press spin to start the battle.";
  if (phase === "spinning") message = "Spinning...";
  else if (phase === "flipping") message = "Flip!";
  else if (last) {
    message = (last.winner === 1 ? "You win the round. " : last.winner === -1 ? "The computer wins the round. " : "Draw. ") + last.reason + ".";
    if (over) message += me > them ? " You win the game!" : me < them ? " The computer wins the game." : " The game is a tie.";
  }

  return (
    <div className="wrap stack-lg" style={{ alignItems: "center", paddingBottom: 48 }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <h1>Battle</h1>
        <p className="muted" style={{ maxWidth: 640 }}>Every card has a bit of all 8 types, one on each spot. The cards spin face down, slow to a stop and flip over. The two spots pointing at the middle line fight. Type advantage always wins, otherwise the bigger number wins.</p>
      </div>
      <div className="row" style={{ gap: 28, fontFamily: "var(--display)", justifyContent: "center" }}>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>YOU</span><span style={{ fontSize: 44, color: "var(--orange)" }}>{me}</span></div>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>ROUND</span><span style={{ fontSize: 28 }}>{Math.min(over ? n : n + 1, STANDARD_DECK)} / {STANDARD_DECK}</span></div>
        <div className="stack" style={{ alignItems: "center", gap: 0 }}><span className="faint" style={{ fontFamily: "var(--body)", fontWeight: 800 }}>COMPUTER</span><span style={{ fontSize: 44, color: "#60A5FA" }}>{them}</span></div>
      </div>

      <div className="row" style={{ justifyContent: "center", alignItems: "center", gap: 0 }}>
        <div className="stack" style={{ alignItems: "center" }}>
          <SpinningCard card={showA} rotation={rotA} faceUp={faceUp} spinMs={spinMs.a} highlight={settled ? last.spotA : undefined} />
          <span className="faint" style={{ minHeight: 21 }}>{settled ? `${SPOT_NAMES[last.spotA]}: ${last.ta} ${last.a.spots[last.spotA]}` : "Your card"}</span>
        </div>

        <div className="stack" style={{ alignItems: "center", width: 220, textAlign: "center", position: "relative" }}>
          <div aria-hidden="true" style={{ position: "absolute", top: -110, bottom: -110, left: "50%", borderLeft: "2px dashed #3A3550" }} />
          <div style={{ position: "relative", background: "var(--bg)", padding: "6px 0", fontFamily: "var(--display)", fontSize: 32, color: "var(--purple)" }}>VS</div>
          <div style={{ position: "relative", background: "var(--bg)", padding: "4px 0" }}>
            {over && !busy ? (
              <button className="btn btn-lg btn-yellow" onClick={again}>Play again</button>
            ) : (
              <button className="btn btn-lg" onClick={spin} disabled={busy}>{busy ? "Spinning..." : "Spin and flip"}</button>
            )}
          </div>
          <p aria-live="polite" style={{ position: "relative", background: "var(--bg)", fontWeight: 800, maxWidth: 220, minHeight: 72, color: settled ? (last.winner === 1 ? "var(--orange)" : last.winner === -1 ? "#60A5FA" : "var(--muted)") : "var(--muted)" }}>{message}</p>
        </div>

        <div className="stack" style={{ alignItems: "center" }}>
          <SpinningCard card={showB} rotation={rotB} faceUp={faceUp} spinMs={spinMs.b} highlight={settled ? last.spotB : undefined} />
          <span className="faint" style={{ minHeight: 21 }}>{settled ? `${SPOT_NAMES[last.spotB]}: ${last.tb} ${last.b.spots[last.spotB]}` : "Computer's card"}</span>
        </div>
      </div>
    </div>
  );
}
