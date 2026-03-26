import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/lib/db';
import Match from '@/src/models/Match';
import { getSession } from '@/src/lib/session';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && (session as any).role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Remove matches that are not IPL 2026 or were created as "Dummy"
    // We can identify dummy matches by venue "Wankhede Stadium, Mumbai" (from my seed) 
    // or group "League Match" or simply delete EVERYTHING and let the admin Sync.
    // However, it's safer to target specific dummy markers or just provide a "Delete All" for clean slate.
    
    const result = await Match.deleteMany({
      $or: [
        { venue: "Wankhede Stadium, Mumbai" },
        { group: "League Match" },
        { group: { $ne: "IPL 2026" } } // Remove anything not tagged as IPL 2026
      ]
    });

    return NextResponse.json({ message: 'Cleanup completed', deletedCount: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
