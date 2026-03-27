import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Prediction from '@/src/models/Prediction';
import User from '@/src/models/User';
import { getSession } from '@/src/lib/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const predictions = await Prediction.find({ matchId: id });
    const matchQuestions = match.questions;

    // 1. Calculate points for each prediction
    const scoredPredictions = predictions.map(prediction => {
      let totalPoints = 0;
      const scoredAnswers = prediction.answers.map(answer => {
        // 🔍 Resilient Question Matching
        // Priority 1: Exact ID matching
        let question = matchQuestions.find(q => String(q._id) === String(answer.questionId));

        // Priority 2: Index fallback (very likely correct if IDs changed but order stayed same)
        if (!question) {
          const answerIndex = prediction.answers.findIndex(a => String(a.questionId) === String(answer.questionId));
          if (answerIndex !== -1 && matchQuestions[answerIndex]) {
            question = matchQuestions[answerIndex];
          }
        }

        if (!question) {
          console.warn(`[Resolve] Question mismatch for answer. PredQID: ${answer.questionId}`);
          return { questionId: answer.questionId, value: answer.value, points: 0 };
        }

        let points = 0;
        const correctResult = (question.result || "").trim().toLowerCase();
        const userValue = (answer.value || "").trim().toLowerCase();
        const text = question.text.toLowerCase();

        // 🔢 Production-Grade Scoring Engine (Audit Hardened)
        const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "");

        const rType = question.ruleType || "EXACT";
        const qPoints = typeof question.points === "number" ? question.points : 20;
        const qMaxRange = typeof question.maxRange === "number" ? question.maxRange : 30;

        if (!userValue) {
          points = 0;
        } else if (rType === "EXACT") {
          const uNorm = normalize(userValue);
          // Supports multiple winners (comma-separated result)
          const winners = (question.result || "").split(',').map(w => normalize(w)).filter(w => w !== "");
          points = (winners.includes(uNorm) && uNorm !== "") ? qPoints : 0;
        } else if (rType === "NEAREST") {
          // Robust numeric extraction
          const userNum = Number(userValue.replace(/[^0-9]/g, ""));
          const correctNum = Number((question.result || "").replace(/[^0-9]/g, ""));

          if (isNaN(userNum) || isNaN(correctNum)) {
            points = 0;
          } else {
            const diff = Math.abs(userNum - correctNum);
            // Strict range validation and negative protection
            points = diff >= qMaxRange ? 0 : Math.max(0, qPoints - diff);
          }
        }

        console.log(`[Resolve] Match: ${id} | Q: "${question.text}" -> Predicted: "${userValue}" vs Official: "${correctResult}" | Points: ${points}`);

        totalPoints += points;
        return {
          questionId: question._id, // 🔥 CRITICAL: Update old Ids to new ones for frontend sync
          value: answer.value,
          points
        };
      });

      return {
        prediction,
        totalPoints,
        scoredAnswers,
        // For tie-breaking
        predictedAt: prediction.predictedAt
      };
    });

    // 🏆 Final Winner Selection Logic (Sort)
    scoredPredictions.sort((a, b) => {
      // 1. Highest total points
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

      // 2. Numerical tie-breaker (Closest prediction for generic NEAREST question)
      const getRunDiff = (p: any) => {
        const nearestAns = p.scoredAnswers.find((ans: any) => {
          const q = matchQuestions.find(mq => String(mq._id) === String(ans.questionId));
          return q?.ruleType === "NEAREST";
        });
        if (!nearestAns) return 999;
        const q = matchQuestions.find(mq => String(mq._id) === String(nearestAns.questionId));
        // Safe numeric extraction for tie-break
        const uVal = Number(String(nearestAns.value || "").replace(/[^0-9]/g, ""));
        const aVal = Number(String(q?.result || "").replace(/[^0-9]/g, ""));
        return isNaN(uVal) || isNaN(aVal) ? 999 : Math.abs(uVal - aVal);
      };

      const diffA = getRunDiff(a);
      const diffB = getRunDiff(b);
      if (diffA !== diffB) return diffA - diffB; // Lower diff is better

      // 3. Earliest submission wins
      return new Date(a.predictedAt).getTime() - new Date(b.predictedAt).getTime();
    });

    // 3. Update all predictions with scores and ranks in bulk
    const totalParticipants = scoredPredictions.length;
    const topLimit = Math.max(3, Math.ceil(totalParticipants * 0.1));

    await Promise.all(scoredPredictions.map(async (sp, index) => {
      const isTopPredictor = sp.totalPoints > 0 && index < topLimit;

      // 🔥 Streak Logic: Find user's most recent resolved prediction
      const lastVal = await Prediction.findOne({
        userId: sp.prediction.userId,
        matchId: { $ne: id },
        totalPoints: { $exists: true }
      }).sort({ createdAt: -1 });

      const prevStreak = lastVal?.streak || 0;
      const currentStreak = sp.totalPoints > 0 ? prevStreak + 1 : 0;

      await Prediction.findByIdAndUpdate(sp.prediction._id, {
        answers: sp.scoredAnswers,
        totalPoints: sp.totalPoints,
        rank: index + 1,
        isWinner: index === 0 && sp.totalPoints > 0,
        streak: currentStreak,
        isTopPredictor
      });
    }));

    // 🏆 Update Global User Points (Bulk Aggregation)
    const uniqueUserIds = [...new Set(scoredPredictions.map(sp => String(sp.prediction.userId)))];

    await Promise.all(uniqueUserIds.map(async (userId) => {
      const userPredictions = await Prediction.find({ userId });
      const totalPoints = userPredictions.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
      await User.findByIdAndUpdate(userId, { points: totalPoints });
    }));

    // 4. Update Match Status
    match.status = 'COMPLETED';
    await match.save();

    return NextResponse.json({
      success: true,
      resolvedCount: scoredPredictions.length,
      winner: scoredPredictions[0]?.totalPoints > 0 ? scoredPredictions[0].prediction.userId : null
    });

  } catch (error: any) {
    console.error("Resolution Logic Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
