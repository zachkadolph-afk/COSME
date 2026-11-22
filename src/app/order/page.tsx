import Link from "next/link";
import { redirect } from "next/navigation";
import { GameCard } from "@/components/GameCard";
import { weaknessesOf, type CardType } from "@/lib/game";
import { stripeConfigured } from "@/lib/stripe";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { OrderForm } from "./OrderForm";

export const metadata = { title: "Order · COSME" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ hero?: string; cancelled?: string }> }) {
  const { hero: heroId, cancelled } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login?next=/order");
  const supabase = await supabaseServer();

  const { data: heroes } = await supabase.from("heroes").select("*").order("created_at", { ascending: false });
  const hero = heroes?.find((h) => h.id === heroId) ?? heroes?.[0];
  if (!hero) {
    return (
      <div className="narrow stack-lg">
        <h1>Make a hero first</h1>
        <p className="lead">Every order starts with your own hero card.</p>
        <div><Link href="/make" className="btn btn-lg">Make my hero</Link></div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start", paddingBottom: 48 }}>
      <div className="stack-lg" style={{ flex: "999 1 520px", minWidth: 0 }}>
        <div className="steps"><span className="done">1 Grown-up check ✓</span><span className="done">2 Build your hero ✓</span><span className="now">3 Order</span></div>
        <h1>Your order</h1>
        {cancelled && <div className="notice notice-info">Checkout was cancelled. Nothing was charged.</div>}
        {heroes && heroes.length > 1 && (
          <div className="row" style={{ gap: 8 }}>
            <span className="faint">Ordering for:</span>
            {heroes.map((h) => (
              <Link key={h.id} href={`/order?hero=${h.id}`} className="chip" aria-pressed={h.id === hero.id} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                {h.name}
              </Link>
            ))}
          </div>
        )}
        <OrderForm heroId={hero.id} heroName={hero.name} checkoutReady={stripeConfigured()} />
      </div>
      <div className="stack" style={{ flex: "1 1 300px", alignItems: "center" }}>
        <GameCard
          hero
          width={300}
          card={{ name: hero.name, type: hero.type as CardType, move: hero.move, art_url: hero.avatar_url, total: 8000, spots: hero.hero_spots, weaknesses: weaknessesOf(hero.type as CardType) }}
        />
        <span className="faint">2 of these come in your pack</span>
      </div>
    </div>
  );
}
