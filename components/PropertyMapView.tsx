
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Info, ExternalLink, Home, Star, Euro, Maximize2, Crosshair, ChevronRight } from 'lucide-react';
import { Property } from '../types';

interface PropertyMapViewProps {
  properties: Property[];
  onSelectProperty: (p: Property) => void;
}

const PropertyMapView: React.FC<PropertyMapViewProps> = ({ properties, onSelectProperty }) => {
  const [selectedPin, setSelectedPin] = useState<Property | null>(null);

  // Intentamos crear una vista general basada en las primeras direcciones si no hay nada seleccionado
  const getInitialViewQuery = () => {
    if (properties.length === 0) return "Madrid";
    // Tomamos hasta 3 direcciones para crear un área de búsqueda
    return properties.slice(0, 3).map(p => p.address).join(' OR ');
  };

  // Generamos la URL del mapa. 
  // Si hay selección: Zoom 18 (Calle). Si no: Zoom 13 (Ciudad/Barrio)
  const mapUrl = selectedPin 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedPin.exactAddress || selectedPin.address)}&t=&z=18&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(getInitialViewQuery())}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden h-[750px] animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar de Navegación del Mapa */}
      <div className="w-full lg:w-96 border-r border-slate-100 flex flex-col h-full bg-slate-50/30">
        <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              Explorer Hub
            </h3>
            <button 
              onClick={() => setSelectedPin(null)}
              className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
              title="Ver todos"
            >
              Reset View
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {properties.length} Active Assets in Area
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {properties.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase">No location data</p>
            </div>
          ) : (
            properties.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPin(p)}
                className={`w-full text-left p-5 rounded-[2rem] transition-all border group relative ${
                  selectedPin?.id === p.id 
                    ? 'bg-white border-indigo-500 shadow-xl ring-1 ring-indigo-50 scale-[1.02] z-10' 
                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    selectedPin?.id === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'
                  }`}>
                    €{p.price.toLocaleString()}
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
                {selectedPin?.id === p.id && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 animate-in slide-in-from-left-2">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área del Mapa Interactivo */}
      <div className="flex-1 relative bg-slate-200">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={mapUrl}
          className="grayscale-[0.1] contrast-[1.05]"
          title="Dynamic Property Map"
        />
        
        {/* Overlay de Control Flotante */}
        <div className="absolute top-6 left-6 z-20">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${selectedPin ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {selectedPin ? 'Focused on Asset' : 'Scanning Area'}
            </span>
          </div>
        </div>

        {/* Info Card de Propiedad Enfocada */}
        {selectedPin && (
          <div className="absolute bottom-10 left-10 right-10 lg:left-auto lg:right-10 lg:w-[450px] animate-in slide-in-from-bottom-12 duration-700">
            <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white flex gap-6 items-center">
              <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-2xl ring-4 ring-white">
                <img src={selectedPin.images[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Selected Property</p>
                  <button onClick={() => setSelectedPin(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><Maximize2 className="w-4 h-4" /></button>
                </div>
                <h4 className="font-black text-slate-900 text-xl leading-tight truncate tracking-tight">{selectedPin.title}</h4>
                
                <div className="flex items-center gap-5 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Euro className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm font-black text-slate-900">{(selectedPin.price / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-sm font-black text-slate-900">{selectedPin.sqft}m²</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button 
                    onClick={() => onSelectProperty(selectedPin)}
                    className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5" /> Full Analysis
                  </button>
                  <a 
                    href={selectedPin.url} 
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

        {/* Map Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white flex flex-col gap-1">
            <button className="p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-500 transition-all" title="My Location"><Crosshair className="w-5 h-5" /></button>
            <button 
              onClick={() => setSelectedPin(null)}
              className="p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-500 transition-all" 
              title="Global Search"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMapView;
