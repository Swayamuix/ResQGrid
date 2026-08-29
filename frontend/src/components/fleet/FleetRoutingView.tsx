'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { FLEET_VEHICLES } from '@/data/initialData';
import { FLEET_ORIGINS, FLEET_DESTINATIONS } from '@/data/mockGenerator';
import { ApiSnippetModal } from './ApiSnippetModal';
import { formatInr } from '@/utils/formatters';
import { 
  Truck, 
  Bike, 
  Car, 
  ShieldAlert, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Code, 
  Sparkles, 
  DollarSign,
  Clock,
  Waves,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function FleetRoutingView() {
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
          className: 'bg-red-950/80 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.35)] animate-pulse',
        };
      case 'WARNING':
        return {
          label: 'ELEVATED FLOOD WARNING',
          className: 'bg-amber-950/80 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        };
      default:
        return {
          label: 'SAFE HIGH-GROUND CORRIDOR',
          className: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
        };
    }
  };

  const riskBadge = getRiskBadge(fleetResult.riskLevel);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-3 overflow-y-auto space-y-3 select-none">
      {/* Top Banner: B2B Commercial Product Intro */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/60 border border-purple-500/30 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
              B2B Enterprise
            </span>
            <h2 className="text-xs font-bold text-slate-100">
              Dispatch & Routes API
            </h2>
          </div>
          <button
            onClick={() => {
              soundFx.playBlip();
              setIsApiModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>API Docs</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
          Real-time bathymetric flood elevation routing for commercial delivery fleets, e-commerce, and emergency logistics.
        </p>
      </div>

      {/* Origin & Destination Pickers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Dispatch Route Matrix
        </span>

        {/* Origin */}
        <div>
          <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Origin Logistics Hub:
          </label>
          <select
            value={fleetOrigin}
            onChange={(e) => {
              soundFx.playBlip();
              setFleetOrigin(e.target.value);
            }}
            className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition-colors"
          >
            {FLEET_ORIGINS.map((orig) => (
              <option key={orig} value={orig}>
                {orig}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Destination Delivery Hub:
          </label>
          <select
            value={fleetDestination}
            onChange={(e) => {
              soundFx.playBlip();
              setFleetDestination(e.target.value);
            }}
            className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition-colors"
          >
            {FLEET_DESTINATIONS.map((dest) => (
              <option key={dest} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Archetype Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Vehicle Archetype & Ground Clearance
        </span>
        <div className="grid grid-cols-2 gap-2">
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
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    vehicle.hydroLockRisk === 'Extreme' ? 'bg-red-950 text-red-400' :
                    vehicle.hydroLockRisk === 'High' ? 'bg-amber-950 text-amber-400' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {vehicle.waterClearanceFt}ft limit
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-100 leading-tight">
                  {vehicle.shortName}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Payload: {vehicle.cargoCapacityKg} kg
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk Assessment Scorecard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Real-Time Threat Level
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${riskBadge.className}`}>
            {riskBadge.label}
          </span>
        </div>

        {/* Warning Callout for Standard Route */}
        {fleetResult.riskLevel !== 'SAFE' ? (
          <div className="bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl flex items-start gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-200">
                Standard GPS Route is SUBMERGED ({fleetResult.maxFloodDepthEncounteredFt}ft water depth).
              </p>
              <p className="text-[11px] text-red-400/90 mt-0.5">
                Exceeds {fleetResult.vehicle.shortName} safe clearance ({fleetResult.vehicle.waterClearanceFt}ft). High likelihood of engine hydro-lock failure.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl flex items-start gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">
                High-Ground Elevated Corridor Verified Safe.
              </p>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Vehicle water clearance ({fleetResult.vehicle.waterClearanceFt}ft) safely navigates this route.
              </p>
            </div>
          </div>
        )}

        {/* Route Comparison Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Standard Flooded Route */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-red-900/40">
            <span className="text-[10px] text-red-400 font-bold uppercase block mb-1">
              Standard GPS Route
            </span>
            <div className="text-slate-200 space-y-1 text-[11px]">
              <p>Distance: <strong className="text-slate-100">{fleetResult.standardRouteKm} km</strong></p>
              <p>Nominal ETA: <strong className="text-slate-100">{fleetResult.standardRouteMin} mins</strong></p>
              <p className="text-red-400 font-semibold">⚠️ 2 Submerged Chokepoints</p>
              <p className="text-red-400 font-semibold">❌ Hydro-Lock Catastrophe</p>
            </div>
          </div>

          {/* ResQGrid Safe Corridor */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
              ResQGrid Safe Corridor
            </span>
            <div className="text-slate-200 space-y-1 text-[11px]">
              <p>Distance: <strong className="text-emerald-300">{fleetResult.safeRouteKm} km</strong></p>
              <p>Real ETA: <strong className="text-emerald-300">{fleetResult.safeRouteMin} mins</strong></p>
              <p className="text-emerald-400 font-semibold">🛡️ 100% Dry Elevation</p>
              <p className="text-cyan-400 font-semibold">⚡ SLA Compliant</p>
            </div>
          </div>
        </div>

        {/* Financial & Operational Value Generated */}
        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1.5">
            B2B Commercial Value Generated
          </span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Asset Damage Avoided</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {formatInr(fleetResult.estimatedAssetLossSavedInr)}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Stranded Delay Prevented</span>
              <span className="text-sm font-black text-cyan-400 font-mono">
                {fleetResult.slaDelaySavedMin} mins
              </span>
            </div>
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
