'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { AgentLog, AgentType } from '@/types/resq';
import { LogDetailModal } from './LogDetailModal';
import { Search, Code2 } from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function AgentAuditLogTab() {
  const { agentLogs } = useResQ();
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

  const getAgentColor = (agent: AgentType) => {
    switch (agent) {
      case 'scout':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'logistics':
        return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'comms':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-850';
    }
  };

  const handleInspect = (log: AgentLog) => {
    soundFx.playBlip();
    setInspectingLog(log);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none text-xs font-sans">
      {/* Search & Filter Header */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
        {/* Agent Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(['all', 'scout', 'logistics', 'comms'] as const).map((agent) => (
            <button
              key={agent}
              onClick={() => {
                soundFx.playBlip();
                setSelectedAgent(agent);
              }}
              className={`px-3 py-1.5 rounded text-[11px] font-mono uppercase font-semibold transition-colors min-h-[32px] shrink-0 ${
                selectedAgent === agent
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search autonomous logs or payload hashes..."
            className="w-full bg-zinc-900 text-zinc-200 text-xs pl-8 pr-2.5 py-1.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 transition-colors font-sans placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Logs Table / List with generous mobile touch targets */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-850">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs font-mono">
            No matching agent logs found.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => handleInspect(log)}
              className="p-3 hover:bg-zinc-900/60 active:bg-zinc-850 cursor-pointer transition-colors space-y-1.5 min-h-[48px]"
            >
              <div className="flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${getAgentColor(log.agent)}`}>
                    {log.agent}
                  </span>
                  {log.stepNumber && (
                    <span className="text-zinc-500">Step {log.stepNumber}/3</span>
                  )}
                </div>
                <span className="text-zinc-500">{log.timestamp} UTC</span>
              </div>

              <p className="text-zinc-200 font-medium text-xs leading-snug">
                {log.message}
              </p>

              {log.detail && (
                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2 font-sans">
                  {log.detail}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                <span className="truncate max-w-[220px]">
                  {log.payload ? `payload: ${Object.keys(log.payload).join(', ')}` : 'status: OK'}
                </span>
                <span className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Inspect
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Inspector */}
      {inspectingLog && (
        <LogDetailModal
          log={inspectingLog}
          onClose={() => setInspectingLog(null)}
        />
      )}
    </div>
  );
}
