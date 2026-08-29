'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { FLEET_VEHICLES } from '@/data/initialData';
import { FLEET_ORIGINS, FLEET_DESTINATIONS } from '@/data/mockGenerator';
import { formatInr } from '@/utils/formatters';
import { ApiSnippetModal } from '../fleet/ApiSnippetModal';
import { 
  Truck, 
  Bike, 
  Car, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Code, 
  ArrowRight 
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function FleetRoutingTab() {
  const {
    fleetOrigin,
    setFleetOrigin,
    fleetDestination,
    setFleetDestination,
    selectedVehicleId,
    setSelectedVehicleId,
    fleetResult,
  } = useResQ();

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 space-y-3 select-none text-xs font-sans">
      {/* Top Banner / API trigger */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div>
          <h3 className="font-semibold text-zinc-100 text-xs">
            Dispatch & Routes Engine
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono">
            Bathymetric elevation routing
          </p>
        </div>
        <button
          onClick={() => {
            soundFx.playBlip();
            setIsApiModalOpen(true);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-mono transition-colors"
        >
          <Code className="w-3 h-3 text-zinc-400" />
          <span>API Docs</span>
        </button>
      </div>

      {/* Origin & Destination Selectors */}
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
              <option key={o} value={o}>
                {o}
              </option>
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
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Archetypes */}
      <div>
        <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block mb-1.5">
          Vehicle Clearance Profile
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {FLEET_VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const Icon = getVehicleIcon(vehicle.iconName);

            return (
              <button
                key={vehicle.id}
                onClick={() => {
                  soundFx.playBlip();
                  setSelectedVehicleId(vehicle.id);
                }}
                className={`flex flex-col p-2 rounded border text-left transition-colors ${
                  isSelected
                    ? 'bg-zinc-850 border-zinc-500 text-zinc-100'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
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

      {/* Risk Assessment Scorecard */}
      <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-zinc-400 uppercase font-semibold">Threat Level</span>
          <span className={`px-1.5 py-0.5 rounded ${riskBadge.className}`}>
            {fleetResult.riskLevel}
          </span>
        </div>

        {/* Status explanation */}
        <div className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 leading-normal">
          {fleetResult.riskLevel === 'CRITICAL_HAZARD' ? (
            <span className="text-red-400">
              ⚠️ Standard GPS route submerged ({fleetResult.maxFloodDepthEncounteredFt}ft water depth). High likelihood of engine hydro-lock failure for {fleetResult.vehicle.shortName}.
            </span>
          ) : fleetResult.riskLevel === 'WARNING' ? (
            <span className="text-amber-400">
              ⚠️ Water level approaches maximum clearance. Elevated bypass corridor recommended.
            </span>
          ) : (
            <span className="text-emerald-400">
              ✓ Route is safe high ground. Clearance limits respected.
            </span>
          )}
        </div>

        {/* Comparison Matrix */}
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
            <span className="text-zinc-500 uppercase text-[9px] block mb-0.5">Standard Route</span>
            <p className="text-zinc-300 font-semibold">{fleetResult.standardRouteKm} km • {fleetResult.standardRouteMin}m</p>
            <p className="text-red-400 text-[10px] mt-1">2 Submerged Nodes</p>
          </div>

          <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
            <span className="text-emerald-500 uppercase text-[9px] block mb-0.5">Safe Corridor</span>
            <p className="text-emerald-400 font-semibold">{fleetResult.safeRouteKm} km • {fleetResult.safeRouteMin}m</p>
            <p className="text-emerald-400 text-[10px] mt-1">100% Dry Elevation</p>
          </div>
        </div>

        {/* Economic Value */}
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800 grid grid-cols-2 gap-2 text-center font-mono">
          <div>
            <span className="text-zinc-500 text-[9px] uppercase block">Damage Prevented</span>
            <span className="text-emerald-400 font-bold text-xs">{formatInr(fleetResult.estimatedAssetLossSavedInr)}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[9px] uppercase block">Downtime Saved</span>
            <span className="text-zinc-200 font-bold text-xs">{fleetResult.slaDelaySavedMin} mins</span>
          </div>
        </div>
      </div>

      {/* API Snippet Modal */}
      {isApiModalOpen && (
        <ApiSnippetModal
          origin={fleetOrigin}
          destination={fleetDestination}
          vehicleId={selectedVehicleId}
          onClose={() => setIsApiModalOpen(false)}
        />
      )}
    </div>
  );
}
