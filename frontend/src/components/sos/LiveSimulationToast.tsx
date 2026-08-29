'use client';

import React from 'react';
import { useResQ } from '@/context/ResQContext';
import { AlertCircle, Eye, Compass, Send, CheckCircle2, X } from 'lucide-react';

export function LiveSimulationToast() {
  const { toasts, removeToast } = useResQ();

  if (toasts.length === 0) return null;

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'sos':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'scout':
        return <Eye className="w-3.5 h-3.5 text-sky-400" />;
      case 'logistics':
        return <Compass className="w-3.5 h-3.5 text-purple-400" />;
      case 'comms':
        return <Send className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm px-2 pointer-events-none flex flex-col gap-1.5 font-sans select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-2 p-2.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs shadow-md"
        >
          <div className="mt-0.5 shrink-0">{getToastIcon(toast.type)}</div>
          <div className="flex-1">
            <h5 className="font-semibold text-zinc-100 text-[11px] leading-tight font-mono uppercase">
              {toast.title}
            </h5>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              {toast.desc}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-zinc-300 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
