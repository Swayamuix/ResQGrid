'use client';

import React, { useState } from 'react';
import { ResQProvider, useResQ } from '@/context/ResQContext';
import { Header } from '@/components/layout/Header';
import { HazardMap } from '@/components/map/HazardMap';
import { OperationsSidebar } from '@/components/sidebar/OperationsSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { IncidentsTab } from '@/components/sidebar/IncidentsTab';
import { AgentAuditLogTab } from '@/components/sidebar/AgentAuditLogTab';
import { FleetRoutingTab } from '@/components/sidebar/FleetRoutingTab';
import { SosIntakeTab } from '@/components/sidebar/SosIntakeTab';
import { LiveSimulationToast } from '@/components/sos/LiveSimulationToast';

function OperationsDashboard() {
  const { activeTab } = useResQ();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Operations Header */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} 
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP VIEW (md: and above) -> Fixed Split-Pane Layout */}
        <div className="hidden md:flex flex-1 h-full overflow-hidden">
          {/* Main Canvas: Unobstructed Leaflet Map */}
          <main className="flex-1 h-full relative overflow-hidden bg-zinc-950">
            <HazardMap />
          </main>

          {/* Right Operations Sidebar */}
          {isSidebarOpen && <OperationsSidebar />}
        </div>

        {/* MOBILE VIEW (< md: / < 768px) -> Full-Width Stacked Single Screen */}
        <div className="flex md:hidden flex-1 h-full overflow-hidden flex-col bg-zinc-950">
          {activeTab === 'map' && (
            <main className="flex-1 h-full relative overflow-hidden bg-zinc-950">
              <HazardMap />
            </main>
          )}
          {activeTab === 'incidents' && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950">
              <IncidentsTab />
            </div>
          )}
          {activeTab === 'swarm' && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950">
              <AgentAuditLogTab />
            </div>
          )}
          {activeTab === 'fleet' && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950">
              <FleetRoutingTab />
            </div>
          )}
          {activeTab === 'sos' && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950">
              <SosIntakeTab />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Hidden on Desktop) */}
      <MobileBottomNav />

      {/* Subtle Toast Notifications */}
      <LiveSimulationToast />
    </div>
  );
}

export default function Home() {
  return (
    <ResQProvider>
      <OperationsDashboard />
    </ResQProvider>
  );
}
