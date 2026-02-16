
import React from 'react';
import { Property, PropertyStatus } from '../types';
import { ICONS } from '../constants';

interface PropertyCardProps {
  property: Property;
  onSelect: (p: Property) => void;
  onStatusChange: (id: string, status: PropertyStatus) => void;
  isEditable?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect, onStatusChange, isEditable = true }) => {
  // Use PropertyStatus enum members as runtime values for switch logic
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
          <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
            {ICONS.Star} {property.rating}/5
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-xs font-bold truncate flex items-center gap-1">
             {ICONS.MapPin} {property.address}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-800 truncate mb-1" title={property.title}>
              {property.title}
            </h3>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              €{Math.round(property.price / property.sqft).toLocaleString()}/m² Base Price
            </p>
          </div>
          <a href={property.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
            {ICONS.ExternalLink}
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Rooms</span>
            <span className="font-bold text-slate-800 text-sm">{property.rooms}</span>
          </div>
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Baths</span>
            <span className="font-bold text-slate-800 text-sm">{property.bathrooms}</span>
          </div>
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-center">
            <span className="block text-[8px] text-slate-400 uppercase font-bold tracking-tighter mb-0.5">Surface</span>
            <span className="font-bold text-slate-800 text-sm">{property.sqft}m²</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Project Cost</p>
            <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
              €{(property.price + renoTotal).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={() => onSelect(property)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            Manage
          </button>
        </div>

        <div className="flex gap-2">
          {isEditable ? (
            <select 
              className="flex-1 bg-slate-100 border-none rounded-xl text-[10px] font-bold text-slate-500 py-3 px-4 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase tracking-widest"
              value={property.status}
              onChange={(e) => onStatusChange(property.id, e.target.value as PropertyStatus)}
            >
              {/* Cast Object.values to string[] to ensure runtime iteration and valid React child types */}
              {(Object.values(PropertyStatus) as string[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <div className="flex-1 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 py-3 px-4 text-center border border-slate-100 uppercase tracking-widest">
               Status: {property.status}
            </div>
          )}
          <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            {ICONS.MessageSquare}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
