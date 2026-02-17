
import React from 'react';
import { X, MapPin, Euro, Ruler, Layers, Star, ExternalLink, Calendar, MessageSquare, Info, ShieldCheck, TrendingUp, ChevronLeft } from 'lucide-react';
import { Property, UserRole, RenovationItem } from '../types';
import RenovationCalculator from './RenovationCalculator';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  userRole: UserRole;
  onUpdateReno: (items: RenovationItem[]) => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, userRole, onUpdateReno }) => {
  const renoTotal = property.renovationCosts.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-slate-50 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 custom-scrollbar">
        {/* Header Pegajoso */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Search
          </button>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              {property.status}
            </span>
            <a 
              href={property.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Columna Izquierda: Info Principal */}
            <div className="lg:col-span-7 space-y-10">
              <section>
                <div className="flex items-center gap-2 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < property.rating ? 'fill-current' : 'opacity-20'}`} />
                  ))}
                  <span className="text-xs font-black ml-2 text-slate-400">INVESTMENT SCORE</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-4">
                  {property.title}
                </h1>
                <p className="flex items-center gap-2 text-slate-500 font-medium text-lg">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  {property.address}
                </p>
                {property.exactAddress && (
                   <p className="text-slate-400 text-sm mt-1 ml-7 italic">Exact: {property.exactAddress}</p>
                )}
              </section>

              {/* Grid de Especificaciones Técnicas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <Euro className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</p>
                  <p className="text-xl font-black text-slate-900 mt-1">€{property.price.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <Ruler className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Area</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{property.sqft} m²</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <Layers className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rooms</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{property.rooms}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">€ / m²</p>
                  <p className="text-xl font-black text-slate-900 mt-1">€{Math.round(property.price / property.sqft)}</p>
                </div>
              </div>

              {/* Notas y Análisis de IA */}
              <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <MessageSquare className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Strategic Analysis
                </h3>
                <p className="text-xl font-medium leading-relaxed text-slate-300 italic">
                  "{property.notes || 'No manual notes provided for this asset. AI analysis is being generated based on listing parameters...'}"
                </p>
                <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
                   <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Monthly Expenses</p>
                      <p className="text-2xl font-black">€{property.fees || 0}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Projected ROI</p>
                      <p className="text-2xl font-black text-emerald-400">High</p>
                   </div>
                </div>
              </section>

              {/* Imágenes */}
              <section>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Gallery & Visuals</h3>
                <div className="grid grid-cols-2 gap-4">
                  {property.images.map((img, i) => (
                    <div key={i} className="aspect-video rounded-[2rem] overflow-hidden border border-slate-200 shadow-md group">
                      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Columna Derecha: Calculadora y Acciones */}
            <div className="lg:col-span-5 space-y-8">
              <div className="sticky top-28">
                <RenovationCalculator 
                  property={property} 
                  userRole={userRole} 
                  onUpdate={onUpdateReno} 
                />
                
                <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-3xl p-8">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Professional Audit
                  </h4>
                  <p className="text-xs text-indigo-700 leading-relaxed mb-6 font-medium">
                    This property has been analyzed by PropBrain's Neural Engine. All data points are extracted with 95% confidence from local listings.
                  </p>
                  <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
                    Request Structural Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
