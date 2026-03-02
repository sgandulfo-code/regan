
import React, { useState } from 'react';
import { Property, SearchFolder } from '../types';
import { Check, X, Trophy, AlertCircle, Minus, ArrowRight, Building, DollarSign, Ruler, Bed, Bath, Car, Calendar, Layers, Printer } from 'lucide-react';
import ComparisonReportGenerator from './ComparisonReportGenerator';

interface ComparisonToolProps {
  properties: Property[];
  folder?: SearchFolder;
}

const ComparisonTool: React.FC<ComparisonToolProps> = ({ properties, folder }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    properties.slice(0, 3).map(p => p.id)
  );
  const [isReportOpen, setIsReportOpen] = useState(false);

  const toggleProperty = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      } else {
        alert("Puedes comparar hasta 4 propiedades a la vez.");
      }
    }
  };

  const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

  // Helper to find best value (min or max)
  const isBest = (prop: Property, key: keyof Property | 'pricePerSqft', type: 'min' | 'max') => {
    if (selectedProperties.length < 2) return false;
    
    const values = selectedProperties.map(p => {
      if (key === 'pricePerSqft') return p.sqft > 0 ? p.price / p.sqft : 0;
      return Number(p[key]) || 0;
    });

    const val = key === 'pricePerSqft' 
      ? (prop.sqft > 0 ? prop.price / prop.sqft : 0)
      : (Number(prop[key]) || 0);

    if (val === 0) return false;

    if (type === 'min') return val === Math.min(...values.filter(v => v > 0));
    return val === Math.max(...values);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR').format(val);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 animate-in fade-in duration-500 pb-20">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Comparador "Manzanas con Manzanas"</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Selecciona hasta 4 propiedades para comparar sus atributos lado a lado.
          </p>
        </div>
        {selectedProperties.length > 0 && (
          <button 
            onClick={() => setIsReportOpen(true)}
            className="bg-white border border-slate-200 text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Informe PDF</span>
          </button>
        )}
      </div>

      {/* Property Selector */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {properties.map(property => {
            const isSelected = selectedIds.includes(property.id);
            return (
              <button
                key={property.id}
                onClick={() => toggleProperty(property.id)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-2xl border transition-all min-w-[200px] text-left
                  ${isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'}
                `}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {isSelected ? <Check className="w-5 h-5" /> : <Building className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{property.title}</p>
                  <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{property.address}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <Building className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Selecciona propiedades para comenzar la comparación</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-6 text-left bg-slate-50 border-b border-slate-100 w-48 sticky left-0 z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atributo</span>
                  </th>
                  {selectedProperties.map(p => (
                    <th key={p.id} className="p-6 text-left border-b border-slate-100 min-w-[200px]">
                      <div className="relative h-32 rounded-2xl overflow-hidden mb-4 shadow-md">
                        <img src={p.images[0] || 'https://picsum.photos/seed/prop/400/300'} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                          <p className="text-white font-black text-sm truncate">{p.title}</p>
                          <p className="text-white/80 text-[10px] font-bold truncate">{p.address}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Price Section */}
                <tr className="bg-slate-50/50">
                  <td className="p-4 pl-6 font-black text-slate-900 text-xs uppercase tracking-wide sticky left-0 bg-slate-50/50 z-10 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Precio y Valores
                  </td>
                  <td colSpan={selectedProperties.length}></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Precio Total</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${isBest(p, 'price', 'min') ? 'bg-emerald-100 text-emerald-700' : 'text-slate-700'}`}>
                        <span className="font-black text-lg">{formatCurrency(p.price)}</span>
                        {isBest(p, 'price', 'min') && <Trophy className="w-3 h-3 fill-emerald-700" />}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Valor por m²</td>
                  {selectedProperties.map(p => {
                    const val = p.sqft > 0 ? p.price / p.sqft : 0;
                    const isWinner = isBest(p, 'pricePerSqft', 'min');
                    return (
                      <td key={p.id} className="p-4">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${isWinner ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'}`}>
                          <span className="font-bold">{formatCurrency(val)}</span>
                          {isWinner && <Check className="w-3 h-3" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Expensas</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.fees ? formatCurrency(p.fees) : '-'}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Costo Reformas</td>
                  {selectedProperties.map(p => {
                    const renovationTotal = p.renovationCosts?.reduce((acc, curr) => acc + curr.estimatedCost, 0) || 0;
                    return (
                      <td key={p.id} className="p-4">
                        <span className="font-medium text-slate-600">{renovationTotal > 0 ? formatCurrency(renovationTotal) : '-'}</span>
                      </td>
                    );
                  })}
                </tr>

                {/* Dimensions Section */}
                <tr className="bg-slate-50/50">
                  <td className="p-4 pl-6 font-black text-slate-900 text-xs uppercase tracking-wide sticky left-0 bg-slate-50/50 z-10 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-500" /> Superficies
                  </td>
                  <td colSpan={selectedProperties.length}></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Sup. Total</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${isBest(p, 'sqft', 'max') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}>
                        <span className="font-bold">{p.sqft} m²</span>
                        {isBest(p, 'sqft', 'max') && <Trophy className="w-3 h-3 fill-indigo-600" />}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Sup. Cubierta</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.coveredSqft || '-'} m²</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Sup. Descubierta</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.uncoveredSqft || '-'} m²</span>
                    </td>
                  ))}
                </tr>

                {/* Features Section */}
                <tr className="bg-slate-50/50">
                  <td className="p-4 pl-6 font-black text-slate-900 text-xs uppercase tracking-wide sticky left-0 bg-slate-50/50 z-10 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" /> Características
                  </td>
                  <td colSpan={selectedProperties.length}></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Ambientes</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.environments}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Dormitorios</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <div className={`inline-flex items-center gap-2 ${isBest(p, 'rooms', 'max') ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                        {p.rooms}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Baños</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.bathrooms}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Toilettes</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.toilets || 0}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Cocheras</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.parking || 0}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 pl-6 text-xs font-bold text-slate-500 sticky left-0 bg-white z-10">Antigüedad</td>
                  {selectedProperties.map(p => (
                    <td key={p.id} className="p-4">
                      <span className="font-medium text-slate-600">{p.age || 0} años</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isReportOpen && (
        <ComparisonReportGenerator 
          properties={selectedProperties} 
          folder={folder} 
          onClose={() => setIsReportOpen(false)} 
        />
      )}
    </div>
  );
};

export default ComparisonTool;
