import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawText = body.citizenMessage || body.rawText || 'Flood emergency rescue needed.';
    const locationName = body.locationName || 'Yamuna Embankment';
    const citizenName = body.citizenName || 'Citizen Report';
    const phone = body.phone || '+91-98765-XXXXX';
    const trappedCount = body.trappedCount ? parseInt(body.trappedCount, 10) : 1;
    const waterDepthFt = body.waterDepthFt ? parseFloat(body.waterDepthFt) : 3.5;
    const specialNeeds = Array.isArray(body.specialNeeds) ? body.specialNeeds : [];
    const lat = body.lat ? parseFloat(body.lat) : undefined;
    const lng = body.lng ? parseFloat(body.lng) : undefined;

    const result = await orchestrator.runPipeline({
      rawText,
      locationName,
      citizenName,
      phone,
      trappedCount,
      waterDepthFt,
      specialNeeds,
      lat,
      lng,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Error in /api/sos/submit:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
