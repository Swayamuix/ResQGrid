'use client';

import React from 'react';
import { useResQ } from '@/context/ResQContext';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { LiveSimulationToast } from '../sos/LiveSimulationToast';
import { Wifi, BatteryMedium, Shield } from 'lucide-react';

export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { viewMode } = useResQ();

  if (viewMode === 'expanded') {
    // Full width Command Center view for big screens
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
        <Header />
        <main className="flex-1 relative flex flex-col overflow-hidden">
          {children}
        </main>
        <BottomNav />
        <LiveSimulationToast />
      </div>
    );
  }

  // Mobile First Phone Frame view
  return (
    <div className="min-h-screen bg-[#020617] bg-tactical-grid flex items-center justify-center p-0 md:p-6 overflow-hidden">
      {/* Background ambient lighting effects on desktop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
      </div>

      {/* Smartphone Chassis Container */}
      <div className="w-full h-screen md:h-[880px] md:max-w-[430px] bg-slate-950 md:rounded-[44px] md:border-[10px] md:border-slate-800/90 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] flex flex-col relative overflow-hidden ring-1 ring-white/10">
        {/* Dynamic Island / Mobile Phone Notch on Desktop */}
        <div className="hidden md:flex items-center justify-between px-7 pt-3 pb-1 bg-slate-950 text-[11px] text-slate-400 select-none z-40 border-b border-slate-900/50">
          <span className="font-semibold text-slate-200">22:04</span>
          <div className="w-24 h-4 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] font-mono text-cyan-400">ResQ-AI</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Shield className="w-3 h-3 text-emerald-400" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Global Header */}
        <Header />

        {/* Dynamic Tab Screen Body */}
        <main className="flex-1 relative flex flex-col overflow-hidden bg-slate-950">
          {children}
        </main>

        {/* Bottom Tab Bar */}
        <BottomNav />

        {/* Floating Toast Notification Stack */}
        <LiveSimulationToast />

        {/* Home Indicator Bar for iPhone style */}
        <div className="hidden md:flex justify-center pb-1.5 pt-1 bg-slate-950">
          <div className="w-32 h-1 bg-slate-700/80 rounded-full" />
        </div>
      </div>
    </div>
  );
}
