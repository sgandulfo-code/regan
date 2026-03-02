
import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, MapPin, Building, Ruler, Euro, Shield, Download, FileText, ChevronLeft, Map as MapIcon, Table, Loader2, ExternalLink, Bed, Bath, Car, Clock, Layers, DollarSign, ShieldCheck } from 'lucide-react';
import { Property, SearchFolder } from '../types';
import L from 'leaflet';

interface ReportGeneratorProps {
  folder: SearchFolder;
  properties: Property[];
  onClose: () => void;
}

interface GeocodedPoint {
  id: string;
  lat: number;
  lng: number;
  index: number;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ folder, properties, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const createReportIcon = (index: number) => L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center" style="width: 30px; height: 38px;">
        <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.7C17.3 17.1 20 13.1 20 9.7C20 5.2 16.4 1.6 12 1.6C7.6 1.6 4 5.2 4 9.7C4 13.1 6.7 17.1 12 21.7Z" fill="#4f46e5" stroke="white" stroke-width="2"/>
          <text x="12" y="11" fill="white" font-size="8" font-weight="900" text-anchor="middle" font-family="Inter, sans-serif">${index + 1}</text>
        </svg>
      </div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 38]
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    const geocodeAndPlot = async () => {
      setIsGeocoding(true);
      const markersLayer = L.featureGroup().addTo(map);
      
      const geocodedPoints: GeocodedPoint[] = [];

      for (let i = 0; i < properties.length; i++) {
        const p = properties[i];
        const query = p.exactAddress || p.address;
        try {
          const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
          const data = await resp.json();
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            L.marker([lat, lng], { icon: createReportIcon(i) }).addTo(markersLayer);
            geocodedPoints.push({ id: p.id, lat, lng, index: i });
          }
        } catch (e) {
          console.error("Error geocoding for report:", e);
        }
      }

      if (geocodedPoints.length > 0) {
        map.fitBounds(markersLayer.getBounds(), { padding: [40, 40] });
      } else {
        map.setView([40.4168, -3.7038], 12);
      }
      setIsGeocoding(false);
    };

    geocodeAndPlot();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [properties]);

  return (
    <div className="report-overlay fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex justify-center overflow-y-auto py-10 px-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="report-container w-full max-w-[1000px] bg-white rounded-[3rem] shadow-2xl flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none print:block">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-30 print:hidden rounded-t-[3rem]">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
            <ChevronLeft className="w-5 h-5" /> Volver
          </button>
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
                    Tesis de Inversión
                  </div>
                  <div className="bg-white text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {properties.length} Activos
                  </div>
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 leading-tight text-slate-900">{folder.name}</h1>
                
                <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100 print:border-slate-200 print:bg-slate-50/50">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalle de la Búsqueda</h3>
                  <p className="text-slate-700 text-lg leading-relaxed font-medium">{folder.description || 'Informe técnico detallado de activos inmobiliarios y análisis de mercado.'}</p>
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

          <section className="mb-12 print:break-inside-avoid">
            <div className="bg-slate-50 p-2 rounded-[2.5rem] border border-slate-200 print:border-none print:p-0 print:bg-white">
              <div className="w-full h-[500px] rounded-[2rem] overflow-hidden relative z-0 print:h-[500px] print:rounded-xl border border-slate-100 print:border-slate-300 shadow-sm">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
               <MapIcon className="w-4 h-4" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Vista Geo-Espacial de Activos</p>
            </div>
          </section>

          <section className="space-y-6 pt-6 print:break-inside-auto">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Matriz de Comparativa Técnica</h3>
            </div>
            <div className="overflow-hidden border-2 border-slate-100 rounded-[2rem] print:rounded-none print:border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Propiedad</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Total</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expensas</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">$ / m²</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Superficie</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                  {properties.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                      <td className="p-5">
                        <span className="bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-5">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 text-sm leading-tight hover:underline print:text-indigo-800">
                          {p.title}
                        </a>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium leading-relaxed print:text-slate-600">
                          {p.address}
                        </p>
                      </td>
                      <td className="p-5">
                        <span className="font-black text-slate-900 text-sm">${p.price.toLocaleString()}</span>
                      </td>
                      <td className="p-5 text-slate-500 font-bold text-xs">
                        ${(p.fees || 0).toLocaleString()}
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-500 text-xs">${Math.round(p.price / (p.sqft || 1)).toLocaleString()}</span>
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-800 text-sm">{p.sqft}m²</span>
                        <p className="text-[9px] text-slate-400 uppercase">{p.coveredSqft || p.sqft} cub.</p>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{p.rooms}H</span>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black">{p.bathrooms}B</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6 pt-6 print:break-inside-auto">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-4 flex-1">Análisis Detallado por Activo</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 print:block">
              {properties.map((p, idx) => {
                const pricePerSqft = Math.round(p.price / (p.sqft || 1));
                const totalReno = p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0);
                
                return (
                  <div key={p.id} className="p-8 border-2 border-slate-50 rounded-[2.5rem] bg-slate-50/20 relative flex flex-col mb-8 print:break-inside-avoid print:border-slate-200 print:bg-white print:rounded-3xl print:p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start gap-6 w-full">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-white print:border-slate-200">
                          <img 
                            src={p.images[0] || 'https://picsum.photos/seed/prop/200/200'} 
                            alt={p.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="bg-slate-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="font-black text-slate-900 text-lg leading-tight">{p.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                             <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{p.address}</p>
                          </div>
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline print:text-indigo-800">
                            <ExternalLink className="w-3.5 h-3.5" /> Ver ficha original
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      {/* Métricas Principales de Costo */}
                      <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-3 print:grid-cols-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center print:border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                          <p className="font-black text-slate-900 text-base">${p.price.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center print:border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expensas</p>
                          <p className="font-black text-slate-900 text-base">${(p.fees || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 text-center flex flex-col justify-center">
                          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Valor m²</p>
                          <p className="font-black text-white text-base">${pricePerSqft.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Especificaciones Técnicas Compactas en Grid */}
                      <div className="col-span-12 lg:col-span-7 grid grid-cols-3 sm:grid-cols-6 gap-2 print:grid-cols-6">
                        {[
                          { icon: Bed, label: 'Hab.', val: p.rooms },
                          { icon: Bath, label: 'Baños', val: `${p.bathrooms}${p.toilets ? `+${p.toilets}` : ''}` },
                          { icon: Car, label: 'Coch.', val: p.parking || 0 },
                          { icon: Ruler, label: 'm² Tot.', val: p.sqft },
                          { icon: Clock, label: 'Ant.', val: p.age ? `${p.age}a` : 'Estrenar' },
                          { icon: Building, label: 'Piso', val: p.floor || 'N/A' }
                        ].map((spec, i) => (
                          <div key={i} className="bg-white border border-slate-100 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center print:border-slate-200">
                            <spec.icon className="w-4 h-4 text-indigo-500 mb-1" />
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{spec.label}</p>
                            <p className="text-[10px] font-black text-slate-800 leading-tight truncate w-full">{spec.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 print:block print:space-y-4">
                       <div className="md:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 print:border-slate-200 print:w-full print:mb-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-indigo-600" /> Notas Analíticas
                          </p>
                          <p className="text-[12px] text-slate-600 leading-relaxed italic">
                            {p.notes || 'Análisis técnico no disponible para este activo.'}
                          </p>
                       </div>
                       <div className="md:col-span-4 bg-slate-900 p-5 rounded-3xl text-white flex flex-col justify-center print:w-full print:bg-slate-900 print:text-white">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Proyecto de Reforma</p>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[11px] opacity-70">
                                <span>Reforma estimada:</span>
                                <span className="font-bold">${totalReno.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Total Proyecto:</span>
                                <span className="text-lg font-black text-white">
                                   ${(p.price + totalReno).toLocaleString()}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print:border-slate-200 print:pt-6">
            <p>© 2024 PropBi Technical Intelligence</p>
            <p>Ref Búsqueda: {folder.name}</p>
            <p>Uso Exclusivo & Confidencial</p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
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
          #root main, #root aside {
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
          section {
            page-break-inside: auto;
            margin-bottom: 2rem !important;
            display: block !important;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: block !important;
          }
          .leaflet-container {
            border: 1px solid #e2e8f0 !important;
            height: 400px !important;
            width: 100% !important;
            page-break-inside: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }
          /* Fix for grid systems in chrome print */
          .grid {
            display: grid !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid-cols-3 {
             grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-6 {
             grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
          .col-span-12 {
            grid-column: span 12 / span 12 !important;
          }
          /* Force column spans in print */
          .print\\:grid-cols-12 {
             grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;
