
import React from 'react';
import { Property, PropertyStatus } from '../types';
import { ICONS } from '../constants';
import { Layers, ShieldCheck, Pencil, Trash2, MapPin } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect: (p: Property) => void;
  onStatusChange: (id: string, status: PropertyStatus) => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
  isEditable?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect, onStatusChange, onEdit, onDelete, isEditable = true }) => {
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case PropertyStatus.VISITED: return 'bg-green-100 text-green-700';
      case PropertyStatus.CONTACTED: return 'bg-blue-100 text-blue-700';
      case PropertyStatus.DISCARDED: return 'bg-red-100 text-red-700';
      case PropertyStatus.OFFERED: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renoTotal = property.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="relative h-52 overflow-hidden">
        <img 
          src={property.images[0]} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
          <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
            {ICONS.Star} {property.rating}/5
          </span>
        </div>
        
        {/* Hover Actions */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(property); }}
            className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-600 hover:text-indigo-600 shadow-lg transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(property.id); }}
            className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-600 hover:text-rose-600 shadow-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-800 truncate mb-1" title={property.title}>
              {property.title}
            </h3>
          </div>
          <a href={property.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
            {ICONS.ExternalLink}
          </a>
        </div>

        {/* Dirección visible permanentemente */}
        <div className="flex items-center gap-2 mb-4 text-slate-500">
          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest truncate">
            {property.address}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            ${Math.round(property.price / property.sqft).toLocaleString()}/m²
          </p>
          {property.fees && property.fees > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-black uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              ${property.fees} expensas
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Ambientes</span>
            <span className="font-bold text-slate-800 text-xs">{property.environments}</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Covered</span>
            <span className="font-bold text-slate-800 text-xs">{property.coveredSqft || property.sqft}m²</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Parking</span>
            <span className="font-bold text-slate-800 text-xs">{property.parking || 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Project Cost</p>
            <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
              ${(property.price + renoTotal).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={() => onSelect(property)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            Details
          </button>
        </div>

        <div className="flex gap-2">
          {isEditable ? (
            <select 
              className="flex-1 bg-slate-100 border-none rounded-xl text-[10px] font-bold text-slate-500 py-3 px-4 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase tracking-widest"
              value={property.status}
              onChange={(e) => onStatusChange(property.id, e.target.value as PropertyStatus)}
            >
              {(Object.values(PropertyStatus) as string[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <div className="flex-1 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 py-3 px-4 text-center border border-slate-100 uppercase tracking-widest">
               Status: {property.status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
