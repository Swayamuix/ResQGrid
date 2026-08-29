'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { Incident } from '@/types/resq';
import { 
  AlertCircle, 
  MapPin, 
  Users, 
  Radio, 
  X, 
  Copy, 
  Check,
  Navigation
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function IncidentsTab() {
  const { incidents, selectedIncident, setSelectedIncident, setActiveTab } = useResQ();
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'ta' | 'bn'>('hi');
  const [copied, setCopied] = useState(false);

  const handleSelect = (inc: Incident) => {
    soundFx.playBlip();
    setSelectedIncident(inc);
  };

  const handleViewOnMap = (inc: Incident) => {
    soundFx.playRadarPing();
    setSelectedIncident(inc);
    setActiveTab('map');
  };

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
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-zinc-950 border-b border-zinc-800 font-mono text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
        <div className="col-span-3">EMERGENCY</div>
        <div className="col-span-5 md:col-span-4">LOCATION</div>
        <div className="col-span-2 text-center">TRAPPED</div>
        <div className="col-span-2 md:col-span-3 text-right">STATUS</div>
      </div>

      {/* Incidents Scrollable List with 44px+ touch targets on mobile */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-850">
        {incidents.map((inc) => {
          const isSelected = selectedIncident?.id === inc.id;

          return (
            <div
              key={inc.id}
              onClick={() => handleSelect(inc)}
              className={`grid grid-cols-12 gap-1 px-3 py-3 md:py-2.5 items-center cursor-pointer transition-colors min-h-[44px] ${
                isSelected 
                  ? 'bg-zinc-900 border-l-2 border-red-500 text-zinc-100' 
                  : 'hover:bg-zinc-900/60 active:bg-zinc-850 text-zinc-300'
              }`}
            >
              {/* ID & Priority */}
              <div className="col-span-3 flex items-center gap-1.5 font-mono text-[11px]">
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${getSeverityBadge(inc.severity)}`}>
                  {inc.severity}
                </span>
                <span className="font-semibold">{inc.id}</span>
              </div>

              {/* Location Name */}
              <div className="col-span-5 md:col-span-4 truncate text-[11px] font-medium text-zinc-200">
                {inc.locationName.split(',')[0]}
              </div>

              {/* Trapped Count & Depth */}
              <div className="col-span-2 text-center font-mono text-[11px]">
                <span className="text-red-400 font-semibold">{inc.trappedCount}p</span>
                <span className="text-zinc-500 text-[10px] block">{inc.waterDepthFt}ft</span>
              </div>

              {/* Status Badge */}
              <div className="col-span-2 md:col-span-3 text-right flex items-center justify-end gap-1 font-mono text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  inc.status === 'dispatched' ? 'bg-emerald-500' :
                  inc.status === 'verified' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-zinc-400 uppercase truncate">{inc.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Incident Detail Drawer */}
      {selectedIncident && (
        <div className="bg-zinc-900 border-t border-zinc-800 p-3.5 max-h-[52%] overflow-y-auto space-y-2.5 shadow-lg">
          {/* Top Bar */}
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
                onClick={() => handleViewOnMap(selectedIncident)}
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

          {/* Coordinates & Location */}
          <div className="font-mono text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-1">
            <span className="text-zinc-200 font-sans font-medium truncate max-w-[220px]">
              {selectedIncident.locationName}
            </span>
            <span>
              {selectedIncident.lat.toFixed(4)}°N, {selectedIncident.lng.toFixed(4)}°E
            </span>
          </div>

          {/* Citizen Raw Distress Remarks */}
          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[11px] text-zinc-300 italic leading-relaxed">
            &quot;{selectedIncident.citizenMessage}&quot;
          </div>

          {/* Assigned Unit */}
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

          {/* Multilingual Alerts Switcher */}
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
                    className={`min-w-[32px] py-1 rounded uppercase font-semibold transition-colors ${
                      selectedLang === l 
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
