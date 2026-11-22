import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";

const CONSENT_VERSION = "2026-11-v1";

/** Records that the signed-in adult is the parent or guardian and agrees to the photo rules. */
export async function POST(request: Request) {
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  const body = await request.json().catch(() => ({}));
  if (body?.isParent !== true || body?.agree !== true) return jsonError("Both boxes need to be ticked.");

  const { error } = await ctx.admin
    .from("profiles")
    .update({ consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION })
    .eq("id", ctx.user.id);
  if (error) return jsonError("Could not save permission. Please try again.", 500);
  return NextResponse.json({ ok: true });
}
