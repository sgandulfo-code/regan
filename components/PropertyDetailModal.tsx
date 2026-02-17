
import React, { useState, useEffect } from 'react';
import { X, MapPin, Euro, Ruler, Layers, Star, ExternalLink, Calendar, MessageSquare, Info, ShieldCheck, TrendingUp, ChevronLeft, Monitor, ImageIcon, AlertOctagon, RefreshCw, Loader2 } from 'lucide-react';
import { Property, UserRole, RenovationItem } from '../types';
import RenovationCalculator from './RenovationCalculator';
import { dataService } from '../services/dataService';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  userRole: UserRole;
  onUpdateReno: (items: RenovationItem[]) => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, userRole, onUpdateReno }) => {
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'snapshot'>('snapshot');
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  useEffect(() => {
    // Intentamos obtener la captura de Microlink al abrir el modal
    setSnapshotLoading(true);
    dataService.fetchExternalMetadata(property.url).then(meta => {
      setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(property.url)}?w=1600`);
      if (!meta?.screenshot) setSnapshotLoading(false);
    });
  }, [property.url]);

  const isIframeBlocked = (url: string) => {
    if (!url) return false;
    const blocked = ['remax', 'idealista', 'zillow', 'fotocasa', 'arbol', 'zonaprop', 'mercadolibre', 'portalinmobiliario', 'argenprop', 'inmuebles24', 'finca_raiz', 'tokkobroker', 'properati', 'habitaclia', 'century21'];
    return blocked.some(domain => url.toLowerCase().includes(domain));
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full bg-white shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col xl:flex-row">
        
        {/* LADO IZQUIERDO: FICHA TÉCNICA */}
        <div className="w-full xl:w-[600px] h-full overflow-y-auto border-r border-slate-200 bg-slate-50 flex flex-col custom-scrollbar">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all">
              <ChevronLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-4">
              <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {property.status}
              </span>
            </div>
          </div>

          <div className="p-8 lg:p-10 space-y-10">
            <section>
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < property.rating ? 'fill-current' : 'opacity-20'}`} />
                ))}
                <span className="text-xs font-black ml-2 text-slate-400">PROP SCORE</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-4">{property.title}</h1>
              <p className="flex items-center gap-2 text-slate-500 font-medium text-lg">
                <MapPin className="w-5 h-5 text-indigo-500" />
                {property.address}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <Euro className="w-5 h-5 text-indigo-600 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Price</p>
                <p className="text-xl font-black text-slate-900 mt-1">€{property.price.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <Ruler className="w-5 h-5 text-indigo-600 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Area</p>
                <p className="text-xl font-black text-slate-900 mt-1">{property.sqft} m²</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <Layers className="w-5 h-5 text-indigo-600 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedrooms</p>
                <p className="text-xl font-black text-slate-900 mt-1">{property.rooms}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Fees</p>
                <p className="text-xl font-black text-slate-900 mt-1">€{property.fees || 0}</p>
              </div>
            </div>

            <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp className="w-32 h-32" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Neural Insights</h3>
              <p className="text-lg font-medium leading-relaxed text-slate-300 italic">"{property.notes || 'Analysis pending...'}"</p>
            </section>

            <section>
               <RenovationCalculator property={property} userRole={userRole} onUpdate={onUpdateReno} />
            </section>
          </div>
        </div>

        {/* LADO DERECHO: VISTA DEL PORTAL (MICROLINK SNAPSHOT) */}
        <div className="flex-1 bg-slate-900 h-full relative flex flex-col overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between backdrop-blur-md z-30">
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveRefTab('snapshot')} 
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <ImageIcon className="w-3 h-3 inline mr-2" /> AI Snapshot
              </button>
              <button 
                onClick={() => setActiveRefTab('live')} 
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-50 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Monitor className="w-3 h-3 inline mr-2" /> Live Portal
              </button>
            </div>
            <div className="flex items-center gap-3">
              <a href={property.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-indigo-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                Portal Original <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="flex-1 bg-white relative">
            {activeRefTab === 'snapshot' ? (
              <div className="w-full h-full relative overflow-auto custom-scrollbar flex items-center justify-center p-8 bg-slate-100">
                {snapshotLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendering High-Fidelity Snapshot...</p>
                  </div>
                )}
                {snapshotError ? (
                  <div className="text-center max-w-sm">
                    <AlertOctagon className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                    <h4 className="text-xl font-black text-slate-800 mb-2">Capture Restricted</h4>
                    <p className="text-slate-400 text-sm mb-6">Automated capture failed. Use the original portal link to view this property.</p>
                  </div>
                ) : (
                  snapshotUrl && (
                    <img 
                      src={snapshotUrl}
                      className="max-w-full h-auto shadow-2xl rounded-2xl"
                      alt="Portal Reference"
                      onLoad={() => setSnapshotLoading(false)}
                      onError={() => { 
                        if (!snapshotUrl.includes('mshots')) {
                          setSnapshotUrl(`https://s.wordpress.com/mshots/v1/${encodeURIComponent(property.url)}?w=1600`);
                        } else {
                          setSnapshotError(true); setSnapshotLoading(false); 
                        }
                      }}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="w-full h-full relative">
                <iframe 
                  src={property.url}
                  className="w-full h-full border-none"
                  title="Live Audit"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  referrerPolicy="no-referrer"
                />
                {isIframeBlocked(property.url) && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-12 text-center">
                    <div className="max-w-md">
                      <AlertOctagon className="w-20 h-20 text-amber-500 mx-auto mb-6" />
                      <h4 className="text-2xl font-black text-white mb-2">Live Browsing Restricted</h4>
                      <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        The source portal (Idealista, RE/MAX, etc.) does not allow being viewed inside other applications for security reasons.
                        <br/><br/>
                        Use the <b>AI Snapshot</b> tab for a full visual reference without blocks.
                      </p>
                      <button onClick={() => setActiveRefTab('snapshot')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all">Switch to AI Snapshot</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-none z-20 shadow-inner"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetailModal;
