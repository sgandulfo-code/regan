import React from 'react';
import { Property, PropertyStatus } from '../types';
import { ICONS } from '../constants';
import { ShieldCheck, MapPin, Building, User, Phone, ExternalLink, Calendar, CheckSquare, Square, Plus, ChevronDown } from 'lucide-react';

interface SharedPropertyRowProps {
  property: Property;
  index: number;
  onSelect: (p: Property) => void;
  onCompare: (id: string) => void;
  isCompared: boolean;
  onRequestVisit: (p: Property) => void;
  onAddCustomField: (p: Property) => void;
  onStatusChange?: (id: string, status: PropertyStatus) => void;
}

const SharedPropertyRow: React.FC<SharedPropertyRowProps> = ({ 
  property, 
  index, 
  onSelect, 
  onCompare, 
  isCompared, 
  onRequestVisit,
  onAddCustomField,
  onStatusChange
}) => {
  const getStatusColor = (status: PropertyStatus | string) => {
    switch (status) {
      case PropertyStatus.SUGERIDA: return 'bg-slate-100 text-slate-700';
      case PropertyStatus.ELEGIDA:
      case 'Wishlist': return 'bg-pink-100 text-pink-700';
      case PropertyStatus.CONTACTADA:
      case 'Contacted': return 'bg-blue-100 text-blue-700';
      case PropertyStatus.VISITADA:
      case 'Visited': return 'bg-green-100 text-green-700';
      case PropertyStatus.OFERTADA:
      case 'Offered': return 'bg-purple-100 text-purple-700';
      case PropertyStatus.RESERVADA: return 'bg-indigo-100 text-indigo-700';
      case PropertyStatus.DISPONIBLE: return 'bg-sky-100 text-sky-700';
      case PropertyStatus.VENDIDA: return 'bg-emerald-100 text-emerald-700';
      case PropertyStatus.ALQUILADA: return 'bg-teal-100 text-teal-700';
      case PropertyStatus.DESCARTADA:
      case 'Discarded': return 'bg-red-100 text-red-700';
      case PropertyStatus.VENDIDA_POR_OTRO: return 'bg-slate-800 text-slate-200';
      case PropertyStatus.ALQUILADA_POR_OTRO: return 'bg-slate-700 text-slate-300';
      case PropertyStatus.SUSPENDIDA:
      case 'Cancelada': return 'bg-rose-50 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renoTotal = property.renovationCosts?.reduce((acc, curr) => acc + curr.estimatedCost, 0) || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col gap-4 hover:shadow-md transition-all group">
      {/* Title & Address - Full Width */}
      <div className="flex justify-between items-start w-full gap-4">
        <div className="flex-1 min-w-0">
          {property.code && (
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">{property.code}</span>
          )}
          <h3 className="font-bold text-lg md:text-xl text-slate-800 pr-2 cursor-pointer hover:text-indigo-600 transition-colors leading-snug" onClick={() => onSelect(property)} title={property.title}>{property.title}</h3>
          <div className="flex items-start gap-2 mt-1.5 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold uppercase tracking-wider leading-relaxed break-words">{property.address}</p>
          </div>
        </div>
        <a href={property.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0 mt-1 p-2 bg-slate-50 rounded-lg hover:bg-indigo-50 border border-slate-100">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        {/* Image & Index */}
        <div className="relative w-full md:w-56 h-48 md:h-auto shrink-0 rounded-xl overflow-hidden group-hover:brightness-110 transition-all cursor-pointer" onClick={() => onSelect(property)}>
          <div className="absolute top-2 left-2 z-10 bg-slate-900/80 text-white w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs backdrop-blur-sm">
              {(index + 1).toString().padStart(2, '0')}
          </div>
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover absolute inset-0"
          />
           {property.acquisitionReason && (
              <div className="absolute bottom-2 left-2 right-2">
               <span className="bg-slate-900/80 backdrop-blur text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-white/10 block text-center truncate">
                 {property.acquisitionReason}
               </span>
              </div>
            )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {onStatusChange && (property.status === PropertyStatus.SUGERIDA || property.status === PropertyStatus.ELEGIDA) ? (
                  <div className="relative inline-block">
                    <select
                      className={`pl-2.5 pr-6 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none appearance-none ${getStatusColor(property.status)}`}
                      value={property.status}
                      onChange={(e) => onStatusChange(property.id, e.target.value as PropertyStatus)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value={PropertyStatus.SUGERIDA}>{PropertyStatus.SUGERIDA}</option>
                      <option value={PropertyStatus.ELEGIDA}>{PropertyStatus.ELEGIDA}</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                  </div>
                ) : (
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                )}
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 text-slate-600">
                  {ICONS.Star} {property.rating}
                </span>
                {property.fees && property.fees > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> Expensas: ${property.fees.toLocaleString()}
                    </span>
                )}
            </div>

            {/* Custom Fields at the top */}
            {property.clientCustomFields && Object.keys(property.clientCustomFields).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {Object.entries(property.clientCustomFields).map(([key, field]: [string, any]) => {
                  const label = typeof field === 'object' && field !== null ? field.label : key;
                  const value = typeof field === 'object' && field !== null ? field.value : field;
                  const type = typeof field === 'object' && field !== null ? field.type : 'text';
                  
                  return (
                  <span key={key} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-indigo-100">
                    <span className="text-indigo-400">{label}:</span> 
                    {type === 'boolean' ? (value ? 'Sí' : 'No') : 
                     type === 'rating' ? `${value}/5` : 
                     String(value || 'N/A')}
                  </span>
                )})}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{property.environments}</span> Amb</span>
                <span className="w-px h-3 bg-slate-200"></span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{property.coveredSqft || property.sqft}</span> m²</span>
                <span className="w-px h-3 bg-slate-200"></span>
                <span className="flex items-center gap-1"><span className="font-bold text-slate-700">{property.parking || 0}</span> Coch</span>
                {property.floor && (
                  <>
                    <span className="w-px h-3 bg-slate-200"></span>
                    <span className="flex items-center gap-1">Piso <span className="font-bold text-slate-700">{property.floor}</span></span>
                  </>
                )}
                 <span className="w-px h-3 bg-slate-200"></span>
                 <span className="flex items-center gap-1"><span className="font-bold text-slate-700">${Math.round(property.price / property.sqft).toLocaleString()}</span>/m²</span>
            </div>
          </div>

          {/* Agency & Agent (Hidden on small screens if needed, or compact) */}
          {(property.realEstateAgency || property.agentName) && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                {property.realEstateAgency && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wide truncate" title={property.realEstateAgency}>
                      {property.realEstateAgency}
                    </p>
                  </div>
                )}
                {(property.realEstateAgency && (property.agentName || property.agentWhatsapp)) && (
                  <span className="w-px h-3 bg-slate-200 hidden sm:block"></span>
                )}
                {(property.agentName || property.agentWhatsapp) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-wide truncate" title={property.agentName}>
                        {property.agentName || 'Agente'}
                    </p>
                     {property.agentWhatsapp && (
                      <a 
                        href={`https://wa.me/${property.agentWhatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-500 hover:text-emerald-600 transition-colors ml-2 bg-emerald-50 p-1 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Price & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-full sm:w-auto flex justify-between sm:block items-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Project Cost</p>
                  <p className="text-lg font-black text-slate-900 leading-none tracking-tight">
                    ${(property.price + renoTotal).toLocaleString()}
                  </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onAddCustomField(property); }}
                    className="flex-1 sm:flex-none bg-white border border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-300 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    title="Agregar Criterio"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Criterio</span>
                </button>

                 <button 
                    onClick={(e) => { e.stopPropagation(); onCompare(property.id); }}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isCompared ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                    title="Comparar"
                >
                    {isCompared ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Comparar</span>
                </button>

                 <button 
                    onClick={() => onSelect(property)}
                    className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    title="Ver Ficha"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ficha</span>
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); onRequestVisit(property); }}
                    className="flex-1 sm:flex-none bg-indigo-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                    title="Pedir Visita"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Visita</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedPropertyRow;
