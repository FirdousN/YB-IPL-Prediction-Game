import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const apiKey = process.env.CRICKETDATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

  try {
    const seriesRes = await fetch(`https://api.cricapi.com/v1/series?apikey=${apiKey}&offset=0`);
    const seriesData = await seriesRes.json();
    
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

    // Fetch points table
    const pointsRes = await fetch(`https://api.cricapi.com/v1/series_points?apikey=${apiKey}&id=${iplSeries.id}`);
    const pointsData = await pointsRes.json();

    return NextResponse.json({
       series: iplSeries,
       points: pointsData.data || []
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
