import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";

/** One vote on a new card. The database function enforces one vote per parent per card. */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return jsonError("Please sign in to vote.", 401);

  const body = await request.json().catch(() => ({}));
  if (typeof body.cardId !== "string" || typeof body.newCardWon !== "boolean") return jsonError("Bad vote.");

  const { data, error } = await supabase.rpc("cast_vote", { p_card: body.cardId, p_new_card_won: body.newCardWon });
  if (error) {
    const msg = error.message.includes("duplicate") ? "You already voted on this card." : error.message;
    return jsonError(msg, 400);
  }
  return NextResponse.json({ card: data });
}
