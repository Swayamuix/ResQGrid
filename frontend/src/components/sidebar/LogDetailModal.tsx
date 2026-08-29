'use client';

import React, { useState } from 'react';
import { AgentLog } from '@/types/resq';
import { X, Copy, Check } from 'lucide-react';
import { soundFx } from '@/utils/audio';

interface LogDetailModalProps {
  log: AgentLog;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    soundFx.playBlip();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] text-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
              {log.agent}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              TELEMETRY #{log.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 overflow-y-auto space-y-3">
          <div>
            <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
              Action Summary
            </span>
            <p className="text-zinc-100 font-medium text-xs">
              {log.message}
            </p>
          </div>

          {log.detail && (
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block mb-0.5">
                Execution Detail
              </span>
              <p className="text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 leading-relaxed font-sans text-xs">
                {log.detail}
              </p>
            </div>
          )}

          {log.payload && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">
                  Structured Payload (JSON)
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-x-auto border border-zinc-800 leading-normal">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>{log.timestamp} UTC</span>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
