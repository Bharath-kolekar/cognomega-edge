import React, { useEffect, useState } from "react";
import { fetchCreditBalance } from "../lib/billing/credits";

export default function CreditPill() {
  const [balance, setBalance] = useState<number|null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    const probe = async () => {
      setPending(true);
      const v = await fetchCreditBalance();
      if (!alive) return;
      if (v !== null) setBalance(v);
      setPending(false);
    };
    probe();
    const id = setInterval(probe, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-sm">
      <span className="opacity-75">Credits</span>
      <span className="font-semibold">{balance ?? "—"}</span>
      {pending && <span className="animate-pulse opacity-70">·</span>}
    </div>
  );
}