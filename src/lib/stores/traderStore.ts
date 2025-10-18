"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** ---- Types aligned to your API ---- */
export type ScoreBreakdown = {
  accountAge: number;
  tradingVolume: number;
  winRate: number;
  tradeCount: number;
  profitability: number;
  total: number;
};

export type Metrics = {
  totalTrades: number;
  totalVolume: number; // numbers in store (we coerce from API)
  accountAgeYears: number;
  winRate: number; // percentage (0..100)
  totalPnL: number;
  roi: number; // percentage (e.g. 12.34)
  winningTrades: number;
  losingTrades: number;
};

export type Trader = {
  address: string;
  platform: "hyperliquid";
  trustScore: number;
  scoreBreakdown: ScoreBreakdown;
  metrics: Metrics;
  createdAt?: string;
  updatedAt?: string;
};

type TraderState = {
  trader: Trader | null;

  /** Set the whole trader object */
  setTrader: (t: Trader) => void;

  /** Shallow patch fields on the stored trader */
  patchTrader: (patch: Partial<Trader>) => void;

  /** Clear the store */
  clearTrader: () => void;

  /**
   * Accepts your API response and normalizes into the store shape.
   * Works with both /trader-login/hyperliquid and /trader-signup responses.
   */
  setFromApi: (apiJson: any) => void;
};

/** Safely coerce numeric strings from API into numbers */
function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

/** Some builds SSR-render pages; guard localStorage on server */
const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : undefined;

export const useTraderStore = create<TraderState>()(
  persist(
    (set, get) => ({
      trader: null,

      setTrader: (t) => set({ trader: t }),

      patchTrader: (patch) =>
        set((s) => (s.trader ? { trader: { ...s.trader, ...patch } } : s)),

      clearTrader: () => set({ trader: null }),

      setFromApi: (apiJson) => {
        // Expecting { success, data: { ...traderFields } }
        const data = apiJson?.data ?? apiJson;

        if (!data || !data.address) {
          // If your /signup 404 returns {success:false, message}, just ignore
          return;
        }

        const normalized: Trader = {
          address: String(data.address).toLowerCase(),
          platform: data.platform ?? "hyperliquid",
          trustScore: toNum(data.trustScore),

          scoreBreakdown: {
            accountAge: toNum(data.scoreBreakdown?.accountAge),
            tradingVolume: toNum(data.scoreBreakdown?.tradingVolume),
            winRate: toNum(data.scoreBreakdown?.winRate),
            tradeCount: toNum(data.scoreBreakdown?.tradeCount),
            profitability: toNum(data.scoreBreakdown?.profitability),
            total: toNum(data.scoreBreakdown?.total),
          },

          metrics: {
            totalTrades: toNum(data.metrics?.totalTrades),
            totalVolume: toNum(data.metrics?.totalVolume),
            accountAgeYears: toNum(data.metrics?.accountAgeYears),
            winRate: toNum(data.metrics?.winRate),
            totalPnL: toNum(data.metrics?.totalPnL),
            roi: toNum(data.metrics?.roi),
            winningTrades: toNum(data.metrics?.winningTrades),
            losingTrades: toNum(data.metrics?.losingTrades),
          },

          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        set({ trader: normalized });
      },
    }),
    {
      name: "trader-store-v1",
      storage,
      // Only persist the trader (not actions)
      partialize: (state) => ({ trader: state.trader }),
      version: 1,
    }
  )
);

/** ---- Convenience selector hooks ---- */
export const useTrader = () => useTraderStore((s) => s.trader);
export const useTraderAddress = () =>
  useTraderStore((s) => s.trader?.address ?? null);
export const useTrustScore = () =>
  useTraderStore((s) => s.trader?.trustScore ?? null);
