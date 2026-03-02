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
  properties: { lat?: number; lng?: number; title?: string }[];
  height?: string;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, height = '500px' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already exists, just update markers? 
    // For simplicity in reports, we can destroy and recreate or just init once.
    // Since properties might change, let's handle init carefully.
    
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false // Static map for report
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;
    
    // Clear existing markers if any (though usually this component mounts once)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const validProps = properties.filter(p => p.lat && p.lng);
    
    if (validProps.length > 0) {
      const markers = validProps.map((p, idx) => {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #4F46E5; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${idx + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        return L.marker([p.lat!, p.lng!], { icon }).addTo(map);
      });

      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
      // Default view if no props
      map.setView([40.4168, -3.7038], 13);
    }

    // CRITICAL FIX: Invalidate size after mount to ensure map renders correctly in modal
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // We don't necessarily need to destroy the map on unmount if the ref persists, 
      // but for safety in React:
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties]);

  return (
    <div className="w-full rounded-[2rem] overflow-hidden relative z-0 border border-slate-100 shadow-sm print:border-slate-300" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default PropertyMap;
