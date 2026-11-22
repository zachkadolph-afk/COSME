"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewButtons({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(status: "voting" | "retired") {
    setBusy(true);
    await fetch(`/api/admin/cards/${cardId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    router.refresh();
  }

  return (
    <div className="row" style={{ gap: 8 }}>
      <button className="btn" disabled={busy} onClick={() => set("voting")}>Approve</button>
      <button className="btn btn-danger" disabled={busy} onClick={() => set("retired")}>Turn away</button>
    </div>
  );
}
