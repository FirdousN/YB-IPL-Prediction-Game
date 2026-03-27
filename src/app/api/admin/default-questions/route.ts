import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/src/lib/db";
import DefaultQuestion from "@/src/models/DefaultQuestion";
import { getSession } from "@/src/lib/session";

// ✅ GET
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const questions = await DefaultQuestion
      .find({ isActive: true })
      .sort({ order: 1 });

    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// ✅ POST (SAFE SEED)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const count = await DefaultQuestion.countDocuments();

    if (count > 0) {
      return NextResponse.json(
        { message: "Default questions already exist" },
        { status: 400 }
      );
    }

    const DEFAULT_QUESTIONS = [
      { text: "Who will win the match?", type: "OPTIONS", options: [], points: 20, ruleType: "EXACT", unit: "TEAM", order: 1 },
      { text: "Who will score the most runs in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", order: 2 },
      { text: "Who will take the most wickets in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", order: 3 },
      { text: "Total runs scored by the winning team?", type: "TEXT", options: [], points: 30, ruleType: "NEAREST", maxRange: 30, unit: "RUNS", order: 4 },
      { text: "Player / Man of the Match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", order: 5 }
    ];

    const created = await DefaultQuestion.insertMany(DEFAULT_QUESTIONS);

    return NextResponse.json({ success: true, count: created.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}