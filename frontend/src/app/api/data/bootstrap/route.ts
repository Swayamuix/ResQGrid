import { NextResponse } from 'next/server';
import { db } from '@/db';
import { incidents, hazardPolygons, rescueUnits, rescueDepots, routePaths, agentLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allIncidentsRaw = await db.select().from(incidents).orderBy(desc(incidents.createdAt));
    const allHazardsRaw = await db.select().from(hazardPolygons);
    const allUnitsRaw = await db.select().from(rescueUnits);
    const allDepotsRaw = await db.select().from(rescueDepots);
    const allRoutesRaw = await db.select().from(routePaths);
    const allLogsRaw = await db.select().from(agentLogs);

    // Format Incidents
    const formattedIncidents = allIncidentsRaw.map((inc) => {
      let specialNeeds = [];
      let vernacularAlerts = { en: '', hi: '', ta: '', bn: '' };
      let assignedUnit = undefined;

      try { specialNeeds = JSON.parse(inc.specialNeedsJson); } catch {}
      try { vernacularAlerts = JSON.parse(inc.vernacularAlertsJson); } catch {}
      try { if (inc.assignedUnitJson) assignedUnit = JSON.parse(inc.assignedUnitJson); } catch {}

      return {
        id: inc.id,
        title: inc.rawText.slice(0, 40) + '...',
        locationName: inc.locationName,
        lat: inc.lat,
        lng: inc.lng,
        severity: inc.urgencyLevel as 'P1' | 'P2' | 'P3',
        status: (inc.status.toLowerCase() as 'reported' | 'verified' | 'dispatched' | 'rescued'),
        timestamp: 'Active',
        citizenMessage: inc.rawText,
        citizenName: inc.citizenName,
        phoneLast4: inc.phone.slice(-4),
        trappedCount: inc.trappedCount,
        waterDepthFt: inc.waterLevelFt,
        specialNeeds,
        verifiedConfidence: inc.verificationScore,
        assignedUnit,
        vernacularAlerts,
        imageUrl: inc.imageUrl || undefined,
        routeId: inc.routeId || undefined,
      };
    });

    // Format Hazards
    const formattedHazards = allHazardsRaw.map((hz) => {
      let polygon: [number, number][] = [];
      try { polygon = JSON.parse(hz.coordinatesGeojson); } catch {}
      return {
        id: hz.id,
        name: hz.name,
        polygon,
        waterLevelFt: hz.waterLevelFt,
        velocityMs: hz.velocityMs,
        riskLevel: hz.severityLevel as 'extreme' | 'high' | 'moderate',
        submergedRoad: hz.submergedRoad,
      };
    });

    // Format Units
    const formattedUnits = allUnitsRaw.map((u) => ({
      id: u.id,
      name: u.unitName,
      type: (u.type.toLowerCase() as 'boat' | 'drone' | 'truck'),
      lat: u.currentLat,
      lng: u.currentLng,
      status: (u.status === 'AVAILABLE' ? 'idle' : 'en_route' as 'idle' | 'en_route' | 'rescuing'),
      batteryOrFuel: u.batteryOrFuel,
      targetIncidentId: u.targetIncidentId || undefined,
    }));

    // Format Routes map
    const routesMap: Record<string, any> = {};
    for (const r of allRoutesRaw) {
      let safeCoordinates = [];
      let blockedCoordinates = [];
      try { safeCoordinates = JSON.parse(r.safeCoordinatesJson); } catch {}
      try { blockedCoordinates = JSON.parse(r.blockedCoordinatesJson); } catch {}

      routesMap[r.id] = {
        id: r.id,
        incidentId: r.incidentId,
        safeCoordinates,
        blockedCoordinates,
        bypassReason: r.bypassReason,
        distanceKm: r.distanceKm,
        etaMin: r.etaMin,
        elevationM: r.elevationM,
      };
    }

    // Format Logs
    const formattedLogs = allLogsRaw.map((l) => {
      let payload = undefined;
      try { if (l.payloadJson) payload = JSON.parse(l.payloadJson); } catch {}
      return {
        id: l.id,
        agent: l.agent as 'scout' | 'logistics' | 'comms' | 'system',
        timestamp: l.timestamp,
        message: l.message,
        detail: l.detail || undefined,
        payload,
        stepNumber: l.stepNumber || undefined,
        incidentId: l.incidentId || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      incidents: formattedIncidents,
      floodZones: formattedHazards,
      rescueUnits: formattedUnits,
      rescueDepots: allDepotsRaw,
      routes: routesMap,
      agentLogs: formattedLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
