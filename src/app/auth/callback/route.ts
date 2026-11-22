import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Finishes the email sign-in link and sends the parent where they were going. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/parents";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/parents";

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
