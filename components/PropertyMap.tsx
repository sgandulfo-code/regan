import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { geocodePropertyList, DEFAULT_MAP_CENTER } from '../services/geocodingService';

interface PropertyMapProps {
  properties: { id: string; lat?: number; lng?: number; title?: string; address?: string; exactAddress?: string }[];
  height?: string;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, height = '500px' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false 
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; StreetMap',
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    const markersLayer = markersRef.current;

    let isMounted = true;

    const plotProperties = async () => {
      if (!markersLayer) return;
      markersLayer.clearLayers();

      const bounds = L.latLngBounds([]);
      let hasMarkers = false;

      const createIcon = (index: number) => L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #4F46E5; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${index + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      try {
        const geocoded = await geocodePropertyList(properties);
        if (!isMounted) return;

        geocoded.forEach((p, i) => {
          if (!p.geocodeFailed && p.lat && p.lng && (p.lat !== 0 || p.lng !== 0)) {
            L.marker([p.lat, p.lng], { icon: createIcon(i) }).addTo(markersLayer);
            bounds.extend([p.lat, p.lng]);
            hasMarkers = true;
          }
        });

        if (hasMarkers && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else {
          map.setView(DEFAULT_MAP_CENTER, 12);
        }
      } catch (err) {
        console.error("PropertyMap plotting error:", err);
        map.setView(DEFAULT_MAP_CENTER, 12);
      }

      // Invalidate size to ensure correct rendering without grey patches
      setTimeout(() => {
        if (isMounted) map.invalidateSize();
      }, 200);
      setTimeout(() => {
        if (isMounted) map.invalidateSize();
      }, 500);
    };

    plotProperties();

    return () => {
      isMounted = false;
    };
  }, [properties]);

  return (
    <div className="w-full rounded-[2rem] overflow-hidden relative z-0 border border-slate-100 shadow-sm print:border-slate-300" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default PropertyMap;
