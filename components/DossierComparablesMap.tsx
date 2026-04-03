import React, { useEffect, useState, useRef } from 'react';
import { Property, ValuationComparable } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DossierComparablesMapProps {
  subjectProperty: Property;
  comparables: ValuationComparable[];
  allProperties: Property[];
}

interface GeocodedProperty extends Property {
  lat: number;
  lng: number;
  type: 'subject' | 'active' | 'sold';
  geocodeFailed?: boolean;
}

const DossierComparablesMap: React.FC<DossierComparablesMapProps> = ({ subjectProperty, comparables, allProperties }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Custom Icons
  const createIcon = (type: 'subject' | 'active' | 'sold', index?: number) => {
    let color = '#94a3b8'; // default
    if (type === 'subject') color = '#4f46e5'; // indigo-600
    else if (type === 'sold') color = '#10b981'; // emerald-500
    else if (type === 'active') color = '#f59e0b'; // amber-500

    const text = type === 'subject' ? '★' : (index !== undefined ? index + 1 : '');

    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center" style="width: 32px; height: 40px;">
          <div class="absolute w-8 h-8 rounded-full animate-pulse scale-150" style="background-color: ${color}33; transition: transform 0.3s ease;"></div>
          <div class="relative w-8 h-10 flex items-center justify-center transition-all duration-300 hover:scale-125 hover:-translate-y-2">
            <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.7C17.3 17.1 20 13.1 20 9.7C20 5.2 16.4 1.6 12 1.6C7.6 1.6 4 5.2 4 9.7C4 13.1 6.7 17.1 12 21.7Z" fill="${color}" stroke="white" stroke-width="2"/>
              <text x="12" y="11" fill="white" font-size="8" font-weight="900" text-anchor="middle" font-family="Inter, sans-serif">${text}</text>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
    });
  };

  // Geocoding
  useEffect(() => {
    const geocodeAll = async () => {
      setIsGeocoding(true);
      
      const propsToGeocode = [
        { ...subjectProperty, type: 'subject' as const },
        ...comparables.map(c => {
          const p = allProperties.find(prop => prop.id === c.propertyId);
          return p ? { ...p, type: c.type } : null;
        }).filter(Boolean) as (Property & { type: 'active' | 'sold' })[]
      ];

      const promises = propsToGeocode.map(async (p) => {
        try {
          const query = p.exactAddress || p.address;
          if (!query) return { ...p, lat: 0, lng: 0, geocodeFailed: true };

          let data;
          try {
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
            data = await response.json();
          } catch (e) {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
            const nomData = await response.json();
            if (nomData && nomData.length > 0) {
              data = { features: [{ geometry: { coordinates: [parseFloat(nomData[0].lon), parseFloat(nomData[0].lat)] } }] };
            }
          }
          
          if (data && data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              return { ...p, lat, lng };
            }
          }
          return { ...p, lat: 0, lng: 0, geocodeFailed: true };
        } catch (error) {
          return { ...p, lat: 0, lng: 0, geocodeFailed: true };
        }
      });

      const results = await Promise.all(promises);
      setGeocodedProperties(results as GeocodedProperty[]);
      setIsGeocoding(false);
    };

    geocodeAll();
  }, [subjectProperty, comparables, allProperties]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.4168, -3.7038], 
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    markersLayerRef.current = L.featureGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || geocodedProperties.length === 0) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const validProps = geocodedProperties.filter(p => !p.geocodeFailed);

    let compIndex = 0;
    validProps.forEach((p) => {
      const isSubject = p.type === 'subject';
      const index = isSubject ? undefined : compIndex++;
      
      const marker = L.marker([p.lat, p.lng], { 
        icon: createIcon(p.type, index)
      });

      const popupContent = `
        <div class="p-3 min-w-[200px] font-sans">
          <div class="w-full h-24 mb-3 rounded-xl overflow-hidden">
            <img src="${p.images[0]}" class="w-full h-full object-cover" />
          </div>
          <div class="text-[9px] font-black uppercase tracking-widest ${
            p.type === 'subject' ? 'text-indigo-600' : p.type === 'sold' ? 'text-emerald-500' : 'text-amber-500'
          } mb-1">
            ${p.type === 'subject' ? 'Tu Propiedad' : p.type === 'sold' ? 'Vendido' : 'En Venta'}
          </div>
          <h3 class="font-bold text-slate-800 text-sm leading-tight mb-1">${p.title}</h3>
          <p class="text-xs text-slate-500 mb-2 truncate">${p.address}</p>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span class="font-black text-slate-800">${p.currency === 'ARS' ? '$' : 'U$S'} ${p.price.toLocaleString()}</span>
            <span class="text-xs font-bold text-slate-400">${p.coveredSqft || p.sqft} m²</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        closeButton: false,
        minWidth: 200
      });

      marker.addTo(layer);
    });

    if (validProps.length > 0) {
      mapInstanceRef.current.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }
  }, [geocodedProperties]);

  return (
    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm">
      {isGeocoding && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ubicando propiedades...</span>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        .custom-popup .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DossierComparablesMap;
