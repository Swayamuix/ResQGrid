'use client';

import React, { useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { 
  AlertCircle, 
  MapPin, 
  Users, 
  Waves, 
  Play, 
  Navigation
} from 'lucide-react';
import { soundFx } from '@/utils/audio';

export function SosIntakeTab() {
  const { createCitizenSos, isSimulating, triggerSimulation } = useResQ();

  const [locationName, setLocationName] = useState('Mayur Vihar Extension, Pocket 4');
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
    'Medical Emergency',
    'Low Battery (<15%)',
    'Submerged Ground Floor',
    'Pet Evacuation',
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
    const mockSpots = [
      'Kashmiri Gate Monastery Road #12',
      'ITO Power House Embankment Colony',
      'Geeta Colony Block 7 Pushta Road',
      'Sarita Vihar Pocket D Near Drain',
    ];
    setLocationName(mockSpots[Math.floor(Math.random() * mockSpots.length)]);
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3.5 space-y-3.5 select-none text-xs font-sans">
      {/* Simulation Quick Trigger */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-zinc-200 text-xs block">
            Automated Swarm Simulator
          </span>
          <p className="text-[10px] text-zinc-400 font-mono">
            Execute 3-Agent pipeline against live DB
          </p>
        </div>
        <button
          type="button"
          onClick={() => triggerSimulation()}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-650 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors shrink-0 min-h-[38px]"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate SOS'}</span>
        </button>
      </div>

      {/* Distress Intake Form */}
      <form onSubmit={handleSubmitSos} className="space-y-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded">
        <div className="border-b border-zinc-800 pb-2">
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 block">
            Incoming Emergency Call
          </span>
        </div>

        {/* Location Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-zinc-300 font-medium">Location / Sector:</label>
            <button
              type="button"
              onClick={handleGpsAutoDetect}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1 min-h-[24px]"
            >
              <Navigation className="w-3 h-3 text-emerald-400" /> Auto Geocode
            </button>
          </div>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
            className="w-full bg-zinc-950 text-zinc-200 text-xs px-3 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 min-h-[38px]"
          />
        </div>

        {/* Headcount & Water Depth */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Headcount */}
          <div>
            <label className="text-[11px] text-zinc-300 font-medium block mb-1">Trapped Victims:</label>
            <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 h-[38px]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.max(1, c - 1));
                }}
                className="w-9 h-full text-zinc-400 hover:text-zinc-100 font-mono text-center font-bold text-sm"
              >
                -
              </button>
              <span className="flex-1 text-center font-mono font-bold text-zinc-200 text-xs">
                {trappedCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playBlip();
                  setTrappedCount((c) => Math.min(50, c + 1));
                }}
                className="w-9 h-full text-zinc-400 hover:text-zinc-100 font-mono text-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Water Depth */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-zinc-300 font-medium">Water Depth:</label>
              <span className="text-amber-400 font-mono text-xs font-bold">{waterDepthFt} ft</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.1"
              value={waterDepthFt}
              onChange={(e) => setWaterDepthFt(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-950 rounded appearance-none cursor-pointer accent-amber-500 mt-2.5"
            />
          </div>
        </div>

        {/* Vulnerability Tags */}
        <div>
          <label className="text-[11px] text-zinc-300 font-medium block mb-1.5">Vulnerability Flags:</label>
          <div className="grid grid-cols-2 gap-1.5">
            {availableNeeds.map((need) => {
              const isChecked = specialNeeds.includes(need);
              return (
                <button
                  type="button"
                  key={need}
                  onClick={() => handleToggleNeed(need)}
                  className={`px-2.5 py-2 rounded text-[10px] font-medium text-left border transition-colors min-h-[36px] ${
                    isChecked
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {need}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="text-[11px] text-zinc-300 font-medium block mb-1">Distress Remarks:</label>
          <textarea
            value={citizenMessage}
            onChange={(e) => setCitizenMessage(e.target.value)}
            rows={3}
            required
            className="w-full bg-zinc-950 text-zinc-200 text-xs p-2.5 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 font-sans leading-relaxed"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Caller Name:</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              required
              className="w-full bg-zinc-950 text-zinc-200 text-xs px-2.5 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 min-h-[38px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Contact Phone:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-zinc-950 text-zinc-200 text-xs px-2.5 py-2 rounded border border-zinc-800 focus:outline-none focus:border-zinc-600 font-mono min-h-[38px]"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSimulating}
          className="w-full py-3 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 border border-red-500 transition-colors shadow-xs min-h-[44px]"
        >
          Request Rescue
        </button>
      </form>
    </div>
  );
}
