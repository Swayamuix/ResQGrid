import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

import {
  INITIAL_FLOOD_ZONES,
  INITIAL_INCIDENTS,
  INITIAL_RESCUE_DEPOTS,
  INITIAL_RELIEF_UNITS,
  INITIAL_ROUTES,
  INITIAL_AGENT_LOGS,
} from '@/data/initialData';

// Database path in the project root
const dbPath = path.resolve(process.cwd(), 'resqgrid.db');

const sqlite = new Database(dbPath);
// Enable WAL mode for high concurrency and performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Table initialization script
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      citizen_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location_name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      trapped_count INTEGER NOT NULL,
      water_level_ft REAL NOT NULL,
      urgency_level TEXT NOT NULL,
      verification_score INTEGER NOT NULL,
      status TEXT NOT NULL,
      special_needs_json TEXT NOT NULL,
      assigned_unit_id TEXT,
      assigned_unit_json TEXT,
      vernacular_alerts_json TEXT NOT NULL,
      route_id TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hazard_polygons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      coordinates_geojson TEXT NOT NULL,
      water_level_ft REAL NOT NULL,
      velocity_ms REAL NOT NULL,
      severity_level TEXT NOT NULL,
      submerged_road TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rescue_units (
      id TEXT PRIMARY KEY,
      unit_name TEXT NOT NULL,
      type TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      status TEXT NOT NULL,
      team_lead TEXT NOT NULL,
      contact_freq TEXT NOT NULL,
      battery_or_fuel INTEGER NOT NULL,
      target_incident_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rescue_depots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      boat_count INTEGER NOT NULL,
      personnel_count INTEGER NOT NULL,
      readiness_percent INTEGER NOT NULL,
      contact_number TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fleet_routes (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      vehicle_clearance_mm INTEGER NOT NULL,
      risk_score TEXT NOT NULL,
      recommended_path_geojson TEXT NOT NULL,
      blocked_path_geojson TEXT NOT NULL,
      flood_depth_ft REAL NOT NULL,
      asset_damage_prevented_inr INTEGER NOT NULL,
      sla_delay_saved_min INTEGER NOT NULL,
      distance_km REAL NOT NULL,
      eta_min INTEGER NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_logs (
      id TEXT PRIMARY KEY,
      agent TEXT NOT NULL,
      message TEXT NOT NULL,
      detail TEXT,
      payload_json TEXT,
      step_number INTEGER,
      incident_id TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_paths (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      safe_coordinates_json TEXT NOT NULL,
      blocked_coordinates_json TEXT NOT NULL,
      bypass_reason TEXT NOT NULL,
      distance_km REAL NOT NULL,
      eta_min INTEGER NOT NULL,
      elevation_m REAL NOT NULL
    );
  `);

  // Seed initial data if tables are empty
  const incidentCount = (sqlite.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number }).count;
  
  if (incidentCount === 0) {
    const nowStr = new Date().toISOString();

    // 1. Seed Hazard Polygons
    const insertHazard = sqlite.prepare(`
      INSERT INTO hazard_polygons (id, name, hazard_type, coordinates_geojson, water_level_ft, velocity_ms, severity_level, submerged_road, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const hz of INITIAL_FLOOD_ZONES) {
      insertHazard.run(
        hz.id,
        hz.name,
        'FLOOD',
        JSON.stringify(hz.polygon),
        hz.waterLevelFt,
        hz.velocityMs,
        hz.riskLevel,
        hz.submergedRoad,
        nowStr
      );
    }

    // 2. Seed Depots
    const insertDepot = sqlite.prepare(`
      INSERT INTO rescue_depots (id, name, lat, lng, boat_count, personnel_count, readiness_percent, contact_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of INITIAL_RESCUE_DEPOTS) {
      insertDepot.run(d.id, d.name, d.lat, d.lng, d.boatCount, d.personnelCount, d.readinessPercent, d.contactNumber);
    }

    // 3. Seed Rescue Units
    const insertUnit = sqlite.prepare(`
      INSERT INTO rescue_units (id, unit_name, type, current_lat, current_lng, status, team_lead, contact_freq, battery_or_fuel, target_incident_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of INITIAL_RELIEF_UNITS) {
      insertUnit.run(
        u.id,
        u.name,
        u.type.toUpperCase(),
        u.lat,
        u.lng,
        u.status === 'idle' ? 'AVAILABLE' : 'BUSY',
        u.type === 'boat' ? 'Capt. R. K. Meena' : 'Sub-Inspector Ankit Verma',
        'VHF Ch 16 (156.800 MHz)',
        u.batteryOrFuel,
        u.targetIncidentId || null,
        nowStr
      );
    }

    // 4. Seed Route Paths
    const insertRoute = sqlite.prepare(`
      INSERT INTO route_paths (id, incident_id, safe_coordinates_json, blocked_coordinates_json, bypass_reason, distance_km, eta_min, elevation_m)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const rKey of Object.keys(INITIAL_ROUTES)) {
      const r = INITIAL_ROUTES[rKey];
      insertRoute.run(
        r.id,
        r.incidentId,
        JSON.stringify(r.safeCoordinates),
        JSON.stringify(r.blockedCoordinates),
        r.bypassReason,
        r.distanceKm,
        r.etaMin,
        r.elevationM
      );
    }

    // 5. Seed Incidents
    const insertIncident = sqlite.prepare(`
      INSERT INTO incidents (id, raw_text, citizen_name, phone, location_name, lat, lng, trapped_count, water_level_ft, urgency_level, verification_score, status, special_needs_json, assigned_unit_id, assigned_unit_json, vernacular_alerts_json, route_id, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const inc of INITIAL_INCIDENTS) {
      insertIncident.run(
        inc.id,
        inc.citizenMessage,
        inc.citizenName,
        `+91-98765-XX${inc.phoneLast4}`,
        inc.locationName,
        inc.lat,
        inc.lng,
        inc.trappedCount,
        inc.waterDepthFt,
        inc.severity,
        inc.verifiedConfidence,
        inc.status.toUpperCase(),
        JSON.stringify(inc.specialNeeds),
        inc.assignedUnit?.id || null,
        inc.assignedUnit ? JSON.stringify(inc.assignedUnit) : null,
        JSON.stringify(inc.vernacularAlerts),
        inc.routeId || null,
        inc.imageUrl || null,
        nowStr
      );
    }

    // 6. Seed Agent Logs
    const insertLog = sqlite.prepare(`
      INSERT INTO agent_logs (id, agent, message, detail, payload_json, step_number, incident_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const log of INITIAL_AGENT_LOGS) {
      insertLog.run(
        log.id,
        log.agent,
        log.message,
        log.detail || null,
        log.payload ? JSON.stringify(log.payload) : null,
        log.stepNumber || null,
        log.incidentId || null,
        log.timestamp
      );
    }
  }
}

// Run table bootstrap on module import
initDatabase();
