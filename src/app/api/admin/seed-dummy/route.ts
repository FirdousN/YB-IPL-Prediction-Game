import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import Team from '@/src/models/Team';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Find any two teams to create a match
    const teams = await Team.find().limit(2);
    if (teams.length < 2) {
      return NextResponse.json({ error: 'At least 2 teams are required to seed a match' }, { status: 400 });
    }

    // Target Time: March 26, 2026, 11:00 PM IST
    // IST is UTC+5:30. So 11:00 PM IST is 17:30 UTC.
    const startTime = new Date('2026-03-26T17:30:00.000Z');
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

    const dummyMatch = await Match.create({
      teamA: teams[0]._id,
      teamB: teams[1]._id,
      startTime,
      endTime,
      status: 'UPCOMING',
      venue: 'Wankhede Stadium, Mumbai',
      group: 'League Match',
      questions: [
        {
          text: 'Who will win the match?',
          type: 'OPTIONS',
          options: [teams[0].shortName, teams[1].shortName]
        },
        {
          text: 'How many sixes will be hit?',
          type: 'TEXT'
        }
      ]
    });

    return NextResponse.json({ message: 'Dummy match seeded successfully', match: dummyMatch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
