import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Stripe tells us when a payment goes through. Point a Stripe webhook at /api/stripe/webhook. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId && session.payment_status === "paid") {
      const shipping = session.collected_information?.shipping_details ?? null;
      await supabaseAdmin()
        .from("orders")
        .update({ status: "paid", amount_total: session.amount_total, shipping })
        .eq("id", orderId);
    }
  }
  return NextResponse.json({ received: true });
}
