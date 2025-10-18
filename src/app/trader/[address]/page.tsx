// app/trader/[address]/page.tsx
"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrader } from "../../../lib/stores/traderStore";

export default function TraderPage() {
  const router = useRouter();
  const params = useParams<{ address: string }>();
  const routeAddress = String(params.address || "").toLowerCase();

  // From Zustand store
  const trader = useTrader();

  // If store has a trader but route param differs, prefer route param for links
  const displayAddress = useMemo(
    () => routeAddress || trader?.address || "",
    [routeAddress, trader?.address]
  );

  const goCreateVault = () => {
    if (!displayAddress) return;
    router.push(`/trader/${displayAddress}/create-vault`);
  };

  if (!trader || trader.address !== routeAddress) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Trader</h1>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <p className="text-zinc-300 mb-2">
              No trader data found in store for{" "}
              <span className="font-mono text-zinc-100">{routeAddress}</span>.
            </p>
            <p className="text-sm text-zinc-500">
              Please go back and use{" "}
              <span className="font-semibold">Sign up</span> (read) or{" "}
              <span className="font-semibold">Login</span> (create) to load the
              profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    trustScore,
    scoreBreakdown,
    metrics,
    platform,
    updatedAt,
    createdAt,
  } = trader;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trader</h1>
            <p className="text-sm text-zinc-400">
              Address:{" "}
              <span className="font-mono text-zinc-200">{displayAddress}</span>{" "}
              • Platform: <span className="uppercase">{platform}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Created: {createdAt ? new Date(createdAt).toLocaleString() : "—"}{" "}
              • Updated:{" "}
              {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
            </p>
          </div>

          <button
            onClick={goCreateVault}
            className="rounded-md bg-emerald-400 px-5 py-3 font-medium text-black hover:opacity-90"
            title="Create a new vault for this trader"
          >
            Create Vault
          </button>
        </header>

        {/* Trust Score Card */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-3">Trust Score</h2>
            <div className="text-5xl font-bold">{trustScore}</div>
            <p className="text-sm text-zinc-400 mt-1">out of 100</p>

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Account Age</span>
                <span className="font-medium">
                  {scoreBreakdown.accountAge}/25
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trading Volume</span>
                <span className="font-medium">
                  {scoreBreakdown.tradingVolume}/25
                </span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate</span>
                <span className="font-medium">{scoreBreakdown.winRate}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Trade Count</span>
                <span className="font-medium">
                  {scoreBreakdown.tradeCount}/15
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profitability</span>
                <span className="font-medium">
                  {scoreBreakdown.profitability}/15
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="md:col-span-2 rounded-xl border border-zinc-700 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold mb-3">Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Metric label="Total Trades" value={metrics.totalTrades} />
              <Metric label="Total Volume ($)" value={metrics.totalVolume} />
              <Metric
                label="Account Age (yrs)"
                value={metrics.accountAgeYears}
              />
              <Metric label="Win Rate (%)" value={metrics.winRate} />
              <Metric label="Total PnL ($)" value={metrics.totalPnL} />
              <Metric label="ROI (%)" value={metrics.roi} />
              <Metric label="Winning Trades" value={metrics.winningTrades} />
              <Metric label="Losing Trades" value={metrics.losingTrades} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">
        {typeof value === "number" ? formatNum(value) : value}
      </div>
    </div>
  );
}

function formatNum(n: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n;
  }
}
