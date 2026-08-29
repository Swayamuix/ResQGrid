'use client';

import React from 'react';
import { useResQ, TabType } from '@/context/ResQContext';
import { MapPin, Cpu, Route, AlertOctagon, Sparkles } from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  highlight?: boolean;
}

export function BottomNav() {
  const { activeTab, setActiveTab, unreadSwarmCount, incidents } = useResQ();

  const activeSosCount = incidents.filter((i) => i.status !== 'rescued').length;

  const tabs: TabItem[] = [
    {
      id: 'map',
      label: 'Active Emergencies',
      sublabel: 'Hazard Map',
      icon: MapPin,
      badge: activeSosCount > 0 ? activeSosCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'swarm',
      label: 'AI Decision Log',
      sublabel: 'Live Pipeline',
      icon: Cpu,
      badge: unreadSwarmCount > 0 ? unreadSwarmCount : undefined,
      badgeColor: 'bg-cyan-500 text-slate-950 font-bold',
    },
    {
      id: 'fleet',
      label: 'Dispatch & Routes',
      sublabel: 'B2B Routing',
      icon: Route,
    },
    {
      id: 'sos',
      label: 'Request Rescue',
      sublabel: 'Citizen Portal',
      icon: AlertOctagon,
      highlight: true,
    },
  ];

  return (
    <nav className="w-full bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 z-30 select-none">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 group ${
                isActive
                  ? tab.highlight 
                    ? 'bg-red-950/50 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'bg-slate-900 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {/* Active Indicator Top Glow Bar */}
              {isActive && (
                <div 
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full ${
                    tab.highlight ? 'bg-red-400 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                  }`} 
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? (tab.highlight ? 'text-red-400' : 'text-cyan-400') : 'text-slate-400'
                }`} />

                {tab.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] rounded-full animate-bounce shadow-md ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}

                {tab.highlight && !isActive && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>

              {/* Text Labels */}
              <span className={`text-[11px] font-semibold mt-1 tracking-tight ${
                isActive ? (tab.highlight ? 'text-red-300' : 'text-cyan-300') : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
