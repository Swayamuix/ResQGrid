'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useResQ } from '@/context/ResQContext';
import { MAP_CENTER, DEFAULT_ZOOM } from '@/data/initialData';
import { MapControls } from './MapControls';
import { soundFx } from '@/utils/audio';

export function HazardMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{
    floods: any;
    depots: any;
    relief: any;
    sos: any;
    routes: any;
  }>({
    floods: null,
    depots: null,
    relief: null,
    sos: null,
    routes: null,
  });

  const {
    incidents,
    selectedIncident,
    setSelectedIncident,
    floodZones,
    rescueDepots,
    reliefUnits,
    routes,
    filters,
  } = useResQ();

  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) {
        return;
      }

      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Fail-safe: Guard L.latLng globally against NaN to prevent uncaught animation lifecycle exceptions
      if (!(L as any).__latLngGuarded) {
        const origLatLng = L.latLng;
        (L as any).latLng = function(a: any, b?: any, c?: any) {
          try {
            if (a === undefined || a === null) {
              return origLatLng(28.6280, 77.2450);
            }
            if (Array.isArray(a)) {
              const lat = Number(a[0]);
              const lng = Number(a[1]);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            } else if (typeof a === 'object' && ('lat' in a || 'latitude' in a)) {
              const lat = Number(a.lat ?? a.latitude);
              const lng = Number(a.lng ?? a.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            } else if (b !== undefined) {
              const lat = Number(a);
              const lng = Number(b);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return origLatLng(28.6280, 77.2450);
              }
            }
            return origLatLng.apply(this, arguments as any);
          } catch {
            return origLatLng(28.6280, 77.2450);
          }
        };
        (L as any).__latLngGuarded = true;
      }

      const defaultCenter: [number, number] = [28.6280, 77.2450];
      const rawLat = Number(MAP_CENTER?.[0] ?? defaultCenter[0]);
      const rawLng = Number(MAP_CENTER?.[1] ?? defaultCenter[1]);
      const safeCenter: [number, number] = (Number.isFinite(rawLat) && Number.isFinite(rawLng))
        ? [rawLat, rawLng]
        : defaultCenter;

      const map = L.map(mapContainerRef.current, {
        center: safeCenter,
        zoom: Number.isFinite(DEFAULT_ZOOM) ? DEFAULT_ZOOM : 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Add CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom Control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Layer Groups
      const floodGroup = L.layerGroup().addTo(map);
      const depotGroup = L.layerGroup().addTo(map);
      const reliefGroup = L.layerGroup().addTo(map);
      const sosGroup = L.layerGroup().addTo(map);
      const routeGroup = L.layerGroup().addTo(map);

      layersRef.current = {
        floods: floodGroup,
        depots: depotGroup,
        relief: reliefGroup,
        sos: sosGroup,
        routes: routeGroup,
      };

      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Responsive container observer to keep Leaflet dimensions synced
  useEffect(() => {
    if (!mapInstanceRef.current || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch {}
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isMapReady]);

  // Update Layers when State changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    async function updateLayers() {
      const L = (await import('leaflet')).default;
      const { floods, depots, relief, sos, routes: routeGroup } = layersRef.current;

      // 1. FLOOD HAZARDS (Polygons)
      floods.clearLayers();
      if (filters.floodZones && Array.isArray(floodZones)) {
        floodZones
          .filter((zone) => Array.isArray(zone?.polygon))
          .forEach((zone) => {
            const validPolygon: [number, number][] = zone.polygon
              .map(([lat, lng]): [number, number] => [Number(lat), Number(lng)])
              .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

            if (validPolygon.length < 3) return;

            try {
              const polygon = L.polygon(validPolygon, {
                color: '#f59e0b',
                weight: 1.5,
                dashArray: '4, 4',
                fillColor: '#b45309',
                fillOpacity: 0.25,
              });

              polygon.bindPopup(`
                <div class="text-xs font-sans p-1">
                  <div class="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span class="uppercase text-[10px] tracking-wider">Flood Hazard Zone</span>
                  </div>
                  <p class="font-semibold text-zinc-100 text-xs mb-0.5">${zone.name}</p>
                  <p class="text-zinc-400 text-[11px] mb-2">${zone.submergedRoad}</p>
                  <div class="grid grid-cols-2 gap-2 text-center bg-zinc-900 p-1.5 rounded border border-zinc-800 font-mono text-[11px]">
                    <div>
                      <span class="text-[10px] text-zinc-500 block">DEPTH</span>
                      <span class="font-bold text-amber-400">${zone.waterLevelFt} FT</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-zinc-500 block">CURRENT</span>
                      <span class="font-bold text-zinc-200">${zone.velocityMs} m/s</span>
                    </div>
                  </div>
                </div>
              `);

              floods.addLayer(polygon);
            } catch (err) {
              console.warn('Failed to add flood polygon safely:', err);
            }
          });
      }

      // 2. RESCUE DEPOTS
      depots.clearLayers();
      if (filters.depots && Array.isArray(rescueDepots)) {
        rescueDepots
          .filter((depot) => {
            const lat = Number((depot as any)?.lat ?? (depot as any)?.latitude);
            const lng = Number((depot as any)?.lng ?? (depot as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((depot) => {
            const lat = Number((depot as any).lat ?? (depot as any).latitude);
            const lng = Number((depot as any).lng ?? (depot as any).longitude);

            try {
              const icon = L.divIcon({
                className: 'custom-depot-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-blue-500/50 text-blue-400 text-[10px] font-mono font-semibold shadow-sm cursor-pointer hover:bg-zinc-850">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>${depot.name.slice(0, 10)}</span>
                    <span class="text-zinc-400">(${depot.boatCount}B)</span>
                  </div>
                `,
                iconSize: [110, 24],
                iconAnchor: [55, 12],
              });

              const marker = L.marker([lat, lng], { icon });
              marker.bindPopup(`
                <div class="text-xs font-sans p-1">
                  <span class="text-blue-400 font-bold text-[10px] uppercase tracking-wider">NDRF Staging Base</span>
                  <h4 class="font-semibold text-zinc-100 text-xs mt-0.5">${depot.name}</h4>
                  <div class="mt-2 text-[11px] text-zinc-300 space-y-1 bg-zinc-900 p-2 rounded border border-zinc-800 font-mono">
                    <p>🚤 Ready Boats: <strong class="text-blue-400">${depot.boatCount}</strong></p>
                    <p>👥 Responders: <strong class="text-zinc-200">${depot.personnelCount}</strong></p>
                    <p>⚡ Readiness: <strong class="text-emerald-400">${depot.readinessPercent}%</strong></p>
                  </div>
                </div>
              `);
              depots.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add depot marker safely:', err);
            }
          });
      }

      // 3. RELIEF FLEET UNITS
      relief.clearLayers();
      if (Array.isArray(reliefUnits)) {
        reliefUnits
          .filter((unit) => {
            const lat = Number((unit as any)?.lat ?? (unit as any)?.latitude);
            const lng = Number((unit as any)?.lng ?? (unit as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((unit) => {
            const lat = Number((unit as any).lat ?? (unit as any).latitude);
            const lng = Number((unit as any).lng ?? (unit as any).longitude);

            try {
              const icon = L.divIcon({
                className: 'custom-relief-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono font-semibold shadow-sm cursor-pointer hover:bg-zinc-850">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>${unit.name.slice(0, 14)}</span>
                  </div>
                `,
                iconSize: [110, 24],
                iconAnchor: [55, 12],
              });

              const marker = L.marker([lat, lng], { icon });
              marker.bindPopup(`
                <div class="text-xs p-1">
                  <span class="text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">Rescue Unit</span>
                  <h4 class="font-semibold text-zinc-100 mt-0.5">${unit.name}</h4>
                  <p class="text-zinc-400 text-[11px]">Status: <span class="text-emerald-400 font-mono">${unit.status.toUpperCase()}</span></p>
                  <p class="text-zinc-400 text-[11px]">Battery / Fuel: <span class="text-zinc-200 font-mono">${unit.batteryOrFuel}%</span></p>
                </div>
              `);
              relief.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add relief marker safely:', err);
            }
          });
      }

      // 4. SOS INCIDENT MARKERS
      sos.clearLayers();
      if (filters.sosPins && Array.isArray(incidents)) {
        incidents
          .filter((incident) => {
            const lat = Number((incident as any)?.lat ?? (incident as any)?.latitude);
            const lng = Number((incident as any)?.lng ?? (incident as any)?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          })
          .forEach((incident) => {
            const lat = Number((incident as any).lat ?? (incident as any).latitude);
            const lng = Number((incident as any).lng ?? (incident as any).longitude);

            try {
              const isSelected = selectedIncident?.id === incident.id;
              const isP1 = incident.severity === 'P1';

              const icon = L.divIcon({
                className: 'custom-sos-icon',
                html: `
                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded ${
                    isSelected 
                      ? 'bg-red-500 text-white font-bold ring-2 ring-white/50' 
                      : isP1 
                      ? 'bg-zinc-900 border border-red-500/60 text-red-400 font-semibold' 
                      : 'bg-zinc-900 border border-amber-500/60 text-amber-400 font-semibold'
                  } text-[10px] font-mono shadow-sm cursor-pointer transition-colors">
                    <span class="w-1.5 h-1.5 rounded-full ${isP1 ? 'bg-red-500' : 'bg-amber-500'}"></span>
                    <span>${incident.severity}</span>
                    <span class="text-zinc-400 font-normal">| ${incident.trappedCount}p</span>
                  </div>
                `,
                iconSize: [60, 22],
                iconAnchor: [30, 11],
              });

              const marker = L.marker([lat, lng], { icon });
              marker.on('click', () => {
                soundFx.playRadarPing();
                setSelectedIncident(incident);
              });
              sos.addLayer(marker);
            } catch (err) {
              console.warn('Failed to add incident marker safely:', err);
            }
          });
      }

      // 5. ROUTE POLYLINES
      routeGroup.clearLayers();
      if (filters.routes && selectedIncident?.routeId && routes && routes[selectedIncident.routeId]) {
        const activeRoute = routes[selectedIncident.routeId];

        // Blocked Road (Dashed Red Line)
        const validBlocked: [number, number][] = (activeRoute.blockedCoordinates || [])
          .map(([lat, lng]): [number, number] => [Number(lat), Number(lng)])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (validBlocked.length >= 2) {
          try {
            const blockedPolyline = L.polyline(validBlocked, {
              color: '#ef4444',
              weight: 2.5,
              dashArray: '5, 5',
              opacity: 0.8,
            });
            blockedPolyline.bindPopup(`
              <div class="text-xs p-1 font-sans">
                <span class="text-red-400 font-semibold text-[10px] uppercase">Blocked Road Segment</span>
                <p class="text-zinc-300 text-[11px] mt-1">${activeRoute.bypassReason}</p>
              </div>
            `);
            routeGroup.addLayer(blockedPolyline);
          } catch (err) {
            console.warn('Failed to add blocked polyline safely:', err);
          }
        }

        // Safe Elevated Corridor (Solid Emerald Green Line)
        const validSafe: [number, number][] = (activeRoute.safeCoordinates || [])
          .map(([lat, lng]): [number, number] => [Number(lat), Number(lng)])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

        if (validSafe.length >= 2) {
          try {
            const safePolyline = L.polyline(validSafe, {
              color: '#10b981',
              weight: 3.5,
              opacity: 0.95,
            });

            safePolyline.bindPopup(`
              <div class="text-xs p-1 font-sans">
                <span class="text-emerald-400 font-semibold text-[10px] uppercase">Calculated Safe Corridor</span>
                <p class="text-zinc-300 text-[11px] mt-1 font-mono">${activeRoute.distanceKm} km • ETA: ${activeRoute.etaMin}m</p>
              </div>
            `);
            routeGroup.addLayer(safePolyline);
          } catch (err) {
            console.warn('Failed to add safe polyline safely:', err);
          }
        }
      }
    }

    updateLayers();
  }, [
    isMapReady,
    incidents,
    selectedIncident,
    floodZones,
    rescueDepots,
    reliefUnits,
    routes,
    filters,
    setSelectedIncident,
  ]);

  // Pan to selected incident
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncident) return;
    const lat = Number((selectedIncident as any).lat ?? (selectedIncident as any).latitude);
    const lng = Number((selectedIncident as any).lng ?? (selectedIncident as any).longitude);
    
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const map = mapInstanceRef.current;
      try {
        const size = map.getSize();
        if (size && size.x > 0 && size.y > 0) {
          map.flyTo([lat, lng], 14, { duration: 1 });
        } else {
          map.setView([lat, lng], 14, { animate: false });
        }
      } catch (e) {
        try {
          map.setView([lat, lng], 14, { animate: false });
        } catch {}
      }
    }
  }, [selectedIncident]);

  const handleResetView = () => {
    soundFx.playBlip();
    if (mapInstanceRef.current) {
      try {
        const centerLat = Number(MAP_CENTER?.[0] ?? 28.6280);
        const centerLng = Number(MAP_CENTER?.[1] ?? 77.2450);
        if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
          const size = mapInstanceRef.current.getSize();
          if (size && size.x > 0 && size.y > 0) {
            mapInstanceRef.current.flyTo([centerLat, centerLng], DEFAULT_ZOOM, { duration: 0.6 });
          } else {
            mapInstanceRef.current.setView([centerLat, centerLng], DEFAULT_ZOOM, { animate: false });
          }
        }
      } catch (e) {
        console.warn("resetView failed safely:", e);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex-1 bg-zinc-950 overflow-hidden select-none">
      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Layer Controls (Top Right) */}
      <MapControls onResetView={handleResetView} />

      {/* Compact Flat Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-zinc-950/90 border border-zinc-800 px-2.5 py-1.5 rounded-md shadow-sm pointer-events-none text-[11px] font-sans flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          <span className="text-zinc-300 text-[10px]">Safe Bypass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-red-500" />
          <span className="text-zinc-400 text-[10px]">Submerged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500/40 border border-amber-500/70" />
          <span className="text-amber-300 text-[10px]">Flood Zone</span>
        </div>
      </div>
    </div>
  );
}
