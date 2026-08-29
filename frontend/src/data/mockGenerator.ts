import { Incident, AgentLog, RoutePath, FleetRouteResult, FleetVehicleConfig } from '@/types/resq';
import { FLEET_VEHICLES } from './initialData';

const RANDOM_LOCATIONS = [
  {
    name: 'Geeta Colony Ring Road Sector 5',
    lat: 28.6495,
    lng: 77.2680,
    waterDepth: 4.2,
    message: 'Water breached ground floor shops. 6 store workers and 2 customers trapped on mezzanine loft. Need immediate evacuation boat.',
    nameCitizen: 'Vikas Malhotra',
    needs: ['Power Loss', 'Elderly Merchant (70yo)', 'Medical Kit'],
  },
  {
    name: 'Shakarpur Pushta Lowland Lane 3',
    lat: 28.6255,
    lng: 77.2820,
    waterDepth: 5.1,
    message: 'Embankment overflowed. 4 residents trapped on single-story roof. Current is strong, cannot swim across.',
    nameCitizen: 'Pooja Devi',
    needs: ['Pregnant Mother', 'Food/Water Ration', 'Infant Care'],
  },
  {
    name: 'Okhla Village Embankment Zone 2',
    lat: 28.5630,
    lng: 77.2940,
    waterDepth: 3.6,
    message: 'Sewage backflow merged with flood water. 8 people isolated on residential second floor.',
    nameCitizen: 'Mohammad Tariq',
    needs: ['Potable Drinking Water', 'Elderly Evacuation', 'Insulin Cooling'],
  },
  {
    name: 'Bela Road Ghat Civil Lines',
    lat: 28.6780,
    lng: 77.2280,
    waterDepth: 4.6,
    message: 'Monastery basement submerged. 7 monks and caretaker moved to pagoda top.',
    nameCitizen: 'Tenzin Dorjee',
    needs: ['First Aid', 'Hypothermia Risk'],
  },
  {
    name: 'Kalyanpuri Culvert Bypass',
    lat: 28.6180,
    lng: 77.3150,
    waterDepth: 3.4,
    message: 'Auto rickshaw stranded in culvert whirlpool with 3 passengers. Water rising fast.',
    nameCitizen: 'Deepak Kumar',
    needs: ['Submerged Vehicle', 'Urgent Rope Retrieval'],
  },
];

export function generateRandomIncident(): { incident: Incident; route: RoutePath; swarmSteps: AgentLog[] } {
  const locIndex = Math.floor(Math.random() * RANDOM_LOCATIONS.length);
  const loc = RANDOM_LOCATIONS[locIndex];
  const randId = Math.floor(1000 + Math.random() * 9000);
  const incidentId = `sos-${randId}`;
  const routeId = `route-${randId}`;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const eta = Math.floor(6 + Math.random() * 10);
  const boatNum = Math.floor(1 + Math.random() * 8).toString().padStart(2, '0');

  const incident: Incident = {
    id: incidentId,
    title: `${loc.needs[0]} - ${loc.name.split(' ')[0]} Alert`,
    locationName: loc.name,
    lat: loc.lat + (Math.random() - 0.5) * 0.005,
    lng: loc.lng + (Math.random() - 0.5) * 0.005,
    severity: 'P1',
    status: 'dispatched',
    timestamp: 'Just now',
    citizenMessage: loc.message,
    citizenName: loc.nameCitizen,
    phoneLast4: Math.floor(1000 + Math.random() * 9000).toString(),
    trappedCount: Math.floor(3 + Math.random() * 6),
    waterDepthFt: parseFloat(loc.waterDepth.toFixed(1)),
    specialNeeds: loc.needs,
    verifiedConfidence: Math.floor(93 + Math.random() * 6),
    assignedUnit: {
      id: `unit-boat-${boatNum}`,
      name: `NDRF Quick Response Boat #${boatNum}`,
      type: 'boat',
      teamLead: `Sub-Inspector K. ${['Singh', 'Rao', 'Das', 'Kumar'][Math.floor(Math.random() * 4)]}`,
      etaMinutes: eta,
      contactFreq: `VHF Ch ${Math.floor(10 + Math.random() * 8)} (156.${Math.floor(100 + Math.random() * 800)} MHz)`,
    },
    vernacularAlerts: {
      en: `NDRF Boat #${boatNum} dispatched to your exact GPS coordinates. ETA: ${eta} mins. Stay on high ground with flashlight visible.`,
      hi: `एनडीआरएफ नाव #${boatNum} आपके जीपीएस स्थान के लिए रवाना हो चुकी है। आगमन समय: ${eta} मिनट। कृपया सुरक्षित छत पर बने रहें।`,
      ta: `என்டிஆர்எஃப் படகு #${boatNum} அனுப்பப்பட்டது. வந்து சேரும் நேரம்: ${eta} நிமிடங்கள். பாதுகாப்பாக இருங்கள்.`,
      bn: `এনডিআরএফ বোট #${boatNum} রওনা হয়েছে। পৌঁছানোর সময়: ${eta} মিনিট। ছাদে নিরাপদে থাকুন।`,
    },
    routeId,
  };

  // Generate safe route and blocked route for this incident
  const depotLat = 28.6480;
  const depotLng = 77.2220;
  const midLat = (depotLat + incident.lat) / 2;
  const midLng = (depotLng + incident.lng) / 2;

  const route: RoutePath = {
    id: routeId,
    incidentId: incident.id,
    safeCoordinates: [
      [depotLat, depotLng],
      [depotLat - 0.005, depotLng + 0.015],
      [midLat + 0.008, midLng - 0.004],
      [midLat + 0.004, midLng + 0.010],
      [incident.lat + 0.002, incident.lng - 0.004],
      [incident.lat, incident.lng],
    ],
    blockedCoordinates: [
      [depotLat - 0.005, depotLng + 0.015],
      [midLat - 0.005, midLng + 0.002],
      [incident.lat, incident.lng],
    ],
    bypassReason: `High-water hazard (${incident.waterDepthFt}ft deep current). Rerouted along elevated bypass embankment to prevent boat cavitation and swift-water debris strike.`,
    distanceKm: parseFloat((4.5 + Math.random() * 4).toFixed(1)),
    etaMin: eta,
    elevationM: 218,
  };

  const swarmSteps: AgentLog[] = [
    {
      id: `sim-log-${Date.now()}-1`,
      agent: 'scout',
      timestamp: timeStr,
      message: `Emergency SOS captured from ${loc.nameCitizen} at ${loc.name}.`,
      detail: `Parsed ${incident.trappedCount} trapped souls with critical tag: ${loc.needs.join(', ')}. Geotag confidence: ${incident.verifiedConfidence}%.`,
      payload: {
        rawInput: loc.message,
        hydrologicalRisk: `${incident.waterDepthFt} ft submersion depth`,
        sentinelConfidence: `${incident.verifiedConfidence}% match with radar soil saturation`,
      },
      stepNumber: 1,
      incidentId: incident.id,
      isNew: true,
    },
    {
      id: `sim-log-${Date.now()}-2`,
      agent: 'logistics',
      timestamp: timeStr,
      message: `Direct approach Chokepoint submerged under ${incident.waterDepthFt}ft water. Elevating bypass route.`,
      detail: `Assigned closest available NDRF Boat #${boatNum} from 8th Battalion Base. Computed safe high-water corridor (ETA: ${eta}m).`,
      payload: {
        assignedAsset: `NDRF Inflatable Boat #${boatNum}`,
        navigationCorridor: 'Elevated High-Tide Embankment Bypass',
        bypassDistance: `${route.distanceKm} km`,
      },
      stepNumber: 2,
      incidentId: incident.id,
      isNew: true,
    },
    {
      id: `sim-log-${Date.now()}-3`,
      agent: 'comms',
      timestamp: timeStr,
      message: `Multilingual emergency guidance pushed to citizen +91-98765-XX${incident.phoneLast4} & district commander.`,
      detail: `Broadcast localized SMS in Hindi & English with live telemetry beacon token & flashlight signaling instructions.`,
      payload: {
        smsBroadcastChannel: 'Disaster Cell Broadcast Node #7',
        targetLanguage: 'Hindi / English Vernacular',
        acknowledgementStatus: 'ACK_RECEIVED',
      },
      stepNumber: 3,
      incidentId: incident.id,
      isNew: true,
    },
  ];

  return { incident, route, swarmSteps };
}

export const FLEET_ORIGINS = [
  'Okhla Industrial Logistics Hub (South)',
  'Kashmiri Gate Cargo Terminal (North)',
  'Mayur Vihar Fulfillment Center (East)',
  'Connaught Place Rapid Hub (Central)',
];

export const FLEET_DESTINATIONS = [
  'Noida Sector 18 Commercial Hub',
  'East Delhi Mother Dairy Distribution Depot',
  'ISBT Freight Forwarding Bay',
  'Sarita Vihar Apollo Relief Warehouse',
];

export function calculateFleetRoute(
  origin: string,
  destination: string,
  vehicleId: string
): FleetRouteResult {
  const vehicle = FLEET_VEHICLES.find((v) => v.id === vehicleId) || FLEET_VEHICLES[0];
  const standardKm = 14.8;
  const standardMin = 32;

  // If vehicle has low clearance, high flood risk
  let riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD' = 'SAFE';
  let floodDepth = 3.8;
  let bypassedSegments = 2;

  if (vehicle.waterClearanceFt < 1.0) {
    riskLevel = 'CRITICAL_HAZARD';
  } else if (vehicle.waterClearanceFt < 2.0) {
    riskLevel = 'WARNING';
  } else {
    riskLevel = 'SAFE';
  }

  const safeKm = parseFloat((standardKm + 2.4).toFixed(1));
  const safeMin = standardMin + 8; // Extra 8 mins bypass vs getting submerged/stuck for 4 hours!

  const potentialDamage = riskLevel === 'CRITICAL_HAZARD' 
    ? vehicle.engineReplacementCostInr 
    : riskLevel === 'WARNING' 
    ? Math.round(vehicle.engineReplacementCostInr * 0.45) 
    : 0;

  const slaDelaySaved = riskLevel === 'CRITICAL_HAZARD' ? 180 : 45; // 3 hours avoided stranded downtime

  return {
    origin,
    destination,
    vehicle,
    standardRouteKm: standardKm,
    standardRouteMin: standardMin,
    safeRouteKm: safeKm,
    safeRouteMin: safeMin,
    floodSegmentsBypassed: bypassedSegments,
    maxFloodDepthEncounteredFt: floodDepth,
    riskLevel,
    estimatedAssetLossSavedInr: potentialDamage,
    slaDelaySavedMin: slaDelaySaved,
    routeCoordinates: [
      [28.5850, 77.2620],
      [28.5950, 77.2500],
      [28.6150, 77.2450],
      [28.6350, 77.2550],
      [28.6450, 77.2750],
      [28.6310, 77.3050],
    ],
    blockedCoordinates: [
      [28.5950, 77.2500],
      [28.6080, 77.2750], // Deep flood chokepoint
      [28.6310, 77.3050],
    ],
  };
}
