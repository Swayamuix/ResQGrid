import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Incidents Table
export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey(),
  rawText: text('raw_text').notNull(),
  citizenName: text('citizen_name').notNull(),
  phone: text('phone').notNull(),
  locationName: text('location_name').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  trappedCount: integer('trapped_count').notNull(),
  waterLevelFt: real('water_level_ft').notNull(),
  urgencyLevel: text('urgency_level').notNull(), // 'P1' | 'P2' | 'P3'
  verificationScore: integer('verification_score').notNull(), // 0 - 100
  status: text('status').notNull(), // 'PENDING' | 'VERIFIED' | 'DISPATCHED' | 'RESOLVED'
  specialNeedsJson: text('special_needs_json').notNull(), // JSON array string
  assignedUnitId: text('assigned_unit_id'),
  assignedUnitJson: text('assigned_unit_json'), // JSON object string
  vernacularAlertsJson: text('vernacular_alerts_json').notNull(), // JSON { en, hi, ta, bn }
  routeId: text('route_id'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
});

// 2. Hazard Polygons Table
export const hazardPolygons = sqliteTable('hazard_polygons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hazardType: text('hazard_type').notNull(), // 'FLOOD' | 'DEBRIS'
  coordinatesGeojson: text('coordinates_geojson').notNull(), // JSON [[lat, lng], ...]
  waterLevelFt: real('water_level_ft').notNull(),
  velocityMs: real('velocity_ms').notNull(),
  severityLevel: text('severity_level').notNull(), // 'extreme' | 'high' | 'moderate'
  submergedRoad: text('submerged_road').notNull(),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: text('created_at').notNull(),
});

// 3. Rescue Units Table
export const rescueUnits = sqliteTable('rescue_units', {
  id: text('id').primaryKey(),
  unitName: text('unit_name').notNull(),
  type: text('type').notNull(), // 'BOAT' | 'AMBULANCE' | '4X4' | 'DRONE'
  currentLat: real('current_lat').notNull(),
  currentLng: real('current_lng').notNull(),
  status: text('status').notNull(), // 'AVAILABLE' | 'BUSY'
  teamLead: text('team_lead').notNull(),
  contactFreq: text('contact_freq').notNull(),
  batteryOrFuel: integer('battery_or_fuel').notNull(),
  targetIncidentId: text('target_incident_id'),
  createdAt: text('created_at').notNull(),
});

// 4. Rescue Depots Table
export const rescueDepots = sqliteTable('rescue_depots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  boatCount: integer('boat_count').notNull(),
  personnelCount: integer('personnel_count').notNull(),
  readinessPercent: integer('readiness_percent').notNull(),
  contactNumber: text('contact_number').notNull(),
});

// 5. Fleet Routes Table (B2B Hazard Routing Cache)
export const fleetRoutes = sqliteTable('fleet_routes', {
  id: text('id').primaryKey(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  vehicleClearanceMm: integer('vehicle_clearance_mm').notNull(),
  riskScore: text('risk_score').notNull(), // 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD'
  recommendedPathGeojson: text('recommended_path_geojson').notNull(), // JSON
  blockedPathGeojson: text('blocked_path_geojson').notNull(), // JSON
  floodDepthFt: real('flood_depth_ft').notNull(),
  assetDamagePreventedInr: integer('asset_damage_prevented_inr').notNull(),
  slaDelaySavedMin: integer('sla_delay_saved_min').notNull(),
  distanceKm: real('distance_km').notNull(),
  etaMin: integer('eta_min').notNull(),
  timestamp: text('timestamp').notNull(),
});

// 6. Agent Logs Table (Telemetry & Decision Store)
export const agentLogs = sqliteTable('agent_logs', {
  id: text('id').primaryKey(),
  agent: text('agent').notNull(), // 'scout' | 'logistics' | 'comms' | 'system'
  message: text('message').notNull(),
  detail: text('detail'),
  payloadJson: text('payload_json'), // JSON string
  stepNumber: integer('step_number'),
  incidentId: text('incident_id'),
  timestamp: text('timestamp').notNull(),
});

// 7. Route Paths Table (Safe vs Blocked Geometry Store for SOS)
export const routePaths = sqliteTable('route_paths', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull(),
  safeCoordinatesJson: text('safe_coordinates_json').notNull(),
  blockedCoordinatesJson: text('blocked_coordinates_json').notNull(),
  bypassReason: text('bypass_reason').notNull(),
  distanceKm: real('distance_km').notNull(),
  etaMin: integer('eta_min').notNull(),
  elevationM: real('elevation_m').notNull(),
});
