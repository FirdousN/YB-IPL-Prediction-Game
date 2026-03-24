import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.CRICKETDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key missing" },
      { status: 500 }
    );
  }

  try {
    // 1. Search for the IPL series dynamically to ensure we get the latest active one
    const searchRes = await fetch(`https://api.cricapi.com/v1/series_search?apikey=${apiKey}&search=IPL`);
    if (!searchRes.ok) throw new Error('API Search failed');
    const searchData = await searchRes.json();
    
    // Attempt to grab the latest IPL series ID
    const iplSeries = searchData.data?.find((s: any) => s.name.toLowerCase().includes('ipl') || s.name.toLowerCase().includes('indian premier league'));
    
    // If not found dynamically, we can fallback to the current active match or hardcode later if user provides exact ID.
    // Assuming API has `v1/series_points?id=...`
    
    if (!iplSeries) {
         return NextResponse.json({ error: "Active IPL Series not found on network" }, { status: 404 });
    }

    // 2. Fetch the Points table for this specific ID
    const pointsRes = await fetch(`https://api.cricapi.com/v1/series_points?apikey=${apiKey}&id=${iplSeries.id}`);
    if (!pointsRes.ok) throw new Error('Failed to fetch Points Data');
    
    const pointsData = await pointsRes.json();
    
    return NextResponse.json({
       seriesName: iplSeries.name,
       standings: pointsData.data || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
