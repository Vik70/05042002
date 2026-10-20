"use client";

import { useState } from "react";

export function LockDoorButton() {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/gate", { method: "DELETE" }).catch(() => {});
        window.location.replace("/gate");
      }}
      className="font-sans text-xs uppercase tracking-[0.3em] text-[#4a3428]/45 transition hover:text-[#4a3428]/80 disabled:opacity-40"
    >
      {busy ? "locking…" : "lock the door behind you"}
    </button>
  );
}
