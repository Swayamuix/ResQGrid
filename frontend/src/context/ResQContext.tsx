'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Incident, FloodZone, RescueDepot, ReliefUnit, RoutePath, AgentLog, FleetRouteResult } from '@/types/resq';
import { 
  INITIAL_FLOOD_ZONES, 
  INITIAL_INCIDENTS, 
  INITIAL_RESCUE_DEPOTS, 
  INITIAL_RELIEF_UNITS, 
  INITIAL_ROUTES, 
  INITIAL_AGENT_LOGS,
  FLEET_VEHICLES,
} from '@/data/initialData';
import { calculateFleetRoute, FLEET_ORIGINS, FLEET_DESTINATIONS } from '@/data/mockGenerator';
import { soundFx } from '@/utils/audio';

export type TabType = 'map' | 'incidents' | 'swarm' | 'fleet' | 'sos';
export type ViewMode = 'mobile' | 'expanded';

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

interface ResQContextType {
  // Navigation & Layout
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Data
  incidents: Incident[];
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  floodZones: FloodZone[];
  rescueDepots: RescueDepot[];
  reliefUnits: ReliefUnit[];
  routes: Record<string, RoutePath>;
  agentLogs: AgentLog[];
  
  // Filters
  filters: FilterState;
  toggleFilter: (key: keyof FilterState) => void;
  
  // Audio & Settings
  isMuted: boolean;
  toggleMute: () => void;
  
  // Simulation & Real API Operations
  isSimulating: boolean;
  triggerSimulation: () => Promise<void>;
  createCitizenSos: (formData: {
    locationName: string;
    trappedCount: number;
    waterDepthFt: number;
    specialNeeds: string[];
    citizenMessage: string;
    citizenName: string;
    phone: string;
  }) => Promise<void>;
  
  // Fleet B2B Mode
  fleetOrigin: string;
  setFleetOrigin: (origin: string) => void;
  fleetDestination: string;
  setFleetDestination: (destination: string) => void;
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  fleetResult: FleetRouteResult;
  
  // Notifications / Telemetry
  toasts: ToastInfo[];
  removeToast: (id: string) => void;
  unreadSwarmCount: number;
  resetUnreadSwarm: () => void;
}

const ResQContext = createContext<ResQContextType | undefined>(undefined);

export function ResQProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabType>('map');
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(INITIAL_INCIDENTS[0]);
  const [floodZones, setFloodZones] = useState<FloodZone[]>(INITIAL_FLOOD_ZONES);
  const [rescueDepots, setRescueDepots] = useState<RescueDepot[]>(INITIAL_RESCUE_DEPOTS);
  const [reliefUnits, setReliefUnits] = useState<ReliefUnit[]>(INITIAL_RELIEF_UNITS);
  const [routes, setRoutes] = useState<Record<string, RoutePath>>(INITIAL_ROUTES);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(INITIAL_AGENT_LOGS);
  
  const [filters, setFilters] = useState<FilterState>({
    floodZones: true,
    sosPins: true,
    depots: true,
    routes: true,
  });
  
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [unreadSwarmCount, setUnreadSwarmCount] = useState<number>(0);
  
  // Fleet state
  const [fleetOrigin, setFleetOrigin] = useState<string>(FLEET_ORIGINS[0]);
  const [fleetDestination, setFleetDestination] = useState<string>(FLEET_DESTINATIONS[0]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(FLEET_VEHICLES[0].id);
  
  const [fleetResult, setFleetResult] = useState<FleetRouteResult>(() => 
    calculateFleetRoute(FLEET_ORIGINS[0], FLEET_DESTINATIONS[0], FLEET_VEHICLES[0].id)
  );

  const addToast = useCallback((toast: Omit<ToastInfo, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  // 1. Initial State Bootstrap from SQLite Database
  useEffect(() => {
    async function loadDatabaseState() {
      try {
        const res = await fetch('/api/data/bootstrap');
        const data = await res.json();
        if (data.success) {
          if (data.incidents && data.incidents.length > 0) setIncidents(data.incidents);
          if (data.floodZones && data.floodZones.length > 0) setFloodZones(data.floodZones);
          if (data.rescueUnits && data.rescueUnits.length > 0) setReliefUnits(data.rescueUnits);
          if (data.rescueDepots && data.rescueDepots.length > 0) setRescueDepots(data.rescueDepots);
          if (data.routes && Object.keys(data.routes).length > 0) setRoutes(data.routes);
          if (data.agentLogs && data.agentLogs.length > 0) setAgentLogs(data.agentLogs);
          if (data.incidents && data.incidents.length > 0) setSelectedIncident(data.incidents[0]);
        }
      } catch (err) {
        console.error('Failed to bootstrap from database:', err);
      }
    }

    loadDatabaseState();
  }, []);

  // 2. Server-Sent Events (SSE) Live Stream Listener from /api/agents/stream
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
            soundFx.playAgentStep(parsed.log.agent);

            addToast({
              title: `${parsed.log.agent.toUpperCase()} AGENT TELEMETRY`,
              desc: parsed.log.message,
              type: parsed.log.agent,
            });
          }
        } catch (err) {
          console.error('Error parsing SSE agent log:', err);
        }
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
        } catch (err) {
          console.error('Error parsing SSE new incident:', err);
        }
      });
    } catch (err) {
      console.warn('SSE connection unavailable, operating in standard API mode:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [addToast]);

  // 3. Dynamic Fleet Route Calculation via Backend API
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

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundFx.isMuted = next;
      if (!next) soundFx.playBlip();
      return next;
    });
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    soundFx.playBlip();
    setActiveTabState(tab);
    if (tab === 'swarm') {
      setUnreadSwarmCount(0);
    }
  }, []);

  const toggleFilter = useCallback((key: keyof FilterState) => {
    soundFx.playBlip();
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetUnreadSwarm = useCallback(() => {
    setUnreadSwarmCount(0);
  }, []);

  // 4. Real Simulation: POST /api/sos/simulate
  const triggerSimulation = useCallback(async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    soundFx.playEmergencyAlarm();

    try {
      const res = await fetch('/api/sos/simulate', {
        method: 'POST',
      });
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
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [isSimulating, addToast]);

  // 5. Citizen SOS Submission: POST /api/sos/submit
  const createCitizenSos = useCallback(async (formData: {
    locationName: string;
    trappedCount: number;
    waterDepthFt: number;
    specialNeeds: string[];
    citizenMessage: string;
    citizenName: string;
    phone: string;
  }) => {
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

        addToast({
          title: 'Emergency SOS Broadcasted',
          desc: `Assigned ${incident.assignedUnit?.name} • ETA: ${incident.assignedUnit?.etaMinutes}m`,
          type: 'success',
        });

        setActiveTabState('map');
      }
    } catch (err) {
      console.error('Citizen SOS Submission error:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [addToast]);

  return (
    <ResQContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        incidents,
        selectedIncident,
        setSelectedIncident,
        floodZones,
        rescueDepots,
        reliefUnits,
        routes,
        agentLogs,
        filters,
        toggleFilter,
        isMuted,
        toggleMute,
        isSimulating,
        triggerSimulation,
        createCitizenSos,
        fleetOrigin,
        setFleetOrigin,
        fleetDestination,
        setFleetDestination,
        selectedVehicleId,
        setSelectedVehicleId,
        fleetResult,
        toasts,
        removeToast,
        unreadSwarmCount,
        resetUnreadSwarm,
      }}
    >
      {children}
    </ResQContext.Provider>
  );
}

export function useResQ() {
  const ctx = useContext(ResQContext);
  if (!ctx) {
    throw new Error('useResQ must be used within a ResQProvider');
  }
  return ctx;
}
