'use client';

import React, { useState, useEffect } from 'react';
import { useResQ } from '@/context/ResQContext';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Radio, 
  Layers, 
  AlertCircle, 
  Cpu, 
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ isSidebarOpen = true, onToggleSidebar }: HeaderProps) {
  const { 
    incidents, 
    floodZones, 
    reliefUnits, 
    isMuted, 
    toggleMute, 
    isSimulating, 
    triggerSimulation 
  } = useResQ();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().slice(11, 19));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'rescued').length;
  const p1Count = incidents.filter((i) => i.severity === 'P1' && i.status !== 'rescued').length;

  return (
    <header className="h-11 bg-zinc-950 border-b border-zinc-800 px-3.5 flex items-center justify-between z-30 select-none text-xs font-sans">
      {/* Left: Brand & Status Indicator */}
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

        {/* Live SSE / Satellite Uplink Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>LIVE UPLINK</span>
        </div>
      </div>

      {/* Center: System Telemetry Stat Pills */}
      <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          <span className="text-zinc-500">ACTIVE EMERGENCIES:</span>
          <span className={p1Count > 0 ? "text-red-400 font-bold" : "text-zinc-200"}>
            {activeIncidents} {p1Count > 0 && `(${p1Count} P1)`}
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

        <div className="text-zinc-500 text-[11px] px-1">
          {currentTime || '00:00:00'} UTC
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Quick Simulation Trigger */}
        <button
          onClick={() => triggerSimulation()}
          disabled={isSimulating}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
            isSimulating
              ? 'bg-zinc-900 text-zinc-400 border-zinc-800 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white border-zinc-800 hover:border-zinc-700'
          }`}
          title="Trigger automated flood incident simulation"
        >
          <Play className={`w-3 h-3 ${isSimulating ? 'text-zinc-500 animate-spin' : 'text-emerald-400 fill-emerald-400'}`} />
          <span>{isSimulating ? 'Executing Pipeline...' : 'Simulate Event'}</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleMute}
          className="p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar Toggle Button (if provided) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            title={isSidebarOpen ? 'Collapse Operations Panel' : 'Expand Operations Panel'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </header>
  );
}
