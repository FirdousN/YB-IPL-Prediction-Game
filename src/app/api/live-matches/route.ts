import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.CRICKETDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CRICKETDATA_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://api.cricapi.com/v1/cricScore?apikey=${apiKey}`);
    if (!res.ok) {
       throw new Error('Failed to fetch live scores');
    }
    const data = await res.json();
    
    // Filter to only include IPL matches
    if (data && data.data) {
      data.data = data.data.filter((match: any) => {
        const seriesName = match.series ? match.series.toLowerCase() : "";
        return seriesName.includes("premier") || seriesName.includes("ipl");
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
