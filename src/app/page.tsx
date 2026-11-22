import Link from "next/link";
import { GameCard, TypeBadge } from "@/components/GameCard";
import { libraryCards } from "@/lib/cards";
import { HERO_TOTAL, TYPES, TYPE_INFO, makeSpots, weaknessesOf } from "@/lib/game";

export const revalidate = 300;

export default async function Home() {
  const cards = await libraryCards();
  const featured = cards.filter((c) => c.art_url).slice(0, 3);
  const squad = cards.filter((c) => c.status === "starter").slice(0, 8);
  const heroSample = featured[0]
    ? { ...featured[0], total: HERO_TOTAL, spots: makeSpots("home-hero", HERO_TOTAL), number: null }
    : null;

  return (
    <>
      <section className="wrap" style={{ padding: "32px 24px 72px", display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
        <div className="stack-lg" style={{ flex: "1 1 460px", minWidth: 0 }}>
          <div className="eyebrow">The card game where you are a card</div>
          <h1>Become the hero of your own deck</h1>
          <p className="lead">
            Turn yourself into a cartoon hero with 8,000 power. Collect packs of cards made by kids everywhere, spin them, flip them and battle your friends.
          </p>
          <div className="row">
            <Link href="/make" className="btn btn-lg">Make my hero</Link>
            <Link href="#play" className="btn btn-ghost btn-lg">See how to play</Link>
          </div>
          <p className="faint">A grown-up sets up the account. Your real photo is never stored or shown.</p>
        </div>
        <div style={{ flex: "1 1 380px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 440, position: "relative", overflow: "hidden" }}>
          {featured[1] && (
            <div style={{ position: "absolute", transform: "translateX(-130px) rotate(-12deg)" }}>
              <GameCard card={featured[1]} width={210} />
            </div>
          )}
          {featured[2] && (
            <div style={{ position: "absolute", transform: "translateX(130px) rotate(12deg)" }}>
              <GameCard card={featured[2]} width={210} />
            </div>
          )}
          {heroSample && (
            <div style={{ position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,.6)", borderRadius: 18 }}>
              <GameCard card={heroSample} width={250} hero />
            </div>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap stack-lg">
          <h2>How you join the game</h2>
          <div className="grid-3">
            {[
              ["1", "A grown-up signs in", "Parents set up the account and give permission first.", "#FF8A3D"],
              ["2", "Snap a photo", "We turn it into a cartoon hero that still looks like you. The real photo is never saved.", "#FFD23F"],
              ["3", "Pick your power", "Choose one of 8 types, name your hero and invent a special move.", "#A78BFA"],
              ["4", "Get your hero pack", "10 cards in the mail: 2 of your own 8,000 hero card plus 8 surprise cards made by other kids.", "#60A5FA"],
            ].map(([n, t, d, c]) => (
              <div key={n} className="panel-dark stack" style={{ borderTop: `5px solid ${c}` }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 30, color: c }}>{n}</div>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="play" className="section">
        <div className="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 48 }}>
          <div className="stack-lg" style={{ flex: "1 1 420px", minWidth: 0 }}>
            <h2>How to play</h2>
            <ol className="stack" style={{ margin: 0, paddingLeft: 22, fontSize: 17, color: "#d9d4ea" }}>
              <li><b style={{ color: "#fff" }}>Bring 10 cards.</b> One pack is a full deck (15 max). Only one hero card allowed.</li>
              <li><b style={{ color: "#fff" }}>Spin it 5 times.</b> Card face down, spin, then flip it over.</li>
              <li><b style={{ color: "#fff" }}>The spot facing your rival fights.</b> Every card has all 8 types, one on each spot (4 corners, 4 edges). Its biggest number is its main type, and its weak spot sits right opposite.</li>
              <li><b style={{ color: "#fff" }}>Type beats numbers.</b> If the type on your spot beats the type on theirs, you win, even against 8,000.</li>
              <li><b style={{ color: "#fff" }}>No type advantage?</b> The bigger number wins.</li>
              <li><b style={{ color: "#fff" }}>Most wins out of 10 takes the game.</b> Nobody loses cards by playing. Trading is separate.</li>
            </ol>
            <div className="row">
              <Link href="/play" className="btn btn-yellow">Try a battle online</Link>
            </div>
          </div>
          <div className="stack" style={{ flex: "1 1 420px", minWidth: 0 }}>
            <h3>The 8 types</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {TYPES.map((t) => (
                <div key={t} className="panel" style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                  <TypeBadge type={t} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>{t}</div>
                    <div className="faint">Beats {TYPE_INFO[t].beats.join(", ").toLowerCase()} · weak to {weaknessesOf(t).join(", ").toLowerCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap stack-lg">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <div className="stack">
              <h2>Meet the starter squad</h2>
              <p className="muted">36 cards to start. Kids&apos; heroes slowly take over the game.</p>
            </div>
            <Link href="/cards" style={{ fontWeight: 800 }}>See all cards</Link>
          </div>
          <div className="grid-cards" style={{ justifyItems: "center" }}>
            {squad.map((c) => <GameCard key={c.id} card={c} width={210} />)}
          </div>
        </div>
      </section>

      <section id="shop" className="section">
        <div className="wrap stack-lg">
          <h2>Shop</h2>
          <div className="grid-3">
            <div className="panel stack" style={{ border: "3px solid var(--orange)" }}>
              <div className="eyebrow" style={{ color: "var(--orange)" }}>Start here</div>
              <h3 style={{ fontSize: 24 }}>Hero pack</h3>
              <p className="muted">10 cards: 2 copies of your own 8,000 hero card plus 8 surprise community cards.</p>
              <Link href="/make" className="btn">Make my hero</Link>
            </div>
            <div className="panel stack">
              <div className="eyebrow" style={{ color: "#A78BFA" }}>Collect more</div>
              <h3 style={{ fontSize: 24 }}>Surprise packs</h3>
              <p className="muted">10 random cards from every hero in the game. Add them when you order your hero pack.</p>
            </div>
            <div className="panel stack">
              <div className="eyebrow" style={{ color: "#60A5FA" }}>Find any card</div>
              <h3 style={{ fontSize: 24 }}>Card library</h3>
              <p className="muted">Look up any card by its number. Cards never show who made them.</p>
              <Link href="/cards" className="btn btn-ghost">Open the library</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap stack-lg">
          <h2>Safe by design</h2>
          <div className="grid-3">
            <div className="stack"><h3 style={{ color: "var(--yellow)" }}>Parents own the account</h3><p className="muted">Kids under 13 play under a parent&apos;s account. A parent gives permission before any photo is used.</p></div>
            <div className="stack"><h3 style={{ color: "var(--yellow)" }}>Cartoon only</h3><p className="muted">The photo is turned into a cartoon and never saved. Only the cartoon is ever shown.</p></div>
            <div className="stack"><h3 style={{ color: "var(--yellow)" }}>Nobody can find you</h3><p className="muted">No looking up who owns a card, no messages and no locations.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
