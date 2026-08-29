'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  PanelRightClose,
  PanelRightOpen,
  Map as MapIcon,
  AlertCircle,
  Terminal,
  Route,
  PlusCircle,
  RotateCcw,
  Navigation,
  X,
  Search,
  Code2,
  Code,
  Copy,
  Check,
  Truck,
  Bike,
  Car,
  ShieldAlert,
  AlertOctagon,
  Eye,
  Compass,
  Send,
  CheckCircle2,
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type Severity = 'P1' | 'P2' | 'P3';
export type IncidentStatus = 'reported' | 'verified' | 'dispatched' | 'rescued';
export type AgentType = 'scout' | 'logistics' | 'comms' | 'system';
export type TabType = 'map' | 'incidents' | 'swarm' | 'fleet' | 'sos';

export interface Incident {
  id: string;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  trappedCount: number;
  waterDepthFt: number;
  severity: Severity;
  verifiedConfidence: number;
  status: IncidentStatus;
  specialNeeds: string[];
  citizenMessage: string;
  citizenName: string;
  phone: string;
  assignedUnit?: {
    id: string;
    name: string;
    type: 'boat' | 'amphibious' | 'truck' | 'drone';
    teamLead: string;
    etaMinutes: number;
    contactFreq: string;
  };
  vernacularAlerts: {
    hi: string;
    en: string;
    ta: string;
    bn: string;
  };
  routeId?: string;
  timestamp: string;
}

export interface FloodZone {
  id: string;
  name: string;
  polygon: [number, number][];
  waterLevelFt: number;
  velocityMs: number;
  severityLevel: 'extreme' | 'high' | 'moderate';
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
}

export interface ReliefUnit {
  id: string;
  name: string;
  type: 'boat' | 'amphibious' | 'truck' | 'drone';
  lat: number;
  lng: number;
  status: 'idle' | 'en_route' | 'rescuing';
  batteryOrFuel: number;
  targetIncidentId?: string;
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

export interface AgentLog {
  id: string;
  agent: AgentType;
  timestamp: string;
  message: string;
  detail?: string;
  payload?: Record<string, unknown>;
  stepNumber?: number;
  incidentId?: string;
}

export interface FleetVehicleConfig {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  waterClearanceFt: number;
  hydroLockRisk: 'Low' | 'Medium' | 'High' | 'Extreme';
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
  maxFloodDepthEncounteredFt: number;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD';
  estimatedAssetLossSavedInr: number;
  slaDelaySavedMin: number;
  safeCoordinates: [number, number][];
  blockedCoordinates: [number, number][];
}

interface FilterState {
  floodZones: boolean;
  sosPins: boolean;
  depots: boolean;
  routes: boolean;
}

interface ToastInfo {
  id: string;
  title: string;
  desc: string;
  type: 'sos' | 'scout' | 'logistics' | 'comms' | 'success';
}

// ==========================================
// 2. CONSTANTS & INITIAL DATA
// ==========================================

const MAP_CENTER: [number, number] = [28.6280, 77.2450];
const DEFAULT_ZOOM = 13;

const FLEET_ORIGINS = [
  'Okhla Phase-III Logistics Hub',
  'Patparganj Industrial Area Terminal',
  'Narela North Distribution Center',
  'Sarita Vihar Central Freight Depot',
];

const FLEET_DESTINATIONS = [
  'Connaught Place Financial Center',
  'Noida Sector 62 Tech Park',
  'ISBT Kashmere Gate Transit Hub',
  'Mayur Vihar Medical Annex',
];

const FLEET_VEHICLES: FleetVehicleConfig[] = [
  {
    id: '2w_ev',
    name: '2-Wheeler Electric Delivery Scooter',
    shortName: 'EV 2-Wheeler',
    iconName: 'Bike',
    waterClearanceFt: 0.6,
    hydroLockRisk: 'Extreme',
    cargoCapacityKg: 35,
    engineReplacementCostInr: 45000,
  },
  {
    id: '3w_auto',
    name: '3-Wheeler Commercial Cargo Auto',
    shortName: '3-Wheeler Cargo',
    iconName: 'Truck',
    waterClearanceFt: 1.1,
    hydroLockRisk: 'High',
    cargoCapacityKg: 500,
    engineReplacementCostInr: 95000,
  },
  {
    id: 'van',
    name: 'Medium Delivery Van / Ambulance',
    shortName: 'Delivery Van',
    iconName: 'Car',
    waterClearanceFt: 1.8,
    hydroLockRisk: 'Medium',
    cargoCapacityKg: 1200,
    engineReplacementCostInr: 165000,
  },
  {
    id: 'truck_10t',
    name: '10-Ton Heavy Logistics / NDRF Truck',
    shortName: '10-Ton Heavy Truck',
    iconName: 'ShieldAlert',
    waterClearanceFt: 3.5,
    hydroLockRisk: 'Low',
    cargoCapacityKg: 10000,
    engineReplacementCostInr: 420000,
  },
];

const INITIAL_FLOOD_ZONES: FloodZone[] = [
  {
    id: 'flood-zone-yamuna-bazar',
    name: 'Yamuna Bazar & Monastery Basin',
    waterLevelFt: 5.2,
    velocityMs: 1.8,
    severityLevel: 'extreme',
    submergedRoad: 'Ring Road Northern Bypass (ISBT to Old Iron Bridge)',
    polygon: [
      [28.6650, 77.2280],
      [28.6720, 77.2340],
      [28.6680, 77.2460],
      [28.6590, 77.2410],
      [28.6600, 77.2310],
    ],
  },
  {
    id: 'flood-zone-mayur-vihar',
    name: 'Mayur Vihar Phase-1 Floodplain Drain',
    waterLevelFt: 4.6,
    velocityMs: 1.2,
    severityLevel: 'extreme',
    submergedRoad: 'Noida Link Lower Underpass Sector 14A',
    polygon: [
      [28.6140, 77.2820],
      [28.6040, 77.2910],
      [28.5980, 77.3020],
      [28.6080, 77.3080],
      [28.6190, 77.2950],
    ],
  },
  {
    id: 'flood-zone-ito-barrage',
    name: 'ITO Powerhouse & Vikas Marg Lowlands',
    waterLevelFt: 3.8,
    velocityMs: 1.5,
    severityLevel: 'high',
    submergedRoad: 'Vikas Marg Embankment Lower Ramp',
    polygon: [
      [28.6340, 77.2480],
      [28.6310, 77.2590],
      [28.6220, 77.2620],
      [28.6210, 77.2510],
    ],
  },
];

const INITIAL_RESCUE_DEPOTS: RescueDepot[] = [
  {
    id: 'depot-ndrf-8bn',
    name: 'NDRF 8th Battalion Base (Kashmere Gate)',
    lat: 28.6685,
    lng: 77.2280,
    boatCount: 14,
    personnelCount: 65,
    readinessPercent: 98,
  },
  {
    id: 'depot-civil-defense-ito',
    name: 'Delhi Civil Defense Station (ITO Barrage)',
    lat: 28.6315,
    lng: 77.2490,
    boatCount: 8,
    personnelCount: 42,
    readinessPercent: 92,
  },
];

const INITIAL_RELIEF_UNITS: ReliefUnit[] = [
  {
    id: 'unit-boat-04',
    name: 'NDRF Quick Rescue Boat #04',
    type: 'boat',
    lat: 28.6480,
    lng: 77.2220,
    status: 'en_route',
    batteryOrFuel: 88,
    targetIncidentId: 'sos-7402',
  },
  {
    id: 'unit-amphi-02',
    name: 'Rapid Inflatable Craft #02',
    type: 'boat',
    lat: 28.6390,
    lng: 77.2510,
    status: 'idle',
    batteryOrFuel: 94,
  },
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'sos-7402',
    title: 'Elderly Heart Patient & Infant on Roof',
    locationName: 'Mayur Vihar Phase-1, Pocket 4',
    lat: 28.6085,
    lng: 77.2880,
    trappedCount: 5,
    waterDepthFt: 4.9,
    severity: 'P1',
    verifiedConfidence: 97,
    status: 'dispatched',
    specialNeeds: ['Elderly (Heart Patient)', 'Infants / Babies', 'Low Battery (<15%)'],
    citizenMessage: 'Water level reached first floor ceiling. 5 family members including an 82-year-old on oxygen and 1 infant on the terrace. Battery at 9%. Please send boat urgent!',
    citizenName: 'Ananya Sen',
    phone: '+91-98101-44920',
    assignedUnit: {
      id: 'unit-boat-04',
      name: 'NDRF Quick Rescue Boat #04',
      type: 'boat',
      teamLead: 'Inspector R. K. Meena',
      etaMinutes: 7,
      contactFreq: 'VHF Ch 16 (156.800 MHz)',
    },
    vernacularAlerts: {
      hi: 'एनडीआरएफ नाव #04 आपके स्थान के लिए रवाना हो चुकी है। आगमन समय: 7 मिनट। कृपया छत पर ही रहें और टॉर्च या चमकीला कपड़ा दिखाएं।',
      en: 'NDRF Rescue Boat #04 is en route to Mayur Vihar Pkt 4. ETA: 7 mins. Stay on the upper terrace and signal with flashlight.',
      ta: 'தேசிய பேரிடர் மீட்புப் படை படகு #04 புறப்பட்டுவிட்டது. வருகை நேரம்: 7 நிமிடங்கள். மேல் மாடியில் காத்திருக்கவும்.',
      bn: 'এনডিআরএফ উদ্ধারকারী বোট #০৪ রওনা হয়েছে। পৌঁছানোর সময়: ৭ মিনিট। অনুগ্রহ করে ছাদেই অবস্থান করুন।',
    },
    routeId: 'route-sos-7402',
    timestamp: '22:01:14',
  },
  {
    id: 'sos-8819',
    title: 'Stranded DTC Bus Passengers at Monastery Ring Road',
    locationName: 'ISBT Ring Road Outer Bypass',
    lat: 28.6665,
    lng: 77.2340,
    trappedCount: 14,
    waterDepthFt: 3.8,
    severity: 'P1',
    verifiedConfidence: 94,
    status: 'dispatched',
    specialNeeds: ['Submerged Vehicle', 'Fast Current (1.8 m/s)'],
    citizenMessage: 'DTC electric bus stalled in submerged dip near Monastery. Water entered passenger compartment up to seat level. Current is rising fast.',
    citizenName: 'Rajesh Tyagi (Driver)',
    phone: '+91-99580-23912',
    assignedUnit: {
      id: 'unit-amphi-02',
      name: 'Rapid Inflatable Craft #02',
      type: 'boat',
      teamLead: 'Sub-Inspector Vikas Sharma',
      etaMinutes: 11,
      contactFreq: 'VHF Ch 12 (156.600 MHz)',
    },
    vernacularAlerts: {
      hi: 'डीटीसी बस यात्रियों के लिए बचाव नाव #02 आ रही है। पानी में न उतरें, छत और सीटों के ऊपर सुरक्षित रहें।',
      en: 'Rescue craft #02 dispatched for DTC passengers at Ring Road. Do not step into water current.',
      ta: 'பேருந்து பயணிகளுக்காக மீட்புப் படகு #02 வருகிறது. தண்ணீரில் இறங்க வேண்டாம்.',
      bn: 'বাসের যাত্রীদের জন্য উদ্ধারকারী বোট #০২ আসছে। জলের স্রোতে নামবেন না।',
    },
    routeId: 'route-sos-8819',
    timestamp: '21:49:30',
  },
];

const INITIAL_ROUTES: Record<string, RoutePath> = {
  'route-sos-7402': {
    id: 'route-sos-7402',
    incidentId: 'sos-7402',
    safeCoordinates: [
      [28.6480, 77.2220],
      [28.6420, 77.2350],
      [28.6320, 77.2480],
      [28.6250, 77.2620],
      [28.6180, 77.2750],
      [28.6085, 77.2880],
    ],
    blockedCoordinates: [
      [28.6320, 77.2480],
      [28.6220, 77.2560],
      [28.6120, 77.2710],
      [28.6085, 77.2880],
    ],
    bypassReason: 'Mayur Vihar Underpass submerged under 4.9ft flood water. Autonomous high-ground corridor calculated via Elevated High Span (+214m ASL).',
    distanceKm: 4.8,
    etaMin: 7,
    elevationM: 214,
  },
  'route-sos-8819': {
    id: 'route-sos-8819',
    incidentId: 'sos-8819',
    safeCoordinates: [
      [28.6480, 77.2220],
      [28.6580, 77.2250],
      [28.6640, 77.2290],
      [28.6665, 77.2340],
    ],
    blockedCoordinates: [
      [28.6580, 77.2250],
      [28.6610, 77.2380],
      [28.6665, 77.2340],
    ],
    bypassReason: 'Kashmiri Gate Lower Arterial 3.9ft submerged. Rerouted via Upper Boulevard Ring Ramp.',
    distanceKm: 3.1,
    etaMin: 11,
    elevationM: 220,
  },
};

const INITIAL_AGENT_LOGS: AgentLog[] = [
  {
    id: 'log-1',
    agent: 'scout',
    timestamp: '22:01:14',
    message: 'Incoming Emergency Call from citizen app & Twitter/X handle @delhi_flood_help.',
    detail: 'Extracted coordinates [28.6085, 77.2880]. NLP Entity Resolution confirmed 5 trapped victims on terrace.',
    payload: {
      source: 'Citizen Mobile Web App + Twitter Webhook',
      nlpConfidence: 0.98,
      hydrologicalMask: 'Sentinel-1 SAR match (water index 0.89)',
      sentimentUrgency: 'CRITICAL_P1',
    },
    stepNumber: 1,
    incidentId: 'sos-7402',
  },
  {
    id: 'log-2',
    agent: 'scout',
    timestamp: '22:01:21',
    message: 'Threat Level verified: 4.8ft flood depth with 1.6 m/s current.',
    detail: 'Cross-referenced with Yamuna CWC telemetry station #ITO-B03. Verification Confidence: 97%.',
    payload: {
      gaugeStation: 'ITO Barrage CWC Sensor #03',
      waterDischargeCusecs: 359000,
      dangerMarkDelta: '+1.45m above danger level',
    },
    stepNumber: 2,
    incidentId: 'sos-7402',
  },
  {
    id: 'log-3',
    agent: 'logistics',
    timestamp: '22:01:34',
    message: 'Safe Evacuation Path Found: Direct route via Mayur Vihar Underpass BLOCKED (4.8ft submerged).',
    detail: 'Recalculating elevated dry corridor via Noida Link Elevated Flyover and DND High Span. Safe bypass locked.',
    payload: {
      blockedNode: 'Node_MV_Underpass_P4 (Elevation 198m)',
      safeNode: 'Node_NoidaLink_Elevated (Elevation 214m)',
      additionalDistanceKm: 1.4,
      hydroLockRiskPrevented: '100%',
    },
    stepNumber: 3,
    incidentId: 'sos-7402',
  },
  {
    id: 'log-4',
    agent: 'logistics',
    timestamp: '22:01:45',
    message: 'Nearest Rescue Boat Assigned: Dispatched NDRF Inflatable Boat #04 (Captain R. K. Meena).',
    detail: 'Assigned dynamic ETA: 7 mins. Unit equipped with pediatric life vests and oxygen cylinder support.',
    payload: {
      unitId: 'unit-boat-04',
      depot: 'NDRF 8th Bn Base',
      assignedCrewCount: 4,
      specialSupplies: ['Pediatric Vest (1x)', 'O2 Portable Kit (1x)', 'Search Floodlights'],
    },
    stepNumber: 4,
    incidentId: 'sos-7402',
  },
];

// ==========================================
// 3. AUDIO SYNTHESIZER & HELPERS
// ==========================================

class WebAudioSynth {
  private ctx: AudioContext | null = null;
  public isMuted = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playBlip() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Ignored if browser prohibits autoplay
    }
  }

  playEmergencyAlarm() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch { }
  }

  playRadarPing() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch { }
  }
}

const soundFx = new WebAudioSynth();

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateFleetRoute(origin: string, destination: string, vehicleId: string): FleetRouteResult {
  const vehicle = FLEET_VEHICLES.find((v) => v.id === vehicleId) || FLEET_VEHICLES[0];
  const maxFlood = 4.8;
  const isBlocked = maxFlood > vehicle.waterClearanceFt;
  const isWarning = maxFlood >= vehicle.waterClearanceFt * 0.75 && !isBlocked;

  const riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD' = isBlocked
    ? 'CRITICAL_HAZARD'
    : isWarning
      ? 'WARNING'
      : 'SAFE';

  const baseKm = 14.2;
  const baseMin = 28;
  const safeKm = parseFloat((baseKm + (isBlocked ? 2.4 : 0.8)).toFixed(1));
  const safeMin = baseMin + (isBlocked ? 9 : 3);

  return {
    origin,
    destination,
    vehicle,
    standardRouteKm: baseKm,
    standardRouteMin: baseMin,
    safeRouteKm: safeKm,
    safeRouteMin: safeMin,
    maxFloodDepthEncounteredFt: maxFlood,
    riskLevel,
    estimatedAssetLossSavedInr: isBlocked ? vehicle.engineReplacementCostInr + 25000 : 0,
    slaDelaySavedMin: isBlocked ? 180 : 0,
    safeCoordinates: [
      [28.5355, 77.2700],
      [28.5600, 77.2800],
      [28.5850, 77.2950],
      [28.6100, 77.3050],
      [28.6280, 77.3650],
    ],
    blockedCoordinates: isBlocked
      ? [
        [28.5600, 77.2800],
        [28.5800, 77.2900],
        [28.6050, 77.3000],
      ]
      : [],
  };
}

// ==========================================
// 4. EMBEDDED UI COMPONENTS
// ==========================================

function MapControls({
  filters,
  toggleFilter,
  onResetView,
}: {
  filters: FilterState;
  toggleFilter: (key: keyof FilterState) => void;
  onResetView: () => void;
}) {
  return (
    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 select-none pointer-events-auto text-[11px] font-sans">
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-md p-0.5 flex items-center gap-1 shadow-sm backdrop-blur-sm">
        <button
          onClick={() => toggleFilter('floodZones')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${filters.floodZones
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Hazards</span>
        </button>

        <button
          onClick={() => toggleFilter('sosPins')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${filters.sosPins
            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Active Emergencies</span>
        </button>

        <button
          onClick={() => toggleFilter('depots')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${filters.depots
            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Depots</span>
        </button>

        <button
          onClick={() => toggleFilter('routes')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${filters.routes
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Routes</span>
        </button>
      </div>

      <button
        onClick={onResetView}
        className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-950/90 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 shadow-sm transition-colors"
        title="Reset map view"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
// 1. Shared Dispatch Matrix
const DISPATCH_MATRIX: Record<string, Record<string, {
  distStd: string;
  timeStd: string;
  distSafe: string;
  timeSafe: string;
  nodes: number;
  depth: number;
}>> = {
  'Okhla Phase-III Logistics Hub': {
    'Connaught Place Financial Center': { distStd: '14.8 km', timeStd: '32m', distSafe: '17.2 km', timeSafe: '40m', nodes: 2, depth: 2.2 },
    'Noida Sector 62 Tech Park': { distStd: '18.6 km', timeStd: '38m', distSafe: '22.4 km', timeSafe: '48m', nodes: 3, depth: 3.4 },
    'ISBT Kashmere Gate Transit Hub': { distStd: '21.4 km', timeStd: '45m', distSafe: '25.8 km', timeSafe: '56m', nodes: 4, depth: 4.6 },
    'Mayur Vihar Medical Annex': { distStd: '11.2 km', timeStd: '24m', distSafe: '13.0 km', timeSafe: '29m', nodes: 1, depth: 1.4 },
  },
  'Patparganj Industrial Area Terminal': {
    'ISBT Kashmere Gate Transit Hub': { distStd: '13.5 km', timeStd: '28m', distSafe: '16.0 km', timeSafe: '35m', nodes: 1, depth: 1.8 },
    'Connaught Place Financial Center': { distStd: '12.0 km', timeStd: '26m', distSafe: '14.5 km', timeSafe: '33m', nodes: 2, depth: 2.5 },
  }
};

// 2. Shared Map Route Coordinates
const ROUTE_COORDINATES: Record<string, Record<string, {
  standard: [number, number][];
  safe: [number, number][];
  floodedNodes: [number, number][];
}>> = {
  'Okhla Phase-III Logistics Hub': {
    'Connaught Place Financial Center': {
      standard: [[28.5355, 77.2690], [28.5680, 77.2430], [28.5880, 77.2340], [28.6304, 77.2177]],
      safe: [[28.5355, 77.2690], [28.5520, 77.2150], [28.5900, 77.1950], [28.6304, 77.2177]],
      floodedNodes: [[28.5680, 77.2430], [28.5880, 77.2340]]
    },
    'Noida Sector 62 Tech Park': {
      standard: [[28.5355, 77.2690], [28.5600, 77.3000], [28.5900, 77.3400], [28.6250, 77.3750]],
      safe: [[28.5355, 77.2690], [28.5200, 77.3100], [28.5800, 77.3800], [28.6250, 77.3750]],
      floodedNodes: [[28.5600, 77.3000], [28.5900, 77.3400]]
    },
    'ISBT Kashmere Gate Transit Hub': {
      standard: [[28.5355, 77.2690], [28.5800, 77.2500], [28.6200, 77.2400], [28.6675, 77.2285]],
      safe: [[28.5355, 77.2690], [28.5700, 77.1900], [28.6400, 77.2000], [28.6675, 77.2285]],
      floodedNodes: [[28.5800, 77.2500], [28.6200, 77.2400]]
    },
    'Mayur Vihar Medical Annex': {
      standard: [[28.5355, 77.2690], [28.5700, 77.2800], [28.6050, 77.2950]],
      safe: [[28.5355, 77.2690], [28.5450, 77.2900], [28.6050, 77.2950]],
      floodedNodes: [[28.5700, 77.2800]]
    }
  },
  'Patparganj Industrial Area Terminal': {
    'ISBT Kashmere Gate Transit Hub': {
      standard: [[28.6280, 77.3050], [28.6500, 77.2700], [28.6675, 77.2285]],
      safe: [[28.6280, 77.3050], [28.6700, 77.2900], [28.6800, 77.2500], [28.6675, 77.2285]],
      floodedNodes: [[28.6500, 77.2700]]
    },
    'Connaught Place Financial Center': {
      standard: [[28.6280, 77.3050], [28.6250, 77.2600], [28.6304, 77.2177]],
      safe: [[28.6280, 77.3050], [28.6100, 77.2700], [28.6150, 77.2300], [28.6304, 77.2177]],
      floodedNodes: [[28.6250, 77.2600]]
    }
  }
};

// 3. Shared Vehicle Profile Resolver
const getProfile = (idOrName: string) => {
  const val = (idOrName || '').toLowerCase();
  if (val.includes('2w') || val.includes('2-wheeler') || val === 'v1') {
    return { name: 'EV 2-Wheeler', limit: 0.6, repairCost: 28500, baseDowntime: 120 };
  }
  if (val.includes('3w') || val.includes('3-wheeler') || val.includes('cargo') || val === 'v2') {
    return { name: '3-Wheeler Cargo', limit: 1.1, repairCost: 42750, baseDowntime: 150 };
  }
  if (val.includes('van') || val === 'v3') {
    return { name: 'Delivery Van', limit: 1.8, repairCost: 86000, baseDowntime: 210 };
  }
  if (val.includes('truck') || val.includes('10-ton') || val === 'v4') {
    return { name: '10-Ton Heavy Truck', limit: 3.5, repairCost: 165000, baseDowntime: 360 };
  }
  return { name: 'EV 2-Wheeler', limit: 0.6, repairCost: 28500, baseDowntime: 120 };
};

function HazardMap({
  incidents,
  selectedIncident,
  setSelectedIncident,
  floodZones,
  rescueDepots,
  reliefUnits,
  routes,
  filters,
  toggleFilter,
  fleetOrigin,
  fleetDestination,
  selectedVehicleId,
}: {
  incidents: Incident[];
  selectedIncident: Incident | null;
  setSelectedIncident: (i: Incident | null) => void;
  floodZones: FloodZone[];
  rescueDepots: RescueDepot[];
  reliefUnits: ReliefUnit[];
  routes: Record<string, RoutePath>;
  filters: FilterState;
  toggleFilter: (key: keyof FilterState) => void;
  fleetOrigin?: string;
  fleetDestination?: string;
  selectedVehicleId?: string;
}) {
  const [currentTab, setCurrentTab] = useState<string>('map');

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) setCurrentTab(e.detail);
    };
    window.addEventListener('tab-change', handleTabChange);
    return () => window.removeEventListener('tab-change', handleTabChange);
  }, []);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    floods: any;
    depots: any;
    relief: any;
    sos: any;
    routes: any;
    dispatchRoutes: any;
  }>({
    floods: null,
    depots: null,
    relief: null,
    sos: null,
    routes: null,
    dispatchRoutes: null,
  });

  const [isMapReady, setIsMapReady] = useState(false);
  // Resolve map coordinates and risk status for current dispatch selection
  const defaultCoords = {
    standard: [[28.5355, 77.2690], [28.5680, 77.2430], [28.5880, 77.2340], [28.6304, 77.2177]] as [number, number][],
    safe: [[28.5355, 77.2690], [28.5520, 77.2150], [28.5900, 77.1950], [28.6304, 77.2177]] as [number, number][],
    floodedNodes: [[28.5680, 77.2430], [28.5880, 77.2340]] as [number, number][]
  };

  // Universal route resolver (handles exact strings, partial matches, or IDs)
  const findMatrixEntry = (orig: string, dest: string) => {
    if (!orig || !dest) return null;
    const oKey = Object.keys(ROUTE_COORDINATES || {}).find((k: string) =>
  orig ? (k.toLowerCase().includes(orig.toLowerCase()) || orig.toLowerCase().includes(k.toLowerCase())) : false
);
    
    if (!oKey) return null;
    const dKey = Object.keys((ROUTE_COORDINATES as any)?.[oKey] || {}).find((k: string) =>
      k.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(k.toLowerCase())
    );
    if (!dKey) return null;
    return {
      coords: ROUTE_COORDINATES[oKey][dKey],
      data: DISPATCH_MATRIX[oKey]?.[dKey]
    };
  };

  const resolved = findMatrixEntry(fleetOrigin as any, fleetDestination as any);
  const activeMapRoute = resolved?.coords || defaultCoords;
  const activeRouteData = resolved?.data || { depth: 2.2, distStd: '14.8 km', timeStd: '32m', distSafe: '17.2 km', timeSafe: '40m', nodes: 2 };

  const currentVehicle = getProfile(selectedVehicleId || 'v1');
  const isSafeOnMap = currentVehicle.limit >= activeRouteData.depth;
  const isCriticalOnMap = !isSafeOnMap && activeRouteData.depth >= currentVehicle.limit * 1.5;
  useEffect(() => {
    const eventSource = new EventSource(
      "http://localhost:3001/api/agents/stream"
    );

    eventSource.addEventListener("connected", (event) => {
      console.log("✅ Agent stream connected:", event);
    });

    eventSource.onmessage = (event) => {
      console.log("📡 Agent event:", event.data);
    };

    eventSource.onerror = (error) => {
      console.error("❌ Agent stream error:", error);
    };

    return () => {
      eventSource.close();
      console.log("🔌 Agent stream disconnected");
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) {
        return;
      }

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Fail-safe: Guard L.latLng globally against NaN to prevent uncaught animation lifecycle exceptions
      if (!(L as any).__latLngGuarded) {
        const origLatLng = L.latLng;
        (L as any).latLng = function (a: any, b?: any, c?: any) {
          try {
            if (a === undefined || a === null) {
              return origLatLng(28.6280, 77.2450);
            }
            if (Array.isArray(a)) {
              const lat = Number(a[0]);
              const lng = Number(a[1]);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            } else if (typeof a === 'object' && ('lat' in a || 'latitude' in a)) {
              const lat = Number(a.lat ?? a.latitude);
              const lng = Number(a.lng ?? a.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            } else if (b !== undefined) {
              const lat = Number(a);
              const lng = Number(b);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            }
            return origLatLng.apply(this, arguments as any);
          } catch {
            return origLatLng(28.6280, 77.2450);
          }
        };
        (L as any).__latLngGuarded = true;
      }

      const defaultCenter: [number, number] = [28.6280, 77.2450];
      const rawLat = Number(MAP_CENTER?.[0] ?? defaultCenter[0]);
      const rawLng = Number(MAP_CENTER?.[1] ?? defaultCenter[1]);
      const safeCenter: [number, number] = (Number.isFinite(rawLat) && Number.isFinite(rawLng))
        ? [rawLat, rawLng]
        : defaultCenter;

      const map = L.map(mapContainerRef.current, {
        center: safeCenter,
        zoom: Number.isFinite(DEFAULT_ZOOM) ? DEFAULT_ZOOM : 13,
        zoomControl: false,
        attributionControl: false,
      });
      

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      layersRef.current = {
        floods: L.layerGroup().addTo(map),
        depots: L.layerGroup().addTo(map),
        relief: L.layerGroup().addTo(map),
        sos: L.layerGroup().addTo(map),
        routes: L.layerGroup().addTo(map),
        dispatchRoutes: L.layerGroup().addTo(map),
      };

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Responsive container observer to keep Leaflet dimensions synced
  useEffect(() => {
    if (!mapInstanceRef.current || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch { }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    async function updateLayers() {
      const map = mapInstanceRef.current;
      if (!map) return;
      const L = (await import('leaflet')).default;
      const { floods, depots, relief, sos, routes: routeGroup, dispatchRoutes } = layersRef.current;

      // 1. Flood Hazards
      floods.clearLayers();
      if (filters.floodZones && Array.isArray(floodZones)) {
        floodZones
          .filter((zone) => Array.isArray(zone?.polygon))
          .forEach((zone) => {
            const validPolygon: [number, number][] = zone.polygon
              .map(([lat, lng]): [number, number] => [Number(lat), Number(lng)])
              .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

            if (validPolygon.length < 3) return;

            try {
              const polygon = L.polygon(validPolygon, {
                color: '#f59e0b',
                weight: 1.5,
                dashArray: '4, 4',
                fillColor: '#b45309',
                fillOpacity: 0.25,
              });

              polygon.bindPopup(`
                <div class="text-xs font-sans p-1">
                  <div class="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span class="uppercase text-[10px] tracking-wider">Flood Hazard Zone</span>
                  </div>
                  <p class="font-semibold text-zinc-100 text-xs mb-0.5">${zone.name}</p>
                  <p class="text-zinc-400 text-[11px] mb-2">${zone.submergedRoad}</p>
                  <div class="grid grid-cols-2 gap-2 text-center bg-zinc-900 p-1.5 rounded border border-zinc-800 font-mono text-[11px]">
                    <div>
                      <span class="text-[10px] text-zinc-500 block">DEPTH</span>
                      <span class="font-bold text-amber-400">${zone.waterLevelFt} FT</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-zinc-500 block">CURRENT</span>
                      <span class="font-bold text-zinc-200">${zone.velocityMs} m/s</span>
                    </div>
                  </div>
                </div>
              `);
              floods.addLayer(polygon);
            } catch (err) {
              console.warn('Failed to add flood polygon safely:', err);
            }
          });
      }

      // 2. Rescue Depots
      depots.clearLayers();
      if (filters.depots && Array.isArray(rescueDepots)) {
        rescueDepots
          .filter((depot) => {
            const lat = Number((depot as any)?.lat ?? (depot as any)?.latitude);
            const lng = Number((depot as any)?.lng ?? (depot as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((depot) => {
            const lat = Number((depot as any).lat ?? (depot as any).latitude);
            const lng = Number((depot as any).lng ?? (depot as any).longitude);

            try {
              const icon = L.divIcon({
                className: 'custom-depot-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-blue-500/50 text-blue-400 text-[10px] font-mono font-semibold shadow-sm cursor-pointer hover:bg-zinc-850">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>${depot.name.slice(0, 10)}</span>
                    <span class="text-zinc-400">(${depot.boatCount}B)</span>
                  </div>
                `,
                iconSize: [110, 24],
                iconAnchor: [55, 12],
              });

              const marker = L.marker([lat, lng], { icon });
              depots.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add depot marker safely:', err);
            }
          });
      }

      // 3. Relief Vessels
      relief.clearLayers();
      if (Array.isArray(reliefUnits)) {
        reliefUnits
          .filter((unit) => {
            const lat = Number((unit as any)?.lat ?? (unit as any)?.latitude);
            const lng = Number((unit as any)?.lng ?? (unit as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((unit) => {
            const lat = Number((unit as any).lat ?? (unit as any).latitude);
            const lng = Number((unit as any).lng ?? (unit as any).longitude);

            try {
              const icon = L.divIcon({
                className: 'custom-relief-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-semibold shadow-sm cursor-pointer hover:bg-zinc-850">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>${unit.name.slice(0, 14)}</span>
                  </div>
                `,
                iconSize: [110, 24],
                iconAnchor: [55, 12],
              });

              const marker = L.marker([lat, lng], { icon });
              relief.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add relief marker safely:', err);
            }
          });
      }
      if (currentTab !== 'fleet' && currentTab !== 'dispatch') {
        // Clear any leftover dispatch paths
        dispatchRoutes?.clearLayers();
      
        // --- Keep your existing SOS, Depots, and Rescue Route code here ---
        // (sos.clearLayers(), sos.addLayer(...), depots.addLayer(...), etc.)
      
      } else {
        // Clear tactical clutter when in Dispatch mode
        sos?.clearLayers();
        depots?.clearLayers();
        relief?.clearLayers();
        routeGroup?.clearLayers();
      }

      // 4. Incident Pins
      sos.clearLayers();
      if (filters.sosPins && Array.isArray(incidents) && currentTab !== 'fleet' && currentTab !== 'dispatch') {
        incidents
          .filter((incident) => {
            const lat = Number((incident as any)?.lat ?? (incident as any)?.latitude);
            const lng = Number((incident as any)?.lng ?? (incident as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((incident) => {
            const lat = Number((incident as any).lat ?? (incident as any).latitude);
            const lng = Number((incident as any).lng ?? (incident as any).longitude);

            try {
              const isSelected = selectedIncident?.id === incident.id;
              const isP1 = incident.severity === 'P1';

              const icon = L.divIcon({
                className: 'custom-sos-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded ${isSelected
                    ? 'bg-red-500 text-white font-bold ring-2 ring-white/50'
                    : isP1
                      ? 'bg-zinc-900 border border-red-500/60 text-red-400 font-semibold'
                      : 'bg-zinc-900 border border-amber-500/60 text-amber-400 font-semibold'
                  } text-[10px] font-mono shadow-sm cursor-pointer transition-colors">
                    <span class="w-1.5 h-1.5 rounded-full ${isP1 ? 'bg-red-500' : 'bg-amber-500'}"></span>
                    <span>${incident.severity}</span>
                    <span class="text-zinc-400 font-normal">| ${incident.trappedCount}p</span>
                  </div>
                `,
                iconSize: [60, 22],
                iconAnchor: [30, 11],
              });

              const marker = L.marker([lat, lng], { icon });
              marker.on('click', () => {
                soundFx.playRadarPing();
                setSelectedIncident(incident);
              });
              sos.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add incident marker safely:', err);
            }
          });
      }

      // 5. Incident Polylines (Fallback / Legacy)
      if (routeGroup) {
        routeGroup.clearLayers();
        if (filters.routes && currentTab !== 'fleet' && currentTab !== 'dispatch') {
          // Prioritize dropdown matrix entry, fallback to incident simulation
          const currentBlocked = 
            (resolved as any)?.blockedCoordinates ||
            (resolved as any)?.standard ||
            (routes && selectedIncident?.routeId ? (routes as any)[selectedIncident.routeId]?.blockedCoordinates : null) ||
            (routes && selectedIncident?.routeId ? (routes as any)[selectedIncident.routeId]?.standard : null) ||
            [];

          const rawSafeObj = 
            (resolved as any)?.safeCoordinates ||
            (resolved as any)?.safe ||
            (resolved as any)?.coords ||
            (routes && selectedIncident?.routeId ? (routes as any)[selectedIncident.routeId]?.safeCoordinates : null) ||
            (routes && selectedIncident?.routeId ? (routes as any)[selectedIncident.routeId]?.safe : null) ||
            (selectedIncident as any)?.safeRoute ||
            (selectedIncident as any)?.safeCoordinates;

          let currentSafe = Array.isArray(rawSafeObj)
            ? rawSafeObj
            : (rawSafeObj?.coordinates || rawSafeObj?.coords || rawSafeObj?.path || rawSafeObj?.waypoints || []);
      
          // Fallback: Anchor to the exact same Start & End points, detour around the flood zone
          if (!currentSafe || (Array.isArray(currentSafe) && currentSafe.length === 0)) {
           if (Array.isArray(currentBlocked) && currentBlocked.length >= 2) {
            const startPt = [
              Number(currentBlocked[0]?.lat ?? currentBlocked[0]?.[0]),
              Number(currentBlocked[0]?.lng ?? currentBlocked[0]?.[1])
            ];
            const endPt = [
              Number(currentBlocked[currentBlocked.length - 1]?.lat ?? currentBlocked[currentBlocked.length - 1]?.[0]),
              Number(currentBlocked[currentBlocked.length - 1]?.lng ?? currentBlocked[currentBlocked.length - 1]?.[1])
            ];

            const midLat = (startPt[0] + endPt[0]) / 2;
            const midLng = (startPt[1] + endPt[1]) / 2;

            currentSafe = [
              startPt,
              [midLat + 0.008, midLng - 0.014],
              [midLat - 0.003, midLng - 0.017],
              endPt
            ];
          }
        }
    
          const allBoundsCoords: [number, number][] = [];
    
          // 1. Blocked Polyline (Red)
          const validBlocked = (Array.isArray(currentBlocked) ? currentBlocked : [])
          .map((coord: any) => [Number(coord?.[0]), Number(coord?.[1])] as [number, number])
          .filter((point: [number, number]) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
          if (validBlocked.length >= 2) {
            try {
              const blockedPolyline = (window as any).L.polyline(validBlocked, {
                color: '#ef4444',
                weight: 2.5,
                dashArray: '6, 8',
              }).bindPopup(`
              <div style="font-family: monospace; font-size: 11px;">
                <strong style="color: #ef4444">⚠ Submerged / Hazard Corridor</strong>
              </div>
            `);
              routeGroup.addLayer(blockedPolyline);
              allBoundsCoords.push(...validBlocked);
            } catch (err) {
              console.warn('Failed to add blocked polyline safely:', err);
            }
          }
        
    
          // 2. Safe Polyline (Cyan/Green)
          const rawSafe = 
            (Array.isArray(currentSafe) && currentSafe.length > 0)
              ? currentSafe
              : ((currentSafe as any)?.coordinates || (currentSafe as any)?.coords || (selectedIncident as any)?.safeRoute || (selectedIncident as any)?.coordinates || []);
          const validSafe = (Array.isArray(rawSafe) ? rawSafe : [])
            .map((coord: any) => [Number(coord?.[0]), Number(coord?.[1])] as [number, number])
            .filter((point: [number, number]) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
          console.log('ACTIVE EMERGENCY ROUTE COORDS:', {
            selectedIncident,
            currentBlocked,
            currentSafe,
            validBlockedLength: validBlocked.length,
            validSafeLength: validSafe.length
          });
    
          if (validSafe.length >= 2) {
            try {
              const safePolyline = (window as any).L.polyline(validSafe, {
                color: '#10b981',
                weight: 4.5,
                opacity: 0.95,
                
              }).bindPopup(`
                <div style="font-family: monospace; font-size: 11px;">
                  <strong style="color: #10b981">✓ Safe Elevation Bypass</strong>
                </div>
             `);

              routeGroup.addLayer(safePolyline);
              allBoundsCoords.push(...validSafe);
            } catch (err) {
              console.warn('Failed to add safe polyline safely:', err);
            }
          }
    
          // 3. Auto-Zoom / Pan Map to the Route
          if (allBoundsCoords.length > 0) {
            try {
              const targetMap = (window as any).mapInstance || (window as any)?.current;
              if (targetMap) {
                const bounds = (window as any).L.latLngBounds(allBoundsCoords);
                targetMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
              }
            } catch (err) {
              console.warn('Failed to fit bounds:', err);
            }
          }
        }
      }
      const origin = fleetOrigin || FLEET_ORIGINS?.[0];
      const destination = fleetDestination || FLEET_DESTINATIONS?.[0];
      const vehicleId = selectedVehicleId || FLEET_VEHICLES?.[0]?.id || 'ev-2w';
      // Ensure activeMapRoute is computed from the selected fleet inputs
      const activeMapRoute = calculateFleetRoute(origin as any, destination as any, vehicleId as any)
        
      console.log('CURRENT TAB VALUE:', currentTab);
      console.log('CHECK PARAMS:', { fleetOrigin, fleetDestination, activeMapRoute });

      // 6. Dynamic Dispatch & Safe Corridor Renderer
      if (dispatchRoutes) {
        dispatchRoutes.clearLayers();
        

        // ONLY render dispatch routes if the active tab is 'fleet'
        if (activeMapRoute && (currentTab === 'fleet' || currentTab === 'dispatch')) {
          const isSafeOnMap = Boolean((activeMapRoute as any)?.isSafe);
          const isCriticalOnMap = Boolean((activeMapRoute as any)?.bottlenecks?.some((b: any) => b.isCritical));
          const stdColor = isSafeOnMap ? '#10b981' : isCriticalOnMap ? '#ef4444' : '#f59e0b';
          const allDispatchBounds: [number, number][] = [];

      // 1. Standard GPS Line
      const rawStd = (activeMapRoute as any)?.standard || (activeMapRoute as any)?.coords || activeMapRoute;
      const validStdCoords = (Array.isArray(rawStd) ? rawStd : [])
        .map((coord: any) => [Number(coord?.[0]), Number(coord?.[1])] as [number, number])
        .filter((point: [number, number]) => Number.isFinite(point[0]) && Number.isFinite(point[1]));

      if (validStdCoords.length >= 2) {
        try {
          const stdPolyline = (window as any).L.polyline(validStdCoords, {
            color: stdColor,
            weight: isSafeOnMap ? 5 : 3.5,
            opacity: isSafeOnMap ? 0.9 : 0.65,
            dashArray: isSafeOnMap ? undefined : '6, 8',
          }).bindPopup(`
            <div style="font-family: monospace; font-size: 11px;">
              <strong>Standard GPS Route</strong><br/>
              Dist: ${(activeRouteData as any)?.distStd || 'N/A'} • Time: ${(activeRouteData as any)?.timeStd || 'N/A'}<br/>
              Status: <b style="color: ${stdColor}">${isSafeOnMap ? 'SAFE' : isCriticalOnMap ? 'CRITICAL' : 'WARNING'}</b>
            </div>
          `);

          dispatchRoutes.addLayer(stdPolyline);
          allDispatchBounds.push(...validStdCoords);
        } catch (err) {
          console.warn('Failed to add standard GPS polyline safely:', err);
        }
      }

          // Safe Corridor Line (if flood hazard present)
      if (!isSafeOnMap) {
        const safeCoords = (activeMapRoute as any)?.safe || (activeMapRoute as any)?.safeCoordinates || [];
        let validSafeCoords: [number, number][] = (Array.isArray(safeCoords) ? safeCoords : [])
          .map((coord: any) => [Number(coord?.[0]), Number(coord?.[1])] as [number, number])
          .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
          if (validSafeCoords.length < 2 && validStdCoords.length >= 2) {
            const startPt = validStdCoords[0];
            const endPt = validStdCoords[validStdCoords.length - 1];
            const midLat = (startPt[0] + endPt[0]) / 2;
            const midLng = (startPt[1] + endPt[1]) / 2;
          
            validSafeCoords = [
              startPt,
              [midLat + 0.008, midLng - 0.014],
              [midLat - 0.003, midLng - 0.017],
              endPt
            ];
          }

        if (validSafeCoords.length >= 2) {
          try {
            const safePolyline = (window as any).L.polyline(validSafeCoords, {
              color: '#10b981',
              weight: 5,
              opacity: 0.95,
            }).bindPopup(`
              <div style="font-family: monospace; font-size: 11px;">
                <strong style="color: #10b981">✓ AI Recommended Safe Corridor</strong><br/>
                100% Dry Elevation Bypass
              </div>
            `);

            dispatchRoutes.addLayer(safePolyline);
            allDispatchBounds.push(...validSafeCoords);
          } catch (err) {
            console.warn('Failed to add safe polyline:', err);
          }
        }
      }

      // Submerged Node Markers
      ((activeMapRoute as any)?.floodedNodes || []).forEach((node: [number, number]) => {
        try {
          const circle = (window as any).L.circleMarker(node, {
            radius: 8,
            color: '#ef4444',
            fillColor: '#b91c1c',
            fillOpacity: 0.9,
          });
          dispatchRoutes.addLayer(circle);
        } catch (err) {}
      });

      // Auto-fit bounds to the complete dispatch path
      if (allDispatchBounds.length > 0) {
        try {
          const bounds = (window as any).L.latLngBounds(allDispatchBounds);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } catch (err) {
          console.warn('Failed to fit bounds:', err);
        }
      }
          // Auto-center and zoom
          /*
          try {
            const allPoints = [...activeMapRoute.standard, ...activeMapRoute.safe];
            if (allPoints.length > 0) {
              mapInstanceRef.current?.fitBounds(allPoints, { padding: [60, 60], maxZoom: 14 });
            }
          } catch (e) {
            console.warn('fitBounds error:', e);
          }
          */
        }

      }
    }

    updateLayers();
  }, [
    currentTab,
    isMapReady,
    incidents,
    selectedIncident,
    floodZones,
    rescueDepots,
    reliefUnits,
    routes,
    filters,
    fleetOrigin,
    fleetDestination,
    selectedVehicleId,
    setSelectedIncident,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncident) return;
    const lat = Number((selectedIncident as any).lat ?? (selectedIncident as any).latitude);
    const lng = Number((selectedIncident as any).lng ?? (selectedIncident as any).longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const map = mapInstanceRef.current;
      try {
        const size = map.getSize();
        if (size && size.x > 0 && size.y > 0) {
          map.flyTo([lat, lng], 14, { duration: 1 });
        } else {
          map.setView([lat, lng], 14, { animate: false });
        }
      } catch (e) {
        try {
          map.setView([lat, lng], 14, { animate: false });
        } catch { }
      }
    }
  }, [selectedIncident]);

  const handleResetView = () => {
    soundFx.playBlip();
    if (mapInstanceRef.current) {
      try {
        const centerLat = Number(MAP_CENTER?.[0] ?? 28.6280);
        const centerLng = Number(MAP_CENTER?.[1] ?? 77.2450);
        if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
          const size = mapInstanceRef.current.getSize();
          if (size && size.x > 0 && size.y > 0) {
            mapInstanceRef.current.flyTo([centerLat, centerLng], DEFAULT_ZOOM, { duration: 0.6 });
          } else {
            mapInstanceRef.current.setView([centerLat, centerLng], DEFAULT_ZOOM, { animate: false });
          }
        }
      } catch (e) {
        console.warn("resetView failed safely:", e);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex-1 bg-zinc-950 overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <MapControls filters={filters} toggleFilter={toggleFilter} onResetView={handleResetView} />

      <div className="absolute bottom-3 left-3 z-20 bg-zinc-950/90 border border-zinc-800 px-2.5 py-1.5 rounded-md shadow-sm pointer-events-none text-[11px] font-sans flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          <span className="text-zinc-300 text-[10px]">Safe Bypass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-red-500" />
          <span className="text-zinc-400 text-[10px]">Submerged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500/40 border border-amber-500/70" />
          <span className="text-amber-300 text-[10px]">Flood Zone</span>
        </div>
      </div>
    </div>
  );
}

function LogDetailModal({ log, onClose }: { log: AgentLog; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    soundFx.playBlip();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] text-xs font-sans">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
              {log.agent}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              TELEMETRY #{log.id}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-3">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
              Action Summary
            </span>
            <p className="text-zinc-100 font-medium text-xs">{log.message}</p>
          </div>

          {log.detail && (
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
                Execution Detail
              </span>
              <p className="text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 leading-relaxed font-sans text-xs">
                {log.detail}
              </p>
            </div>
          )}

          {log.payload && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">
                  Structured Payload (JSON)
                </span>
                <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 leading-normal">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>{log.timestamp} UTC</span>
          <button onClick={onClose} className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function IncidentsTab({
  incidents,
  selectedIncident,
  setSelectedIncident,
  onViewOnMap,
}: {
  incidents: Incident[];
  selectedIncident: Incident | null;
  setSelectedIncident: (i: Incident | null) => void;
  onViewOnMap: (i: Incident) => void;
}) {
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'ta' | 'bn'>('hi');

  const getSeverityBadge = (sev: 'P1' | 'P2' | 'P3') => {
    switch (sev) {
      case 'P1':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'P2':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none text-xs font-sans">
      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-zinc-950 border-b border-zinc-800 font-mono text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
        <div className="col-span-3">EMERGENCY</div>
        <div className="col-span-5 md:col-span-4">LOCATION</div>
        <div className="col-span-2 text-center">TRAPPED</div>
        <div className="col-span-2 md:col-span-3 text-right">STATUS</div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-850">
        {incidents.map((inc) => {
          const isSelected = selectedIncident?.id === inc.id;

          return (
            <div
              key={inc.id}
              onClick={() => {
                soundFx.playBlip();
                setSelectedIncident(inc);
              }}
              className={`grid grid-cols-12 gap-1 px-3 py-3 md:py-2.5 items-center cursor-pointer transition-colors min-h-[44px] ${isSelected
                ? 'bg-zinc-900 border-l-2 border-red-500 text-zinc-100'
                : 'hover:bg-zinc-900/60 active:bg-zinc-850 text-zinc-300'
                }`}
            >
              <div className="col-span-3 flex items-center gap-1.5 font-mono text-[11px]">
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${getSeverityBadge(inc.severity)}`}>
                  {inc.severity}
                </span>
                <span className="font-semibold">{inc.id}</span>
              </div>

              <div className="col-span-5 md:col-span-4 truncate text-[11px] font-medium text-zinc-200">
                {inc.locationName.split(',')[0]}
              </div>

              <div className="col-span-2 text-center font-mono text-[11px]">
                <span className="text-red-400 font-semibold">{inc.trappedCount}p</span>
                <span className="text-zinc-500 text-[10px] block">{inc.waterDepthFt}ft</span>
              </div>

              <div className="col-span-2 md:col-span-3 text-right flex items-center justify-end gap-1 font-mono text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inc.status === 'dispatched' ? 'bg-emerald-500' :
                  inc.status === 'verified' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                <span className="text-zinc-400 uppercase truncate">{inc.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIncident && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-3.5 max-h-[52%] overflow-y-auto space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${getSeverityBadge(selectedIncident.severity)}`}>
                {selectedIncident.severity}
              </span>
              <span className="font-mono font-semibold text-zinc-200 text-xs">
                {selectedIncident.id}
              </span>
              <span className="text-zinc-500 text-[11px]">
                ({selectedIncident.verifiedConfidence}% Verified)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onViewOnMap(selectedIncident)}
                className="md:hidden flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors"
                title="View on Map"
              >
                <Navigation className="w-3 h-3 text-emerald-400" />
                <span>Map</span>
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="font-mono text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-1">
            <span className="text-zinc-200 font-sans font-medium truncate max-w-[220px]">
              {selectedIncident.locationName}
            </span>
            <span>
              {selectedIncident.lat.toFixed(4)}°N, {selectedIncident.lng.toFixed(4)}°E
            </span>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300 italic leading-relaxed">
            &quot;{selectedIncident.citizenMessage}&quot;
          </div>

          {selectedIncident.assignedUnit && (
            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-zinc-500 uppercase text-[9px] font-mono block">Nearest Rescue Boat Assigned</span>
                <span className="text-zinc-200 font-semibold">{selectedIncident.assignedUnit.name}</span>
                <span className="text-zinc-400 block text-[10px]">{selectedIncident.assignedUnit.contactFreq}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-zinc-500 uppercase text-[9px] block">ETA</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedIncident.assignedUnit.etaMinutes}m</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="text-zinc-400 font-mono text-[10px] uppercase font-semibold">
                Vernacular Alert Broadcast
              </span>
              <div className="flex gap-1 font-mono text-[10px]">
                {(['hi', 'en', 'ta', 'bn'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      soundFx.playBlip();
                      setSelectedLang(l);
                    }}
                    className={`min-w-[32px] py-1 rounded uppercase font-semibold transition-colors ${selectedLang === l
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300 leading-normal">
              {selectedIncident.vernacularAlerts[selectedLang]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentAuditLogTab({ agentLogs }: { agentLogs: AgentLog[] }) {
  const [selectedAgent, setSelectedAgent] = useState<'all' | AgentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingLog, setInspectingLog] = useState<AgentLog | null>(null);
  const getAgentColor = (agent?: string) => {
    switch (agent?.toLowerCase()) {
      case 'scout':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'logistics':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'comms':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-850';
    }
  };

  const filteredLogs = agentLogs.filter((log) => {
    // 1. Safe case-insensitive agent check
    const matchAgent =
      selectedAgent === 'all' ||
      log.agent?.toLowerCase() === selectedAgent?.toLowerCase();

    // 2. Safe comprehensive search query matching
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchAgent;

    const matchSearch =
      Boolean(log.message?.toLowerCase().includes(query)) ||
      Boolean(log.detail?.toLowerCase().includes(query)) ||
      Boolean(log.agent?.toLowerCase().includes(query)) ||
      Boolean((log as any).action?.toLowerCase().includes(query)) ||
      Boolean((log as any).location?.toLowerCase().includes(query)) ||
      Boolean((log as any).summary?.toLowerCase().includes(query)) ||
      JSON.stringify(log.payload || {}).toLowerCase().includes(query);

    return matchAgent && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none text-xs font-sans">
      <div className="p-3 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(['all', 'scout', 'logistics', 'comms'] as const).map((agent) => (
            <button
              key={agent}
              onClick={() => {
                soundFx.playBlip();
                setSelectedAgent(agent);
              }}
              className={`px-3 py-1.5 rounded text-[11px] font-mono uppercase font-semibold transition-colors min-h-[32px] shrink-0 ${selectedAgent === agent
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
            >
              {agent}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search autonomous logs or payload hashes..."
            className="w-full bg-zinc-900 text-zinc-200 text-xs pl-8 pr-2.5 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 transition-colors font-sans placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-850">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs font-mono">
            No matching agent logs found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => {
                if (typeof soundFx?.playBlip === 'function') {
                  soundFx.playBlip?.();
                }
                setInspectingLog(log);
              }}
              className="p-3 hover:bg-zinc-900/60 active:bg-zinc-850 cursor-pointer transition-colors space-y-1.5 min-h-[48px]"
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${getAgentColor(log.agent as any)}`}>
                    {log.agent}
                  </span>
                  {log.stepNumber && <span className="text-zinc-500">Step {log.stepNumber}/3</span>}
                </div>
                <span className="text-zinc-500">{log.timestamp} UTC</span>
              </div>

              <p className="text-zinc-200 font-medium text-xs leading-snug">{log.message}</p>

              {log.detail && (
                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2 font-sans">
                  {log.detail}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                <span className="truncate max-w-[220px]">
                  {log.payload ? `payload: ${Object.keys(log.payload).join(', ')}` : 'status: OK'}
                </span>
                <span className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Inspect
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {inspectingLog && (
        <LogDetailModal log={inspectingLog} onClose={() => setInspectingLog(null)} />
      )}
    </div>
  );
}

function FleetRoutingTab({
  fleetOrigin,
  setFleetOrigin,
  fleetDestination,
  setFleetDestination,
  selectedVehicleId,
  setSelectedVehicleId,
  fleetResult,
}: {
  fleetOrigin: string;
  setFleetOrigin: (o: string) => void;
  fleetDestination: string;
  setFleetDestination: (d: string) => void;
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  fleetResult: FleetRouteResult;
}) {
  const getVehicleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bike':
        return Bike;
      case 'Truck':
        return Truck;
      case 'Car':
        return Car;
      default:
        return ShieldAlert;
    }
  };

  const getRiskBadge = (risk: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD') => {
    switch (risk) {
      case 'CRITICAL_HAZARD':
        return {
          label: 'CRITICAL HYDRO-LOCK HAZARD',
          className: 'bg-red-500/15 text-red-400 border border-red-500/30 font-bold',
        };
      case 'WARNING':
        return {
          label: 'ELEVATED FLOOD WARNING',
          className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold',
        };
      default:
        return {
          label: 'SAFE HIGH-GROUND CORRIDOR',
          className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold',
        };
    }
  };

  const riskBadge = getRiskBadge(fleetResult.riskLevel);

  // 3. Resolve Current Route & Vehicle Selection
  const defaultRoute = { distStd: '14.8 km', timeStd: '32m', distSafe: '17.2 km', timeSafe: '40m', nodes: 2, depth: 2.2 };

  const activeRoute =
    (DISPATCH_MATRIX[fleetOrigin] && DISPATCH_MATRIX[fleetOrigin][fleetDestination])
      ? DISPATCH_MATRIX[fleetOrigin][fleetDestination]
      : (DISPATCH_MATRIX['Okhla Phase-III Logistics Hub']?.[fleetDestination] || defaultRoute);

  const currentVehicle = getProfile(selectedVehicleId);
  const waterDepth = activeRoute.depth;
  const clearanceLimit = currentVehicle.limit;

  // Exact physics thresholds
  const isSafe = clearanceLimit >= waterDepth;
  const isCritical = !isSafe && waterDepth >= clearanceLimit * 1.5;
  const isWarning = !isSafe && !isCritical;
  const calculatedRisk = isSafe ? 'SAFE' : isCritical ? 'CRITICAL_HAZARD' : 'WARNING';

  // Dynamic UI outputs
  const displayStandardDist = activeRoute.distStd;
  const displayStandardTime = activeRoute.timeStd;
  const displaySafeDist = activeRoute.distSafe;
  const displaySafeTime = activeRoute.timeSafe;
  const displaySubmergedNodes = isSafe ? 0 : activeRoute.nodes;
  const displayDamage = isSafe ? '₹0' : `₹${currentVehicle.repairCost.toLocaleString('en-IN')}`;
  const displayDowntime = isSafe
    ? '0 mins'
    : isCritical
      ? `${currentVehicle.baseDowntime} mins`
      : `${Math.round(currentVehicle.baseDowntime * 0.4)} mins`;

  const displayAdvisory = isCritical
    ? `⚠️ Standard GPS route submerged (${waterDepth}ft water depth). High likelihood of engine hydro-lock failure for ${currentVehicle.name}.`
    : isWarning
      ? `⚠️ Water level (${waterDepth}ft) approaches clearance limit (${clearanceLimit}ft). Elevated bypass corridor recommended.`
      : `✓ Route is safe high ground. Clearance limits respected.`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 space-y-3 select-none text-xs font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <h3 className="font-semibold text-zinc-100 text-xs">Dispatch & Routes Engine</h3>
          <p className="text-[10px] text-zinc-500 font-mono">Bathymetric elevation routing</p>
        </div>
      </div>

      <div className="space-y-2 bg-zinc-900 p-2.5 rounded border border-zinc-800">
        <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block">
          Dispatch Route
        </span>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-0.5">Origin Terminal:</label>
          <select
            value={fleetOrigin}
            onChange={(e) => {
              soundFx.playBlip();
              setFleetOrigin(e.target.value);
            }}
            className="w-full bg-zinc-950 text-zinc-200 text-[11px] px-2 py-1 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600"
          >
            {FLEET_ORIGINS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 block mb-0.5">Destination Hub:</label>
          <select
            value={fleetDestination}
            onChange={(e) => {
              soundFx.playBlip();
              setFleetDestination(e.target.value);
            }}
            className="w-full bg-zinc-950 text-zinc-200 text-[11px] px-2 py-1 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600"
          >
            {FLEET_DESTINATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block mb-1.5">
          Vehicle Clearance Profile
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {FLEET_VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id || selectedVehicleId === vehicle.shortName;
            const Icon = getVehicleIcon(vehicle.iconName);

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  soundFx?.playBlip?.();
                  setSelectedVehicleId(vehicle.id);
                }}
                className={`flex flex-col p-2 rounded border text-left transition-all ${isSelected
                  ? 'bg-sky-950/60 border-sky-500 text-sky-200 shadow-sm shadow-sky-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 rounded border ${isSelected
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                  >
                    {vehicle.waterClearanceFt}ft limit
                  </span>
                </div>
                <span className="text-[11px] font-medium text-zinc-200 leading-tight">
                  {vehicle.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-zinc-400 uppercase font-semibold">Threat Level</span>
          <span
            className={`px-1.5 py-0.5 rounded font-mono font-bold ${isSafe
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : isCritical
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
          >
            {calculatedRisk}
          </span>
        </div>

        <div className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 leading-normal">
          <span className={isSafe ? 'text-emerald-400' : isCritical ? 'text-red-400' : 'text-amber-400'}>
            {displayAdvisory}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <span className="text-zinc-500 uppercase text-[9px] block mb-0.5">Standard Route</span>
          <p className="text-zinc-300 font-semibold">{displayStandardDist} • {displayStandardTime}</p>
          <p className={displaySubmergedNodes > 0 ? "text-red-400 text-[10px] mt-1" : "text-emerald-400 text-[10px] mt-1"}>
            {displaySubmergedNodes} Submerged Nodes
          </p>
        </div>

        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <span className="text-emerald-500 uppercase text-[9px] block mb-0.5">Safe Corridor</span>
          <p className="text-emerald-400 font-semibold">{displaySafeDist} • {displaySafeTime}</p>
          <p className="text-emerald-400 text-[10px] mt-1">100% Dry Elevation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-center">
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase block">DAMAGE PREVENTED</span>
          <span className="text-sm font-bold text-emerald-400">{displayDamage}
          </span>
        </div>
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase block">DOWNTIME SAVED</span>
          <span className="text-sm font-bold text-sky-400">
            {displayDowntime}
          </span>
        </div>
      </div>
    </div>
  );
}

function SosIntakeTab({
  createCitizenSos,
  isSimulating,
  triggerSimulation,
}: {
  createCitizenSos: (formData: any) => Promise<void>;
  isSimulating: boolean;
  triggerSimulation: () => Promise<void>;
}) {
  const [locationName, setLocationName] = useState('Mayur Vihar Extension, Pocket 4');
  const [trappedCount, setTrappedCount] = useState<number>(4);
  const [waterDepthFt, setWaterDepthFt] = useState<number>(4.2);
  const [citizenName, setCitizenName] = useState('Ananya Sen');
  const [phone, setPhone] = useState('9810144920');
  const [citizenMessage, setCitizenMessage] = useState(
    'Water reached first floor balcony. Power cut since 3 hours. 4 people including an elderly heart patient. Need evacuation boat urgently.'
  );

  const [specialNeeds, setSpecialNeeds] = useState<string[]>([
    'Elderly (Heart Patient)',
    'Medical Emergency',
  ]);

  const availableNeeds = [
    'Infants / Babies',
    'Elderly (Heart Patient)',
    'Medical Emergency',
    'Low Battery (<15%)',
    'Submerged Ground Floor',
    'Pet Evacuation',
  ];

  const handleToggleNeed = (need: string) => {
    soundFx.playBlip();
    if (specialNeeds.includes(need)) {
      setSpecialNeeds(specialNeeds.filter((n) => n !== need));
    } else {
      setSpecialNeeds([...specialNeeds, need]);
    }
  };

  const handleGpsAutoDetect = () => {
    soundFx.playRadarPing();
    const mockSpots = [
      'Kashmiri Gate Monastery Road #12',
      'ITO Power House Embankment Colony',
      'Geeta Colony Block 7 Pushta Road',
      'Sarita Vihar Pocket D Near Drain',
    ];
    setLocationName(mockSpots[Math.floor(Math.random() * mockSpots.length)]);
  };

  const handleSubmitSos = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCitizenSos({
      locationName,
      trappedCount,
      waterDepthFt,
      specialNeeds,
      citizenMessage,
      citizenName,
      phone,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3.5 space-y-3.5 select-none text-xs font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-zinc-200 text-xs block">Automated Swarm Simulator</span>
          <p className="text-[10px] text-zinc-400 font-mono">Execute 3-Agent pipeline against live DB</p>
        </div>
        <button
          type="button"
          onClick={() => triggerSimulation()}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-650 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors shrink-0 min-h-[38px]"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate SOS'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmitSos} className="space-y-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded">
        <div className="border-b border-zinc-800 pb-2">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block">
            Incoming Emergency Call
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-zinc-300 font-medium">Location / Sector:</label>
            <button
              type="button"
              onClick={handleGpsAutoDetect}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1 min-h-[24px]"
            >
              <Navigation className="w-3 h-3 text-emerald-400" /> Auto Geocode
            </button>
          </div>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
            className="w-full bg-zinc-950 text-zinc-200 text-xs px-3 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 min-h-[38px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-zinc-300 font-medium block mb-1">Trapped Victims:</label>
            <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 h-[38px]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.max(1, c - 1));
                }}
                className="w-9 h-full text-zinc-400 hover:text-zinc-100 font-mono text-center font-bold text-sm"
              >
                -
              </button>
              <span className="flex-1 text-center font-mono font-bold text-zinc-200 text-xs">
                {trappedCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.min(50, c + 1));
                }}
                className="w-9 h-full text-zinc-400 hover:text-zinc-100 font-mono text-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-zinc-300 font-medium">Water Depth:</label>
              <span className="text-amber-400 font-mono text-xs font-bold">{waterDepthFt} ft</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={waterDepthFt}
              onChange={(e) => setWaterDepthFt(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-950 rounded appearance-none cursor-pointer accent-amber-500 mt-2.5"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-zinc-300 font-medium block mb-1.5">Vulnerability Flags:</label>
          <div className="grid grid-cols-2 gap-1.5">
            {availableNeeds.map((need) => {
              const isChecked = specialNeeds.includes(need);
              return (
                <button
                  type="button"
                  key={need}
                  onClick={() => handleToggleNeed(need)}
                  className={`px-2.5 py-2 rounded text-[10px] font-medium text-left border transition-colors min-h-[36px] ${isChecked
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {need}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-zinc-300 font-medium block mb-1">Distress Remarks:</label>
          <textarea
            value={citizenMessage}
            onChange={(e) => setCitizenMessage(e.target.value)}
            rows={3}
            required
            className="w-full bg-zinc-950 text-zinc-200 text-xs p-2.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 font-sans leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Caller Name:</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              required
              className="w-full bg-zinc-950 text-zinc-200 text-xs px-2.5 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 min-h-[38px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Contact Phone:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-zinc-950 text-zinc-200 text-xs px-2.5 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 font-mono min-h-[38px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-3 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 border border-red-500 transition-colors shadow-xs min-h-[44px]"
        >
          Request Rescue
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 5. MASTER DASHBOARD COMPONENT
// ==========================================

export default function ResQGridDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(INITIAL_INCIDENTS[0]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('Okhla Phase-III Logistics Hub');
  const [selectedDestination, setSelectedDestination] = useState<string>('Connaught Place Financial Center');
  const [floodZones, setFloodZones] = useState<FloodZone[]>(INITIAL_FLOOD_ZONES);
  const [rescueDepots, setRescueDepots] = useState<RescueDepot[]>(INITIAL_RESCUE_DEPOTS);
  const [reliefUnits, setReliefUnits] = useState<ReliefUnit[]>(INITIAL_RELIEF_UNITS);
  const [routes, setRoutes] = useState<Record<string, RoutePath>>(INITIAL_ROUTES);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(INITIAL_AGENT_LOGS);
  const [unreadSwarmCount, setUnreadSwarmCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    floodZones: true,
    sosPins: true,
    depots: true,
    routes: true,
  });

  const [fleetOrigin, setFleetOrigin] = useState<string>(FLEET_ORIGINS[0]);
  const [fleetDestination, setFleetDestination] = useState<string>(FLEET_DESTINATIONS[0]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(FLEET_VEHICLES[0].id);

  const [fleetResult, setFleetResult] = useState<FleetRouteResult>(() =>
    calculateFleetRoute(FLEET_ORIGINS[0], FLEET_DESTINATIONS[0], FLEET_VEHICLES[0].id)
  );
  useEffect(() => {
    const newResult = calculateFleetRoute(fleetOrigin, fleetDestination, selectedVehicleId);
    setFleetResult(newResult);
  }, [fleetOrigin, fleetDestination, selectedVehicleId]);

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toISOString().slice(11, 19));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tab-change', { detail: activeTab }));
    }
  }, [activeTab]);

  const addToast = useCallback((toast: Omit<ToastInfo, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const toggleFilter = (key: keyof FilterState) => {
    soundFx.playBlip();
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      soundFx.isMuted = !prev;
      if (prev) soundFx.playBlip();
      return !prev;
    });
  };

  useEffect(() => {
    async function loadBackendState() {
      try {
        const res = await fetch('/api/data/bootstrap');
        const data = await res.json();
        if (data.success) {
          if (data.incidents?.length) setIncidents(data.incidents);
          if (data.floodZones?.length) setFloodZones(data.floodZones);
          if (data.rescueUnits?.length) setReliefUnits(data.rescueUnits);
          if (data.rescueDepots?.length) setRescueDepots(data.rescueDepots);
          if (data.routes && Object.keys(data.routes).length) setRoutes(data.routes);
          if (data.agentLogs?.length) setAgentLogs(data.agentLogs);
          if (data.incidents?.length) setSelectedIncident(data.incidents[0]);
        }
      } catch { }
    }
    loadBackendState();
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/agents/stream');
      eventSource.addEventListener('agent_log', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.log) {
            setAgentLogs((prev) => [parsed.log, ...prev]);
            setUnreadSwarmCount((c) => c + 1);
            soundFx.playBlip();
            addToast({
              title: `${parsed.log.agent.toUpperCase()} AGENT TELEMETRY`,
              desc: parsed.log.message,
              type: parsed.log.agent,
            });
          }
        } catch { }
      });

      eventSource.addEventListener('new_incident', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.incident) {
            setIncidents((prev) => [parsed.incident, ...prev]);
            setSelectedIncident(parsed.incident);
            if (parsed.route) {
              setRoutes((prev) => ({ ...prev, [parsed.route.id]: parsed.route }));
            }
          }
        } catch { }
      });
    } catch { }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [addToast]);

  useEffect(() => {
    async function fetchFleetRoute() {
      try {
        const res = await fetch('/api/routing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: fleetOrigin,
            destination: fleetDestination,
            vehicle_type: selectedVehicleId,
          }),
        });
        const data = await res.json();
        if (data.success && data.route) {
          setFleetResult(data.route);
        } else {
          setFleetResult(calculateFleetRoute(fleetOrigin, fleetDestination, selectedVehicleId));
        }
      } catch {
        setFleetResult(calculateFleetRoute(fleetOrigin, fleetDestination, selectedVehicleId));
      }
    }
    fetchFleetRoute();
  }, [fleetOrigin, fleetDestination, selectedVehicleId]);

  const triggerSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    soundFx.playEmergencyAlarm();

    try {
      const res = await fetch('/api/sos/simulate', { method: 'POST' });
      const json = await res.json();

      if (json.success && json.data) {
        const { incident, route, logs } = json.data;
        setIncidents((prev) => [incident, ...prev]);
        setRoutes((prev) => ({ ...prev, [route.id]: route }));
        setSelectedIncident(incident);
        setAgentLogs((prev) => [...logs, ...prev]);
        setUnreadSwarmCount((c) => c + logs.length);

        if (incident.assignedUnit) {
          setReliefUnits((prev) => [
            {
              id: incident.assignedUnit.id,
              name: incident.assignedUnit.name,
              type: 'boat',
              lat: incident.lat - 0.006,
              lng: incident.lng - 0.008,
              status: 'en_route',
              batteryOrFuel: 88,
              targetIncidentId: incident.id,
            },
            ...prev,
          ]);
        }

        addToast({
          title: `DISTRESS EMERGENCY: ${incident.locationName}`,
          desc: `${incident.trappedCount} souls • Verified ${incident.verifiedConfidence}% • ${incident.assignedUnit?.name} en route`,
          type: 'sos',
        });
      }
    } catch {
      // Fallback in-memory simulation
      const newInc: Incident = {
        id: `sos-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Residential Roof Evacuation',
        locationName: 'Geeta Colony Embankment Sector 7',
        lat: 28.6520,
        lng: 77.2720,
        trappedCount: 6,
        waterDepthFt: 5.1,
        severity: 'P1',
        verifiedConfidence: 98,
        status: 'dispatched',
        specialNeeds: ['Infants / Babies', 'Medical Emergency'],
        citizenMessage: 'Ground floor completely flooded. 6 people trapped on balcony.',
        citizenName: 'Deepak Sharma',
        phone: '+91-98711-22334',
        assignedUnit: {
          id: 'unit-boat-04',
          name: 'NDRF Quick Rescue Boat #04',
          type: 'boat',
          teamLead: 'Capt. R. K. Meena',
          etaMinutes: 8,
          contactFreq: 'VHF Ch 16',
        },
        vernacularAlerts: {
          hi: 'बचाव नाव रवाना हो चुकी है। आगमन समय: 8 मिनट।',
          en: 'Rescue boat dispatched. ETA: 8 mins.',
          ta: 'மீட்புப் படகு புறப்பட்டுவிட்டது. வருகை நேரம்: 8 நிமிடங்கள்.',
          bn: 'উদ্ধারকারী বোট রওনা হয়েছে। পৌঁছানোর সময়: ৮ মিনিট।',
        },
        routeId: 'route-sos-7402',
        timestamp: new Date().toISOString().slice(11, 19),
      };
      setIncidents((prev) => [newInc, ...prev]);
      setSelectedIncident(newInc);
    } finally {
      setIsSimulating(false);
    }
  };

  const createCitizenSos = async (formData: any) => {
    setIsSimulating(true);
    soundFx.playEmergencyAlarm();

    try {
      const res = await fetch('/api/sos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const { incident, route, logs } = json.data;
        setIncidents((prev) => [incident, ...prev]);
        setRoutes((prev) => ({ ...prev, [route.id]: route }));
        setSelectedIncident(incident);
        setAgentLogs((prev) => [...logs, ...prev]);
        setUnreadSwarmCount((c) => c + logs.length);
        setActiveTab('map');
      }
    } catch { } finally {
      setIsSimulating(false);
    }
  };

  const activeEmergenciesCount = incidents.filter((i) => i.status !== 'rescued').length;
  const p1Count = incidents.filter((i) => i.severity === 'P1' && i.status !== 'rescued').length;
  const currentSidebarTab = activeTab === 'map' ? 'incidents' : activeTab;

  const sidebarTabs: { id: TabType; label: string; badge?: number; badgeColor?: string }[] = [
    {
      id: 'incidents',
      label: 'Active Emergencies',
      badge: activeEmergenciesCount > 0 ? activeEmergenciesCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'swarm',
      label: 'AI Decision Log',
      badge: unreadSwarmCount > 0 ? unreadSwarmCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    { id: 'fleet', label: 'Dispatch & Routes' },
    { id: 'sos', label: 'Request Rescue' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-11 bg-zinc-950 border-b border-zinc-800 px-3.5 flex items-center justify-between z-30 select-none text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 font-mono font-bold text-[11px]">
              RQ
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight">
              ResQGrid <span className="text-zinc-500 font-normal text-[11px]">Ops Center</span>
            </span>
          </div>
          <div className="h-3.5 w-px bg-zinc-800" />
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>LIVE UPLINK</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">ACTIVE EMERGENCIES:</span>
            <span className={p1Count > 0 ? "text-red-400 font-bold" : "text-zinc-200"}>
              {activeEmergenciesCount} {p1Count > 0 && `(${p1Count} P1)`}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">HAZARDS:</span>
            <span className="text-amber-400 font-semibold">{floodZones.length}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">UNITS:</span>
            <span className="text-emerald-400 font-semibold">{reliefUnits.length}</span>
          </div>
          <div className="text-zinc-500 text-[11px] px-1">{currentTime || '00:00:00'} UTC</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerSimulation()}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${isSimulating
              ? 'bg-zinc-900 text-zinc-400 border-zinc-800 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
          >
            <Play className={`w-3 h-3 ${isSimulating ? 'text-zinc-500 animate-spin' : 'text-emerald-400 fill-emerald-400'}`} />
            <span>{isSimulating ? 'Executing...' : 'Simulate Event'}</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="hidden md:flex p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
          >
            {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Canvas & Split Pane Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Unified Map Canvas (Always active on Desktop; on Mobile visible when activeTab === 'map') */}
        <main className={`flex-1 h-full relative overflow-hidden bg-zinc-950 ${activeTab === 'map' ? 'flex' : 'hidden md:flex'}`}>
          <HazardMap
            incidents={incidents}
            selectedIncident={selectedIncident}
            setSelectedIncident={setSelectedIncident}
            floodZones={floodZones}
            rescueDepots={rescueDepots}
            reliefUnits={reliefUnits}
            routes={routes}
            filters={filters}
            toggleFilter={toggleFilter}
            fleetOrigin={fleetOrigin}
            fleetDestination={fleetDestination}
            selectedVehicleId={selectedVehicleId}
          />
        </main>

        {/* Desktop Sidebar (Only when sidebar open and screen >= md) */}
        {isSidebarOpen && (
          <aside className="hidden md:flex w-[390px] lg:w-[430px] bg-zinc-950 border-l border-zinc-800 flex-col h-full overflow-hidden select-none text-xs">
            <div className="flex items-center border-b border-zinc-800 bg-zinc-950 p-1 gap-1">
              {sidebarTabs.map((tab) => {
                const isActive = currentSidebarTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundFx.playBlip();
                      setActiveTab(tab.id);
                      if (tab.id === 'swarm') setUnreadSwarmCount(0);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${isActive
                      ? 'bg-zinc-850 text-zinc-100 font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`px-1 rounded-sm text-[9px] font-mono font-bold ${tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {currentSidebarTab === 'incidents' && (
                <IncidentsTab
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  setSelectedIncident={setSelectedIncident}
                  onViewOnMap={(inc) => setSelectedIncident(inc)}
                />
              )}
              {currentSidebarTab === 'swarm' && <AgentAuditLogTab agentLogs={agentLogs} />}
              {currentSidebarTab === 'fleet' && (
                <FleetRoutingTab
                  fleetOrigin={fleetOrigin}
                  setFleetOrigin={setFleetOrigin}
                  fleetDestination={fleetDestination}
                  setFleetDestination={setFleetDestination}
                  selectedVehicleId={selectedVehicleId}
                  setSelectedVehicleId={setSelectedVehicleId}
                  fleetResult={fleetResult}
                />
              )}
              {currentSidebarTab === 'sos' && (
                <SosIntakeTab
                  createCitizenSos={createCitizenSos}
                  isSimulating={isSimulating}
                  triggerSimulation={triggerSimulation}
                />
              )}
            </div>
          </aside>
        )}

        {/* Mobile View Active Tab (When activeTab is not 'map' on mobile screens) */}
        {activeTab !== 'map' && (
          <div className="flex md:hidden flex-1 h-full overflow-hidden flex-col bg-zinc-950">
            {activeTab === 'incidents' && (
              <IncidentsTab
                incidents={incidents}
                selectedIncident={selectedIncident}
                setSelectedIncident={setSelectedIncident}
                onViewOnMap={(inc) => {
                  setSelectedIncident(inc);
                  setActiveTab('map');
                }}
              />
            )}
            {activeTab === 'swarm' && (
              <AgentAuditLogTab agentLogs={agentLogs} />
            )}
            {activeTab === 'fleet' && (
              <FleetRoutingTab
                fleetOrigin={fleetOrigin}
                setFleetOrigin={setFleetOrigin}
                fleetDestination={fleetDestination}
                setFleetDestination={setFleetDestination}
                selectedVehicleId={selectedVehicleId}
                setSelectedVehicleId={setSelectedVehicleId}
                fleetResult={fleetResult}
              />
            )}
            {activeTab === 'sos' && (
              <SosIntakeTab
                createCitizenSos={createCitizenSos}
                isSimulating={isSimulating}
                triggerSimulation={triggerSimulation}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden h-14 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around px-1 z-40 select-none">
        {[
          { id: 'map' as TabType, label: 'Map', icon: MapIcon },
          {
            id: 'incidents' as TabType,
            label: 'Active Emergencies',
            icon: AlertCircle,
            badge: activeEmergenciesCount > 0 ? activeEmergenciesCount : undefined,
            badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
          },
          {
            id: 'swarm' as TabType,
            label: 'AI Decision Log',
            icon: Terminal,
            badge: unreadSwarmCount > 0 ? unreadSwarmCount : undefined,
            badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
          },
          { id: 'fleet' as TabType, label: 'Dispatch & Routes', icon: Route },
          { id: 'sos' as TabType, label: 'Request Rescue', icon: PlusCircle },
        ].map((item) => {
          const isStrictActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playBlip();
                setActiveTab(item.id);
                if (item.id === 'swarm') setUnreadSwarmCount(0);
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[48px] transition-colors relative ${isStrictActive ? 'text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              {isStrictActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zinc-400 rounded-full" />
              )}
              <div className="relative">
                <Icon className={`w-4 h-4 ${isStrictActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                {item.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-3 px-1 rounded-sm text-[8px] font-mono font-bold leading-tight ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] ${isStrictActive ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Subtle Live Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 md:bottom-4 right-4 z-50 w-full max-w-sm px-2 pointer-events-none flex flex-col gap-1.5 font-sans select-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-2 p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs shadow-md"
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === 'sos' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-zinc-100 text-[11px] leading-tight font-mono uppercase">
                  {toast.title}
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{toast.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
