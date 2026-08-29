'use client';

import React from 'react';
import { useResQ, TabType } from '@/context/ResQContext';
import { IncidentsTab } from './IncidentsTab';
import { AgentAuditLogTab } from './AgentAuditLogTab';
import { FleetRoutingTab } from './FleetRoutingTab';
import { SosIntakeTab } from './SosIntakeTab';
import { soundFx } from '@/utils/audio';

export function OperationsSidebar() {
  const { activeTab, setActiveTab, incidents, unreadSwarmCount } = useResQ();

  const activeIncidents = incidents.filter((i) => i.status !== 'rescued').length;

  const tabs: { id: TabType; label: string; badge?: number; badgeColor?: string }[] = [
    {
      id: 'incidents',
      label: 'Active Emergencies',
      badge: activeIncidents > 0 ? activeIncidents : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'swarm',
      label: 'AI Decision Log',
      badge: unreadSwarmCount > 0 ? unreadSwarmCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    {
      id: 'fleet',
      label: 'Dispatch & Routes',
    },
    {
      id: 'sos',
      label: 'Request Rescue',
    },
  ];

  // If on desktop and activeTab is 'map', display the 'incidents' tab inside the sidebar
  const currentTab = activeTab === 'map' ? 'incidents' : activeTab;

  return (
    <aside className="w-full md:w-[390px] lg:w-[430px] bg-zinc-950 border-l border-zinc-800 flex flex-col h-full overflow-hidden select-none text-xs font-sans">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950 p-1 gap-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playBlip();
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                isActive
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

      {/* Operations Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'incidents' && <IncidentsTab />}
        {currentTab === 'swarm' && <AgentAuditLogTab />}
        {currentTab === 'fleet' && <FleetRoutingTab />}
        {currentTab === 'sos' && <SosIntakeTab />}
      </div>
    </aside>
  );
}
