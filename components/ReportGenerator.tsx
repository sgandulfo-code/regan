
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
      <div className="report-container w-full max-w-[1000px] bg-white rounded-[3rem] shadow-2xl flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
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

        <div id="report-content" className="p-16 space-y-12 print:p-8 print:space-y-6">
          <header className="flex justify-between items-start border-b-2 border-slate-900 pb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">PB</div>
                <h1 className="text-xl font-black tracking-tighter text-slate-900">PropBrain | Technical Intelligence</h1>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">{folder.name}</h2>
              <p className="text-slate-500 font-medium max-w-xl">{folder.description || 'Informe técnico detallado de activos inmobiliarios.'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
              <p className="font-bold text-slate-900">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </header>

          <section className="space-y-4 print:break-inside-avoid">
            <div className="flex items-center gap-3">
              <MapIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Distribución de Activos en el Mapa</h3>
            </div>
            <div className="w-full h-[450px] rounded-[2.5rem] overflow-hidden border-2 border-slate-100 relative bg-slate-50 shadow-inner print:h-[400px]">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
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
                        <span className="font-bold text-slate-500 text-xs">${Math.round(p.price / p.sqft).toLocaleString()}</span>
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
            
            <div className="grid grid-cols-1 gap-6">
              {properties.map((p, idx) => {
                const pricePerSqft = Math.round(p.price / p.sqft);
                return (
                  <div key={p.id} className="p-6 border-2 border-slate-50 rounded-[2rem] bg-slate-50/20 relative flex flex-col print:break-inside-avoid print:border-slate-200 print:bg-white print:rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-black text-slate-900 text-base leading-tight">{p.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <MapPin className="w-3 h-3 text-indigo-600" />
                             <p className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[500px]">{p.address}</p>
                          </div>
                        </div>
                      </div>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline print:hidden">
                        <ExternalLink className="w-3 h-3" /> Listado original
                      </a>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      {/* Métricas Principales de Costo */}
                      <div className="col-span-12 md:col-span-5 grid grid-cols-3 gap-2">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Precio</p>
                          <p className="font-black text-slate-900 text-sm">${p.price.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Expensas</p>
                          <p className="font-black text-slate-900 text-sm">${(p.fees || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100 text-center">
                          <p className="text-[8px] font-black text-white/60 uppercase mb-1">Valor m²</p>
                          <p className="font-black text-white text-sm">${pricePerSqft.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Especificaciones Compactas */}
                      <div className="col-span-12 md:col-span-7 flex flex-wrap gap-2">
                        {[
                          { icon: Bed, label: 'Hab.', val: p.rooms },
                          { icon: Bath, label: 'Baños', val: `${p.bathrooms}${p.toilets ? `+${p.toilets}` : ''}` },
                          { icon: Car, label: 'Coch.', val: p.parking || 0 },
                          { icon: Ruler, label: 'm² Tot.', val: p.sqft },
                          { icon: Clock, label: 'Ant.', val: p.age ? `${p.age}a` : 'Estrenar' },
                          { icon: Building, label: 'Piso', val: p.floor || 'N/A' }
                        ].map((spec, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2 min-w-[70px]">
                            <spec.icon className="w-3 h-3 text-indigo-500" />
                            <div>
                              <p className="text-[7px] font-black text-slate-400 uppercase leading-none">{spec.label}</p>
                              <p className="text-[10px] font-black text-slate-800 leading-tight">{spec.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-12 gap-4">
                       <div className="col-span-12 md:col-span-8 bg-white p-4 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" /> Notas Analíticas
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed italic">
                            {p.notes || 'Análisis técnico no disponible para este activo.'}
                          </p>
                       </div>
                       <div className="col-span-12 md:col-span-4 bg-slate-900 p-4 rounded-2xl text-white">
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Costos de Reforma</p>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-medium opacity-70">Presupuesto estimado:</span>
                             <span className="text-sm font-black text-indigo-400">
                               ${p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0).toLocaleString()}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print:border-slate-200">
            <p>© 2024 PropBrain Technical Reports</p>
            <p>Búsqueda: {folder.name}</p>
            <p>Informe Confidencial</p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.8cm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-overlay {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .report-container {
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          section {
            page-break-inside: auto;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .grid {
            display: grid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;
