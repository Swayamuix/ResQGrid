import { ScoutAgent, ScoutInput } from './scoutAgent';
import { LogisticsAgent } from './logisticsAgent';
import { CommsAgent } from './commsAgent';
import { agentEventHub } from './eventStream';
import { db } from '@/db';
import { incidents, routePaths, agentLogs, rescueUnits } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface OrchestrationResult {
  incident: {
    id: string;
    title: string;
    locationName: string;
    lat: number;
    lng: number;
    severity: 'P1' | 'P2' | 'P3';
    status: 'dispatched';
    timestamp: string;
    citizenMessage: string;
    citizenName: string;
    phoneLast4: string;
    trappedCount: number;
    waterDepthFt: number;
    specialNeeds: string[];
    verifiedConfidence: number;
    assignedUnit: {
      id: string;
      name: string;
      type: 'boat' | 'amphibious' | 'truck' | 'drone';
      teamLead: string;
      etaMinutes: number;
      contactFreq: string;
    };
    vernacularAlerts: {
      en: string;
      hi: string;
      ta: string;
      bn: string;
    };
    routeId: string;
  };
  route: {
    id: string;
    incidentId: string;
    safeCoordinates: [number, number][];
    blockedCoordinates: [number, number][];
    bypassReason: string;
    distanceKm: number;
    etaMin: number;
    elevationM: number;
  };
  logs: Array<{
    id: string;
    agent: 'scout' | 'logistics' | 'comms' | 'system';
    message: string;
    detail?: string;
    payload?: Record<string, unknown>;
    stepNumber?: number;
    incidentId?: string;
    timestamp: string;
  }>;
}

export class AgentOrchestrator {
  private scout = new ScoutAgent();
  private logistics = new LogisticsAgent();
  private comms = new CommsAgent();

  async runPipeline(input: ScoutInput): Promise<OrchestrationResult> {
    const randId = Math.floor(1000 + Math.random() * 9000);
    const incidentId = `sos-${randId}`;

    // Step 1: Scout Agent Execution
    const scoutData = await this.scout.process(input, incidentId);

    // Step 2: Logistics Agent Execution
    const logisticsData = await this.logistics.process(scoutData);

    // Step 3: Comms Agent Execution
    const commsData = await this.comms.process(scoutData, logisticsData);

    const nowStr = new Date().toISOString();
    const phoneLast4 = scoutData.phone.slice(-4) || '9900';

    const incidentRecord = {
      id: incidentId,
      title: scoutData.title,
      locationName: scoutData.locationName,
      lat: scoutData.lat,
      lng: scoutData.lng,
      severity: scoutData.urgencyLevel,
      status: 'dispatched' as const,
      timestamp: 'Just now',
      citizenMessage: scoutData.rawText,
      citizenName: scoutData.citizenName,
      phoneLast4,
      trappedCount: scoutData.trappedCount,
      waterDepthFt: scoutData.waterDepthFt,
      specialNeeds: scoutData.specialNeeds,
      verifiedConfidence: scoutData.verificationScore,
      assignedUnit: logisticsData.assignedUnit,
      vernacularAlerts: commsData.vernacularAlerts,
      routeId: logisticsData.routeId,
    };

    const combinedLogs = [
      { ...scoutData.log, incidentId },
      { ...logisticsData.log, incidentId },
      { ...commsData.log, incidentId },
    ];

    // Commit to SQLite Database
    try {
      // 1. Insert Incident
      await db.insert(incidents).values({
        id: incidentId,
        rawText: scoutData.rawText,
        citizenName: scoutData.citizenName,
        phone: scoutData.phone,
        locationName: scoutData.locationName,
        lat: scoutData.lat,
        lng: scoutData.lng,
        trappedCount: scoutData.trappedCount,
        waterLevelFt: scoutData.waterDepthFt,
        urgencyLevel: scoutData.urgencyLevel,
        verificationScore: scoutData.verificationScore,
        status: 'DISPATCHED',
        specialNeedsJson: JSON.stringify(scoutData.specialNeeds),
        assignedUnitId: logisticsData.assignedUnit.id,
        assignedUnitJson: JSON.stringify(logisticsData.assignedUnit),
        vernacularAlertsJson: JSON.stringify(commsData.vernacularAlerts),
        routeId: logisticsData.routeId,
        imageUrl: null,
        createdAt: nowStr,
      });

      // 2. Insert Route Path
      await db.insert(routePaths).values({
        id: logisticsData.route.id,
        incidentId: incidentId,
        safeCoordinatesJson: JSON.stringify(logisticsData.route.safeCoordinates),
        blockedCoordinatesJson: JSON.stringify(logisticsData.route.blockedCoordinates),
        bypassReason: logisticsData.route.bypassReason,
        distanceKm: logisticsData.route.distanceKm,
        etaMin: logisticsData.route.etaMin,
        elevationM: logisticsData.route.elevationM,
      });

      // 3. Insert Agent Logs
      for (const l of combinedLogs) {
        await db.insert(agentLogs).values({
          id: l.id,
          agent: l.agent,
          message: l.message,
          detail: l.detail,
          payloadJson: l.payload ? JSON.stringify(l.payload) : null,
          stepNumber: l.stepNumber,
          incidentId: incidentId,
          timestamp: l.timestamp,
        });
      }
    } catch (err) {
      console.error('DB Persistence Error:', err);
    }

    // Broadcast complete incident to SSE clients
    agentEventHub.broadcast('new_incident', {
      incident: incidentRecord,
      route: logisticsData.route,
      logs: combinedLogs,
    });

    return {
      incident: incidentRecord,
      route: logisticsData.route,
      logs: combinedLogs,
    };
  }
}

export const orchestrator = new AgentOrchestrator();
