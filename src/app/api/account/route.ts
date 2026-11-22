import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";

/** Deletes the parent's account and everything tied to it. Community cards are retired from new packs. */
export async function DELETE(request: Request) {
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE") return jsonError('Type DELETE to confirm.');

  const { data: heroes } = await ctx.admin.from("heroes").select("community_card_id").eq("owner_id", ctx.user.id);
  const cardIds = (heroes ?? []).map((h) => h.community_card_id).filter(Boolean);
  if (cardIds.length) await ctx.admin.from("cards").update({ status: "retired", art_url: null }).in("id", cardIds);

  const { data: files } = await ctx.admin.storage.from("avatars").list(ctx.user.id, { limit: 1000 });
  if (files?.length) await ctx.admin.storage.from("avatars").remove(files.map((f) => `${ctx.user.id}/${f.name}`));

  // Removing the sign-in account also removes the profile, heroes, votes and orders (cascade).
  const { error } = await ctx.admin.auth.admin.deleteUser(ctx.user.id);
  if (error) return jsonError("Could not delete the account. Please contact us.", 500);
  return NextResponse.json({ ok: true });
}
