
import React, { useRef, useEffect } from 'react';
import { Map as MapIcon, Building, User, CheckSquare } from 'lucide-react';
import { SearchFolder, Property } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportLayout from './ReportLayout';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ReportGeneratorProps {
  folder: SearchFolder;
  properties: Property[];
  onClose: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ folder, properties, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Initialize map
    if (mapContainerRef.current && !mapRef.current && properties.length > 0) {
      // Calculate center
      const validProps = properties.filter(p => p.lat && p.lng);
      if (validProps.length === 0) return;

      const centerLat = validProps.reduce((sum, p) => sum + (p.lat || 0), 0) / validProps.length;
      const centerLng = validProps.reduce((sum, p) => sum + (p.lng || 0), 0) / validProps.length;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([centerLat, centerLng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      // Add markers
      validProps.forEach((p, idx) => {
        if (p.lat && p.lng && mapRef.current) {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #4F46E5; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${idx + 1}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker([p.lat, p.lng], { icon }).addTo(mapRef.current);
        }
      });

      // Fit bounds
      if (validProps.length > 1) {
        const bounds = L.latLngBounds(validProps.map(p => [p.lat!, p.lng!]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const metadata = [
    { label: 'Operación', value: folder.transactionType || 'N/A' },
    { label: 'Presupuesto', value: folder.budget ? `$${folder.budget.toLocaleString()}` : 'N/A' },
    { label: 'Estado', value: folder.status },
    { label: 'Días Activa', value: `${folder.createdAt ? Math.floor((new Date().getTime() - new Date(folder.createdAt).getTime()) / (1000 * 3600 * 24)) : 0} días` }
  ];

  return (
    <ReportLayout
      title={folder.name}
      description={folder.description || 'Informe técnico detallado de activos inmobiliarios y análisis de mercado.'}
      metadata={metadata}
      onClose={onClose}
      headerTag="Tesis de Inversión"
      headerTagColor="bg-indigo-50 text-indigo-700 border-indigo-100"
      subtitle={`${properties.length} Activos`}
    >
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

      <section className="space-y-12 print:space-y-8">
        {properties.map((p, idx) => (
          <div key={p.id} className="print:break-inside-avoid print:page-break-inside-avoid print:block mb-8">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{p.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{p.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 print:grid-cols-12 print:gap-4 print:block">
              {/* Left Column: Image & Key Stats */}
              <div className="col-span-4 space-y-6 print:col-span-4 print:inline-block print:w-1/3 print:align-top print:pr-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                  <img src={p.images[0] || 'https://picsum.photos/seed/prop/400/300'} className="w-full h-full object-cover" alt={p.title} />
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(p.price)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor m²</p>
                      <p className="text-lg font-black text-slate-900">{p.sqft > 0 ? formatCurrency(p.price / p.sqft) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expensas</p>
                      <p className="text-sm font-bold text-slate-600">{p.fees ? formatCurrency(p.fees) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sup. Total</p>
                      <p className="text-sm font-bold text-slate-600">{p.sqft} m²</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Analysis */}
              <div className="col-span-8 space-y-6 print:col-span-8 print:inline-block print:w-2/3 print:align-top">
                {/* Specs Grid */}
                <div className="grid grid-cols-4 gap-3 print:grid-cols-4">
                  <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ambientes</p>
                    <p className="font-black text-slate-800">{p.environments}</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dormitorios</p>
                    <p className="font-black text-slate-800">{p.rooms}</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Baños</p>
                    <p className="font-black text-slate-800">{p.bathrooms}</p>
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Antigüedad</p>
                    <p className="font-black text-slate-800">{p.age || 0} años</p>
                  </div>
                </div>

                {/* Notes & Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 print:border-slate-200 print:w-full print:block print:mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notas Analíticas</h4>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {p.notes || 'Sin notas registradas para esta propiedad.'}
                  </p>
                </div>

                {/* Renovation Project */}
                {p.renovationCosts && p.renovationCosts.length > 0 && (
                  <div className="bg-slate-900 rounded-2xl p-6 text-white print:bg-slate-900 print:text-white print:w-full print:block">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Proyecto de Reforma</h4>
                      </div>
                      <span className="text-lg font-black text-indigo-400">
                        {formatCurrency(p.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0))}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {p.renovationCosts.map(item => (
                        <div key={item.id} className="flex justify-between text-xs border-b border-white/5 pb-2 last:border-0">
                          <span className="text-slate-300 font-medium">{item.category}</span>
                          <span className="font-bold">{formatCurrency(item.estimatedCost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Agent Info */}
                {(p.agentName || p.realEstateAgency) && (
                   <div className="flex items-center gap-4 pt-4 border-t border-slate-100 print:pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                         <User className="w-3 h-3" /> {p.agentName || 'Agente no especificado'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                         <Building className="w-3 h-3" /> {p.realEstateAgency || 'Inmobiliaria no especificada'}
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </ReportLayout>
  );
};

export default ReportGenerator;
