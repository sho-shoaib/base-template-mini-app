// app/api/vaults/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

const isHexAddress42 = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const custodyAddress = String(body?.custodyAddress ?? "").trim();
    const traderAddress = String(body?.traderAddress ?? "")
      .trim()
      .toLowerCase();

    if (!name || !description || !custodyAddress) {
      return NextResponse.json(
        { error: "name, description, and custodyAddress are required" },
        { status: 400 }
      );
    }
    if (!isHexAddress42(custodyAddress)) {
      return NextResponse.json(
        { error: "Invalid custodyAddress" },
        { status: 400 }
      );
    }
    if (!isHexAddress42(traderAddress)) {
      return NextResponse.json(
        { error: "Invalid traderAddress" },
        { status: 400 }
      );
    }

    console.log("Connecting to MongoDB...");
    const client = await clientPromise;
    const db = client.db("trading_vaults");
    console.log("Connected to DB");

    const now = new Date();
    const doc = {
      name,
      description,
      custodyAddress: custodyAddress.toLowerCase(),
      traderAddress,
      createdAt: now,
      updatedAt: now,
    };

    console.log("Inserting vault doc...");
    const result = await db.collection("vaults").insertOne(doc);
    console.log("✅ Vault inserted:", result.insertedId);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...doc },
      timestamp: now.toISOString(),
    });
  } catch (err) {
    const error = err as Error & { stack?: string };
    console.error("Full error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message ?? String(err),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
