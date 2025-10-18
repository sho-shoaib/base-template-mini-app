// app/trader/[address]/create-vault/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const isHexAddress42 = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s);

export default function CreateVaultPage() {
  const router = useRouter();
  const params = useParams<{ address: string }>();
  const traderAddress = String(params.address || "").toLowerCase();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [custodyAddress, setCustodyAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCancel = useCallback(() => {
    router.push(`/trader/${traderAddress}`);
  }, [router, traderAddress]);

  const onSubmit = useCallback(async () => {
    if (!name.trim()) return setError("Please enter a vault name.");
    if (!isHexAddress42(custodyAddress.trim())) {
      return setError(
        "Enter a valid EVM address (0x + 40 hex chars) to custody investor funds."
      );
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          custodyAddress: custodyAddress.trim(),
          traderAddress, // API will resolve traderId
          platform: "hyperliquid",
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.success !== true) {
        throw new Error(json?.error || "Failed to create vault");
      }

      // Optionally: store the created vault in a Zustand vault store later
      // For now, redirect back to trader page
      router.push(`/trader/${traderAddress}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create vault.");
    } finally {
      setSubmitting(false);
    }
  }, [name, description, custodyAddress, traderAddress, router]);

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold">Create Vault</h1>
          <p className="text-sm text-zinc-400">
            Trader: <span className="font-mono">{traderAddress}</span>
          </p>
        </header>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Vault Name</label>
            <input
              type="text"
              placeholder="e.g. Alpha Momentum Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Description</label>
            <textarea
              placeholder="Brief description of the strategy, risk, and goals."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">
              Address to Custody Investor Funds
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={custodyAddress}
              onChange={(e) => setCustodyAddress(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-white outline-none focus:border-zinc-500"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-xs text-zinc-500">
              This should be the wallet where investor deposits are held.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-md bg-emerald-400 px-5 py-3 font-medium text-black disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Vault"}
            </button>
            <button
              onClick={onCancel}
              disabled={submitting}
              className="rounded-md bg-zinc-800 px-5 py-3 font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Vaults are linked to the trader by <code>traderId</code> in MongoDB.
        </p>
      </div>
    </div>
  );
}
