
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  MapPin, 
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
  Save,
  Binary,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Search
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
  imageUrl: string;
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
type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

const FormField = ({ label, value, onChange, type = "number", icon: Icon, prefix, placeholder, error, success, loading }: any) => {
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
    <div className="space-y-1 group">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1 group-focus-within:text-indigo-500 transition-colors">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>}
        <input 
          type="text"
          inputMode={isNumeric ? "decimal" : "text"}
          value={localValue}
          onChange={handleInputChange}
          className={`w-full p-3 ${prefix ? 'pl-7' : 'pl-4'} ${error ? 'border-rose-300 bg-rose-50/50' : success ? 'border-emerald-300 bg-emerald-50/50' : 'bg-slate-50 border-slate-200'} border-2 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 text-xs transition-all`}
          placeholder={placeholder || (isNumeric ? "0" : "")}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
          {success && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
          {error && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
        </div>
      </div>
      {error && <p className="text-[8px] font-black text-rose-500 uppercase ml-1 tracking-tighter animate-in fade-in slide-in-from-left-1">{error}</p>}
      {success && <p className="text-[8px] font-black text-emerald-600 uppercase ml-1 tracking-tighter animate-in fade-in slide-in-from-left-1">Verified: {success}</p>}
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

  const [addressStatus, setAddressStatus] = useState<ValidationStatus>('idle');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editedData, setEditedData] = useState<PropertyFormData>({
    title: '', imageUrl: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: '', notes: '', rating: 3
  });

  const performAddressValidation = useCallback(async (address: string) => {
    if (!address || address.trim().length < 4) {
      setAddressStatus('idle');
      setResolvedAddress(null);
      return;
    }

    setAddressStatus('validating');
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const props = feature.properties;
        
        const parts = [
          props.name || props.street,
          props.housenumber,
          props.district || props.city,
          props.state || props.country
        ].filter(Boolean);
        
        const displayName = parts.join(', ');
        
        if (displayName.length > 3) {
          setAddressStatus('valid');
          setResolvedAddress(displayName);
        } else {
          setAddressStatus('invalid');
          setResolvedAddress(null);
        }
      } else {
        setAddressStatus('invalid');
        setResolvedAddress(null);
      }
    } catch (err) {
      console.error("Geocoding validation error:", err);
      setAddressStatus('invalid');
    }
  }, []);

  useEffect(() => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    
    if (editedData.exactAddress) {
      validationTimerRef.current = setTimeout(() => {
        performAddressValidation(editedData.exactAddress);
      }, 1000); 
    } else {
      setAddressStatus('idle');
      setResolvedAddress(null);
    }

    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, [editedData.exactAddress, performAddressValidation]);

  useEffect(() => {
    if (propertyToEdit) {
      setEditedData({
        title: propertyToEdit.title,
        imageUrl: propertyToEdit.images[0] || '',
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
      setEditedData((prev: PropertyFormData) => ({
        ...prev,
        title: analysisResult.title || prev.title,
        price: analysisResult.price || 0,
        fees: analysisResult.fees || 0,
        location: analysisResult.location || '',
        exactAddress: analysisResult.exactAddress || analysisResult.location || '',
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
          const finalScreenshot = meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(link.url)}?w=1440`;
          setSnapshotUrl(finalScreenshot);
          setEditedData((prev: PropertyFormData) => ({ ...prev, imageUrl: prev.imageUrl || finalScreenshot }));
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
    const finalScreenshot = meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1440`;
    setAnalysisResult({ title: meta?.title || '', price: 0, confidence: 1, dealScore: 50 });
    if (meta?.title) setEditedData((prev: PropertyFormData) => ({ ...prev, title: meta.title, imageUrl: finalScreenshot }));
    setSnapshotUrl(finalScreenshot);
    setStep('verify');
    setIsAnalyzing(false);
    setSnapshotLoading(false);
  };

  const handleConfirm = async () => {
    if (addressStatus === 'validating') {
      alert("Esperando validación de dirección...");
      return;
    }

    if (!editedData.exactAddress) {
      alert("Por favor, ingresa una dirección exacta para geolocalizar el activo.");
      return;
    }

    if (addressStatus === 'invalid') {
      if (!window.confirm("La dirección ingresada no se pudo validar. Esto impedirá que aparezca en el mapa. ¿Deseas guardar el activo de todas formas?")) {
        return;
      }
    }

    const finalImage = editedData.imageUrl || snapshotUrl || (propertyToEdit?.images[0]) || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(propertyToEdit?.url || processingLink?.url || '')}?w=1200`;

    if (propertyToEdit) {
      const updated: Property = {
        ...propertyToEdit,
        ...editedData,
        address: editedData.location,
        rating: editedData.rating,
        images: [finalImage]
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
      images: [finalImage],
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
    setAddressStatus('idle');
    setResolvedAddress(null);
    setEditedData({
      title: '', imageUrl: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: '', notes: '', rating: 3
    });
  };

  const getPreviewUrl = () => {
    if (propertyToEdit) return propertyToEdit.url;
    return processingLink?.url || '';
  };

  if (step === 'inbox') {
    return (
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 space-y-10">
        <section className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <LinkIcon className="w-40 h-40" />
          </div>
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
              <LinkIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Lead Collector</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Multi-portal ingestion system</p>
            </div>
          </div>
          <div className="relative">
            <textarea
              rows={4}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste listing URLs here (Zonaprop, Argenprop, etc)..."
              className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] outline-none focus:border-indigo-500 focus:bg-white transition-all text-lg font-bold placeholder:text-slate-300 resize-none shadow-inner"
            />
            <button 
              onClick={handleAddLinks}
              disabled={!urlInput.trim() || isSyncingInbox}
              className="absolute bottom-6 right-6 bg-slate-900 text-white px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 disabled:bg-slate-200 transition-all flex items-center gap-3 active:scale-95"
            >
              {isSyncingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Capture Leads
            </button>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Inbox className="w-4 h-4" /> Pending Verification ({pendingLinks.length})
            </h3>
            {isSyncingInbox && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingLinks.map(link => (
              <div key={link.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Monitor className="w-3 h-3 text-indigo-600" />
                      </div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase truncate tracking-widest">
                        {new URL(link.url).hostname.replace('www.', '')}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 truncate font-bold uppercase tracking-tight">{link.url}</p>
                  </div>
                  <button onClick={() => dataService.removeInboxLink(link.id).then(fetchInbox)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-50">
                  <button onClick={() => startProcessing(link, 'ai')} className="bg-slate-900 text-white py-4 rounded-[1.5rem] text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"><Cpu className="w-3.5 h-3.5" /> Neural</button>
                  <button onClick={() => startProcessing(link, 'manual')} className="bg-slate-50 text-slate-500 py-4 rounded-[1.5rem] text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100"><Keyboard className="w-3.5 h-3.5" /> Manual</button>
                </div>
              </div>
            ))}
            {pendingLinks.length === 0 && !isSyncingInbox && (
              <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No leads in queue. Paste some URLs above.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex items-center justify-between bg-white px-8 py-5 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-4 z-[100] backdrop-blur-md bg-white/90">
        <button onClick={resetProcessing} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Collector
        </button>
        <div className="flex items-center gap-6">
          <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${mode === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {mode === 'ai' && <Sparkles className="w-3 h-3" />}
            {propertyToEdit ? 'Asset Editor' : mode === 'ai' ? 'Neural Audit' : 'Standard Ingestion'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-6">
          <div className="bg-white rounded-[4rem] border border-slate-200 p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-12 h-full flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">Asset Audit</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  Verifying technical dimensions
                </p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-3xl">
                <Binary className="w-6 h-6" />
              </div>
            </div>
            
            <div className="flex-1 space-y-10 overflow-y-auto max-h-[700px] pr-6 custom-scrollbar">
              {isAnalyzing ? (
                <div className="py-32 text-center space-y-6">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-widest animate-pulse">Running Neural analysis</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cross-referencing portal data...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-8">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-indigo-500"></div> Core Identity
                    </h4>
                    <FormField label="Asset Commercial Title" type="text" value={editedData.title} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, title: v}))} icon={Home} placeholder="e.g. Penthouse con Terraza" />
                    
                    {/* Campo de URL de Imagen Restaurado */}
                    <FormField label="Visual Media URL" type="text" value={editedData.imageUrl} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, imageUrl: v}))} icon={ImageIcon} placeholder="https://example.com/property-photo.jpg" />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="Acquisition Price" prefix="$" value={editedData.price} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, price: v}))} icon={DollarSign} />
                      <FormField label="Monthly Expensas" prefix="$" value={editedData.fees} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, fees: v}))} icon={ShieldCheck} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 pt-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-indigo-500"></div> Geo-Intelligence
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      <FormField 
                        label="Exact Map Address (Geocoding)" 
                        type="text" 
                        value={editedData.exactAddress} 
                        onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, exactAddress: v}))} 
                        icon={Navigation} 
                        placeholder="Calle, Altura, Localidad"
                        loading={addressStatus === 'validating'}
                        success={resolvedAddress}
                        error={addressStatus === 'invalid' ? "Address could not be mapped" : null}
                      />
                      <FormField 
                        label="Commercial Display Location" 
                        type="text" 
                        value={editedData.location} 
                        onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, location: v}))} 
                        icon={MapPin} 
                        placeholder="e.g. Palermo Hollywood"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 pt-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-indigo-500"></div> Structural Matrix
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <FormField label="Ambientes" value={editedData.environments} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, environments: v}))} icon={Layers} />
                      <FormField label="Cuartos" value={editedData.rooms} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, rooms: v}))} icon={Binary} />
                      <FormField label="Baños Full" value={editedData.bathrooms} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, bathrooms: v}))} icon={Binary} />
                      <FormField label="Toilettes" value={editedData.toilets} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, toilets: v}))} icon={Binary} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 pt-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-indigo-500"></div> Surface Metrics
                    </h4>
                    <div className="grid grid-cols-3 gap-6">
                      <FormField label="Total m²" value={editedData.sqft} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, sqft: v}))} icon={Ruler} />
                      <FormField label="Cubiertos m²" value={editedData.coveredSqft} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, coveredSqft: v}))} icon={Ruler} />
                      <FormField label="Libres m²" value={editedData.uncoveredSqft} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, uncoveredSqft: v}))} icon={Ruler} />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <FormField label="Cocheras" value={editedData.parking} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, parking: v}))} icon={Car} />
                      <FormField label="Años Ant." value={editedData.age} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, age: v}))} icon={Clock} />
                      <FormField label="Piso" type="text" value={editedData.floor} onChange={(v:any) => setEditedData((prev: PropertyFormData) => ({...prev, floor: v}))} icon={Building} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 pt-6">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-indigo-500"></div> Strategy & Value
                    </h4>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ArrowRight className="w-2 h-2" /> Purchase Hypothesis
                      </label>
                      <textarea 
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-xs font-bold text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-300"
                        rows={5} 
                        placeholder="Define the buy-case for this asset..."
                        value={editedData.notes} 
                        onChange={(e) => setEditedData((prev: PropertyFormData) => ({...prev, notes: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Grade (AI Assisted)</label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setEditedData((prev: PropertyFormData) => ({...prev, rating: num}))}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all border-2 ${editedData.rating === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-500'}`}
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
              <div className="flex gap-6 pt-10 border-t border-slate-50">
                <button 
                  onClick={handleConfirm} 
                  disabled={addressStatus === 'validating'}
                  className="flex-1 bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {addressStatus === 'validating' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {propertyToEdit ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      {propertyToEdit ? 'Push Updates' : 'Commit to Portfolio'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="xl:col-span-6">
          <div className="bg-slate-900 rounded-[4rem] border border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] h-[850px] flex flex-col overflow-hidden relative group">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-2xl z-20">
              <div className="flex gap-3 bg-white/5 p-1.5 rounded-[1.8rem]">
                <button onClick={() => setActiveRefTab('live')} className={`px-6 py-3 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
                  <Monitor className="w-3.5 h-3.5" /> Source Portal
                </button>
                <button onClick={() => setActiveRefTab('snapshot')} className={`px-6 py-3 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Asset Media
                </button>
              </div>
              {activeRefTab === 'live' && (
                <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  Real-time synchronization
                </div>
              )}
            </div>
            <div className="flex-1 bg-white relative">
              {activeRefTab === 'live' ? (
                <div className="w-full h-full relative">
                   <iframe src={getPreviewUrl()} className="w-full h-full border-none" title="Lead Source Visualization" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-12 bg-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                  {snapshotLoading ? (
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating preview...</p>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <img 
                        src={editedData.imageUrl || snapshotUrl || ''} 
                        className="max-w-full h-auto shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] rounded-[2.5rem] border-4 border-white transition-all duration-700 hover:scale-[1.02]" 
                        alt="Neural Asset Preview" 
                      />
                      <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center gap-4 animate-in zoom-in duration-500 delay-300">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">AI</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Image Verified</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">External Source</p>
                        </div>
                      </div>
                    </div>
                  )}
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
