
import React, { useState } from 'react';
import { MapPin, Navigation, Info, ExternalLink, Home, Star, Euro } from 'lucide-react';
import { Property } from '../types';

interface PropertyMapViewProps {
  properties: Property[];
  onSelectProperty: (p: Property) => void;
}

const PropertyMapView: React.FC<PropertyMapViewProps> = ({ properties, onSelectProperty }) => {
  const [selectedPin, setSelectedPin] = useState<Property | null>(properties[0] || null);

  // Generamos una URL de Google Maps para el iframe basada en la dirección
  // Si no hay propiedad seleccionada, mostramos un mapa general
  const mapUrl = selectedPin 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedPin.exactAddress || selectedPin.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=Madrid&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden h-[700px] animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar de Propiedades en el Mapa */}
      <div className="w-full lg:w-80 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Navigation className="w-4 h-4 text-indigo-600" />
            Exploration Hub
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{properties.length} Properties in this area</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {properties.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPin(p)}
              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                selectedPin?.id === p.id 
                  ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50' 
                  : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                  selectedPin?.id === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  €{p.price.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                  <Star className="w-3 h-3 fill-current" />
                  {p.rating}
                </div>
              </div>
              <h4 className="font-bold text-slate-800 text-sm truncate">{p.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {p.address}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Área del Mapa */}
      <div className="flex-1 relative bg-slate-100">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          className="grayscale-[0.2] opacity-90 contrast-[1.1]"
        />
        
        {/* Overlay Info Card (Bottom) */}
        {selectedPin && (
          <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-8 lg:w-96 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white flex gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                <img src={selectedPin.images[0]} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{selectedPin.title}</h4>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Euro className="w-3 h-3 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">{(selectedPin.price / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">{selectedPin.sqft}m²</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => onSelectProperty(selectedPin)}
                    className="flex-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Open Sheet
                  </button>
                  <a 
                    href={selectedPin.url} 
                    target="_blank" 
                    className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-xl border border-white flex flex-col gap-1">
            <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"><Navigation className="w-5 h-5" /></button>
            <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"><Info className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMapView;
