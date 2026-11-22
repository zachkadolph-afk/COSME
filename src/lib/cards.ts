import { COMMUNITY_TOTAL, makeSpots, weaknessesOf, type CardType } from "./game";
import { STARTER_CARDS } from "./starter-cards";
import { supabaseServer } from "./supabase/server";
import type { CardData } from "@/components/GameCard";

export const supabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/** Starter cards built locally, used before Supabase is connected. */
export function localStarterCards(): CardData[] {
  return STARTER_CARDS.map((c) => ({
    id: `starter-${c.number}`,
    number: c.number,
    name: c.name,
    type: c.type,
    move: c.move,
    description: c.description,
    art_url: c.art ?? null,
    total: c.total ?? COMMUNITY_TOTAL,
    spots: makeSpots(`cosme-starter-${c.number}-${c.name}`, c.total ?? COMMUNITY_TOTAL),
    weaknesses: c.weaknesses ?? weaknessesOf(c.type),
    rarity: c.rarity ?? "common",
    status: "starter",
  }));
}

const COLUMNS = "id, number, name, type, move, description, art_url, total, spots, weaknesses, rarity, status";

/** Every card in the game: starters, cards being voted on, and locked community cards. */
export async function libraryCards(): Promise<CardData[]> {
  if (!supabaseConfigured()) return localStarterCards();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("cards").select(COLUMNS).order("number");
  if (error || !data || data.length === 0) return localStarterCards();
  return data.map((c) => ({ ...c, type: c.type as CardType })) as CardData[];
}

/** Cards that can show up in packs and battles (not the ones still being voted on). */
export async function playableCards(): Promise<CardData[]> {
  return (await libraryCards()).filter((c) => c.status === "starter" || c.status === "locked");
}
