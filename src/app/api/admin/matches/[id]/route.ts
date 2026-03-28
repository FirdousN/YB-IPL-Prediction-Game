import { NextRequest, NextResponse } from 'next/server';
import mongoose from "mongoose";
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Prediction from '@/src/models/Prediction';
import User from '@/src/models/User';
import { z } from 'zod';
import { getSession } from '@/src/lib/session';

const updateMatchSchema = z.object({
  teamA: z.string().optional(),
  teamB: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED']).optional(),
  result: z.string().optional(),
  winner: z.string().optional().transform(val => val === "" ? undefined : val),
  teamAScore: z.object({
    r: z.number(),
    w: z.number(),
    o: z.string()
  }).optional(),
  teamBScore: z.object({
    r: z.number(),
    w: z.number(),
    o: z.string()
  }).optional(),
  venue: z.string().optional(),
  group: z.string().optional(),
  questions: z.array(z.any()).optional(),
  questionResults: z.array(z.object({
    _id: z.string(),
    result: z.string()
  })).optional(),
  isArchived: z.boolean().optional(),
});

async function isAdmin(request: NextRequest) {
  const session = await getSession(request);
  return session && (session.role === 'admin' || (session as any).role === 'ADMIN');
}

// ─── Inline Scoring Engine ─────────────────────────────────────────────────
// Mirrors the logic in resolve/route.ts — called automatically when question
// rules/results change on a COMPLETED match so stored points stay in sync.
async function recalculatePredictions(matchId: string, matchQuestions: any[]) {
  const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "");

  const predictions = await Prediction.find({ matchId });

  const scoredPredictions = predictions.map(prediction => {
    let totalPoints = 0;
    const scoredAnswers = prediction.answers.map((answer: any) => {
      // Priority 1: match by ID
      let question = matchQuestions.find(q => String(q._id) === String(answer.questionId));

      // Priority 2: index fallback
      if (!question) {
        const idx = prediction.answers.findIndex((a: any) => String(a.questionId) === String(answer.questionId));
        if (idx !== -1 && matchQuestions[idx]) question = matchQuestions[idx];
      }

      if (!question) return { questionId: answer.questionId, value: answer.value, points: 0 };

      const userValue = (answer.value || "").trim().toLowerCase();
      const rType = question.ruleType || "EXACT";
      const qPoints = typeof question.points === "number" ? question.points : 20;
      const qMaxRange = typeof question.maxRange === "number" ? question.maxRange : 30;
      let points = 0;

      if (!userValue) {
        points = 0;
      } else if (rType === "EXACT") {
        const uNorm = normalize(userValue);
        const winners = (question.result || "").split(',').map((w: string) => normalize(w)).filter((w: string) => w !== "");
        points = (winners.includes(uNorm) && uNorm !== "") ? qPoints : 0;
      } else if (rType === "NEAREST") {
        const userNum = Number(userValue.replace(/[^0-9]/g, ""));
        const correctNum = Number((question.result || "").replace(/[^0-9]/g, ""));
        if (isNaN(userNum) || isNaN(correctNum)) {
          points = 0;
        } else {
          const diff = Math.abs(userNum - correctNum);
          points = diff >= qMaxRange ? 0 : Math.max(0, qPoints - diff);
        }
      }

      totalPoints += points;
      return { questionId: question._id, value: answer.value, points };
    });

    return { prediction, totalPoints, scoredAnswers };
  });

  // Sort for rank & winner assignment
  scoredPredictions.sort((a, b) => b.totalPoints - a.totalPoints);

  const totalParticipants = scoredPredictions.length;
  const topLimit = Math.max(3, Math.ceil(totalParticipants * 0.1));

  await Promise.all(scoredPredictions.map(async (sp, index) => {
    const isTopPredictor = sp.totalPoints > 0 && index < topLimit;
    await Prediction.findByIdAndUpdate(sp.prediction._id, {
      answers: sp.scoredAnswers,
      totalPoints: sp.totalPoints,
      rank: index + 1,
      isWinner: index === 0 && sp.totalPoints > 0,
      isTopPredictor
    });
  }));

  // Recalculate each affected user's global points total
  const uniqueUserIds = [...new Set(scoredPredictions.map(sp => String(sp.prediction.userId)))];
  await Promise.all(uniqueUserIds.map(async (userId) => {
    const userPredictions = await Prediction.find({ userId });
    const totalPoints = userPredictions.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
    await User.findByIdAndUpdate(userId, { points: totalPoints });
  }));

  console.log(`[AutoResolve] Recalculated ${scoredPredictions.length} predictions for match ${matchId}`);
}

// ─── Detect if scoring-relevant fields changed ─────────────────────────────
function hasQuestionRuleChanged(oldQuestions: any[], newQuestions: any[]): boolean {
  if (!oldQuestions || !newQuestions) return false;
  if (oldQuestions.length !== newQuestions.length) return true;

  const scoringFields = ['ruleType', 'points', 'maxRange', 'result'];
  return newQuestions.some(incoming => {
    if (!incoming._id) return true; // new question added
    const old = oldQuestions.find(q => String(q._id) === String(incoming._id));
    if (!old) return true;
    return scoringFields.some(f => {
      if (f === 'result') return (incoming[f] || '') !== (old[f] || '');
      return incoming[f] !== old[f];
    });
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateMatchSchema.parse(body);

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { questionResults, questions, ...rest } = parsed;

    // Snapshot old question scoring rules BEFORE we mutate
    const oldQuestions = match.questions.map((q: any) => q.toObject ? q.toObject() : { ...q });

    // Apply general updates (status, winner, team scores etc.)
    Object.assign(match, rest);

    // Apply full questions update if provided (Form Builder)
    if (questions && Array.isArray(questions)) {
      // 1. UPDATE EXISTING & ADD NEW
      questions.forEach(incoming => {
        if (incoming._id) {
          const existing = (match.questions as any).id(
            new mongoose.Types.ObjectId(incoming._id)
          );
          if (existing) {
            existing.text = incoming.text;
            existing.type = incoming.type;
            existing.options = incoming.options;
            existing.points = incoming.points;
            existing.ruleType = incoming.ruleType;
            existing.maxRange = incoming.maxRange;
            existing.unit = incoming.unit;
            existing.result = incoming.result;
          }
        } else {
          match.questions.push(incoming);
        }
      });

      // 2. SAFE DELETE — remove questions no longer in the incoming list
      const incomingIds = questions
        .filter(q => q._id)
        .map(q => new mongoose.Types.ObjectId(q._id).toString());

      for (let i = match.questions.length - 1; i >= 0; i--) {
        const existingQ = match.questions[i];
        if (existingQ._id && !incomingIds.includes(String(existingQ._id))) {
          match.questions.splice(i, 1);
        }
      }

      match.markModified('questions');
    }

    // Apply granular result-only updates (Result Modal)
    if (questionResults && Array.isArray(questionResults)) {
      questionResults.forEach(qr => {
        const q = (match.questions as any).id(qr._id);
        if (q) q.result = qr.result;
      });
      match.markModified('questions');
    }

    await match.save();

    // ── Auto-recalculate if scoring rules changed on a COMPLETED match ──────
    const newQuestions = match.questions.map((q: any) => q.toObject ? q.toObject() : { ...q });
    const isCompleted = match.status === 'COMPLETED';
    const rulesChanged = questions
      ? hasQuestionRuleChanged(oldQuestions, questions)
      : questionResults
        ? true   // result values updated → always recalculate
        : false;

    if (isCompleted && rulesChanged) {
      console.log(`[AutoResolve] Rules/results changed on COMPLETED match ${id} → recalculating...`);
      await recalculatePredictions(id, newQuestions);
    }

    return NextResponse.json({ ...match.toObject(), autoResolved: isCompleted && rulesChanged });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const match = await Match.findByIdAndDelete(id);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
