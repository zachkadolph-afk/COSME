import { notFound, redirect } from "next/navigation";
import { GameCard, type CardData } from "@/components/GameCard";
import type { CardType } from "@/lib/game";
import { currentUser, supabaseAdmin } from "@/lib/supabase/server";
import { ReviewButtons } from "./ReviewButtons";

export const metadata = { title: "Admin · COSME" };
export const dynamic = "force-dynamic";

/** Admins check every new community card before players vote on it. */
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) notFound();

  const [{ data: review }, { data: orders }] = await Promise.all([
    admin.from("cards").select("*").eq("status", "review").order("created_at"),
    admin.from("orders").select("id, created_at, status, surprise_packs, amount_total, hero_id").in("status", ["paid", "printing"]).order("created_at"),
  ]);

  return (
    <div className="wrap stack-lg" style={{ paddingBottom: 48 }}>
      <h1>Admin</h1>
      <div className="stack">
        <h2 style={{ fontSize: 26 }}>New cards to check ({review?.length ?? 0})</h2>
        <p className="muted">Approve cards with a friendly cartoon, name and move. Approved cards go to voting.</p>
        <div className="grid-cards" style={{ justifyItems: "center" }}>
          {(review ?? []).map((c) => (
            <div key={c.id} className="stack" style={{ alignItems: "center" }}>
              <GameCard card={{ ...c, type: c.type as CardType } as CardData} width={220} />
              <ReviewButtons cardId={c.id} />
            </div>
          ))}
        </div>
      </div>
      <div className="stack">
        <h2 style={{ fontSize: 26 }}>Orders to print ({orders?.length ?? 0})</h2>
        <p className="muted">Shipping addresses are in Stripe and in the orders table in Supabase.</p>
        {orders?.length ? (
          <div className="scroll-x">
            <table className="list">
              <thead><tr><th>Date</th><th>Order</th><th>Packs</th><th>Status</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}><td>{new Date(o.created_at).toLocaleDateString("en-US")}</td><td>{o.id.slice(0, 8)}</td><td>Hero pack + {o.surprise_packs}</td><td>{o.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">Nothing to print.</p>}
      </div>
    </div>
  );
}
