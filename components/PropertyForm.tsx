
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Euro, 
  Home, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  ArrowRight, 
  Monitor, 
  AlertOctagon, 
  Loader2, 
  Cpu, 
  Keyboard, 
  RefreshCw, 
  Ruler, 
  Layers, 
  Plus, 
  Inbox, 
  ClipboardList 
} from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';
import { dataService, InboxLink } from '../services/dataService';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
  userId: string;
  activeFolderId: string | null;
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
}

type CreationStep = 'inbox' | 'verify';
type ProcessingMode = 'ai' | 'manual' | null;

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd, userId, activeFolderId }) => {
  const [step, setStep] = useState<CreationStep>('inbox');
  const [processingLink, setProcessingLink] = useState<InboxLink | null>(null);
  const [mode, setMode] = useState<ProcessingMode>(null);
  const [urlInput, setUrlInput] = useState('');
  const [pendingLinks, setPendingLinks] = useState<InboxLink[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncingInbox, setIsSyncingInbox] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'snapshot'>('live');
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const [editedData, setEditedData] = useState<PropertyFormData>({
    title: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: ''
  });

  useEffect(() => {
    fetchInbox();
  }, [userId, activeFolderId]);

  const fetchInbox = async () => {
    setIsSyncingInbox(true);
    const links = await dataService.getInboxLinks(userId, activeFolderId);
    setPendingLinks(links);
    setIsSyncingInbox(false);
  };

  useEffect(() => {
    if (analysisResult && !analysisResult.error) {
      setEditedData({
        title: analysisResult.title || editedData.title || '',
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
      });
    }
  }, [analysisResult]);

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

  const isIframeBlocked = (url: string) => {
    if (!url) return false;
    const blocked = ['remax', 'idealista', 'zillow', 'fotocasa', 'arbol', 'zonaprop', 'mercadolibre', 'portalinmobiliario', 'argenprop', 'inmuebles24', 'finca_raiz', 'tokkobroker', 'properati', 'habitaclia', 'century21', 'vivienda', 'pisos.com', 'yaencontre'];
    return blocked.some(domain => url.toLowerCase().includes(domain));
  };

  const startProcessing = async (link: InboxLink, selectedMode: 'ai' | 'manual') => {
    setProcessingLink(link);
    setMode(selectedMode);
    
    // Default to 'live' (iframe) as requested for the standard experience
    setActiveRefTab('live'); 
    
    setSnapshotLoading(true);
    setSnapshotError(false);
    setSnapshotUrl(null);

    if (selectedMode === 'ai') {
      setIsAnalyzing(true);
      setErrorStatus(null);
      const result = await parseSemanticSearch(link.url);
      
      if (result && !result.error) {
        setAnalysisResult(result);
        setStep('verify');
        // Pre-fetch snapshot in background
        dataService.fetchExternalMetadata(link.url).then(meta => {
          setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(link.url)}?w=1440`);
          setSnapshotLoading(false);
        });
      } else {
        const isQuota = result?.error === 'QUOTA_EXCEEDED';
        setErrorStatus(isQuota ? 'Gemini AI Quota Exhausted (429). Switching to Standard mode.' : 'Neural analysis failed.');
        setTimeout(() => switchToManual(link.url), isQuota ? 2000 : 500);
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
    
    setAnalysisResult({ 
      title: meta?.title || '', 
      price: 0, 
      confidence: 1, 
      dealScore: 50, 
      analysis: { strategy: 'Standard audit mode activated. Iframe prioritizing.' }, 
      sources: []
    });
    
    if (meta?.title) {
       setEditedData((prev: PropertyFormData) => ({ ...prev, title: meta.title }));
    }

    setSnapshotUrl(meta?.screenshot || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1440`);
    setStep('verify');
    setIsAnalyzing(false);
    setSnapshotLoading(false);
  };

  const handleConfirm = async () => {
    if (!processingLink || !analysisResult) return;
    
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      folderId: activeFolderId || '',
      ...editedData,
      url: processingLink.url,
      address: editedData.location || 'Unknown Address',
      status: PropertyStatus.WISHLIST,
      rating: Math.round((analysisResult.dealScore || 50) / 20) || 3,
      notes: analysisResult.analysis?.strategy || '',
      renovationCosts: [],
      images: [snapshotUrl || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(processingLink.url)}?w=1200`],
      createdAt: new Date().toISOString(),
    });

    await dataService.removeInboxLink(processingLink.id);
    await fetchInbox();
    resetProcessing();
  };

  const resetProcessing = () => {
    setProcessingLink(null);
    setMode(null);
    setAnalysisResult(null);
    setStep('inbox');
    setErrorStatus(null);
    setSnapshotUrl(null);
    setEditedData({
      title: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: ''
    });
  };

  const FormField = ({ label, value, onChange, type = "number", icon: Icon, prefix }: any) => (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>}
        <input 
          type={type} value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          className={`w-full p-2.5 ${prefix ? 'pl-7' : 'pl-3'} bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-xs transition-all`}
        />
      </div>
    </div>
  );

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
              placeholder="Paste listing URLs here (one per line)..."
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
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Pending Queue ({pendingLinks.length})
            </h3>
            {pendingLinks.length > 0 && (
              <button 
                onClick={() => { if(window.confirm('Clear all pending links?')) dataService.clearInbox(userId, activeFolderId).then(fetchInbox) }} 
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {pendingLinks.length === 0 ? (
            <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ClipboardList className="w-10 h-10 text-slate-200" />
               </div>
               <p className="text-slate-400 font-medium italic">Your inbox is empty. Start by adding some listing URLs above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLinks.map(link => (
                <div key={link.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-indigo-500 uppercase truncate mb-1">
                        {new URL(link.url).hostname.replace('www.', '')}
                      </p>
                      <p className="text-xs text-slate-400 truncate font-medium">{link.url}</p>
                    </div>
                    <button 
                      onClick={() => dataService.removeInboxLink(link.id).then(fetchInbox)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => startProcessing(link, 'ai')}
                      className="bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                      <Cpu className="w-3 h-3" /> Neural AI
                    </button>
                    <button 
                      onClick={() => startProcessing(link, 'manual')}
                      className="bg-indigo-50 text-indigo-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      <Keyboard className="w-3 h-3" /> Standard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between bg-white px-8 py-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <button onClick={resetProcessing} className="text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Inbox
        </button>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${mode === 'ai' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {mode === 'ai' ? 'Neural Verification' : 'Standard Audit'}
          </div>
        </div>
      </div>

      {errorStatus && errorStatus.toLowerCase().includes('quota') && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center gap-3 text-amber-700 text-xs font-bold animate-in slide-in-from-top-4">
           <AlertCircle className="w-5 h-5 shrink-0" />
           <span>{errorStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-5">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-2xl space-y-8 h-full flex flex-col">
            <div className="flex items-center justify-between border-b pb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Asset Audit</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Confirm data before importing to search folder</p>
              </div>
              {mode === 'ai' && !isAnalyzing && (
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> CONFIDENCE: {Math.round((analysisResult?.confidence || 0) * 100)}%
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-5 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isAnalyzing ? (
                <div className="py-20 text-center space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {mode === 'ai' ? 'Neural AI is parsing listing data...' : 'Fetching portal metadata...'}
                  </p>
                </div>
              ) : (
                <>
                  <FormField label="Property Title" type="text" value={editedData.title} onChange={(v:any) => setEditedData({...editedData, title: v})} icon={Home} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Price" prefix="€" value={editedData.price} onChange={(v:any) => setEditedData({...editedData, price: v})} icon={Euro} />
                    <FormField label="Location" type="text" value={editedData.location} onChange={(v:any) => setEditedData({...editedData, location: v})} icon={MapPin} />
                    <FormField label="Area m²" value={editedData.sqft} onChange={(v:any) => setEditedData({...editedData, sqft: v})} icon={Ruler} />
                    <FormField label="Bedrooms" value={editedData.rooms} onChange={(v:any) => setEditedData({...editedData, rooms: v})} icon={Layers} />
                    <FormField label="Bathrooms" value={editedData.bathrooms} onChange={(v:any) => setEditedData({...editedData, bathrooms: v})} icon={Layers} />
                    <FormField label="Monthly Fees" prefix="€" value={editedData.fees} onChange={(v:any) => setEditedData({...editedData, fees: v})} icon={ShieldCheck} />
                  </div>
                  {errorStatus && !errorStatus.toLowerCase().includes('quota') && (
                    <div className="p-4 bg-rose-50 text-rose-500 text-[10px] font-bold uppercase rounded-2xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {errorStatus}
                    </div>
                  )}
                </>
              )}
            </div>

            {!isAnalyzing && (
              <div className="flex gap-4 pt-6 mt-auto">
                <button onClick={handleConfirm} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-indigo-700 transition-all">
                  <CheckCircle2 className="w-6 h-6" /> IMPORT ASSET
                </button>
                <button onClick={resetProcessing} className="px-10 bg-slate-100 text-slate-500 rounded-3xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl h-[750px] flex flex-col overflow-hidden relative">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md z-20">
              <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
                <button onClick={() => setActiveRefTab('live')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <Monitor className="w-3 h-3 inline mr-2" /> Live Portal
                </button>
                <button onClick={() => setActiveRefTab('snapshot')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  <ImageIcon className="w-3 h-3 inline mr-2" /> AI Snapshot
                </button>
              </div>
              <a href={processingLink?.url} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-indigo-400 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all">
                ORIGINAL <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
              {activeRefTab === 'live' ? (
                <div className="w-full h-full relative">
                  <iframe 
                    src={processingLink?.url} 
                    className="w-full h-full border-none" 
                    title="Live Portal View" 
                    allowFullScreen
                    style={{ border: 'none' }}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                  {isIframeBlocked(processingLink?.url || '') && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-12 text-center z-10 pointer-events-none">
                      <div className="max-w-md pointer-events-auto">
                        <AlertOctagon className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                        <h4 className="text-xl font-black text-white mb-2">Embedded View restricted</h4>
                        <p className="text-slate-400 text-sm mb-8">
                          The listing portal blocks direct embedding.
                          <br/><br/>
                          Try the <b>AI Snapshot</b> or open the <b>Original</b> link.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <button onClick={() => setActiveRefTab('snapshot')} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">View Snapshot</button>
                          <a href={processingLink?.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Open Original</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative overflow-auto custom-scrollbar flex items-center justify-center bg-slate-100 p-8">
                  {snapshotLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 text-center">
                      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Visual Snapshot...</p>
                    </div>
                  )}
                  {snapshotUrl ? (
                    <img 
                      src={snapshotUrl} 
                      className="max-w-full h-auto shadow-2xl rounded-lg" 
                      alt="Property Preview"
                      onLoad={() => setSnapshotLoading(false)}
                      onError={() => { 
                        if (!snapshotUrl.includes('mshots')) {
                           setSnapshotUrl(`https://s.wordpress.com/mshots/v1/${encodeURIComponent(processingLink?.url || '')}?w=1440`);
                        } else {
                           setSnapshotError(true); setSnapshotLoading(false);
                        }
                      }}
                    />
                  ) : !snapshotLoading && (
                    <div className="text-center p-12">
                      <AlertOctagon className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                      <h4 className="text-xl font-black text-slate-800 mb-2">Capture Restricted</h4>
                      <p className="text-slate-400 text-sm">Automated capture blocked by portal. Please use original link.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === 'ai' && !isAnalyzing && analysisResult?.dealScore && (
              <div className="p-8 bg-indigo-600 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Neural Verdict</p>
                      <h4 className="text-2xl font-black">Deal Score: {analysisResult?.dealScore || '??'}/100</h4>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
