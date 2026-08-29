'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';
import { soundFx } from '@/utils/audio';

interface ApiSnippetModalProps {
  onClose: () => void;
  origin: string;
  destination: string;
  vehicleId: string;
}

export function ApiSnippetModal({ onClose, origin, destination, vehicleId }: ApiSnippetModalProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST https://api.resqgrid.ai/v1/fleet/hazard-routing \\
  -H "Authorization: Bearer resq_live_99a8b72c1f" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": "${origin}",
    "destination": "${destination}",
    "vehicle_type": "${vehicleId}",
    "bathymetric_avoidance": true,
    "max_allowed_water_depth_ft": 0.8
  }'`,
    python: `import requests

url = "https://api.resqgrid.ai/v1/fleet/hazard-routing"
headers = {
    "Authorization": "Bearer resq_live_99a8b72c1f",
    "Content-Type": "application/json"
}
payload = {
    "origin": "${origin}",
    "destination": "${destination}",
    "vehicle_type": "${vehicleId}",
    "bathymetric_avoidance": True,
    "max_allowed_water_depth_ft": 0.8
}

response = requests.post(url, json=payload, headers=headers)
safe_route = response.json()
print("Safe Corridor Distance:", safe_route["distance_km"])
print("Hydrolock Prevention Value:", safe_route["asset_damage_prevented_inr"])`,
    node: `import { ResQGridClient } from '@resqgrid/sdk';

const resq = new ResQGridClient({
  apiKey: process.env.RESQGRID_API_KEY,
});

const route = await resq.fleet.calculateHazardImmuneRoute({
  origin: "${origin}",
  destination: "${destination}",
  vehicleType: "${vehicleId}",
  bathymetricAvoidance: true,
});

console.log("Safe Route Coordinates:", route.waypoints);
console.log("Flood Risk Score:", route.riskScore);`,
  };

  const handleCopy = () => {
    soundFx.playBlip();
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh] text-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-zinc-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-xs">
                Hazard Intelligence API
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                POST /v1/fleet/hazard-routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-3.5 pt-2 bg-zinc-950 border-b border-zinc-800">
          <div className="flex gap-1">
            {(['curl', 'python', 'node'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  soundFx.playBlip();
                }}
                className={`px-2.5 py-1 rounded-t text-xs font-mono font-medium uppercase transition-colors border-t border-x ${
                  activeTab === tab
                    ? 'bg-zinc-900 text-zinc-100 border-zinc-700 border-b-zinc-900 -mb-px'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {tab === 'node' ? 'TypeScript / Node' : tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 mb-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-3.5 bg-zinc-900 overflow-y-auto flex-1 font-mono text-xs text-zinc-300 leading-relaxed">
          <pre className="text-zinc-200 font-mono whitespace-pre-wrap">
            {snippets[activeTab]}
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>99.99% Availability SLA</span>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
