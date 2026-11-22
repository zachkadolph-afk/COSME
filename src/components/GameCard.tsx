import { TYPE_INFO, type CardType } from "@/lib/game";

export type CardData = {
  id?: string;
  number?: number | null;
  name: string;
  type: CardType;
  move: string;
  description?: string | null;
  art_url?: string | null;
  total: number;
  spots: number[];
  weaknesses: string[];
  rarity?: string | null;
  status?: string | null;
};

export function TypeIcon({ type, size = 20, stroke = "#0A0A0F" }: { type: CardType; size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TYPE_INFO[type].icon} />
    </svg>
  );
}

export function TypeBadge({ type, size = 28 }: { type: CardType; size?: number }) {
  return (
    <span
      title={`${type} type`}
      style={{ width: size, height: size, flex: `0 0 ${size}px`, borderRadius: "50%", background: TYPE_INFO[type].color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <TypeIcon type={type} size={Math.round(size * 0.58)} />
      <span className="sr-only">{type} type</span>
    </span>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * A full COSME card: picture and stats in the middle, the 8 power spots
 * in a thin border (4 corners, 4 edges). `highlight` marks the spot that fought.
 */
export function GameCard({
  card,
  width = 260,
  hero = false,
  highlight,
}: {
  card: CardData;
  width?: number;
  hero?: boolean;
  highlight?: number;
}) {
  const color = TYPE_INFO[card.type].color;
  const border = hero ? "linear-gradient(150deg, #FFD23F, #FF8A3D 35%, #8B5CF6 70%, #3B82F6)" : color;
  const s = card.spots;
  const spot = (i: number, style: React.CSSProperties) => (
    <span
      style={{
        position: "absolute",
        fontFamily: "var(--display)",
        fontSize: Math.max(10, Math.round(width / 24)),
        color: highlight === i ? "#0A0A0F" : "#D9D4EA",
        background: highlight === i ? "#FFD23F" : "transparent",
        borderRadius: 6,
        padding: "0 4px",
        lineHeight: 1.4,
        ...style,
      }}
    >
      {fmt(s[i])}
    </span>
  );
  return (
    <div style={{ width, aspectRatio: "5 / 7", borderRadius: 18, padding: 6, background: border, flex: "0 0 auto" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 13, background: "#120F1C", padding: Math.round(width / 11) }}>
        {spot(0, { top: 4, left: 6 })}
        {spot(1, { top: 4, left: 0, right: 0, margin: "0 auto", width: "fit-content" })}
        {spot(2, { top: 4, right: 6 })}
        {spot(3, { right: -4, top: "50%", transform: "translateY(-50%) rotate(90deg)" })}
        {spot(4, { bottom: 4, right: 6, transform: "rotate(180deg)" })}
        {spot(5, { bottom: 4, left: 0, right: 0, margin: "0 auto", width: "fit-content", transform: "rotate(180deg)" })}
        {spot(6, { bottom: 4, left: 6, transform: "rotate(180deg)" })}
        {spot(7, { left: -4, top: "50%", transform: "translateY(-50%) rotate(-90deg)" })}
        <div style={{ height: "100%", borderRadius: 10, border: `3px solid ${color}`, background: "#1A1626", padding: 8, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: Math.round(width / 16), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "var(--display)", fontSize: Math.round(width / 14), color: hero ? "#FFD23F" : color }}>{fmt(card.total)}</span>
              <TypeBadge type={card.type} size={Math.round(width / 11)} />
            </span>
          </div>
          <div style={{ flex: "1 1 auto", minHeight: 0, borderRadius: 6, background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {card.art_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.art_url} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <TypeIcon type={card.type} size={Math.round(width / 4)} stroke={color} />
            )}
          </div>
          <div style={{ background: "#F5F3FF", color: "#120F1C", borderRadius: 6, padding: "5px 8px", fontSize: Math.max(10, Math.round(width / 22)) }}>
            <div style={{ fontWeight: 800 }}>{card.move}</div>
            <div>Weak to {card.weaknesses.join(" and ") || "nothing"}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: Math.max(9, Math.round(width / 26)), fontWeight: 800, color: hero ? "#FFD23F" : "#B9B4C9" }}>
            <span>{hero ? "YOUR HERO" : card.rarity && card.rarity !== "common" ? card.rarity.toUpperCase() : card.type.toUpperCase()}</span>
            <span>{card.number ? `#${String(card.number).padStart(3, "0")}` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
