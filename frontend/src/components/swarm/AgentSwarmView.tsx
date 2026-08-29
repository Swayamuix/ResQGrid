'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { AgentLog, AgentType } from '@/types/resq';
import { AgentPipeline } from './AgentPipeline';
import { LogDetailModal } from './LogDetailModal';
import { 
  Eye, 
  Compass, 
  Send, 
  Terminal, 
  Filter, 
  Search, 
  Zap, 
  Code2, 
  Clock, 
  Activity,
  Layers
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function AgentSwarmView() {
  const { agentLogs, isSimulating, triggerSimulation } = useResQ();
  const [selectedAgent, setSelectedAgent] = useState<'all' | AgentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingLog, setInspectingLog] = useState<AgentLog | null>(null);

  const filteredLogs = agentLogs.filter((log) => {
    const matchAgent = selectedAgent === 'all' || log.agent === selectedAgent;
    const matchSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchAgent && matchSearch;
  });

  const getAgentBadge = (agent: AgentType) => {
    switch (agent) {
      case 'scout':
        return {
          label: 'Scout Agent',
          badgeClass: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]',
          dotClass: 'bg-cyan-400',
          icon: Eye,
        };
      case 'logistics':
        return {
          label: 'Logistics Agent',
          badgeClass: 'bg-purple-950/80 text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
          dotClass: 'bg-purple-400',
          icon: Compass,
        };
      case 'comms':
        return {
          label: 'Comms Agent',
          badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
          dotClass: 'bg-emerald-400',
          icon: Send,
        };
      default:
        return {
          label: 'System Core',
          badgeClass: 'bg-slate-900 text-slate-400 border-slate-700',
          dotClass: 'bg-slate-400',
          icon: Terminal,
        };
    }
  };

  const handleInspect = (log: AgentLog) => {
    soundFx.playBlip();
    setInspectingLog(log);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-3 overflow-y-auto space-y-3 select-none">
      {/* Header & Agent Swarm Pipeline Overview */}
      <AgentPipeline />

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Agent Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {(['all', 'scout', 'logistics', 'comms'] as const).map((agent) => (
              <button
                key={agent}
                onClick={() => {
                  setSelectedAgent(agent);
                  soundFx.playBlip();
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all ${
                  selectedAgent === agent
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {agent === 'all' ? 'All Logs' : agent}
              </button>
            ))}
          </div>

          {/* Quick Simulation Trigger */}
          <button
            onClick={() => triggerSimulation()}
            disabled={isSimulating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold shrink-0 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            <Zap className="w-3 h-3 text-red-400" />
            <span className="text-[11px]">{isSimulating ? 'Simulating...' : 'Simulate Feed'}</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search autonomous logs, coordinates, or payload hashes..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition-colors placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Logs Stream Container */}
      <div className="flex-1 space-y-2 pb-6">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-cyan-400" />
            Live Execution Feed ({filteredLogs.length})
          </span>
          <span className="font-mono text-slate-500">Auto-Refreshed</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
            No matching agent activity found.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getAgentBadge(log.agent);
            const Icon = badge.icon;

            return (
              <div
                key={log.id}
                onClick={() => handleInspect(log)}
                className={`p-3 rounded-xl border bg-slate-900/90 border-slate-800/90 hover:border-slate-700 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md ${
                  log.isNew ? 'ring-1 ring-cyan-500/50 bg-cyan-950/20' : ''
                }`}
              >
                {/* Top metadata line */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.badgeClass}`}>
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    {log.stepNumber && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Step {log.stepNumber}/3
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {log.timestamp}
                  </span>
                </div>

                {/* Primary message */}
                <p className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-relaxed">
                  {log.message}
                </p>

                {/* Secondary detail */}
                {log.detail && (
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {log.detail}
                  </p>
                )}

                {/* Footer preview */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span className="font-mono truncate max-w-[200px]">
                    Payload: {log.payload ? Object.keys(log.payload).join(', ') : 'OK'}
                  </span>
                  <span className="text-cyan-400 font-medium group-hover:underline flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> Inspect Telemetry
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Detail Modal */}
      {inspectingLog && (
        <LogDetailModal
          log={inspectingLog}
          onClose={() => setInspectingLog(null)}
        />
      )}
    </div>
  );
}
