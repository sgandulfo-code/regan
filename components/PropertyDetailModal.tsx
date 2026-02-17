
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
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'snapshot'>('live');
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  useEffect(() => {
    setSnapshotLoading(true);
    dataService.fetchExternalMetadata(property.url).then(meta => {
      setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(property.url)}?w=1600`);
      if (!meta?.screenshot) setSnapshotLoading(false);
    });
  }, [property.url]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full bg-white shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col xl:flex-row">
        
        <div className="w-full xl:w-[600px] h-full overflow-y-auto border-r border-slate-200 bg-slate-50 flex flex-col custom-scrollbar">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all"><ChevronLeft className="w-5 h-5" /> Back</button>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">{property.status}</span>
          </div>

          <div className="p-8 lg:p-10 space-y-10">
            <section>
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < property.rating ? 'fill-current' : 'opacity-20'}`} />))}
                <span className="text-xs font-black ml-2 text-slate-400">PROP SCORE</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-4">{property.title}</h1>
              <p className="flex items-center gap-2 text-slate-500 font-medium text-lg"><MapPin className="w-5 h-5 text-indigo-500" />{property.address}</p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><Euro className="w-5 h-5 text-indigo-600 mb-3" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</p><p className="text-xl font-black text-slate-900 mt-1">€{property.price.toLocaleString()}</p></div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"><Ruler className="w-5 h-5 text-indigo-600 mb-3" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</p><p className="text-xl font-black text-slate-900 mt-1">{property.sqft} m²</p></div>
            </div>

            <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <TrendingUp className="absolute top-0 right-0 p-8 opacity-5 w-32 h-32" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Neural Insights</h3>
              <p className="text-lg font-medium leading-relaxed text-slate-300 italic">"{property.notes || 'No notes saved.'}"</p>
            </section>

            <section><RenovationCalculator property={property} userRole={userRole} onUpdate={onUpdateReno} /></section>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 h-full relative flex flex-col overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between backdrop-blur-md z-30">
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
              <button onClick={() => setActiveRefTab('live')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-3 h-3 inline mr-2" /> Live Portal</button>
              <button onClick={() => setActiveRefTab('snapshot')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><ImageIcon className="w-3 h-3 inline mr-2" /> AI Snapshot</button>
            </div>
            <a href={property.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-indigo-400 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">Portal <ExternalLink className="w-4 h-4" /></a>
          </div>

          <div className="flex-1 bg-white relative">
            {activeRefTab === 'live' ? (
              <iframe 
                src={property.url} 
                className="w-full h-full" 
                title="Live View" 
                allowFullScreen 
                style={{ border: 'none', background: '#fff' }} 
              />
            ) : (
              <div className="w-full h-full relative overflow-auto custom-scrollbar flex items-center justify-center p-8 bg-slate-100">
                {snapshotLoading ? (
                  <div className="flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rendering...</p></div>
                ) : snapshotUrl && (
                  <img src={snapshotUrl} className="max-w-full h-auto shadow-2xl rounded-2xl" alt="Portal Snapshot" onLoad={() => setSnapshotLoading(false)} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
