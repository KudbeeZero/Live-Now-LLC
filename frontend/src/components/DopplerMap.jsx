import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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

// Brightside Recovery royal blue
const BS_BLUE = '#003087';

// ZIP code → approximate center coordinates for NE Ohio demo ZIPs.
// Used to show the Proof of Presence pulse marker when a handoff is verified.
const ZIP_COORDS = {
  '44101': [41.4993, -81.6944],  // Cleveland
  '44102': [41.4820, -81.7350],  // Cleveland West
  '44107': [41.4820, -81.7982],  // Lakewood
  '44129': [41.3845, -81.7229],  // Parma
  '44132': [41.5931, -81.5268],  // Euclid
  '44302': [41.0814, -81.5190],  // Akron
  '44052': [41.4529, -82.1824],  // Lorain
  '44256': [41.1381, -81.8637],  // Medina
  '44060': [41.6731, -81.3498],  // Mentor
  '44077': [41.7209, -81.2404],  // Painesville
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
 * PulseMarker
 *
 * Renders an animated "pulse" DivIcon on the map at the given coordinates.
 * Used to show that a Proof of Presence handoff was recently verified in
 * the ZIP code at that location.
 */
function PulseMarker({ position, zipCode }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:40px;height:40px;">
          <span style="
            position:absolute;inset:0;
            border-radius:50%;
            background:#00A896;
            opacity:0.4;
            animation:pop-ping 1.2s cubic-bezier(0,0,0.2,1) infinite;
          "></span>
          <span style="
            position:absolute;inset:6px;
            border-radius:50%;
            background:#00A896;
            display:flex;align-items:center;justify-content:center;
            font-size:9px;font-weight:700;color:#fff;font-family:sans-serif;
          ">PoP</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker(position, { icon, zIndexOffset: 1000 });
    marker.bindPopup(
      `<div style="font-size:12px;font-weight:600;">
         Handoff Verified<br>
         <span style="color:#6b7280;font-weight:400;">ZIP ${zipCode}</span>
       </div>`
    );
    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [map, position, zipCode]);

  return null;
}

/**
 * AnchorMarker
 *
 * Renders a Brightside "Verified Anchor" pin using a royal blue teardrop divIcon.
 * Rendered above all regular provider pins (zIndexOffset: 2000).
 * Popup shows clinic name, address, phone, services, and Suboxone price snippet.
 */
function AnchorMarker({ location }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:34px;height:40px;">
          <div style="
            width:34px;height:34px;
            background:${BS_BLUE};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2.5px solid #fff;
            box-shadow:0 3px 8px rgba(0,0,40,0.45);
          "></div>
          <span style="
            position:absolute;top:4px;left:0;right:6px;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:11px;font-weight:900;
            font-family:system-ui,sans-serif;letter-spacing:-0.5px;
          ">BS</span>
        </div>
      `,
      iconSize:   [34, 40],
      iconAnchor: [17, 40],
    });

    const services = location.services ? location.services.join(' · ') : '';
    const marker = L.marker([location.lat, location.lng], { icon, zIndexOffset: 2000 });
    marker.bindPopup(`
      <div style="font-family:system-ui,sans-serif;min-width:180px;">
        <div style="background:${BS_BLUE};color:#fff;padding:7px 10px;margin:-12px -12px 8px;font-size:11px;font-weight:700;border-radius:4px 4px 0 0;">
          ★ BRIGHTSIDE ANCHOR
        </div>
        <p style="font-size:12px;font-weight:700;margin:0 0 3px;color:#111;">${location.name}</p>
        <p style="font-size:11px;color:#555;margin:0 0 3px;">${location.address ?? ''}</p>
        <p style="font-size:11px;color:${BS_BLUE};font-weight:600;margin:0 0 3px;">${location.phone ?? ''}</p>
        ${services ? `<p style="font-size:10px;color:#666;margin:0 0 5px;">${services}</p>` : ''}
        <p style="font-size:10px;color:#16a34a;font-weight:700;margin:0;">
          ✓ Medicaid &nbsp;|&nbsp; Suboxone <strong>$45.37</strong>/mo via Cost Plus
        </p>
      </div>
    `);
    marker.addTo(map);
    markerRef.current = marker;
    return () => { marker.remove(); };
  }, [map, location]);

  return null;
}

/**
 * DopplerMap
 *
 * Props:
 *   providers       — array of ProviderView objects from the backend (or mock data)
 *     { id, name, lat, lng, status: 'Live' | 'Offline' | 'Unknown' }
 *   anchorProviders — array of Brightside locations { id, name, lat, lng, address, phone, services }
 *                     rendered as royal-blue teardrop pins with highest z-index
 *   pulsingZips     — Set<string> of ZIP codes with a recently verified handoff
 *                     (shows animated PoP pulse markers)
 */
export function DopplerMap({ providers = [], anchorProviders = [], pulsingZips = new Set() }) {
  // Build list of ZIP coords to pulse, filtering to only known ZIPs
  const pulseMarkers = [...pulsingZips]
    .filter((zip) => ZIP_COORDS[zip])
    .map((zip) => ({ zip, coords: ZIP_COORDS[zip] }));

  return (
    <>
      {/* Keyframe for the pulse ring — injected once per render */}
      <style>{`
        @keyframes pop-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

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

          {/* Provider status markers */}
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

          {/* Brightside "Verified Anchor" pins — highest z-index, rendered last */}
          {anchorProviders.map((loc) => (
            <AnchorMarker key={loc.id} location={loc} />
          ))}

          {/* Proof of Presence pulse markers for recently verified handoff ZIPs */}
          {pulseMarkers.map(({ zip, coords }) => (
            <PulseMarker key={zip} position={coords} zipCode={zip} />
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="flex gap-4 justify-center py-2 bg-white border-t border-gray-100 text-xs text-gray-600 flex-wrap px-3">
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
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: '#00A896', opacity: 0.7 }}
            />
            Handoff Verified (PoP)
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm rotate-45"
              style={{ background: '#003087' }}
            />
            Brightside Anchor
          </span>
        </div>
      </div>
    </>
  );
}
