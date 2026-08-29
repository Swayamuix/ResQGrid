import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hazardPolygons, fleetRoutes } from '@/db/schema';
import { FLEET_VEHICLES } from '@/data/initialData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const origin = body.origin || 'Okhla Industrial Logistics Hub (South)';
    const destination = body.destination || 'Noida Sector 18 Commercial Hub';
    const vehicleType = body.vehicle_type || '2w_ev';

    const vehicle = FLEET_VEHICLES.find((v) => v.id === vehicleType) || FLEET_VEHICLES[0];
    const clearanceMm = body.vehicle_clearance_mm || Math.round(vehicle.waterClearanceFt * 304.8);

    // Fetch active hazard polygons from Database
    const activeHazards = await db.select().from(hazardPolygons);
    const maxHazardDepth = Math.max(...activeHazards.map((h) => h.waterLevelFt), 3.8);

    // Evaluate Risk Level based on Ground Clearance
    let riskScore: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD' = 'SAFE';
    if (vehicle.waterClearanceFt < 1.0) {
      riskScore = 'CRITICAL_HAZARD';
    } else if (vehicle.waterClearanceFt < 2.0) {
      riskScore = 'WARNING';
    } else {
      riskScore = 'SAFE';
    }

    const standardKm = 14.8;
    const standardMin = 32;
    const safeKm = parseFloat((standardKm + 2.4).toFixed(1));
    const safeMin = standardMin + 8;

    const potentialDamageInr =
      riskScore === 'CRITICAL_HAZARD'
        ? vehicle.engineReplacementCostInr
        : riskScore === 'WARNING'
        ? Math.round(vehicle.engineReplacementCostInr * 0.45)
        : 0;

    const slaDelaySavedMin = riskScore === 'CRITICAL_HAZARD' ? 180 : 45;

    const recommendedPath = [
      [28.5850, 77.2620],
      [28.5950, 77.2500],
      [28.6150, 77.2450],
      [28.6350, 77.2550],
      [28.6450, 77.2750],
      [28.6310, 77.3050],
    ];

    const blockedPath = [
      [28.5950, 77.2500],
      [28.6080, 77.2750],
      [28.6310, 77.3050],
    ];

    const routeId = `fleet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // Cache in Database
    try {
      await db.insert(fleetRoutes).values({
        id: routeId,
        origin,
        destination,
        vehicleType,
        vehicleClearanceMm: clearanceMm,
        riskScore,
        recommendedPathGeojson: JSON.stringify(recommendedPath),
        blockedPathGeojson: JSON.stringify(blockedPath),
        floodDepthFt: maxHazardDepth,
        assetDamagePreventedInr: potentialDamageInr,
        slaDelaySavedMin,
        distanceKm: safeKm,
        etaMin: safeMin,
        timestamp,
      });
    } catch (err) {
      console.error('Fleet route DB cache error:', err);
    }

    return NextResponse.json({
      success: true,
      route: {
        id: routeId,
        origin,
        destination,
        vehicle,
        vehicleClearanceMm: clearanceMm,
        standardRouteKm: standardKm,
        standardRouteMin: standardMin,
        safeRouteKm: safeKm,
        safeRouteMin: safeMin,
        floodSegmentsBypassed: 2,
        maxFloodDepthEncounteredFt: maxHazardDepth,
        riskLevel: riskScore,
        estimatedAssetLossSavedInr: potentialDamageInr,
        slaDelaySavedMin,
        routeCoordinates: recommendedPath,
        blockedCoordinates: blockedPath,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/routing/calculate:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Routing Calculation Error' },
      { status: 500 }
    );
  }
}
