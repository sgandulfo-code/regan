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
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false 
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    const markersLayer = markersRef.current;

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

      for (let i = 0; i < properties.length; i++) {
        const p = properties[i];
        let lat = p.lat;
        let lng = p.lng;

        // If no coordinates, try to geocode
        if ((!lat || !lng) && (p.exactAddress || p.address)) {
          try {
            const query = p.exactAddress || p.address;
            const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query || '')}&limit=1`);
            const data = await resp.json();
            if (data.features && data.features.length > 0) {
              [lng, lat] = data.features[0].geometry.coordinates;
            }
          } catch (e) {
            console.error("Geocoding error:", e);
          }
        }

        if (lat && lng) {
          L.marker([lat, lng], { icon: createIcon(i) }).addTo(markersLayer);
          bounds.extend([lat, lng]);
          hasMarkers = true;
        }
      }

      if (hasMarkers) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView([40.4168, -3.7038], 13); // Default fallback
      }
      
      // Invalidate size to ensure correct rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    plotProperties();

    return () => {
      // Cleanup if needed
    };
  }, [properties]);

  return (
    <div className="w-full rounded-[2rem] overflow-hidden relative z-0 border border-slate-100 shadow-sm print:border-slate-300" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default PropertyMap;
