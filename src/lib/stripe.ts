import Stripe from "stripe";

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export const stripeConfigured = () =>
  !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_HERO_PACK && !!process.env.STRIPE_PRICE_SURPRISE_PACK;
