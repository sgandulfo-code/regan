
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Check, Trophy, DollarSign, Ruler, Layers, Building } from 'lucide-react';
import { Property, SearchFolder } from '../types';

interface ComparisonReportGeneratorProps {
  properties: Property[];
  folder?: SearchFolder;
  onClose: () => void;
}

const ComparisonReportGenerator: React.FC<ComparisonReportGeneratorProps> = ({ properties, folder, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Helper to find best value (min or max)
  const isBest = (prop: Property, key: keyof Property | 'pricePerSqft', type: 'min' | 'max') => {
    if (properties.length < 2) return false;
    
    const values = properties.map(p => {
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

  return createPortal(
    <div className="report-overlay fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex justify-center overflow-y-auto py-10 px-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="report-container w-full max-w-[1200px] bg-white rounded-[3rem] shadow-2xl flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none print:block">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-30 print:hidden rounded-t-[3rem]">
          <h2 className="text-xl font-black text-slate-900">Vista Previa del Informe</h2>
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
            >
              <Printer className="w-4 h-4" /> Guardar como PDF / Imprimir
            </button>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div id="report-content" className="p-16 space-y-12 print:p-10 print:space-y-6">
          <header className="mb-12 print:mb-8">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6 print:hidden">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">PB</div>
                  <span className="font-bold text-slate-900 tracking-tight">PropBi Intelligence</span>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporte Confidencial</p>
               </div>
            </div>
            
            <div className="bg-slate-50 text-slate-900 p-10 rounded-[2.5rem] print:rounded-none print:p-0 print:bg-white relative overflow-hidden border border-slate-100 print:border-none">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                    Comparativa de Activos
                  </div>
                  <div className="bg-white text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {properties.length} Propiedades Seleccionadas
                  </div>
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 leading-tight text-slate-900">
                  {folder ? folder.name : 'Análisis Comparativo'}
                </h1>
                
                <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100 print:border-slate-200 print:bg-slate-50/50">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen Ejecutivo</h3>
                  <div 
                    className="text-slate-700 text-lg leading-relaxed font-medium prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: folder?.description || 'Comparación detallada "Manzanas con Manzanas" de las propiedades seleccionadas para facilitar la toma de decisiones basada en datos objetivos.' }}
                  />
                </div>
                
                <div className="flex items-center gap-8 pt-6 border-t border-slate-200">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                     <p className="font-bold text-slate-900">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plataforma</p>
                     <p className="font-bold text-slate-900">PropBi Intelligence</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="print:break-inside-avoid">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 print:border-slate-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 bg-slate-50 border-b border-slate-200 w-48 print:bg-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propiedad</span>
                    </th>
                    {properties.map(p => (
                      <th key={p.id} className="p-4 border-b border-slate-200 min-w-[180px] align-top bg-white">
                        <div className="mb-3 h-32 rounded-xl overflow-hidden border border-slate-100">
                           <img src={p.images[0] || 'https://picsum.photos/seed/prop/400/300'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <p className="font-black text-slate-900 text-sm leading-tight mb-1">{p.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.address}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {/* Price Section */}
                  <tr className="bg-slate-50/50 print:bg-slate-50">
                    <td className="p-3 pl-4 font-black text-slate-900 text-[10px] uppercase tracking-wide flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-emerald-500" /> Precio y Valores
                    </td>
                    <td colSpan={properties.length}></td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Precio Total</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${isBest(p, 'price', 'min') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-700'}`}>
                          <span className="font-black text-sm">{formatCurrency(p.price)}</span>
                          {isBest(p, 'price', 'min') && <Trophy className="w-3 h-3 fill-emerald-700" />}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Valor por m²</td>
                    {properties.map(p => {
                      const val = p.sqft > 0 ? p.price / p.sqft : 0;
                      const isWinner = isBest(p, 'pricePerSqft', 'min');
                      return (
                        <td key={p.id} className="p-3 bg-white">
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${isWinner ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-slate-600'}`}>
                            <span className="font-bold text-xs">{formatCurrency(val)}</span>
                            {isWinner && <Check className="w-3 h-3" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Expensas</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.fees ? formatCurrency(p.fees) : '-'}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Dimensions Section */}
                  <tr className="bg-slate-50/50 print:bg-slate-50">
                    <td className="p-3 pl-4 font-black text-slate-900 text-[10px] uppercase tracking-wide flex items-center gap-2">
                      <Ruler className="w-3 h-3 text-indigo-500" /> Superficies
                    </td>
                    <td colSpan={properties.length}></td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Sup. Total</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg ${isBest(p, 'sqft', 'max') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-slate-600'}`}>
                          <span className="font-bold text-xs">{p.sqft} m²</span>
                          {isBest(p, 'sqft', 'max') && <Trophy className="w-3 h-3 fill-indigo-600" />}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Sup. Cubierta</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.coveredSqft || '-'} m²</span>
                      </td>
                    ))}
                  </tr>

                  {/* Features Section */}
                  <tr className="bg-slate-50/50 print:bg-slate-50">
                    <td className="p-3 pl-4 font-black text-slate-900 text-[10px] uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-3 h-3 text-amber-500" /> Características
                    </td>
                    <td colSpan={properties.length}></td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Ambientes</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.environments}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Dormitorios</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <div className={`inline-flex items-center gap-2 ${isBest(p, 'rooms', 'max') ? 'text-amber-600 font-bold' : 'text-slate-600'} text-xs`}>
                          {p.rooms}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Baños</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.bathrooms}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Cocheras</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.parking || 0}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 pl-4 text-xs font-bold text-slate-500 bg-white">Antigüedad</td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 bg-white">
                        <span className="font-medium text-slate-600 text-xs">{p.age || 0} años</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print:border-slate-200 print:pt-6">
            <p>© 2024 PropBi Technical Intelligence</p>
            <p>Ref: {folder ? folder.name : 'Comparativa'}</p>
            <p>Uso Exclusivo & Confidencial</p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          html, body {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #root {
            display: none !important;
          }
          .report-overlay {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            backdrop-filter: none !important;
          }
          .report-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            height: auto !important;
            display: block !important;
            padding: 0 !important;
          }
          #report-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ComparisonReportGenerator;
