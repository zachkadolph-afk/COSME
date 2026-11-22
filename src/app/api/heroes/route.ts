import { NextResponse } from "next/server";
import { cleanLabel, jsonError, requireParent } from "@/lib/api";
import { COMMUNITY_TOTAL, HERO_TOTAL, isCardType, makeSpots, weaknessesOf } from "@/lib/game";

/** Saves a new hero. If the parent chose to share it, a 200-point community card goes into review. */
export async function POST(request: Request) {
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  if (!ctx.profile.consent_at) return jsonError("A parent needs to give permission first.", 403);

  const body = await request.json().catch(() => ({}));
  const name = cleanLabel(body.name);
  const move = cleanLabel(body.move);
  const type = body.type;
  const share = body.share === true;
  if (!name) return jsonError("Hero names can be 1 to 40 letters and numbers.");
  if (!move) return jsonError("Special moves can be 1 to 40 letters and numbers.");
  if (!isCardType(type)) return jsonError("Please pick a type.");

  // Only accept cartoons this site made for this parent.
  let avatarUrl: string | null = null;
  if (typeof body.avatarUrl === "string" && body.avatarUrl) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${ctx.user.id}/`;
    if (!body.avatarUrl.startsWith(prefix)) return jsonError("That picture can't be used.");
    avatarUrl = body.avatarUrl;
  }

  // Same seed as the live preview on the Make My Hero page, so the saved card matches what the kid saw.
  const seed = `${ctx.user.id}-${name}`;
  const { data: hero, error } = await ctx.admin
    .from("heroes")
    .insert({ owner_id: ctx.user.id, name, type, move, avatar_url: avatarUrl, hero_spots: makeSpots(seed, HERO_TOTAL), share_in_community: share })
    .select()
    .single();
  if (error || !hero) return jsonError("Could not save the hero.", 500);

  if (share) {
    const { data: card } = await ctx.admin
      .from("cards")
      .insert({
        name, type, move, art_url: avatarUrl,
        description: "A hero made by a COSME player.",
        total: COMMUNITY_TOTAL,
        spots: makeSpots(`${seed}-community`, COMMUNITY_TOTAL),
        weaknesses: weaknessesOf(type),
        status: "review",
      })
      .select("id")
      .single();
    if (card) await ctx.admin.from("heroes").update({ community_card_id: card.id }).eq("id", hero.id);
  }

  return NextResponse.json({ id: hero.id });
}
