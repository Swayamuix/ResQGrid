'use client';

import React, { useState } from 'react';
import { Incident } from '@/types/resq';
import { 
  X, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Ship, 
  Volume2, 
  CheckCircle2, 
  Share2, 
  Radio, 
  Flame, 
  AlertTriangle,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

interface IncidentDrawerProps {
  incident: Incident;
  onClose: () => void;
}

export function IncidentDrawer({ incident, onClose }: IncidentDrawerProps) {
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'ta' | 'bn'>('hi');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  const langNames = {
    hi: 'हिंदी (Hindi)',
    en: 'English',
    ta: 'தமிழ் (Tamil)',
    bn: 'বাংলা (Bengali)',
  };

  const handlePlayVoiceAlert = () => {
    soundFx.playAgentStep('comms');
    setIsPlayingAudio(true);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 2800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(incident.vernacularAlerts[selectedLang]);
    setCopied(true);
    soundFx.playBlip();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-700/80 rounded-t-2xl shadow-[0_-15px_35px_rgba(0,0,0,0.8)] z-40 max-h-[82%] overflow-y-auto p-4 transition-all duration-300 animate-in slide-in-from-bottom">
      {/* Grab bar */}
      <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-950 text-red-400 border border-red-500/50 animate-pulse">
            {incident.severity} CRITICAL
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ID: {incident.id.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Location */}
      <div className="mt-3">
        <h3 className="font-bold text-slate-100 text-base leading-snug">
          {incident.title}
        </h3>
        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{incident.locationName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{incident.timestamp}</span>
        </p>
      </div>

      {/* Key Metric Pills */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Trapped</span>
          <span className="text-sm font-bold text-red-400">{incident.trappedCount} Souls</span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Flood Depth</span>
          <span className="text-sm font-bold text-amber-400">{incident.waterDepthFt} ft</span>
        </div>
        <div className="bg-slate-900/90 border border-cyan-900/60 rounded-xl p-2">
          <span className="text-[10px] text-cyan-400 block font-semibold uppercase">AI Confidence</span>
          <span className="text-sm font-bold text-cyan-300">{incident.verifiedConfidence}%</span>
        </div>
      </div>

      {/* Special Needs Tags */}
      {incident.specialNeeds && incident.specialNeeds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Flags:
          </span>
          {incident.specialNeeds.map((need, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-950/60 text-red-300 border border-red-800/50"
            >
              {need}
            </span>
          ))}
        </div>
      )}

      {/* Citizen Raw Distress Post */}
      <div className="mt-3.5 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="font-semibold text-slate-200">Raw Citizen SOS Feed</span>
          <span className="font-mono">Caller: {incident.citizenName} (+91-XX{incident.phoneLast4})</span>
        </div>
        <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          &quot;{incident.citizenMessage}&quot;
        </p>
      </div>

      {/* Assigned NDRF Unit & ETA */}
      {incident.assignedUnit && (
        <div className="mt-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Assigned Rescue Vessel
                </span>
                <h4 className="text-xs font-bold text-slate-100">
                  {incident.assignedUnit.name}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Lead: {incident.assignedUnit.teamLead}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">ETA</span>
              <span className="text-base font-black text-emerald-400 font-mono animate-pulse">
                {incident.assignedUnit.etaMinutes} MINS
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Radio className="w-3 h-3 text-cyan-400" />
              {incident.assignedUnit.contactFreq}
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Safe Bypass Active
            </span>
          </div>
        </div>
      )}

      {/* Multilingual Vernacular Citizen Alert Preview */}
      <div className="mt-3.5 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Vernacular Citizen SMS Broadcast
          </span>
          <div className="flex gap-1">
            {(['hi', 'en', 'ta', 'bn'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLang(lang);
                  soundFx.playBlip();
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase transition-colors ${
                  selectedLang === lang
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed">
          {incident.vernacularAlerts[selectedLang]}
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px]">
          <button
            onClick={handlePlayVoiceAlert}
            disabled={isPlayingAudio}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              isPlayingAudio
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isPlayingAudio ? 'Synthesizing Audio...' : 'Audio Broadcast'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Alert Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
