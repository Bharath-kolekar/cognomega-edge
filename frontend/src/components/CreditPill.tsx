import React, { useEffect, useState } from "react";
import { fetchCredits } from "../lib/billing/credits";

export default function CreditPill() {
  const [label, setLabel] = useState<string>("Credits: —");
  const [stamp, setStamp] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const info = await fetchCredits();
        if (!mounted) return;

        let text = "Credits: ";
        if (info.requiresAuth) text += "sign in";
        else if (info.unsupported) text += "—";
        else if (typeof info.balance === "number") text += String(info.balance);
        else text += "0";

        setLabel(text);
        setStamp(new Date().toLocaleTimeString());
      } catch {
        if (mounted) {
          setLabel("Credits: error");
          setStamp(new Date().toLocaleTimeString());
        }
      }
    }

    refresh();
    const t = setInterval(refresh, 60_000); // refresh every minute
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.2 }}>
      <div style={{ fontSize: 16 }}>{label}</div>
      {stamp && <div style={{ fontSize: 12, color: "#666" }}>updated {stamp}</div>}
    </div>
  );
}
