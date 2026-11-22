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
  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/cards?select=id&status=eq.starter`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: "count=exact", Range: "0-0" },
        cache: "no-store",
      });
      database = res.ok;
      const range = res.headers.get("content-range");
      starterCards = range ? Number(range.split("/")[1]) || 0 : 0;
    } catch {
      database = false;
    }
  }

  return NextResponse.json({
    supabaseUrl: !!url,
    supabasePublicKey: !!anon,
    supabaseServerKey: !!service,
    databaseReachable: database,
    starterCards,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    stripe: stripeConfigured(),
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    cartoonMaker: !!process.env.OPENAI_API_KEY,
  });
}
