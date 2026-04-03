
import React, { useState, useEffect } from 'react';
import { X, MapPin, Euro, Ruler, Layers, Star, ExternalLink, Calendar, MessageSquare, Info, ShieldCheck, TrendingUp, ChevronLeft, Monitor, ImageIcon, AlertOctagon, RefreshCw, Loader2, Navigation, Car, Clock, Maximize, Building, Trash2, DollarSign, Layout } from 'lucide-react';
import { Property, UserRole, RenovationItem, TransactionType, PropertyStatus, SearchFolder, getContextualStatuses } from '../types';
import RenovationCalculator from './RenovationCalculator';
import ClosingCostsWidget from './ClosingCostsWidget';
import { dataService } from '../services/dataService';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  userRole: UserRole;
  onUpdateReno: (items: RenovationItem[]) => void;
  onStatusChange: (id: string, status: PropertyStatus) => void;
  isEditable?: boolean;
  folders?: SearchFolder[];
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose, userRole, onUpdateReno, onStatusChange, isEditable = true, folders = [] }) => {
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'snapshot'>('live');
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const folder = folders.find(f => f.id === property.folderId);
  const isCaptacion = folder?.operation_type?.startsWith('Captación') || property.acquisitionReason === 'Captación';
  const allowedStatuses = getContextualStatuses(isCaptacion);

  useEffect(() => {
    setSnapshotLoading(true);
    dataService.fetchExternalMetadata(property.url).then(meta => {
      setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(property.url)}?w=1600`);
      if (!meta?.screenshot) setSnapshotLoading(false);
    });
  }, [property.url]);

  const TechBadge = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full bg-white shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col lg:flex-row">
        
        <div className="w-full lg:w-[500px] xl:w-[650px] h-full overflow-y-auto border-r border-slate-200 bg-slate-50 flex flex-col custom-scrollbar">
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-8 py-4 flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /> Dashboard</button>
            <div className="flex items-center gap-3">
              {isEditable ? (
                <select 
                  className="bg-indigo-50 text-indigo-600 px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  value={property.status}
                  onChange={(e) => onStatusChange(property.id, e.target.value as PropertyStatus)}
                >
                  {allowedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <span className="bg-indigo-50 text-indigo-600 px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100">{property.status}</span>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10 space-y-8 md:space-y-10 pb-20">
            <section>
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < property.rating ? 'fill-current' : 'opacity-20'}`} />))}
                <span className="text-[10px] font-black ml-2 text-slate-400 uppercase">Prop Score</span>
              </div>
              {property.code && (
                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">
                  {property.code}
                </div>
              )}
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-4">{property.title}</h1>
              <div className="space-y-1">
                <div className="flex items-start gap-2 text-slate-500 font-medium text-base md:text-lg leading-relaxed">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 shrink-0 mt-1" />
                  <p className="break-words">{property.address}</p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-600 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl text-white">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 mb-3 opacity-60" />
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Price</p>
                <p className="text-xl md:text-2xl font-black">{property.currency === 'ARS' ? '$' : 'U$S'} {property.price.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 mb-3 text-indigo-600" />
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Fees</p>
                <p className="text-xl md:text-2xl font-black text-slate-800">{property.feesCurrency === 'USD' ? 'U$S' : '$'} {property.fees || 0}</p>
              </div>
            </div>

            <section className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Info className="w-4 h-4" /> Technical Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <TechBadge icon={Layers} label="Ambientes" value={property.environments} />
                <TechBadge icon={Layers} label="Dormitorios" value={property.rooms} />
                <TechBadge icon={Layers} label="Baños" value={property.bathrooms} />
                <TechBadge icon={Ruler} label="Total Area" value={`${property.sqft} m²`} />
              </div>
            </section>

            {property.clientCustomFields && Object.keys(property.clientCustomFields).length > 0 && (
              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Criterios de Evaluación
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(property.clientCustomFields).map(([id, field]: [string, any]) => {
                    const label = typeof field === 'object' && field !== null ? field.label : id;
                    const value = typeof field === 'object' && field !== null ? field.value : field;
                    const type = typeof field === 'object' && field !== null ? field.type : 'text';
                    
                    return (
                    <div key={id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        {type === 'boolean' ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {value ? 'Sí' : 'No'}
                          </span>
                        ) : type === 'rating' ? (
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < (value || 0) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-slate-800">{String(value || 'N/A')}</p>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </section>
            )}

            <section><RenovationCalculator property={property} userRole={userRole} onUpdate={onUpdateReno} isEditable={isEditable} /></section>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 h-full min-h-[400px] lg:h-full relative flex flex-col overflow-hidden">
          <div className="p-3 md:p-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between backdrop-blur-md z-30 gap-3">
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl w-full sm:w-auto">
              <button onClick={() => setActiveRefTab('live')} className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-3 h-3 inline mr-2" /> Live Portal</button>
              <button onClick={() => setActiveRefTab('snapshot')} className={`flex-1 sm:flex-none px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><ImageIcon className="w-3 h-3 inline mr-2" /> AI Snapshot</button>
            </div>
            <a href={property.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-indigo-400 px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">Source <ExternalLink className="w-4 h-4" /></a>
          </div>

          <div className="flex-1 bg-white relative">
            {activeRefTab === 'live' ? (
              <iframe src={property.url} className="w-full h-full border-none" title="Live View" allowFullScreen style={{ background: '#fff' }} />
            ) : (
              <div className="w-full h-full relative overflow-auto custom-scrollbar flex items-center justify-center p-8 bg-slate-100">
                {snapshotLoading ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : snapshotUrl && <img src={snapshotUrl} className="max-w-full h-auto shadow-2xl rounded-2xl" alt="Portal Snapshot" onLoad={() => setSnapshotLoading(false)} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
