import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";
import { COMMUNITY_TOTAL, makeSpots, weaknessesOf, type CardType } from "@/lib/game";

/** Parent switches a hero in or out of other kids' packs. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  const body = await request.json().catch(() => ({}));
  if (typeof body.share !== "boolean") return jsonError("Missing setting.");

  const { data: hero } = await ctx.admin.from("heroes").select("*").eq("id", id).eq("owner_id", ctx.user.id).single();
  if (!hero) return jsonError("Hero not found.", 404);

  if (!body.share) {
    if (hero.community_card_id) await ctx.admin.from("cards").update({ status: "retired" }).eq("id", hero.community_card_id);
  } else if (hero.community_card_id) {
    const { data: card } = await ctx.admin.from("cards").select("status, vote_count").eq("id", hero.community_card_id).single();
    if (card?.status === "retired") {
      // Back in: finished cards return as they were, unfinished ones go back to review.
      await ctx.admin.from("cards").update({ status: card.vote_count >= 52 ? "locked" : "review" }).eq("id", hero.community_card_id);
    }
  } else {
    const { data: card } = await ctx.admin
      .from("cards")
      .insert({
        name: hero.name, type: hero.type, move: hero.move, art_url: hero.avatar_url,
        description: "A hero made by a COSME player.",
        total: COMMUNITY_TOTAL,
        spots: makeSpots(`${hero.id}-community`, COMMUNITY_TOTAL),
        weaknesses: weaknessesOf(hero.type as CardType),
        status: "review",
      })
      .select("id")
      .single();
    if (card) await ctx.admin.from("heroes").update({ community_card_id: card.id }).eq("id", hero.id);
  }

  await ctx.admin.from("heroes").update({ share_in_community: body.share }).eq("id", hero.id);
  return NextResponse.json({ ok: true });
}
