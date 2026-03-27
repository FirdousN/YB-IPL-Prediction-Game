import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';
import Prediction from '@/src/models/Prediction';
import DefaultQuestion from '@/src/models/DefaultQuestion';
import { z } from 'zod';

const matchSchema = z.object({
  teamA: z.string(),
  teamB: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  venue: z.string().optional(),
  group: z.string().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED']).default('UPCOMING'),
  result: z.string().optional(),
  winner: z.string().optional().transform((val: string | undefined) => val === "" ? undefined : val),
  questions: z.array(z.any()).optional().default([]),
  teamAScore: z.object({ r: z.number(), w: z.number(), o: z.string() }).optional(),
  teamBScore: z.object({ r: z.number(), w: z.number(), o: z.string() }).optional(),
  isArchived: z.boolean().optional(),
});

// const DEFAULT_QUESTIONS = [
//   { text: "Who will win the match?", type: "OPTIONS", options: [], points: 20, ruleType: "EXACT", unit: "TEAM", result: "" },
//   { text: "Who will score the most runs in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
//   { text: "Who will take the most wickets in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
//   { text: "Total runs scored by the winning team?", type: "TEXT", options: [], points: 30, ruleType: "NEAREST", maxRange: 30, unit: "RUNS", result: "" },
//   { text: "Player / Man of the Match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" }
// ];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const matches = await Match.find()
      .populate('teamA')
      .populate('teamB')
      .sort({ startTime: -1 });

    const matchesWithMetadata = await Promise.all(matches.map(async (m) => {
      const hasPredictions = await Prediction.exists({ matchId: m._id });
      return {
        ...m.toObject(),
        hasPredictions: !!hasPredictions
      };
    }));

    return NextResponse.json(matchesWithMetadata);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const parsed = matchSchema.parse(body);

    // 🔥 Always load from DB
    if (!parsed.questions || parsed.questions.length === 0) {
      const dbDefaults = await DefaultQuestion
        .find({ isActive: true }) // ✅ better
        .sort({ order: 1 });

      if (dbDefaults.length === 0) {
        return NextResponse.json(
          { error: "No default questions found. Please seed first." },
          { status: 400 }
        );
      }

      parsed.questions = dbDefaults.map(q => ({
        text: q.text,
        type: q.type,
        options: q.options,
        points: q.points,
        ruleType: q.ruleType,
        maxRange: q.maxRange,
        unit: q.unit,
        result: ""
      }));
    }

    const match = await Match.create(parsed);

    return NextResponse.json(match, { status: 201 });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) },
      { status: 400 }
    );
  }
}
