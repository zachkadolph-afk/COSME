import { redirect } from "next/navigation";
import { playableCards } from "@/lib/cards";
import { currentUser, supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { CardData } from "@/components/GameCard";
import type { CardType } from "@/lib/game";
import { VoteBattle } from "./VoteBattle";

export const metadata = { title: "Vote · COSME" };
export const dynamic = "force-dynamic";

export default async function VotePage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/vote");
  const supabase = await supabaseServer();

  const [{ data: voting }, { data: mine }, { data: voted }] = await Promise.all([
    supabase.from("cards").select("id, number, name, type, move, description, art_url, total, spots, weaknesses, rarity, status, vote_count, vote_score").eq("status", "voting").order("created_at"),
    supabase.from("heroes").select("community_card_id"),
    supabaseAdmin().from("votes").select("card_id").eq("voter_id", user.id),
  ]);

  const skip = new Set([...(mine ?? []).map((h) => h.community_card_id), ...(voted ?? []).map((v) => v.card_id)]);
  const open = (voting ?? []).filter((c) => !skip.has(c.id));
  const next = open[0];

  if (!next) {
    return (
      <div className="narrow stack-lg" style={{ paddingBottom: 48 }}>
        <h1>Who wins this battle?</h1>
        <div className="panel stack">
          <p className="lead">You&apos;ve voted on every new hero for now.</p>
          <p className="muted">New heroes need 52 votes before they join the packs. Check back when more kids make heroes.</p>
        </div>
      </div>
    );
  }

  const opponents = await playableCards();
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];

  return (
    <VoteBattle
      card={{ ...next, type: next.type as CardType } as CardData & { vote_count: number; vote_score: number }}
      opponent={opponent}
      remaining={open.length}
    />
  );
}
