import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

/**
 * Northeast Ohio bounds — locked per CLAUDE.md § Map Bounds.
 * Users cannot pan outside this region.
 *   SW: [40.394, -82.758]  (south of Mansfield)
 *   NE: [42.327, -80.519]  (Lake Erie / PA border)
 */
const NE_OHIO_BOUNDS = [
  [40.394, -82.758],
  [42.327, -80.519],
];
const CLEVELAND_CENTER = [41.4993, -81.6944];
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 8;
const MAX_ZOOM = 15;

// Pin colours per status
const STATUS_STYLE = {
  Live:    { color: '#00A896', fillColor: '#00A896', label: 'LIVE' },
  Offline: { color: '#6B7280', fillColor: '#9CA3AF', label: 'Offline' },
  Unknown: { color: '#D97706', fillColor: '#FCD34D', label: 'Unknown' },
};

/** Enforces maxBounds after mount so users cannot pan outside NE Ohio. */
function BoundsEnforcer() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(NE_OHIO_BOUNDS);
    map.setMinZoom(MIN_ZOOM);
    map.setMaxZoom(MAX_ZOOM);
  }, [map]);
  return null;
}

/**
 * DopplerMap
 *
 * Props:
 *   providers — array of ProviderView objects from the backend (or mock data)
 *     { id, name, lat, lng, status: 'Live' | 'Offline' | 'Unknown' }
 */
export function DopplerMap({ providers = [] }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200" style={{ height: '480px' }}>
      <MapContainer
        center={CLEVELAND_CENTER}
        zoom={DEFAULT_ZOOM}
        bounds={NE_OHIO_BOUNDS}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        aria-label="Northeast Ohio MAT provider map"
      >
        <BoundsEnforcer />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {providers.map((p) => {
          const style = STATUS_STYLE[p.status] ?? STATUS_STYLE.Unknown;
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={12}
              pathOptions={{
                color:       style.color,
                fillColor:   style.fillColor,
                fillOpacity: 0.85,
                weight:      2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-navy mb-1">{p.name}</p>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="flex gap-4 justify-center py-2 bg-white border-t border-gray-100 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: STATUS_STYLE.Live.fillColor }} />
          Live (verified &lt;4h)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: STATUS_STYLE.Offline.fillColor }} />
          Offline
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: STATUS_STYLE.Unknown.fillColor }} />
          Unknown / Stale
        </span>
      </div>
    </div>
  );
}
