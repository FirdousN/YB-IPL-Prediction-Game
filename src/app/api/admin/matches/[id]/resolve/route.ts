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
        const question = matchQuestions.find(q => String(q._id) === String(answer.questionId));
        if (!question) return { 
          questionId: answer.questionId,
          value: answer.value, 
          points: 0 
        };

        let points = 0;
        const correctResult = (question.result || "").trim().toLowerCase();
        const userValue = (answer.value || "").trim().toLowerCase();

        // 🔢 Scoring Formula
        const text = question.text.toLowerCase();
        
        // Match Winner (10 pts)
        if (text.includes("who will win")) {
          if (correctResult && userValue === correctResult) points = 10;
        } 
        // Top Run Scorer / Top Wicket Taker / MoM (20 pts)
        else if (text.includes("most runs") || text.includes("most wickets") || text.includes("man of the match") || text.includes("player of the match")) {
          // Supports multiple winners (comma-separated)
          const winners = correctResult.split(',').map(w => w.trim().toLowerCase());
          if (winners.includes(userValue) && userValue !== "") points = 20;
        }
        // Total Runs (30 pts)
        else if (text.includes("total runs")) {
          const actualRuns = parseInt(correctResult);
          const predictedRuns = parseInt(userValue);
          if (!isNaN(actualRuns) && !isNaN(predictedRuns)) {
            const diff = Math.abs(predictedRuns - actualRuns);
            if (diff >= 30) {
              points = 0;
            } else {
              points = 30 - diff;
            }
          }
        }

        totalPoints += points;
        return { 
          questionId: answer.questionId, 
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

      // 2. Closest total runs prediction (tie-breaker)
      const getRunDiff = (p: any) => {
        const runAns = p.scoredAnswers.find((ans: any) => {
           const q = matchQuestions.find(mq => String(mq._id) === String(ans.questionId));
           return q?.text.toLowerCase().includes("total runs");
        });
        if (!runAns) return 999;
        const q = matchQuestions.find(mq => String(mq._id) === String(runAns.questionId));
        const actualRuns = parseInt(q?.result || "0");
        const predictedRuns = parseInt(runAns.value || "0");
        return isNaN(actualRuns) || isNaN(predictedRuns) ? 999 : Math.abs(predictedRuns - actualRuns);
      };

      const diffA = getRunDiff(a);
      const diffB = getRunDiff(b);
      if (diffA !== diffB) return diffA - diffB; // Lower diff is better

      // 3. Earliest submission wins
      return new Date(a.predictedAt).getTime() - new Date(b.predictedAt).getTime();
    });

    // 3. Update all predictions with scores and ranks in bulk
    await Promise.all(scoredPredictions.map(async (sp, index) => {
      await Prediction.findByIdAndUpdate(sp.prediction._id, {
        answers: sp.scoredAnswers,
        totalPoints: sp.totalPoints,
        rank: index + 1,
        isWinner: index === 0 && sp.totalPoints > 0
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
