"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GameCard, TypeBadge } from "@/components/GameCard";
import { HERO_TOTAL, TYPES, TYPE_INFO, makeSpots, weaknessesOf, type CardType } from "@/lib/game";

type Step = "consent" | "build";

export function MakeHero({ userId, hasConsent, imageServiceReady }: { userId: string; hasConsent: boolean; imageServiceReady: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(hasConsent ? "build" : "consent");
  const [isParent, setIsParent] = useState(false);
  const [agree, setAgree] = useState(false);
  const [type, setType] = useState<CardType>("Lightning");
  const [name, setName] = useState("");
  const [move, setMove] = useState("");
  const [share, setShare] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "consent" | "cartoon" | "save">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const preview = useMemo(
    () => ({
      name: name.trim() || "Your hero",
      type,
      move: move.trim() || "Special move",
      art_url: avatarUrl,
      total: HERO_TOTAL,
      spots: makeSpots(`${userId}-${name.trim().replace(/\s+/g, " ") || "Your hero"}`, HERO_TOTAL),
      weaknesses: weaknessesOf(type),
    }),
    [name, move, type, avatarUrl, userId],
  );

  async function giveConsent() {
    setBusy("consent");
    setError("");
    const res = await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isParent, agree }) });
    setBusy("");
    if (res.ok) setStep("build");
    else setError((await res.json().catch(() => ({}))).error || "Something went wrong.");
  }

  async function makeCartoon() {
    if (!photo) return;
    setBusy("cartoon");
    setError("");
    setNote("");
    const form = new FormData();
    form.append("photo", photo);
    form.append("type", type);
    const res = await fetch("/api/avatar", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setError(json.error || "The cartoon maker had a problem.");
    if (json.url) setAvatarUrl(json.url);
    if (json.note) setNote(json.note);
    setPhoto(null);
  }

  async function save() {
    setBusy("save");
    setError("");
    const res = await fetch("/api/heroes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, move, type, share, avatarUrl }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setError(json.error || "Could not save the hero.");
    router.push(`/order?hero=${json.id}`);
  }

  const steps = (
    <div className="steps" aria-label="Progress">
      <span className={step === "consent" ? "now" : "done"}>1 Grown-up check{step !== "consent" ? " ✓" : ""}</span>
      <span className={step === "build" ? "now" : ""}>2 Build your hero</span>
      <span>3 Order</span>
    </div>
  );

  if (step === "consent") {
    return (
      <div className="narrow stack-lg" style={{ paddingBottom: 48 }}>
        {steps}
        <div className="stack">
          <h1>Grown-up check</h1>
          <p className="lead">Kids, hand the screen to a parent or guardian. This part is just for them.</p>
        </div>
        <div className="panel stack">
          <label className="check">
            <input type="checkbox" checked={isParent} onChange={(e) => setIsParent(e.target.checked)} />
            <span className="stack" style={{ gap: 4 }}>
              <b>I&apos;m this child&apos;s parent or legal guardian</b>
              <span className="muted">Kids under 13 play under your account.</span>
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="stack" style={{ gap: 4 }}>
              <b>I agree to how photos are used</b>
              <span className="muted">
                The photo is sent to our cartoon maker to draw a cartoon hero, then thrown away. We never save the real photo. Only the cartoon is kept, and you can delete it any time from the parent area.
              </span>
            </span>
          </label>
        </div>
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        <div>
          <button className="btn btn-lg" disabled={!isParent || !agree || busy === "consent"} onClick={giveConsent}>
            {busy === "consent" ? "Saving..." : "Give permission and continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start", paddingBottom: 48 }}>
      <div className="stack-lg" style={{ flex: "999 1 520px", minWidth: 0 }}>
        {steps}
        <div className="stack">
          <h1>Build your hero</h1>
          <p className="lead">Pick a power, make your cartoon, and give your hero a name and special move.</p>
        </div>

        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 800, marginBottom: 12 }}>Pick your type</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))", gap: 10 }}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(t)}
                style={{ minHeight: 52, borderRadius: 12, border: `3px solid ${type === t ? TYPE_INFO[t].color : "var(--line)"}`, background: "var(--panel)", color: "var(--text)", font: "inherit", fontWeight: 800, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer" }}
              >
                <TypeBadge type={t} size={28} />
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="panel stack">
          <b>Your cartoon</b>
          {imageServiceReady ? (
            <>
              <p className="muted">Choose a clear, smiling photo. It&apos;s turned into a cartoon and never saved.</p>
              <div className="row">
                <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
                  {photo ? photo.name : "Choose a photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
                <button className="btn" type="button" disabled={!photo || busy === "cartoon"} onClick={makeCartoon}>
                  {busy === "cartoon" ? "Drawing your cartoon..." : avatarUrl ? "Make a new cartoon" : "Make my cartoon"}
                </button>
              </div>
              {busy === "cartoon" && <p className="faint">This can take up to a minute.</p>}
            </>
          ) : (
            <p className="muted">The cartoon maker isn&apos;t connected yet, so your card will show its type symbol for now. You can still save your hero.</p>
          )}
          {note && <p className="faint">{note}</p>}
        </div>

        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <label className="field">
            Hero name
            <input type="text" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Captain Storm" />
          </label>
          <label className="field">
            Special move
            <input type="text" maxLength={40} value={move} onChange={(e) => setMove(e.target.value)} placeholder="Cloud Rider" />
          </label>
        </div>

        <div className="panel stack" style={{ gap: 6 }}>
          <b>Your power spots total 8,000</b>
          <span className="muted">Your hero has a bit of all 8 types, one on each spot. The type you pick gets the biggest number, and your weak spot sits right opposite it, so even a hero card can lose a spin.</span>
        </div>

        <label className="check panel">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          <span className="stack" style={{ gap: 4 }}>
            <b>Add a 200-point version to other kids&apos; packs</b>
            <span className="muted">We check every card first, then players vote on its power. Only the cartoon, name and powers are shared, never who made it. Parents can switch this off any time.</span>
          </span>
        </label>

        {error && <div className="notice notice-error" role="alert">{error}</div>}
        <div className="row">
          <button className="btn btn-lg" disabled={!name.trim() || !move.trim() || busy === "save"} onClick={save}>
            {busy === "save" ? "Saving..." : "Save my hero and order"}
          </button>
          <span className="faint">Hero pack: 2 hero cards + 8 surprise cards</span>
        </div>
      </div>

      <div className="stack" style={{ flex: "1 1 320px", alignItems: "center", position: "sticky", top: 16 }}>
        <span className="eyebrow" style={{ color: "var(--muted)" }}>Live preview</span>
        <GameCard card={preview} width={320} hero />
      </div>
    </div>
  );
}
