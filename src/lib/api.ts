import { NextResponse } from "next/server";
import { currentUser, supabaseAdmin } from "./supabase/server";

export const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Signed-in parent plus their profile row, or an error response. */
export async function requireParent() {
  const user = await currentUser();
  if (!user) return { error: jsonError("Please sign in first.", 401) } as const;
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) {
    // Profile rows are made by a database trigger; make one if it is missing.
    await admin.from("profiles").upsert({ id: user.id, email: user.email });
    return { user, profile: { id: user.id, email: user.email, consent_at: null, is_admin: false }, admin } as const;
  }
  return { user, profile, admin } as const;
}

/** Names and moves: letters, numbers, spaces and a little punctuation, 1 to 40 characters. */
export function cleanLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  if (s.length < 1 || s.length > 40) return null;
  if (!/^[\p{L}\p{N} '\-.!&]+$/u.test(s)) return null;
  return s;
}
