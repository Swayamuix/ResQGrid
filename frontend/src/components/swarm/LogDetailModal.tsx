'use client';

import React from 'react';
import { AgentLog } from '@/types/resq';
import { X, Code2, Copy, Check } from 'lucide-react';
import { soundFx } from '@/utils/audio';

interface LogDetailModalProps {
  log: AgentLog;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    soundFx.playBlip();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAgentColor = () => {
    switch (log.agent) {
      case 'scout':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/60';
      case 'logistics':
        return 'text-purple-400 border-purple-500/40 bg-purple-950/60';
      case 'comms':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-900';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getAgentColor()}`}>
              {log.agent} Agent
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Telemetry #{log.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 font-sans text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Execution Message
            </span>
            <p className="text-slate-100 font-semibold text-sm mt-0.5">
              {log.message}
            </p>
          </div>

          {log.detail && (
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Autonomous Rationale
              </span>
              <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-0.5 leading-relaxed">
                {log.detail}
              </p>
            </div>
          )}

          {/* JSON Payload */}
          {log.payload && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Structured Decision Payload (JSON)
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-normal">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Timestamp: {log.timestamp} IST</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
