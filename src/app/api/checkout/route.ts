import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";
import { stripe, stripeConfigured } from "@/lib/stripe";

/**
 * Starts a Stripe checkout for a hero pack plus any surprise packs.
 * Prices live in Stripe (STRIPE_PRICE_HERO_PACK, STRIPE_PRICE_SURPRISE_PACK), not in code.
 */
export async function POST(request: Request) {
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  if (!stripeConfigured()) return jsonError("Checkout isn't switched on yet. Add the Stripe keys to turn it on.", 503);

  const body = await request.json().catch(() => ({}));
  const packs = Number.isInteger(body.surprisePacks) ? Math.min(9, Math.max(0, body.surprisePacks)) : 0;
  const heroId = typeof body.heroId === "string" ? body.heroId : null;
  if (!heroId) return jsonError("Pick a hero first.");

  const { data: hero } = await ctx.admin.from("heroes").select("id, name").eq("id", heroId).eq("owner_id", ctx.user.id).single();
  if (!hero) return jsonError("Hero not found.", 404);

  const { data: order, error } = await ctx.admin
    .from("orders")
    .insert({ owner_id: ctx.user.id, hero_id: hero.id, surprise_packs: packs, status: "pending" })
    .select("id")
    .single();
  if (error || !order) return jsonError("Could not start the order.", 500);

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const lineItems = [{ price: process.env.STRIPE_PRICE_HERO_PACK!, quantity: 1 }];
  if (packs > 0) lineItems.push({ price: process.env.STRIPE_PRICE_SURPRISE_PACK!, quantity: packs });

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: ctx.user.email ?? undefined,
    shipping_address_collection: { allowed_countries: ["US"] },
    metadata: { order_id: order.id },
    success_url: `${site}/parents?order=thanks`,
    cancel_url: `${site}/order?hero=${hero.id}&cancelled=1`,
  });

  await ctx.admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
  return NextResponse.json({ url: session.url });
}
