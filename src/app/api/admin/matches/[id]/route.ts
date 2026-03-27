import { NextRequest, NextResponse } from 'next/server';
import mongoose from "mongoose";
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
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

import Prediction from '@/src/models/Prediction';

async function isAdmin(request: NextRequest) {
  const session = await getSession(request);
  return session && (session.role === 'admin' || (session as any).role === 'ADMIN');
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

    // 🔥 Immutability Check: If predictions exist, block core rule changes
    const hasPredictions = await Prediction.exists({ matchId: id });
    const sensitiveFields = ['text', 'type', 'options', 'points', 'ruleType', 'maxRange', 'unit'];

    const { questionResults, questions, ...rest } = parsed;

    if (hasPredictions && questions) {
      for (const newQ of questions) {
        if (!newQ._id) {
          // New questions added after predictions started
          return NextResponse.json({ error: "Cannot add new questions after predictions have started." }, { status: 400 });
        }
        const oldQ = (match.questions as any).id(newQ._id);
        if (oldQ) {
          const modified = sensitiveFields.filter(f => {
            if (f === 'options') return JSON.stringify(newQ[f]) !== JSON.stringify(oldQ[f]);
            return newQ[f] !== oldQ[f];
          });
          if (modified.length > 0) {
            return NextResponse.json({ 
              error: `Questions, rules, and points cannot be modified after predictions have started. (Locked: ${modified.join(', ')})` 
            }, { status: 400 });
          }
        }
      }
    }

    // Apply general updates (status, winner, team scores etc.)
    Object.assign(match, rest);

    // Apply full questions update if provided (Form Builder)
    if (questions && Array.isArray(questions)) {
      console.log("--- DEBUG: MATCH QUESTIONS UPDATE ---");
      console.log("Incoming questions:", JSON.stringify(questions, null, 2));

      // 1. UPDATE EXISTING & ADD NEW LOGIC (Run first)
      questions.forEach(incoming => {
        if (incoming._id) {
          // const existing = (match.questions as any).id(incoming._id);
          const existing = (match.questions as any).id(
            new mongoose.Types.ObjectId(incoming._id)
          );
          console.log(`Incoming _id: ${incoming._id}`);
          console.log(`Matched existing question: ${!!existing}`);
          
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
          console.log("NEW QUESTION (Adding):", incoming.text);
          match.questions.push(incoming);
        }
      });

      // 2. SAFE DELETE LOGIC (Run AFTER update/add)
      // const incomingIds = questions
      //   .filter(q => q._id)
      //   .map(q => String(q._id));
      const incomingIds = questions
        .filter(q => q._id)
        .map(q => new mongoose.Types.ObjectId(q._id).toString());

      console.log("Incoming IDs for retention:", incomingIds);

      // Use splice to remove missing questions in-place to ensure Mongoose detects changes better
      for (let i = match.questions.length - 1; i >= 0; i--) {
        const existingQ = match.questions[i];
        if (existingQ._id) {
          const idStr = String(existingQ._id);
          if (!incomingIds.includes(idStr)) {
            console.log(`DELETING question (not in incoming): ${idStr}`);
            match.questions.splice(i, 1);
          }
        }
      }

      console.log("Before save (questions state):", JSON.stringify(match.questions, null, 2));
      // match.markModified('questions');
    }

    // Apply granular question updates (only result field - Result Modal)
    if (questionResults && Array.isArray(questionResults)) {
      questionResults.forEach(qr => {
        const q = (match.questions as any).id(qr._id);
        if (q) {
          q.result = qr.result;
        }
      });
    }
    console.log("FINAL QUESTIONS:", JSON.stringify(match.questions, null, 2));
    await match.save();
    return NextResponse.json(match);
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
