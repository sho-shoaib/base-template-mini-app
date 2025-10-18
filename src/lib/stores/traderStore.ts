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
  totalVolume: number;
  accountAgeYears: number;
  winRate: number;
  totalPnL: number;
  roi: number;
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

interface ApiScoreBreakdown {
  accountAge?: number;
  tradingVolume?: number;
  winRate?: number;
  tradeCount?: number;
  profitability?: number;
  total?: number;
}

interface ApiMetrics {
  totalTrades?: number;
  totalVolume?: number;
  accountAgeYears?: number;
  winRate?: number;
  totalPnL?: number;
  roi?: number;
  winningTrades?: number;
  losingTrades?: number;
}

interface ApiResponse {
  success?: boolean;
  data?: {
    address?: string;
    platform?: string;
    trustScore?: string | number;
    scoreBreakdown?: ApiScoreBreakdown;
    metrics?: ApiMetrics;
    createdAt?: string;
    updatedAt?: string;
  };
  address?: string;
  platform?: string;
  trustScore?: string | number;
  scoreBreakdown?: ApiScoreBreakdown;
  metrics?: ApiMetrics;
  createdAt?: string;
  updatedAt?: string;
}

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
  setFromApi: (apiJson: ApiResponse) => void;
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
    (set) => ({
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
          platform: (data.platform ?? "hyperliquid") as "hyperliquid",
          trustScore: toNum(data.trustScore),

          scoreBreakdown: {
            accountAge: toNum(data.scoreBreakdown?.accountAge ?? 0),
            tradingVolume: toNum(data.scoreBreakdown?.tradingVolume ?? 0),
            winRate: toNum(data.scoreBreakdown?.winRate ?? 0),
            tradeCount: toNum(data.scoreBreakdown?.tradeCount ?? 0),
            profitability: toNum(data.scoreBreakdown?.profitability ?? 0),
            total: toNum(data.scoreBreakdown?.total ?? 0),
          },

          metrics: {
            totalTrades: toNum(data.metrics?.totalTrades ?? 0),
            totalVolume: toNum(data.metrics?.totalVolume ?? 0),
            accountAgeYears: toNum(data.metrics?.accountAgeYears ?? 0),
            winRate: toNum(data.metrics?.winRate ?? 0),
            totalPnL: toNum(data.metrics?.totalPnL ?? 0),
            roi: toNum(data.metrics?.roi ?? 0),
            winningTrades: toNum(data.metrics?.winningTrades ?? 0),
            losingTrades: toNum(data.metrics?.losingTrades ?? 0),
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
