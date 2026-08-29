export type Severity = 'P1' | 'P2' | 'P3';
export type IncidentStatus = 'reported' | 'verified' | 'dispatched' | 'rescued';
export type AgentType = 'scout' | 'logistics' | 'comms' | 'system';

export interface AssignedUnit {
  id: string;
  name: string;
  type: 'boat' | 'amphibious' | 'truck' | 'drone';
  teamLead: string;
  etaMinutes: number;
  contactFreq: string;
}

export interface Incident {
  id: string;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  severity: Severity;
  status: IncidentStatus;
  timestamp: string;
  citizenMessage: string;
  citizenName: string;
  phoneLast4: string;
  trappedCount: number;
  waterDepthFt: number;
  specialNeeds: string[];
  verifiedConfidence: number;
  assignedUnit?: AssignedUnit;
  vernacularAlerts: {
    en: string;
    hi: string;
    ta: string;
    bn: string;
  };
  imageUrl?: string;
  routeId?: string;
}

export interface FloodZone {
  id: string;
  name: string;
  polygon: [number, number][];
  waterLevelFt: number;
  velocityMs: number;
  riskLevel: 'extreme' | 'high' | 'moderate';
  submergedRoad: string;
}

export interface RescueDepot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  boatCount: number;
  personnelCount: number;
  readinessPercent: number;
  contactNumber: string;
}

export interface ReliefUnit {
  id: string;
  name: string;
  type: 'boat' | 'drone' | 'truck';
  lat: number;
  lng: number;
  status: 'idle' | 'en_route' | 'rescuing';
  batteryOrFuel: number;
  targetIncidentId?: string;
}

export interface AgentLog {
  id: string;
  agent: AgentType;
  timestamp: string;
  message: string;
  detail?: string;
  payload?: Record<string, unknown>;
  stepNumber?: number;
  incidentId?: string;
  isNew?: boolean;
}

export interface RoutePath {
  id: string;
  incidentId: string;
  safeCoordinates: [number, number][];
  blockedCoordinates: [number, number][];
  bypassReason: string;
  distanceKm: number;
  etaMin: number;
  elevationM: number;
}

export type VehicleArchetype = '2w_ev' | '3w_auto' | 'van' | 'truck_10t';

export interface FleetVehicleConfig {
  id: VehicleArchetype;
  name: string;
  shortName: string;
  iconName: string;
  waterClearanceFt: number;
  hydroLockRisk: 'Extreme' | 'High' | 'Medium' | 'Low';
  cargoCapacityKg: number;
  engineReplacementCostInr: number;
}

export interface FleetRouteResult {
  origin: string;
  destination: string;
  vehicle: FleetVehicleConfig;
  standardRouteKm: number;
  standardRouteMin: number;
  safeRouteKm: number;
  safeRouteMin: number;
  floodSegmentsBypassed: number;
  maxFloodDepthEncounteredFt: number;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD';
  estimatedAssetLossSavedInr: number;
  slaDelaySavedMin: number;
  routeCoordinates: [number, number][];
  blockedCoordinates: [number, number][];
}
