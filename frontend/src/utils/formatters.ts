export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
}

export function getWaterDepthColor(depthFt: number): string {
  if (depthFt >= 4.0) return 'text-red-400 bg-red-950/70 border-red-500/50';
  if (depthFt >= 2.5) return 'text-amber-400 bg-amber-950/70 border-amber-500/50';
  return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50';
}
