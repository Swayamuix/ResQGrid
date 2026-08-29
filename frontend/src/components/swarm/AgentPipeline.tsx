'use client';

import React from 'react';
import { Eye, Compass, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { useResQ } from '@/context/ResQContext';

export function AgentPipeline() {
  const { isSimulating } = useResQ();

  const stages = [
    {
      step: 1,
      name: 'Scout Agent',
      action: 'Incoming Emergency Call',
      icon: Eye,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/40',
      glow: 'shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    },
    {
      step: 2,
      name: 'Logistics Agent',
      action: 'Safe Evacuation Path Found',
      icon: Compass,
      color: 'text-purple-400',
      border: 'border-purple-500/40',
      bg: 'bg-purple-950/40',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    },
    {
      step: 3,
      name: 'Comms Agent',
      action: 'Vernacular SMS',
      icon: Send,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 shadow-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Autonomous Pipeline Architecture
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
          {isSimulating ? 'EXECUTING PIPELINE' : 'SWARM READY'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className={`relative flex flex-col items-center p-2 rounded-xl border ${stage.border} ${stage.bg} ${stage.glow} transition-all duration-300`}
            >
              {/* Step indicator badge */}
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-950 border border-slate-700 text-[9px] font-bold text-slate-300 flex items-center justify-center">
                {stage.step}
              </span>

              <div className={`p-1.5 rounded-lg bg-slate-950/80 mb-1 ${stage.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-bold leading-none ${stage.color}`}>
                {stage.name}
              </span>
              <span className="text-[9px] text-slate-400 mt-1 font-medium text-center leading-tight">
                {stage.action}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
