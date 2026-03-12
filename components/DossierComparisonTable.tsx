import React from 'react';
import { Property, ValuationComparable } from '../types';
import { Check, X, Building, Ruler, Bed, Bath, Car, Calendar, Layers } from 'lucide-react';

interface DossierComparisonTableProps {
  subjectProperty: Property;
  comparables: ValuationComparable[];
  allProperties: Property[];
}

const DossierComparisonTable: React.FC<DossierComparisonTableProps> = ({ subjectProperty, comparables, allProperties }) => {
  const compProps = comparables.map(c => {
    const p = allProperties.find(prop => prop.id === c.propertyId);
    return p ? { ...p, compType: c.type, soldPrice: c.soldPrice } : null;
  }).filter(Boolean) as (Property & { compType: 'active' | 'sold', soldPrice?: number })[];

  const allPropsToCompare = [
    { ...subjectProperty, compType: 'subject' as const },
    ...compProps
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR').format(val);
  };

  const getPricePerSqft = (p: any) => {
    const price = p.compType === 'sold' && p.soldPrice ? p.soldPrice : p.price;
    const sqft = p.coveredSqft || p.sqft;
    return sqft > 0 ? price / sqft : 0;
  };

  return (
    <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
      <table className="w-full min-w-[800px] border-separate border-spacing-x-4 border-spacing-y-0">
        <thead>
          <tr>
            <th className="w-48 p-4 text-left align-bottom">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Características</span>
            </th>
            {allPropsToCompare.map((p, idx) => (
              <th key={p.id} className="w-64 p-4 align-bottom">
                <div className={`rounded-2xl p-4 border-2 transition-all ${
                  p.compType === 'subject' 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' 
                    : p.compType === 'sold'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-amber-200 bg-amber-50/30'
                }`}>
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${
                    p.compType === 'subject' ? 'text-indigo-600' : p.compType === 'sold' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {p.compType === 'subject' ? 'Tu Propiedad' : p.compType === 'sold' ? 'Vendido' : 'En Venta'}
                  </div>
                  <div className="h-24 rounded-xl overflow-hidden mb-3 relative">
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    {p.compType !== 'subject' && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px] font-black backdrop-blur-sm">
                        {idx}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm truncate mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{p.address}</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Valor m² */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Ruler className="w-4 h-4 text-slate-400" /> Valor m²
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className={`text-lg font-black ${p.compType === 'subject' ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {formatCurrency(getPricePerSqft(p))}
                </span>
              </td>
            ))}
          </tr>

          {/* Precio */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Building className="w-4 h-4 text-slate-400" /> Precio
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className={`text-lg font-black ${p.compType === 'subject' ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {formatCurrency(p.compType === 'sold' && p.soldPrice ? p.soldPrice : p.price)}
                </span>
              </td>
            ))}
          </tr>

          {/* Superficie Total */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Layers className="w-4 h-4 text-slate-400" /> Sup. Total
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{formatNumber(p.sqft)} m²</span>
              </td>
            ))}
          </tr>

          {/* Superficie Cubierta */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Ruler className="w-4 h-4 text-slate-400" /> Sup. Cubierta
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{formatNumber(p.coveredSqft || p.sqft)} m²</span>
              </td>
            ))}
          </tr>

          {/* Habitaciones */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Bed className="w-4 h-4 text-slate-400" /> Ambientes
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{p.environments || p.rooms}</span>
              </td>
            ))}
          </tr>

          {/* Baños */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Bath className="w-4 h-4 text-slate-400" /> Baños
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{p.bathrooms}</span>
              </td>
            ))}
          </tr>

          {/* Cocheras */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Car className="w-4 h-4 text-slate-400" /> Cocheras
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{p.parking || 0}</span>
              </td>
            ))}
          </tr>

          {/* Antigüedad */}
          <tr>
            <td className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-slate-400" /> Antigüedad
              </div>
            </td>
            {allPropsToCompare.map((p) => (
              <td key={p.id} className="p-4 border-b border-slate-100 text-center">
                <span className="text-sm font-bold text-slate-700">{p.age !== undefined ? `${p.age} años` : 'N/A'}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DossierComparisonTable;
