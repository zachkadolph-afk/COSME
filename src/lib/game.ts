// Core COSME game rules shared by the site, the API and the seed script.

export const TYPES = [
  "Lightning",
  "Fire",
  "Ice",
  "Water",
  "Plant",
  "Wind",
  "Metal",
  "Fist",
] as const;

export type CardType = (typeof TYPES)[number];

export const TYPE_INFO: Record<
  CardType,
  { color: string; icon: string; beats: CardType[] }
> = {
  Lightning: { color: "#FFD23F", icon: "M13 2 4 14h7l-1 8 9-12h-7l1-8z", beats: ["Water", "Metal"] },
  Fire: { color: "#FF6A1F", icon: "M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z", beats: ["Ice", "Plant"] },
  Ice: { color: "#9FDCFF", icon: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7", beats: ["Plant", "Wind"] },
  Water: { color: "#3B82F6", icon: "M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z", beats: ["Fire", "Fist"] },
  Plant: { color: "#22C55E", icon: "M12 22V10M12 10c0-4 3-7 8-7 0 5-3 8-8 7zM12 14c0-3-2-5-6-5 0 4 2 6 6 5z", beats: ["Water", "Lightning"] },
  Wind: { color: "#7FC9B8", icon: "M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7", beats: ["Fire", "Fist"] },
  Metal: { color: "#A1A1AA", icon: "M12 2l8 5v10l-8 5-8-5V7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6", beats: ["Ice", "Wind"] },
  Fist: { color: "#F43F5E", icon: "M7 11V7a2 2 0 0 1 4 0v4M11 10V6a2 2 0 0 1 4 0v5M15 10a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-3a2 2 0 0 1 4 0", beats: ["Metal", "Lightning"] },
};

/** Types that beat the given type, from the type chart. */
export function weaknessesOf(type: CardType): CardType[] {
  return TYPES.filter((t) => TYPE_INFO[t].beats.includes(type));
}

/** The 8 power spots, clockwise from the top-left corner. Opposites are 4 apart. */
export const SPOT_NAMES = [
  "Top-left corner",
  "Top edge",
  "Top-right corner",
  "Right edge",
  "Bottom-right corner",
  "Bottom edge",
  "Bottom-left corner",
  "Left edge",
] as const;

export const COMMUNITY_TOTAL = 200;
export const HERO_TOTAL = 8000;
export const VOTES_TO_LOCK = 52;
export const MAX_DECK = 15;
export const STANDARD_DECK = 10;

/** Small deterministic random generator so the same seed always gives the same card. */
function seeded(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Makes 8 uneven power numbers that add up to `total`.
 * Rules (Wyatt): every number different, no round splits, and the
 * strongest spot always sits opposite the weakest.
 */
export function makeSpots(seedText: string, total: number): number[] {
  const rand = seeded(seedText);
  for (let attempt = 0; attempt < 200; attempt++) {
    const weights = Array.from({ length: 8 }, () => 0.15 + rand() * rand() * 3);
    const sum = weights.reduce((a, b) => a + b, 0);
    const values = weights.map((w) => Math.max(1, Math.round((w / sum) * total)));
    const diff = total - values.reduce((a, b) => a + b, 0);
    values[values.indexOf(Math.max(...values))] += diff;

    const unique = new Set(values).size === 8;
    const notRound = values.filter((v) => v % 10 === 0).length <= 1;
    if (!unique || !notRound || values.some((v) => v < 1)) continue;

    // Pair the biggest with the smallest, the 2nd biggest with the 2nd smallest, and so on,
    // then place each pair on opposite spots so strong always faces away from weak.
    const sorted = [...values].sort((a, b) => b - a);
    const pairs: [number, number][] = [];
    for (let i = 0; i < 4; i++) pairs.push([sorted[i], sorted[7 - i]]);
    const start = Math.floor(rand() * 8);
    const spots = new Array<number>(8);
    const order = [0, 2, 1, 3]; // spread the pairs around the card
    order.forEach((p, k) => {
      const pos = (start + k) % 4 + 0;
      const flip = rand() < 0.5;
      const a = (pos + (flip ? 4 : 0)) % 8;
      spots[a] = pairs[p][0];
      spots[(a + 4) % 8] = pairs[p][1];
    });
    return spots;
  }
  throw new Error("Could not make power spots");
}

export type BattleCard = { type: CardType; spots: number[]; weaknesses: string[] };

/**
 * Every card has a little of all 8 types, like a personality profile (Zach and Wyatt's rule).
 * Each of the 8 spots is one type:
 *  - the biggest number is the card's main type,
 *  - the smallest number, right opposite it, is its weak spot (a type that beats the main type),
 *  - the other 6 types fill the remaining spots.
 * Worked out from the card itself, so it is the same on the website, in the database and in print.
 */
export function spotTypes(card: BattleCard): CardType[] {
  const s = card.spots;
  const hi = s.indexOf(Math.max(...s));
  const lo = s.indexOf(Math.min(...s));
  const weak = (card.weaknesses.find((w) => isCardType(w) && w !== card.type) as CardType | undefined) ?? weaknessesOf(card.type)[0];
  const rest = TYPES.filter((t) => t !== card.type && t !== weak);
  const rand = seeded(`${card.type}-${s.join(",")}`);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const out = new Array<CardType>(8);
  out[hi] = card.type;
  out[lo] = weak;
  let k = 0;
  for (let i = 0; i < 8; i++) if (i !== hi && i !== lo) out[i] = rest[k++];
  return out;
}

/**
 * Result of one battle: 1 = A wins, -1 = B wins, 0 = draw.
 * The two spots that face each other fight, each with its own type and number.
 * Type advantage always wins, whatever the numbers. Otherwise the bigger number wins.
 */
export function battle(a: BattleCard, spotA: number, b: BattleCard, spotB: number) {
  const va = a.spots[spotA];
  const vb = b.spots[spotB];
  const ta = spotTypes(a)[spotA];
  const tb = spotTypes(b)[spotB];
  const aBeatsB = TYPE_INFO[ta].beats.includes(tb);
  const bBeatsA = TYPE_INFO[tb].beats.includes(ta);
  if (aBeatsB && !bBeatsA) return { winner: 1 as const, reason: `${ta} ${va} beats ${tb} ${vb}: ${ta} beats ${tb}`, ta, tb };
  if (bBeatsA && !aBeatsB) return { winner: -1 as const, reason: `${tb} ${vb} beats ${ta} ${va}: ${tb} beats ${ta}`, ta, tb };
  if (va === vb) return { winner: 0 as const, reason: `${ta} ${va} vs ${tb} ${vb}: same number`, ta, tb };
  return {
    winner: (va > vb ? 1 : -1) as 1 | -1,
    reason: `${ta} ${va} vs ${tb} ${vb}: no type advantage, ${Math.max(va, vb)} wins`,
    ta,
    tb,
  };
}

/** Rescale a card's spots to a new total, keeping the shape. Used when voting locks a card. */
export function rescaleSpots(spots: number[], newTotal: number): number[] {
  const sum = spots.reduce((a, b) => a + b, 0);
  const scaled = spots.map((v) => Math.max(1, Math.round((v / sum) * newTotal)));
  const diff = newTotal - scaled.reduce((a, b) => a + b, 0);
  scaled[scaled.indexOf(Math.max(...scaled))] += diff;
  return scaled;
}

export function isCardType(v: unknown): v is CardType {
  return typeof v === "string" && (TYPES as readonly string[]).includes(v);
}
