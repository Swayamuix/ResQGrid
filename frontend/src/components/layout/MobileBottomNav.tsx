'use client';

import React from 'react';
import { useResQ, TabType } from '@/context/ResQContext';
import { 
  Map as MapIcon, 
  AlertCircle, 
  Terminal, 
  Route, 
  PlusCircle 
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function MobileBottomNav() {
  const { activeTab, setActiveTab, incidents, unreadSwarmCount } = useResQ();

  const activeIncidents = incidents.filter((i) => i.status !== 'rescued').length;

  const items: { id: TabType; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    {
      id: 'map',
      label: 'Map',
      icon: MapIcon,
    },
    {
      id: 'incidents',
      label: 'Active Emergencies',
      icon: AlertCircle,
      badge: activeIncidents > 0 ? activeIncidents : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'swarm',
      label: 'AI Decision Log',
      icon: Terminal,
      badge: unreadSwarmCount > 0 ? unreadSwarmCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    {
      id: 'fleet',
      label: 'Dispatch & Routes',
      icon: Route,
    },
    {
      id: 'sos',
      label: 'Request Rescue',
      icon: PlusCircle,
    },
  ];

  return (
    <nav className="md:hidden h-14 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around px-1 z-40 select-none safe-area-inset-bottom">
      {items.map((item) => {
        const isStrictActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              soundFx.playBlip();
              setActiveTab(item.id);
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[48px] transition-colors relative ${
              isStrictActive
                ? 'text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {/* Top Indicator Line */}
            {isStrictActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zinc-400 rounded-full" />
            )}

            {/* Icon + Badge */}
            <div className="relative">
              <Icon className={`w-4 h-4 ${isStrictActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
              {item.badge !== undefined && (
                <span className={`absolute -top-1.5 -right-3 px-1 rounded-sm text-[8px] font-mono font-bold leading-tight ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] ${isStrictActive ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
