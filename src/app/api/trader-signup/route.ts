// app/api/trader-signin/hyperliquid/route.ts

import { NextResponse } from "next/server";

// Optional CORS: set NEXT_PUBLIC_DASHBOARD_ORIGIN to your frontend origin
const CORS_ORIGIN = process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN?.trim();
function withCors(resp: NextResponse) {
  if (CORS_ORIGIN) {
    resp.headers.set("Access-Control-Allow-Origin", CORS_ORIGIN);
    resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    resp.headers.set("Access-Control-Allow-Headers", "content-type");
  }
  return resp;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

const MOCK_TRADER_DATA = {
  address: "0x2c8acfa430b2d8033be9171e30737629d882bc11",
  platform: "hyperliquid",
  createdAt: "2025-10-18T09:55:39.263Z",
  metrics: {
    totalTrades: 428,
    totalVolume: 146990.73,
    accountAgeYears: 0.5,
    winRate: 48.32,
    totalPnL: 2346.5,
    roi: 1.6,
    winningTrades: 72,
    losingTrades: 77,
    scoreBreakdown: {
      accountAge: 10,
      tradingVolume: 20,
      winRate: 10,
      tradeCount: 12,
      profitability: 5,
      total: 57,
    },
    trustScore: 57,
  },
  updatedAt: "2025-10-18T09:55:39.263Z",
};

export async function GET() {
  return withCors(
    NextResponse.json({
      success: true,
      data: MOCK_TRADER_DATA,
      timestamp: new Date().toISOString(),
    })
  );
}

export async function POST() {
  return withCors(
    NextResponse.json({
      success: true,
      data: MOCK_TRADER_DATA,
      timestamp: new Date().toISOString(),
    })
  );
}
