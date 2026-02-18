
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Euro, 
  Home, 
  ShieldCheck, 
  CheckCircle2, 
  ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  ArrowRight, 
  Monitor, 
  Loader2, 
  Cpu, 
  Keyboard, 
  Ruler, 
  Layers, 
  Plus, 
  Inbox, 
  Navigation,
  Car,
  Clock,
  Building,
  Maximize,
  Save,
  Binary,
  Hash
} from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';
import { dataService, InboxLink } from '../services/dataService';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
  userId: string;
  activeFolderId: string | null;
  propertyToEdit?: Property | null;
  onCancelEdit?: () => void;
}

interface PropertyFormData {
  title: string;
  price: number;
  fees: number;
  location: string;
  exactAddress: string;
  environments: number;
  rooms: number;
  bathrooms: number;
  toilets: number;
  parking: number;
  sqft: number;
  coveredSqft: number;
  uncoveredSqft: number;
  age: number;
  floor: string;
  notes: string;
  rating: number;
}

type CreationStep = 'inbox' | 'verify';
type ProcessingMode = 'ai' | 'manual' | 'edit' | null;

// Componente FormField definido fuera para evitar re-montajes y pérdida de foco
const FormField = ({ label, value, onChange, type = "number", icon: Icon, prefix, placeholder }: any) => {
  const isNumeric = type === "number";
  const [localValue, setLocalValue] = useState(isNumeric && value === 0 ? '' : value.toString());

  useEffect(() => {
    setLocalValue(isNumeric && value === 0 ? '' : value.toString());
  }, [value, isNumeric]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isNumeric) {
      const sanitized = val.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      const finalVal = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
      setLocalValue(finalVal);
      const numValue = finalVal === '' ? 0 : parseFloat(finalVal);
      if (!isNaN(numValue)) onChange(numValue);
    } else {
      setLocalValue(val);
      onChange(val);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>}
        <input 
          type="text"
          inputMode={isNumeric ? "decimal" : "text"}
          value={localValue}
          onChange={handleInputChange}
          className={`w-full p-2.5 ${prefix ? 'pl-7' : 'pl-3'} bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-xs transition-all`}
          placeholder={placeholder || (isNumeric ? "0" : "")}
        />
      </div>
    </div>
  );
};

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd, userId, activeFolderId, propertyToEdit, onCancelEdit }) => {
  const [step, setStep] = useState<CreationStep>(propertyToEdit ? 'verify' : 'inbox');
  const [processingLink, setProcessingLink] = useState<InboxLink | null>(null);
  const [mode, setMode] = useState<ProcessingMode>(propertyToEdit ? 'edit' : null);
  const [urlInput, setUrlInput] = useState('');
  const [pendingLinks, setPendingLinks] = useState<InboxLink[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncingInbox, setIsSyncingInbox] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'snapshot'>(propertyToEdit ? 'snapshot' : 'live');
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(propertyToEdit?.images[0] || null);

  const [editedData, setEditedData] = useState<PropertyFormData>({
    title: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: '', notes: '', rating: 3
  });

  useEffect(() => {
    if (propertyToEdit) {
      setEditedData({
        title: propertyToEdit.title,
        price: propertyToEdit.price,
        fees: propertyToEdit.fees || 0,
        location: propertyToEdit.address,
        exactAddress: propertyToEdit.exactAddress || '',
        environments: propertyToEdit.environments,
        rooms: propertyToEdit.rooms,
        bathrooms: propertyToEdit.bathrooms,
        toilets: propertyToEdit.toilets || 0,
        parking: propertyToEdit.parking || 0,
        sqft: propertyToEdit.sqft,
        coveredSqft: propertyToEdit.coveredSqft || propertyToEdit.sqft,
        uncoveredSqft: propertyToEdit.uncoveredSqft || 0,
        age: propertyToEdit.age || 0,
        floor: propertyToEdit.floor || '',
        notes: propertyToEdit.notes || '',
        rating: propertyToEdit.rating || 3
      });
      setAnalysisResult({ dealScore: propertyToEdit.rating * 20 });
    } else {
      fetchInbox();
    }
  }, [propertyToEdit, userId, activeFolderId]);

  const fetchInbox = async () => {
    setIsSyncingInbox(true);
    const links = await dataService.getInboxLinks(userId, activeFolderId);
    setPendingLinks(links);
    setIsSyncingInbox(false);
  };

  useEffect(() => {
    if (analysisResult && !analysisResult.error && !propertyToEdit) {
      setEditedData(prev => ({
        ...prev,
        title: analysisResult.title || prev.title,
        price: analysisResult.price || 0,
        fees: analysisResult.fees || 0,
        location: analysisResult.location || '',
        exactAddress: analysisResult.exactAddress || '',
        environments: analysisResult.environments || 0,
        rooms: analysisResult.rooms || 0,
        bathrooms: analysisResult.bathrooms || 0,
        toilets: analysisResult.toilets || 0,
        parking: analysisResult.parking || 0,
        sqft: analysisResult.sqft || 0,
        coveredSqft: analysisResult.coveredSqft || 0,
        uncoveredSqft: analysisResult.uncoveredSqft || 0,
        age: analysisResult.age || 0,
        floor: analysisResult.floor || ''
      }));
    }
  }, [analysisResult, propertyToEdit]);

  const handleAddLinks = async () => {
    const urls = urlInput.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (urls.length > 0) {
      setIsSyncingInbox(true);
      await dataService.addInboxLinks(urls, userId, activeFolderId);
      await fetchInbox();
      setUrlInput('');
      setIsSyncingInbox(false);
    }
  };

  const startProcessing = async (link: InboxLink, selectedMode: 'ai' | 'manual') => {
    setProcessingLink(link);
    setMode(selectedMode);
    setActiveRefTab('live'); 
    setSnapshotLoading(true);

    if (selectedMode === 'ai') {
      setIsAnalyzing(true);
      const result = await parseSemanticSearch(link.url);
      if (result && !result.error) {
        setAnalysisResult(result);
        setStep('verify');
        dataService.fetchExternalMetadata(link.url).then(meta => {
          setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(link.url)}?w=1440`);
          setSnapshotLoading(false);
        });
      } else {
        switchToManual(link.url);
      }
      setIsAnalyzing(false);
    } else {
      await switchToManual(link.url);
    }
  };

  const switchToManual = async (url: string) => {
    setIsAnalyzing(true);
    setActiveRefTab('live'); 
    const meta = await dataService.fetchExternalMetadata(url);
    setAnalysisResult({ title: meta?.title || '', price: 0, confidence: 1, dealScore: 50 });
    if (meta?.title) setEditedData(prev => ({ ...prev, title: meta.title }));
    setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1440`);
    setStep('verify');
    setIsAnalyzing(false);
    setSnapshotLoading(false);
  };

  const handleConfirm = async () => {
    if (propertyToEdit) {
      const updated: Property = {
        ...propertyToEdit,
        ...editedData,
        address: editedData.location,
        rating: editedData.rating
      };
      onAdd(updated);
      return;
    }

    if (!processingLink || !analysisResult) return;
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      folderId: activeFolderId || '',
      ...editedData,
      url: processingLink.url,
      address: editedData.location || 'Unknown Address',
      status: PropertyStatus.WISHLIST,
      rating: Math.round((analysisResult.dealScore || 50) / 20) || 3,
      notes: analysisResult.analysis?.strategy || editedData.notes || '',
      renovationCosts: [],
      images: [snapshotUrl || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(processingLink.url)}?w=1200`],
      createdAt: new Date().toISOString(),
    });
    await dataService.removeInboxLink(processingLink.id);
    await fetchInbox();
    resetProcessing();
  };

  const resetProcessing = () => {
    if (propertyToEdit && onCancelEdit) {
      onCancelEdit();
      return;
    }
    setProcessingLink(null);
    setMode(null);
    setAnalysisResult(null);
    setStep('inbox');
    setSnapshotUrl(null);
    setEditedData({
      title: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: '', notes: '', rating: 3
    });
  };

  const getPreviewUrl = () => {
    if (propertyToEdit) return propertyToEdit.url;
    return processingLink?.url || '';
  };

  if (step === 'inbox') {
    return (
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 space-y-10">
        <section className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <LinkIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lead Collector</h2>
              <p className="text-slate-500 font-medium">Add links from any property portal to your queue.</p>
            </div>
          </div>
          <div className="relative">
            <textarea
              rows={3}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste listing URLs here..."
              className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-500 focus:bg-white transition-all text-lg font-medium placeholder:text-slate-300 resize-none"
            />
            <button 
              onClick={handleAddLinks}
              disabled={!urlInput.trim() || isSyncingInbox}
              className="absolute bottom-6 right-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center gap-2"
            >
              {isSyncingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Inbox
            </button>
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-4">
            <Inbox className="w-4 h-4" /> Pending Queue ({pendingLinks.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingLinks.map(link => (
              <div key={link.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-indigo-500 uppercase truncate mb-1">{new URL(link.url).hostname.replace('www.', '')}</p>
                    <p className="text-xs text-slate-400 truncate font-medium">{link.url}</p>
                  </div>
                  <button onClick={() => dataService.removeInboxLink(link.id).then(fetchInbox)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-50">
                  <button onClick={() => startProcessing(link, 'ai')} className="bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"><Cpu className="w-3 h-3" /> Neural AI</button>
                  <button onClick={() => startProcessing(link, 'manual')} className="bg-indigo-50 text-indigo-600 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"><Keyboard className="w-3 h-3" /> Standard</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex items-center justify-between bg-white px-8 py-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <button onClick={resetProcessing} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
          <ArrowRight className="w-4 h-4 rotate-180" /> {propertyToEdit ? 'Cancel Edit' : 'Back to Inbox'}
        </button>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${mode === 'ai' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
          {propertyToEdit ? 'Editing Asset' : mode === 'ai' ? 'Neural Verification' : 'Standard Audit'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-6">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-2xl space-y-10 h-full flex flex-col">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Technical Audit</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Refine asset specifications</p>
            </div>
            
            <div className="flex-1 space-y-10 overflow-y-auto max-h-[650px] pr-4 custom-scrollbar">
              {isAnalyzing ? (
                <div className="py-20 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Neural AI processing...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b pb-2">1. Base Information</h4>
                    <FormField label="Property Title" type="text" value={editedData.title} onChange={(v:any) => setEditedData({...editedData, title: v})} icon={Home} placeholder="e.g. Luxury Penthouse" />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Price" prefix="€" value={editedData.price} onChange={(v:any) => setEditedData({...editedData, price: v})} icon={Euro} />
                      <FormField label="Monthly Fees" prefix="€" value={editedData.fees} onChange={(v:any) => setEditedData({...editedData, fees: v})} icon={ShieldCheck} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b pb-2">2. Geolocation</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Display Address" type="text" value={editedData.location} onChange={(v:any) => setEditedData({...editedData, location: v})} icon={MapPin} />
                      <FormField label="Exact Address (GPS)" type="text" value={editedData.exactAddress} onChange={(v:any) => setEditedData({...editedData, exactAddress: v})} icon={Navigation} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b pb-2">3. Internal Layout</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <FormField label="Ambientes" value={editedData.environments} onChange={(v:any) => setEditedData({...editedData, environments: v})} icon={Layers} />
                      <FormField label="Dormitorios" value={editedData.rooms} onChange={(v:any) => setEditedData({...editedData, rooms: v})} icon={Binary} />
                      <FormField label="Baños" value={editedData.bathrooms} onChange={(v:any) => setEditedData({...editedData, bathrooms: v})} icon={Binary} />
                      <FormField label="Toilets" value={editedData.toilets} onChange={(v:any) => setEditedData({...editedData, toilets: v})} icon={Binary} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b pb-2">4. Surface & Tech Specs</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Total m²" value={editedData.sqft} onChange={(v:any) => setEditedData({...editedData, sqft: v})} icon={Ruler} />
                      <FormField label="Cubiertos m²" value={editedData.coveredSqft} onChange={(v:any) => setEditedData({...editedData, coveredSqft: v})} icon={Ruler} />
                      <FormField label="Descubiertos m²" value={editedData.uncoveredSqft} onChange={(v:any) => setEditedData({...editedData, uncoveredSqft: v})} icon={Ruler} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="Cocheras" value={editedData.parking} onChange={(v:any) => setEditedData({...editedData, parking: v})} icon={Car} />
                      <FormField label="Antigüedad" value={editedData.age} onChange={(v:any) => setEditedData({...editedData, age: v})} icon={Clock} />
                      <FormField label="Piso / Planta" type="text" value={editedData.floor} onChange={(v:any) => setEditedData({...editedData, floor: v})} icon={Building} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b pb-2">5. Strategic Context</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Analysis & Personal Notes</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        rows={4} 
                        placeholder="Why this property? Any specific details to remember..."
                        value={editedData.notes} 
                        onChange={(e) => setEditedData({...editedData, notes: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rating (1-5)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setEditedData({...editedData, rating: num})}
                            className={`flex-1 py-2 rounded-lg font-black text-xs transition-all ${editedData.rating === num ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isAnalyzing && (
              <div className="flex gap-4 pt-6 border-t">
                <button onClick={handleConfirm} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-indigo-700 transition-all">
                  {propertyToEdit ? <Save className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  {propertyToEdit ? 'UPDATE ASSET' : 'SAVE TO PORTFOLIO'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="xl:col-span-6">
          <div className="bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl h-[850px] flex flex-col overflow-hidden relative">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md z-20">
              <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
                <button onClick={() => setActiveRefTab('live')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-3 h-3 inline mr-2" /> Live Portal</button>
                <button onClick={() => setActiveRefTab('snapshot')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><ImageIcon className="w-3 h-3 inline mr-2" /> AI Snapshot</button>
              </div>
            </div>
            <div className="flex-1 bg-white relative">
              {activeRefTab === 'live' ? (
                <iframe src={getPreviewUrl()} className="w-full h-full border-none" title="Portal View" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 bg-slate-100">
                  {snapshotLoading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <img src={snapshotUrl || ''} className="max-w-full h-auto shadow-2xl rounded-lg" alt="Preview" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
