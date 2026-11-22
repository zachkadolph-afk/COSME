import { NextResponse } from "next/server";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Shows which services are switched on (yes/no only, never the keys themselves). */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  let database = false;
  let starterCards = 0;
  let databaseStatus: number | string | null = null;
  let databaseMessage: string | null = null;
  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/cards?select=id&status=eq.starter`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: "count=exact", Range: "0-0" },
        cache: "no-store",
      });
      database = res.ok;
      databaseStatus = res.status;
      if (!res.ok) databaseMessage = (await res.text()).slice(0, 200);
      const range = res.headers.get("content-range");
      starterCards = range ? Number(range.split("/")[1]) || 0 : 0;
    } catch (e) {
      database = false;
      databaseStatus = "could not connect";
      databaseMessage = e instanceof Error ? e.message.slice(0, 200) : null;
    }
  }

  return NextResponse.json({
    supabaseUrl: !!url,
    supabasePublicKey: !!anon,
    supabaseServerKey: !!service,
    databaseReachable: database,
    databaseStatus,
    databaseMessage,
    // The project address is public (it's in every page), so it's safe to show here.
    supabaseAddress: url ? url.replace(/^(https?:\/\/[^/]+).*$/, "$1") + (url.length > url.replace(/^(https?:\/\/[^/]+).*$/, "$1").length ? " (has extra text after the address)" : "") : null,
    publicKeyLooksLike: anon ? (anon.startsWith("eyJ") ? "legacy anon key" : anon.startsWith("sb_publishable_") ? "new publishable key" : anon.startsWith("sb_secret_") ? "SECRET key in the public slot" : "unrecognized") : null,
    starterCards,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    stripe: stripeConfigured(),
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    cartoonMaker: !!process.env.OPENAI_API_KEY,
  });
}
