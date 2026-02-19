
import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, MapPin, Building, Ruler, Euro, Shield, Download, FileText, ChevronLeft, Map as MapIcon, Table, Loader2, ExternalLink, Bed, Bath, Car, Clock, Layers, DollarSign } from 'lucide-react';
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

        <div id="report-content" className="p-16 space-y-12 print:p-10 print:space-y-8">
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
              <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 print:hidden">
                {isGeocoding ? (
                  <>
                    <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Mapeando activos...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{properties.length} Propiedades Georeferenciadas</span>
                  </>
                )}
              </div>
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
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 text-sm leading-tight hover:underline flex items-center gap-1 group/link print:text-indigo-800">
                          {p.title}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden" />
                        </a>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium leading-relaxed print:text-slate-600">
                          {p.address}
                        </p>
                      </td>
                      <td className="p-5">
                        <span className="font-black text-slate-900 text-sm">${p.price.toLocaleString()}</span>
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-500 text-xs">${Math.round(p.price / p.sqft).toLocaleString()}</span>
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-800 text-sm">{p.sqft}m²</span>
                        <p className="text-[9px] text-slate-400 uppercase">{p.coveredSqft || p.sqft} cubiertos</p>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black print:border print:border-indigo-200">{p.rooms}H</span>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black print:border print:border-slate-200">{p.bathrooms}B</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-10 pt-10 print:break-inside-auto">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-4 flex-1">Detalles Técnicos Individuales</h3>
            </div>
            <div className="grid grid-cols-2 gap-10 print:grid-cols-1 print:gap-8">
              {properties.map((p, idx) => {
                const pricePerSqft = Math.round(p.price / p.sqft);
                return (
                  <div key={p.id} className="p-8 border-2 border-slate-50 rounded-[2.5rem] bg-slate-50/30 relative overflow-hidden flex flex-col print:break-inside-avoid print:border-slate-200 print:bg-white print:rounded-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 print:opacity-5">
                      <span className="text-6xl font-black text-slate-900">{(idx + 1).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <span className="bg-slate-900 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-slate-900 text-lg leading-tight flex-1">{p.title}</h4>
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-relaxed">
                          {p.address}
                        </p>
                      </div>
                      
                      {/* Grid de Métricas Principales */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 print:border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Compra</p>
                          <p className="font-black text-slate-900 text-lg">${p.price.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 p-4 rounded-2xl border border-indigo-500 shadow-lg shadow-indigo-100">
                          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Valor m²</p>
                          <p className="font-black text-white text-lg">${pricePerSqft.toLocaleString()}/m²</p>
                        </div>
                      </div>

                      {/* Grid de Especificaciones Técnicas */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Bed className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Habitaciones</p>
                          <p className="font-bold text-slate-800 text-xs">{p.rooms}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Bath className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Baños / Toil.</p>
                          <p className="font-bold text-slate-800 text-xs">{p.bathrooms}{p.toilets ? ` + ${p.toilets}` : ''}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Car className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Cocheras</p>
                          <p className="font-bold text-slate-800 text-xs">{p.parking || 0}</p>
                        </div>
                      </div>

                      {/* Grid de Superficies y Ubicación */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Ruler className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Superficie</p>
                          <p className="font-bold text-slate-800 text-[10px] leading-tight">{p.sqft}m² total</p>
                          <p className="text-[7px] text-slate-400 uppercase">{p.coveredSqft || p.sqft} cub.</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Antigüedad</p>
                          <p className="font-bold text-slate-800 text-xs">{p.age ? `${p.age} años` : 'A estrenar'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                          <Building className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Piso / Ubic.</p>
                          <p className="font-bold text-slate-800 text-xs truncate w-full px-1">{p.floor || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 print:border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <FileText className="w-2.5 h-2.5" /> Análisis de la Oportunidad
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          {p.notes || 'Sin notas analíticas adicionales para este activo.'}
                        </p>
                      </div>

                      {p.renovationCosts.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 print:border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimación de Reformas</p>
                          <div className="space-y-1 bg-slate-100/50 p-3 rounded-xl border border-slate-200/50">
                            {p.renovationCosts.map(r => (
                              <div key={r.id} className="flex justify-between text-[10px]">
                                <span className="text-slate-500 font-medium">{r.category}</span>
                                <span className="font-bold text-slate-900">${r.estimatedCost.toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-[10px] pt-1 mt-1 border-t border-slate-200">
                              <span className="font-black text-slate-500 uppercase">Total Reformas</span>
                              <span className="font-black text-indigo-600">${p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 print:border-slate-200 flex justify-between items-center">
                      <a 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:underline print:text-indigo-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver listado original
                      </a>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Lead Ref: {p.id.substring(0, 8)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print:border-slate-200 print:mt-8">
            <p>© 2024 PropBrain Technical Reports</p>
            <p>Carpeta: {folder.name}</p>
            <p>Confidencial - Propiedad del Usuario</p>
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
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #report-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          section {
            page-break-inside: auto;
            margin-bottom: 2rem !important;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
          a {
            text-decoration: none !important;
            color: #4f46e5 !important;
          }
          /* Fix for grids and multiple columns in print */
          .grid {
             display: block !important;
          }
          .grid > div {
             width: 100% !important;
             margin-bottom: 1.5rem !important;
          }
          /* Re-enable flex where strictly needed but with block flow */
          .flex {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;
