import React from 'react';
import { Check, Trophy, DollarSign, Ruler, Layers, Building, Map as MapIcon } from 'lucide-react';
import { Property, SearchFolder } from '../types';
import ReportLayout from './ReportLayout';
import PropertyMap from './PropertyMap';

interface ComparisonReportGeneratorProps {
  properties: Property[];
  folder: SearchFolder | null;
  onClose: () => void;
}

const ComparisonReportGenerator: React.FC<ComparisonReportGeneratorProps> = ({ properties, folder, onClose }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Calculate best values for highlighting
  const bestPrice = Math.min(...properties.map(p => p.price));
  const bestPricePerSqft = Math.min(...properties.map(p => p.price / (p.sqft || 1)));
  const bestSqft = Math.max(...properties.map(p => p.sqft));

  const metadata = folder ? [
    { label: 'Operación', value: folder.transactionType || 'N/A' },
    { label: 'Presupuesto', value: folder.budget ? `$${folder.budget.toLocaleString()}` : 'N/A' },
    { label: 'Estado', value: folder.status },
    { label: 'Días Activa', value: `${folder.createdAt ? Math.floor((new Date().getTime() - new Date(folder.createdAt).getTime()) / (1000 * 3600 * 24)) : 0} días` }
  ] : [];

  return (
    <ReportLayout
      title={folder ? folder.name : 'Análisis Comparativo'}
      description={folder?.description || 'Comparación detallada "Manzanas con Manzanas" de las propiedades seleccionadas para facilitar la toma de decisiones basada en datos objetivos.'}
      metadata={metadata}
      onClose={onClose}
      headerTag="Comparativa de Activos"
      headerTagColor="bg-indigo-50 text-indigo-700 border-indigo-100"
      subtitle={`${properties.length} Propiedades Seleccionadas`}
    >
      <section className="mb-12 print:break-inside-avoid">
        <div className="bg-slate-50 p-2 rounded-[2.5rem] border border-slate-200 print:border-none print:p-0 print:bg-white">
          <PropertyMap properties={properties} height="400px" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
            <MapIcon className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Vista Geo-Espacial de Activos</p>
        </div>
      </section>

      <section className="print:break-inside-avoid">
        <div className="overflow-hidden border border-slate-200 rounded-[2rem] print:rounded-xl print:border-slate-300 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="p-6 w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 bg-slate-50/50 sticky left-0 z-10 print:static">
                  PROPIEDAD
                </th>
                {properties.map((p) => (
                  <th key={p.id} className="p-6 min-w-[200px] align-top border-r border-slate-200 last:border-r-0">
                    <div className="space-y-4">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                        <img 
                          src={p.images[0] || 'https://picsum.photos/seed/prop/300/200'} 
                          alt={p.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm leading-tight mb-2 line-clamp-3 uppercase tracking-tight">{p.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-relaxed">{p.address}</p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Price Section */}
              <tr className="bg-slate-50/30">
                <td colSpan={properties.length + 1} className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100">
                  <DollarSign className="w-3 h-3 text-emerald-600" /> Precio y Valores
                </td>
              </tr>
              
              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Precio Total</td>
                {properties.map(p => (
                  <td key={p.id} className={`p-6 border-r border-slate-100 last:border-r-0 ${p.price === bestPrice ? 'bg-emerald-50/50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black ${p.price === bestPrice ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {formatCurrency(p.price)}
                      </span>
                      {p.price === bestPrice && <Trophy className="w-4 h-4 text-emerald-500 fill-emerald-500" />}
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Valor por m²</td>
                {properties.map(p => {
                  const pricePerSqft = p.price / (p.sqft || 1);
                  const isBest = pricePerSqft === bestPricePerSqft;
                  return (
                    <td key={p.id} className={`p-6 border-r border-slate-100 last:border-r-0 ${isBest ? 'bg-emerald-50/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isBest ? 'text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded' : 'text-slate-600'}`}>
                          {formatCurrency(pricePerSqft)}
                        </span>
                        {isBest && <Check className="w-3 h-3 text-emerald-600" />}
                      </div>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Expensas</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                    {p.fees ? formatCurrency(p.fees) : '-'}
                  </td>
                ))}
              </tr>

              {/* Surfaces Section */}
              <tr className="bg-slate-50/30">
                <td colSpan={properties.length + 1} className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 border-t border-slate-100">
                  <Ruler className="w-3 h-3 text-indigo-600" /> Superficies
                </td>
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Sup. Total</td>
                {properties.map(p => (
                  <td key={p.id} className={`p-6 border-r border-slate-100 last:border-r-0 ${p.sqft === bestSqft ? 'bg-indigo-50/50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${p.sqft === bestSqft ? 'text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded' : 'text-slate-900'}`}>
                        {p.sqft} m²
                      </span>
                      {p.sqft === bestSqft && <Trophy className="w-3 h-3 text-indigo-500 fill-indigo-500" />}
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Sup. Cubierta</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                    {p.coveredSqft || p.sqft} m²
                  </td>
                ))}
              </tr>

              {/* Features Section */}
              <tr className="bg-slate-50/30">
                <td colSpan={properties.length + 1} className="p-4 text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 border-t border-slate-100">
                  <Layers className="w-3 h-3 text-amber-600" /> Características
                </td>
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Ambientes</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-900 font-bold">
                    {p.environments}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Dormitorios</td>
                {properties.map(p => {
                  const maxRooms = Math.max(...properties.map(prop => prop.rooms));
                  return (
                    <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                      <span className={p.rooms === maxRooms ? 'text-amber-600 font-bold' : ''}>{p.rooms}</span>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Baños</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                    {p.bathrooms}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Cocheras</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                    {p.parking || 0}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-6 font-bold text-slate-500 text-xs border-r border-slate-100 bg-slate-50/30">Antigüedad</td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-slate-100 last:border-r-0 text-slate-600 font-medium">
                    {p.age ? `${p.age} años` : 'A estrenar'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ReportLayout>
  );
};

export default ComparisonReportGenerator;
