import { NextResponse } from "next/server";
import { jsonError, requireParent } from "@/lib/api";
import { isCardType, type CardType } from "@/lib/game";

export const runtime = "nodejs";
export const maxDuration = 60;

const THEME: Record<CardType, string> = {
  Lightning: "crackling yellow lightning and storm clouds",
  Fire: "friendly flames and glowing embers",
  Ice: "sparkling ice crystals and snow",
  Water: "splashing waves and bubbles",
  Plant: "leaves, vines and flowers",
  Wind: "swirling wind and clouds",
  Metal: "shiny armor and gears",
  Fist: "boxing gloves and super strength",
};

/**
 * Turns the uploaded photo into a cartoon hero.
 * The real photo is only held in memory for this one request: it is never saved anywhere.
 * Only the finished cartoon is stored.
 */
export async function POST(request: Request) {
  const ctx = await requireParent();
  if ("error" in ctx) return ctx.error;
  if (!ctx.profile.consent_at) return jsonError("A parent needs to give permission first.", 403);

  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const type = form?.get("type");
  if (!(photo instanceof File)) return jsonError("Please choose a photo.");
  if (!isCardType(type)) return jsonError("Please pick a type.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return jsonError("Photos must be JPG, PNG or WEBP.");
  if (photo.size > 8 * 1024 * 1024) return jsonError("That photo is too big. Please use one under 8 MB.");

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // No image service connected yet: the hero card uses its type symbol instead of a picture.
    return NextResponse.json({ url: null, note: "Cartoon maker is not connected yet. Your card will show its type symbol for now." });
  }

  // Each cartoon costs money to make, so cap how many one account can make.
  const { data: existing } = await ctx.admin.storage.from("avatars").list(ctx.user.id, { limit: 100 });
  if ((existing?.length ?? 0) >= 30) return jsonError("This account has made a lot of cartoons. Please contact us to make more.", 429);

  const prompt =
    `Turn this photo into a bright cartoon hero character for a kids' trading card game. ` +
    `Bold outlines, big bright colors, friendly and fun, like a kids' animated TV show. ` +
    `Keep the child recognizable (hair, face shape, skin tone, glasses if any) but fully cartoon. ` +
    `Give them ${type} powers with ${THEME[type]}. Heroic action pose, simple background, no text, no logos.`;

  const body = new FormData();
  body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  body.append("image", photo, photo.name || "photo.png");
  body.append("prompt", prompt);
  body.append("size", "1024x1024");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!res.ok) {
    console.error("Image service error", res.status, await res.text().catch(() => ""));
    return jsonError("The cartoon maker had a problem. Please try another photo.", 502);
  }
  const json = await res.json();
  const b64: string | undefined = json?.data?.[0]?.b64_json;
  if (!b64) return jsonError("The cartoon maker did not return a picture.", 502);

  const path = `${ctx.user.id}/${crypto.randomUUID()}.png`;
  const { error } = await ctx.admin.storage
    .from("avatars")
    .upload(path, Buffer.from(b64, "base64"), { contentType: "image/png", upsert: false });
  if (error) return jsonError("Could not save the cartoon.", 500);

  const { data } = ctx.admin.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
