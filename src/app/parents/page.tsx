import Link from "next/link";
import { redirect } from "next/navigation";
import { GameCard } from "@/components/GameCard";
import { weaknessesOf, type CardType } from "@/lib/game";
import { currentUser, supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { DeleteAccount, ShareToggle } from "./ParentControls";

export const metadata = { title: "Parent area · COSME" };
export const dynamic = "force-dynamic";

const ORDER_STATUS: Record<string, string> = { pending: "Waiting for payment", paid: "Paid", printing: "Printing", shipped: "Shipped", cancelled: "Cancelled" };
const CARD_STATUS: Record<string, string> = { review: "Being checked", voting: "Players are voting", locked: "In the game", retired: "Not in packs" };

export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login?next=/parents");
  const supabase = await supabaseServer();

  const [{ data: profile }, { data: heroes }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("heroes").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
  ]);

  // Community card status for this parent's own heroes. Cards still in review aren't public,
  // so read them with the server key; the ids come only from heroes this parent owns.
  const cardIds = (heroes ?? []).map((h) => h.community_card_id).filter(Boolean) as string[];
  const statusById = new Map<string, { status: string; number: number; vote_count: number }>();
  if (cardIds.length) {
    const { data: cards } = await supabaseAdmin().from("cards").select("id, status, number, vote_count").in("id", cardIds);
    cards?.forEach((c) => statusById.set(c.id, c));
  }

  return (
    <div className="wrap stack-lg" style={{ paddingBottom: 48 }}>
      {order === "thanks" && <div className="notice notice-ok">Thanks! Your order is in. We&apos;ll email you when it ships.</div>}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Your family&apos;s heroes</h1>
        <form action="/auth/signout" method="post"><button className="btn btn-ghost">Sign out</button></form>
      </div>

      {!heroes?.length ? (
        <div className="panel stack">
          <p className="lead">No heroes yet.</p>
          <div><Link href="/make" className="btn">Make a hero</Link></div>
        </div>
      ) : (
        <div className="grid-3">
          {heroes.map((h) => {
            const card = h.community_card_id ? statusById.get(h.community_card_id) : undefined;
            const status = card ? (h.share_in_community ? CARD_STATUS[card.status] : CARD_STATUS.retired) : "Private: your packs only";
            return (
              <div key={h.id} className="panel stack" style={{ alignItems: "center" }}>
                <GameCard hero width={240} card={{ name: h.name, type: h.type as CardType, move: h.move, art_url: h.avatar_url, total: 8000, spots: h.hero_spots, weaknesses: weaknessesOf(h.type as CardType) }} />
                <div className="stack" style={{ width: "100%", gap: 8 }}>
                  <span className="badge" style={{ background: card && h.share_in_community ? "var(--green)" : "var(--yellow)", alignSelf: "flex-start" }}>{status}</span>
                  {card && h.share_in_community && card.status === "voting" && <span className="faint">{card.vote_count} of 52 votes</span>}
                  {card && card.status === "locked" && <span className="faint">Community card #{String(card.number).padStart(3, "0")}</span>}
                  <ShareToggle heroId={h.id} initial={h.share_in_community} />
                  <Link href={`/order?hero=${h.id}`} className="btn btn-ghost">Order a pack</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="stack">
        <h2 style={{ fontSize: 26 }}>Orders</h2>
        {orders?.length ? (
          <div className="scroll-x">
            <table className="list">
              <thead><tr><th>Date</th><th>Items</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleDateString("en-US")}</td>
                    <td>Hero pack{o.surprise_packs ? ` + ${o.surprise_packs} surprise pack${o.surprise_packs > 1 ? "s" : ""}` : ""}</td>
                    <td>{ORDER_STATUS[o.status] ?? o.status}</td>
                    <td>{o.amount_total != null ? `$${(o.amount_total / 100).toFixed(2)}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No orders yet.</p>
        )}
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 26 }}>Privacy</h2>
        <div className="panel stack">
          <span>Permission given: <b>{profile?.consent_at ? new Date(profile.consent_at).toLocaleDateString("en-US") : "not yet"}</b></span>
          <span className="muted">Real photos are never saved. Nobody can look up who owns a card. There are no messages and no locations in COSME.</span>
          <DeleteAccount />
        </div>
      </div>

      {profile?.is_admin && <div><Link href="/admin" className="btn btn-ghost">Admin: review new cards</Link></div>}
    </div>
  );
}
