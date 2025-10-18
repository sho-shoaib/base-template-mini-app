"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTraderStore } from "../../lib/stores/traderStore";

const isHexAddress42 = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s);

export default function TraderSignup() {
  const router = useRouter();

  // Zustand actions (pull only what you need to avoid re-renders)
  const setFromApi = useTraderStore((s) => s.setFromApi);

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState<"signup" | "login" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalized = address.trim();

  const handleDone = useCallback(
    (addr: string) => router.push(`/trader/${addr.toLowerCase()}`),
    [router]
  );

  const validate = useCallback(() => {
    if (!isHexAddress42(normalized)) {
      setError("Enter a valid 0x wallet address (42 chars).");
      return false;
    }
    setError(null);
    return true;
  }, [normalized]);

  // SIGN UP → READ existing trader from MongoDB
  const signup = useCallback(async () => {
    if (!validate()) return;
    try {
      setLoading("signup");
      const res = await fetch("/api/trader-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: normalized }),
      });
      const json = await res.json();

      if (!res.ok || json?.success === false) {
        const msg =
          json?.message ||
          (res.status === 404
            ? "No existing trader found for this address."
            : "Sign up (fetch existing) failed.");
        throw new Error(msg);
      }

      // ✅ Store in Zustand
      setFromApi(json);

      // Redirect
      handleDone(normalized);
    } catch (e: any) {
      setError(e?.message || "Sign up failed.");
    } finally {
      setLoading(null);
    }
  }, [normalized, validate, handleDone, setFromApi]);

  // LOGIN → CREATE/UPSERT via Hyperliquid compute
  const login = useCallback(async () => {
    if (!validate()) return;
    try {
      setLoading("login");
      const res = await fetch("/api/trader-login/hyperliquid", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: normalized }),
      });
      const json = await res.json();

      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error || json?.message || "Login (create) failed."
        );
      }

      // ✅ Store in Zustand
      setFromApi(json);

      // Redirect
      handleDone(normalized);
    } catch (e: any) {
      setError(e?.message || "Login failed.");
    } finally {
      setLoading(null);
    }
  }, [normalized, validate, handleDone, setFromApi]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Enter Wallet Address (Hyperliquid)
        </h1>

        <div className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-zinc-500"
            autoComplete="off"
            spellCheck={false}
          />

          {!!error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-4">
            {/* Sign up = READ existing from DB */}
            <button
              onClick={signup}
              disabled={loading !== null}
              className="rounded-md bg-blue-400 px-5 py-3 font-medium text-black disabled:opacity-60"
              aria-busy={loading === "signup"}
              title="Reads existing trader from MongoDB"
            >
              {loading === "signup" ? "Signing up..." : "Sign up"}
            </button>

            {/* Login = CREATE/UPSERT using Hyperliquid data */}
            <button
              onClick={login}
              disabled={loading !== null}
              className="rounded-md bg-purple-400 px-5 py-3 font-medium text-black disabled:opacity-60"
              aria-busy={loading === "login"}
              title="Creates/updates trader using Hyperliquid data"
            >
              {loading === "login" ? "Logging in..." : "Login"}
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            <span className="font-semibold">Sign up</span> fetches existing
            trader from MongoDB. <span className="font-semibold">Login</span>{" "}
            computes trust score from Hyperliquid and stores it.
          </p>
        </div>
      </div>
    </div>
  );
}
