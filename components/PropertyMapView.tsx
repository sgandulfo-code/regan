
import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Info, ExternalLink, Home, Star, DollarSign, Maximize2, Crosshair, ChevronRight, Search, X, Loader2 } from 'lucide-react';
import { Property } from '../types';
import L from 'leaflet';

interface PropertyMapViewProps {
  properties: Property[];
  onSelectProperty: (p: Property) => void;
}

interface GeocodedProperty extends Property {
  lat: number;
  lng: number;
}

const PropertyMapView: React.FC<PropertyMapViewProps> = ({ properties, onSelectProperty }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<GeocodedProperty[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<GeocodedProperty | null>(null);

  // Icono Azul Personalizado (Indigo-600)
  const createBlueIcon = (isSelected: boolean) => L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-indigo-600/20 rounded-full animate-pulse ${isSelected ? 'scale-150' : 'scale-0'}"></div>
        <div class="relative w-8 h-10 flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125 -translate-y-2' : ''}">
          <svg viewBox="0 0 24 24" class="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.7C17.3 17.1 20 13.1 20 9.7C20 5.2 16.4 1.6 12 1.6C7.6 1.6 4 5.2 4 9.7C4 13.1 6.7 17.1 12 21.7Z" fill="#4f46e5" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="9.5" r="3" fill="white"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });

  // Efecto para geocodificar direcciones dinámicamente
  useEffect(() => {
    const geocodeAll = async () => {
      setIsGeocoding(true);
      const results: GeocodedProperty[] = [];
      
      for (const p of properties) {
        try {
          // Intentamos buscar por dirección exacta o normal
          const query = p.exactAddress || p.address;
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            results.push({ ...p, lat, lng });
          }
        } catch (error) {
          console.error(`Geocoding failed for ${p.title}:`, error);
        }
      }
      
      setGeocodedProperties(results);
      setIsGeocoding(false);
    };

    if (properties.length > 0) {
      geocodeAll();
    }
  }, [properties]);

  // Inicializar Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.4168, -3.7038], // Default Madrid
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Capa de Mapa Estilo "Clean / Positron"
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

  // Actualizar Marcadores cuando cambian las propiedades geocodificadas
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    geocodedProperties.forEach(p => {
      const isSelected = selectedProperty?.id === p.id;
      const marker = L.marker([p.lat, p.lng], {
        icon: createBlueIcon(isSelected)
      });

      marker.on('click', () => {
        setSelectedProperty(p);
        mapInstanceRef.current?.flyTo([p.lat, p.lng], 16, { duration: 1.5 });
      });

      marker.addTo(markersLayerRef.current!);
    });

    if (geocodedProperties.length > 0) {
      const bounds = markersLayerRef.current.getBounds();
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geocodedProperties, selectedProperty]);

  const handleSelectFromList = (p: GeocodedProperty) => {
    setSelectedProperty(p);
    mapInstanceRef.current?.flyTo([p.lat, p.lng], 17, { duration: 1 });
  };

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden h-[750px] animate-in fade-in zoom-in-95 duration-500 relative">
      {/* Sidebar Explorer */}
      <div className="w-full lg:w-96 border-r border-slate-100 flex flex-col h-full bg-slate-50/30">
        <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              BluePin Explorer
            </h3>
            {isGeocoding && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {geocodedProperties.length} Assets Mapped in this folder
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {geocodedProperties.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectFromList(p)}
              className={`w-full text-left p-5 rounded-[2.2rem] transition-all border group relative ${
                selectedProperty?.id === p.id 
                  ? 'bg-white border-indigo-500 shadow-xl ring-2 ring-indigo-50 scale-[1.02] z-10' 
                  : 'bg-transparent border-transparent hover:bg-white/50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                  selectedProperty?.id === p.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'
                }`}>
                  ${p.price.toLocaleString()}
                </span>
                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black">
                  <Star className={`w-3.5 h-3.5 ${p.rating >= 4 ? 'fill-current' : ''}`} />
                  {p.rating}.0
                </div>
              </div>
              <h4 className="font-black text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors">{p.title}</h4>
              <div className="flex items-center gap-2 mt-3 text-slate-400">
                <MapPin className="w-3 h-3 shrink-0" />
                <p className="text-[10px] font-bold truncate uppercase tracking-tight">{p.address}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {/* Map UI Overlay */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${selectedProperty ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {selectedProperty ? 'Proprietary Pin Selected' : 'Folder Overview'}
            </span>
          </div>
        </div>

        {/* Selected Property Card */}
        {selectedProperty && (
          <div className="absolute bottom-10 left-10 right-10 lg:left-auto lg:right-10 lg:w-[450px] z-[1000] animate-in slide-in-from-bottom-12 duration-700">
            <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white flex gap-6 items-center relative">
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-2xl ring-4 ring-white">
                <img src={selectedProperty.images[0]} className="w-full h-full object-cover" alt="" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Asset Highlight</p>
                <h4 className="font-black text-slate-900 text-xl leading-tight truncate tracking-tight">{selectedProperty.title}</h4>
                
                <div className="flex items-center gap-5 mt-3">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm font-black text-slate-900">${selectedProperty.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm font-black text-slate-900">{selectedProperty.sqft}m²</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button 
                    onClick={() => onSelectProperty(selectedProperty)}
                    className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5" /> Analysis
                  </button>
                  <a 
                    href={selectedProperty.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyMapView;