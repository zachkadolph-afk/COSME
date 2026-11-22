import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";

/** Admins approve new community cards for voting, or turn them away. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  if (!ctx.profile.is_admin) return jsonError("Admins only.", 403);

  const body = await request.json().catch(() => ({}));
  if (!["voting", "retired"].includes(body.status)) return jsonError("Bad status.");
  const { error } = await ctx.admin.from("cards").update({ status: body.status }).eq("id", id).eq("status", "review");
  if (error) return jsonError("Could not update the card.", 500);
  return NextResponse.json({ ok: true });
}
