'use client';

import React from 'react';
import { useResQ } from '@/context/ResQContext';
import { RotateCcw } from 'lucide-react';

interface MapControlsProps {
  onResetView: () => void;
}

export function MapControls({ onResetView }: MapControlsProps) {
  const { filters, toggleFilter } = useResQ();

  return (
    <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 select-none pointer-events-auto text-[11px] font-sans">
      {/* Layer Filter Pills */}
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-md p-0.5 flex items-center gap-1 shadow-sm backdrop-blur-sm">
        {/* Toggle Floods */}
        <button
          onClick={() => toggleFilter('floodZones')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            filters.floodZones
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Hazards</span>
        </button>

        {/* Toggle SOS */}
        <button
          onClick={() => toggleFilter('sosPins')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            filters.sosPins
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Active Emergencies</span>
        </button>

        {/* Toggle Depots */}
        <button
          onClick={() => toggleFilter('depots')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            filters.depots
              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Depots</span>
        </button>

        {/* Toggle Routes */}
        <button
          onClick={() => toggleFilter('routes')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            filters.routes
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Routes</span>
        </button>
      </div>

      {/* Reset Center */}
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
