'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { 
  AlertOctagon, 
  MapPin, 
  Users, 
  Waves, 
  AlertTriangle, 
  Zap, 
  Phone, 
  User, 
  Navigation,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function CitizenSosView() {
  const { createCitizenSos, isSimulating, triggerSimulation } = useResQ();

  const [locationName, setLocationName] = useState('Mayur Vihar Extension, Gali No. 4');
  const [trappedCount, setTrappedCount] = useState<number>(4);
  const [waterDepthFt, setWaterDepthFt] = useState<number>(4.2);
  const [citizenName, setCitizenName] = useState('Ananya Sen');
  const [phone, setPhone] = useState('9810144920');
  const [citizenMessage, setCitizenMessage] = useState(
    'Water reached first floor balcony. Power cut since 3 hours. 4 people including an elderly heart patient. Need evacuation boat urgently.'
  );

  const [specialNeeds, setSpecialNeeds] = useState<string[]>([
    'Elderly (Heart Patient)',
    'Medical Emergency',
  ]);

  const availableNeeds = [
    'Infants / Babies',
    'Elderly (Heart Patient)',
    'Medical Emergency / Dialysis',
    'Low Phone Battery (<15%)',
    'Submerged Ground Floor',
    'Pet Animal Evacuation',
  ];

  const handleToggleNeed = (need: string) => {
    soundFx.playBlip();
    if (specialNeeds.includes(need)) {
      setSpecialNeeds(specialNeeds.filter((n) => n !== need));
    } else {
      setSpecialNeeds([...specialNeeds, need]);
    }
  };

  const handleGpsAutoDetect = () => {
    soundFx.playRadarPing();
    const mockGpsSpots = [
      'Kashmiri Gate Monastery Road #12',
      'ITO Power House Embankment Colony',
      'Geeta Colony Block 7 Pushta Road',
      'Sarita Vihar Pocket D Near Drain',
    ];
    const picked = mockGpsSpots[Math.floor(Math.random() * mockGpsSpots.length)];
    setLocationName(picked);
  };

  const handleSubmitSos = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCitizenSos({
      locationName,
      trappedCount,
      waterDepthFt,
      specialNeeds,
      citizenMessage,
      citizenName,
      phone,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-3 overflow-y-auto space-y-3 select-none">
      {/* Simulation Callout Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/50 rounded-2xl p-3.5 shadow-[0_0_20px_rgba(239,68,68,0.25)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">
              One-Click Swarm Simulator
            </h3>
            <p className="text-[11px] text-slate-300">
              Simulate an end-to-end multi-agent flood rescue workflow instantly.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => triggerSimulation()}
          disabled={isSimulating}
          className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating Pipeline...' : 'Simulate Random Flood SOS'}</span>
        </button>
      </div>

      {/* Citizen Distress Form */}
      <form onSubmit={handleSubmitSos} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-500/40">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Incoming Emergency Call
            </h2>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 112 Dispatched
          </span>
        </div>

        {/* Location with Auto GPS Button */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Accurate Location / Landmark
            </span>
            <button
              type="button"
              onClick={handleGpsAutoDetect}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" /> Auto GPS Locate
            </button>
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
            placeholder="Enter street, landmark, or house number..."
            className="w-full bg-slate-950 text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
        </div>

        {/* Headcount & Water Depth Level */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Trapped Victims Count */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-red-400" />
              Trapped Victims
            </label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.max(1, c - 1));
                }}
                className="w-7 h-7 rounded-lg bg-slate-900 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-sm text-slate-100 font-mono">
                {trappedCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.min(50, c + 1));
                }}
                className="w-7 h-7 rounded-lg bg-slate-900 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Water Depth Level */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-amber-400" />
                Water Depth
              </span>
              <span className="text-amber-400 font-bold font-mono text-[11px]">
                {waterDepthFt} ft
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={waterDepthFt}
              onChange={(e) => setWaterDepthFt(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-2.5"
            />
          </div>
        </div>

        {/* Special Vulnerabilities / Flags */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Special Vulnerability Tags (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {availableNeeds.map((need) => {
              const isChecked = specialNeeds.includes(need);
              return (
                <button
                  type="button"
                  key={need}
                  onClick={() => handleToggleNeed(need)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium text-left border transition-all ${
                    isChecked
                      ? 'bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {need}
                </button>
              );
            })}
          </div>
        </div>

        {/* Distress Remarks */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Distress Message / Situation Details:
          </label>
          <textarea
            value={citizenMessage}
            onChange={(e) => setCitizenMessage(e.target.value)}
            rows={2}
            required
            placeholder="Describe your current situation, floor level, battery status..."
            className="w-full bg-slate-950 text-slate-100 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-cyan-400" /> Full Name:
            </label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              required
              className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3 text-emerald-400" /> Phone:
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-slate-950 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>REQUEST RESCUE NOW</span>
        </button>
      </form>
    </div>
  );
}
