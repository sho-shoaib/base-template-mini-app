// app/api/trader-login/hyperliquid/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import clientPromise from "../../../../lib/mongodb";

const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

interface TrustScoreBreakdown {
  accountAge: number;
  tradingVolume: number;
  winRate: number;
  tradeCount: number;
  profitability: number;
  total: number;
}

interface HyperliquidFill {
  time: string | number;
  px: string | number;
  sz: string | number;
  closedPnl?: string | number;
  [key: string]: unknown;
}

// --- scoring (unchanged) ---
function scoreAccountAge(years: number): number {
  if (years < 0.5) return 5;
  if (years < 1) return 10;
  if (years < 2) return 15;
  if (years < 3) return 20;
  return 25;
}
function scoreTradingVolume(volume: number): number {
  if (volume < 10000) return 5;
  if (volume < 50000) return 10;
  if (volume < 100000) return 15;
  if (volume < 500000) return 20;
  return 25;
}
function scoreWinRate(winRate: number): number {
  if (winRate < 0.4) return 5;
  if (winRate < 0.5) return 10;
  if (winRate < 0.6) return 15;
  if (winRate < 0.7) return 18;
  return 20;
}
function scoreTradeCount(count: number): number {
  if (count < 10) return 2;
  if (count < 50) return 5;
  if (count < 100) return 8;
  if (count < 500) return 12;
  return 15;
}
function scoreProfitability(pnl: number, volume: number): number {
  if (volume === 0) return 0;
  const roi = (pnl / volume) * 100;
  if (roi < -10) return 0;
  if (roi < 0) return 2;
  if (roi < 5) return 5;
  if (roi < 10) return 8;
  if (roi < 20) return 12;
  return 15;
}
function calculateTrustScore(
  accountAgeYears: number,
  totalVolume: number,
  winRate: number,
  totalTrades: number,
  totalPnL: number
): TrustScoreBreakdown {
  const accountAge = scoreAccountAge(accountAgeYears);
  const tradingVolume = scoreTradingVolume(totalVolume);
  const winRateScore = scoreWinRate(winRate);
  const tradeCount = scoreTradeCount(totalTrades);
  const profitability = scoreProfitability(totalPnL, totalVolume);
  const total =
    accountAge + tradingVolume + winRateScore + tradeCount + profitability;
  return {
    accountAge,
    tradingVolume,
    winRate: winRateScore,
    tradeCount,
    profitability,
    total,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    if (!address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    console.log(`\n=== Fetching data for wallet: ${address} ===`);

    // Fetch fills
    const fillsResponse = await axios.post(HYPERLIQUID_API, {
      type: "userFills",
      user: address,
    });

    const fills: HyperliquidFill[] = fillsResponse.data || [];
    console.log(`Total fills: ${fills.length}`);

    if (fills.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          address,
          trustScore: 0,
          message: "No trading history found",
          saved: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Ensure fills are sorted newest -> oldest (some APIs already do, but be explicit)
    fills.sort((a, b) => Number(b.time) - Number(a.time));

    // Metrics
    const totalTrades = fills.length;

    const totalVolume = fills.reduce((sum: number, fill: HyperliquidFill) => {
      const px = Number(fill.px);
      const sz = Math.abs(Number(fill.sz));
      if (!Number.isFinite(px) || !Number.isFinite(sz)) return sum;
      return sum + px * sz;
    }, 0);

    const oldestTradeTime = Number(fills[fills.length - 1].time);
    const accountAgeMs = Date.now() - oldestTradeTime;
    const accountAgeYears = accountAgeMs / (1000 * 60 * 60 * 24 * 365);

    const closedTrades = fills.filter(
      (f: HyperliquidFill) => Number(f.closedPnl ?? 0) !== 0
    );
    const winningTrades = closedTrades.filter(
      (f: HyperliquidFill) => Number(f.closedPnl ?? 0) > 0
    );
    const winRate =
      closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

    const totalPnL = fills.reduce((sum: number, fill: HyperliquidFill) => {
      const pnl = Number(fill.closedPnl ?? 0);
      if (!Number.isFinite(pnl)) return sum;
      return sum + pnl;
    }, 0);

    const scoreBreakdown = calculateTrustScore(
      accountAgeYears,
      totalVolume,
      winRate,
      totalTrades,
      totalPnL
    );

    console.log(`\n=== TRUST SCORE: ${scoreBreakdown.total}/100 ===`);

    // --- MongoDB upsert without operator conflicts ---
    const client = await clientPromise;
    const db = client.db("trading_vaults");
    const traders = db.collection("traders");

    // Recommend: ensure unique index once (address+platform)
    // await traders.createIndex({ address: 1, platform: 1 }, { unique: true });

    const now = new Date();
    const filter = { address: address.toLowerCase(), platform: "hyperliquid" };

    const update = {
      $set: {
        // idempotent fields
        address: address.toLowerCase(),
        platform: "hyperliquid",

        // computed values
        trustScore: scoreBreakdown.total,
        scoreBreakdown,
        metrics: {
          totalTrades,
          totalVolume: Number(totalVolume.toFixed(2)),
          accountAgeYears: Number(accountAgeYears.toFixed(2)),
          winRate: Number((winRate * 100).toFixed(2)),
          totalPnL: Number(totalPnL.toFixed(2)),
          roi: Number(
            (totalVolume > 0 ? (totalPnL / totalVolume) * 100 : 0).toFixed(2)
          ),
          winningTrades: winningTrades.length,
          losingTrades: closedTrades.length - winningTrades.length,
        },

        // ONLY updated here
        updatedAt: now,
      },
      // ONLY inserted here (do NOT include createdAt in $set)
      $setOnInsert: {
        createdAt: now,
      },
    };

    const result = await traders.updateOne(filter, update, { upsert: true });
    console.log(
      `✅ Trader saved. matched=${result.matchedCount} modified=${
        result.modifiedCount
      } upserted=${result.upsertedCount ?? 0}`
    );

    return NextResponse.json({
      success: true,
      data: {
        address,
        trustScore: scoreBreakdown.total,
        scoreBreakdown,
        metrics: {
          totalTrades,
          totalVolume: totalVolume.toFixed(2),
          accountAgeYears: accountAgeYears.toFixed(2),
          winRate: (winRate * 100).toFixed(2),
          totalPnL: totalPnL.toFixed(2),
          roi: (totalVolume > 0 ? (totalPnL / totalVolume) * 100 : 0).toFixed(
            2
          ),
          winningTrades: winningTrades.length,
          losingTrades: closedTrades.length - winningTrades.length,
        },
        saved: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const err = error as Error & { response?: { data: unknown } };
    console.error("Error:", err?.message || error);
    if (err?.response) {
      console.error("API Response:", err.response.data);
      return NextResponse.json(
        { error: "Failed to fetch data from Hyperliquid API" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
