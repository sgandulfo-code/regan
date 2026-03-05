import React from 'react';
import { Property, PropertyStatus } from '../types';
import { ICONS } from '../constants';
import { ShieldCheck, MapPin, Building, User, Phone, ExternalLink, Calendar, CheckSquare, Square } from 'lucide-react';

interface SharedPropertyRowProps {
  property: Property;
  index: number;
  onSelect: (p: Property) => void;
  onCompare: (id: string) => void;
  isCompared: boolean;
  onRequestVisit: (p: Property) => void;
}

const SharedPropertyRow: React.FC<SharedPropertyRowProps> = ({ 
  property, 
  index, 
  onSelect, 
  onCompare, 
  isCompared, 
  onRequestVisit 
}) => {
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.VISITED: return 'bg-green-100 text-green-700';
      case PropertyStatus.CONTACTED: return 'bg-blue-100 text-blue-700';
      case PropertyStatus.DISCARDED: return 'bg-red-100 text-red-700';
      case PropertyStatus.OFFERED: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renoTotal = property.renovationCosts?.reduce((acc, curr) => acc + curr.estimatedCost, 0) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col md:flex-row gap-4 items-center hover:shadow-md transition-all group">
      {/* Image & Index */}
      <div className="relative w-full md:w-40 h-32 md:h-24 shrink-0 rounded-xl overflow-hidden group-hover:brightness-110 transition-all cursor-pointer" onClick={() => onSelect(property)}>
        <div className="absolute top-2 left-2 z-10 bg-slate-900/80 text-white w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px] backdrop-blur-sm">
            {(index + 1).toString().padStart(2, '0')}
        </div>
        <img 
          src={property.images[0]} 
          alt={property.title}
          className="w-full h-full object-cover"
        />
         {property.acquisitionReason && (
            <div className="absolute bottom-1 left-1 right-1">
             <span className="bg-slate-900/80 backdrop-blur text-white px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider border border-white/10 block text-center truncate">
               {property.acquisitionReason}
             </span>
            </div>
          )}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 w-full">
        <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm md:text-base text-slate-800 truncate pr-2 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onSelect(property)} title={property.title}>{property.title}</h3>
             <a href={property.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
            </a>
        </div>
        
        <div className="flex items-center gap-2 mb-2 text-slate-500">
          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
          <p className="text-[9px] font-black uppercase tracking-widest truncate">{property.address}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
             <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 text-slate-600">
              {ICONS.Star} {property.rating}
            </span>
            {property.fees && property.fees > 0 && (
                <span className="flex items-center gap-1 text-[8px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> ${property.fees}
                </span>
            )}
        </div>

        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><span className="font-black text-slate-700">{property.environments}</span> Amb</span>
            <span className="w-px h-2.5 bg-slate-200"></span>
            <span className="flex items-center gap-1"><span className="font-black text-slate-700">{property.coveredSqft || property.sqft}</span> m²</span>
            <span className="w-px h-2.5 bg-slate-200"></span>
            <span className="flex items-center gap-1"><span className="font-black text-slate-700">{property.parking || 0}</span> Coch</span>
             <span className="w-px h-2.5 bg-slate-200"></span>
             <span className="flex items-center gap-1"><span className="font-black text-slate-700">${Math.round(property.price / property.sqft).toLocaleString()}</span>/m²</span>
        </div>
      </div>

      {/* Agency & Agent (Hidden on small screens if needed, or compact) */}
      {(property.realEstateAgency || property.agentName) && (
        <div className="hidden xl:flex flex-col gap-1.5 w-32 shrink-0 border-l border-slate-100 pl-4">
            {property.realEstateAgency && (
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                <p className="text-[8px] font-bold uppercase tracking-wide truncate" title={property.realEstateAgency}>
                  {property.realEstateAgency}
                </p>
              </div>
            )}
            {(property.agentName || property.agentWhatsapp) && (
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3 h-3 text-indigo-400 shrink-0" />
                <p className="text-[8px] font-bold uppercase tracking-wide truncate" title={property.agentName}>
                    {property.agentName || 'Agente'}
                </p>
                 {property.agentWhatsapp && (
                  <a 
                    href={`https://wa.me/${property.agentWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:text-emerald-600 transition-colors ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
        </div>
      )}

      {/* Price & Actions */}
      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
        <div className="text-left md:text-right">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total</p>
            <p className="text-base font-black text-slate-900 leading-none tracking-tight">
              ${(property.price + renoTotal).toLocaleString()}
            </p>
        </div>

        <div className="flex items-center gap-2">
             <button 
                onClick={(e) => { e.stopPropagation(); onCompare(property.id); }}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${isCompared ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                title="Comparar"
            >
                {isCompared ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            </button>

             <button 
                onClick={() => onSelect(property)}
                className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                title="Ver Ficha"
            >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ficha</span>
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); onRequestVisit(property); }}
                className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                title="Solicitar Visita"
            >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visitar</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SharedPropertyRow;
