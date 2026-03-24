import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour to heavily protect the API limit

export async function GET() {
  const apiKey = process.env.CRICKETDATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

  try {
    const seriesRes = await fetch(`https://api.cricapi.com/v1/series?apikey=${apiKey}&offset=0`);
    const seriesData = await seriesRes.json();
    
    // Attempt to locate IPL 2026 primarily, fallback to any IPL if unavailable
    let iplSeries = seriesData.data?.find((s: any) => 
      s.name.toLowerCase().includes("premier") && s.name.includes("2026")
    );
    
    if (!iplSeries) {
      iplSeries = seriesData.data?.find((s: any) => 
        s.name.toLowerCase().includes("premier") || s.name.toLowerCase().includes("ipl")
      );
    }

    if (!iplSeries) {
      return NextResponse.json({ error: "IPL Series not found in API" }, { status: 404 });
    }

    // Fetch full match list
    const matchRes = await fetch(`https://api.cricapi.com/v1/series_info?apikey=${apiKey}&id=${iplSeries.id}`);
    const matchData = await matchRes.json();

    return NextResponse.json({
       series: iplSeries,
       matches: matchData.data?.matchList || []
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
