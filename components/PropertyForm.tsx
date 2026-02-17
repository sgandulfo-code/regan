
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, ChevronRight, Car, Layers, History, Ruler, Map as MapIcon, ImageIcon, Link as LinkIcon, ListPlus, Trash2, ArrowRight, Monitor, AlertOctagon, Loader2, X, Info, FileSearch } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';
import { dataService, InboxLink } from '../services/dataService';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
  userId: string;
  activeFolderId: string | null;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd, userId, activeFolderId }) => {
  const [input, setInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [pendingLinks, setPendingLinks] = useState<InboxLink[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncingInbox, setIsSyncingInbox] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'map' | 'snapshot'>('snapshot');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  
  const [editedData, setEditedData] = useState<any>({
    title: '', price: 0, fees: 0, location: '', exactAddress: '', environments: 0, rooms: 0, bathrooms: 0, toilets: 0, parking: 0, sqft: 0, coveredSqft: 0, uncoveredSqft: 0, age: 0, floor: ''
  });

  // Detectar si el portal suele bloquear iframes
  const isIframeBlocked = (url: string) => {
    const blocked = ['remax', 'idealista', 'zillow', 'fotocasa', 'arbol', 'zonaprop'];
    return blocked.some(domain => url.toLowerCase().includes(domain));
  };

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
        title: analysisResult.title || '',
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
      // Si el sitio bloquea iframes, preferimos Snapshot por defecto
      if (input.trim().startsWith('http') && isIframeBlocked(input)) {
        setActiveRefTab('snapshot');
      } else {
        setActiveRefTab('live');
      }
    }
  }, [analysisResult]);

  const handleAddBulkLinks = async () => {
    const urls = bulkInput.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (urls.length > 0) {
      setIsSyncingInbox(true);
      await dataService.addInboxLinks(urls, userId, activeFolderId);
      await fetchInbox();
      setBulkInput('');
      setShowBulkAdd(false);
      setIsSyncingInbox(false);
    }
  };

  const handleSelectPendingLink = async (link: InboxLink) => {
    setInput(link.url);
    setIsSyncingInbox(true);
    await dataService.removeInboxLink(link.id);
    await fetchInbox();
    handleAnalyzeWithInput(link.url);
    setIsSyncingInbox(false);
  };

  const handleAnalyzeWithInput = async (targetInput: string) => {
    const trimmedInput = targetInput.trim();
    if (!trimmedInput) return;
    setIsAnalyzing(true);
    setErrorStatus(null);
    const result = await parseSemanticSearch(trimmedInput);
    if (result?.error === 'QUOTA_EXCEEDED') {
      setErrorStatus('AI Quota Exceeded. Reset in 60s.');
      setAnalysisResult(null);
    } else if (result) {
      setAnalysisResult(result);
    } else {
      setErrorStatus('Analysis failed. Try checking the URL.');
    }
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    const isUrl = input.trim().startsWith('http');
    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      folderId: activeFolderId || '',
      ...editedData,
      url: isUrl ? input.trim() : '',
      address: editedData.location,
      status: PropertyStatus.WISHLIST,
      rating: Math.round(analysisResult.dealScore / 20) || 3,
      notes: analysisResult.analysis?.strategy || '',
      renovationCosts: [],
      images: [isUrl ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(input.trim())}?w=1200` : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'],
      createdAt: new Date().toISOString(),
    });
    setAnalysisResult(null);
    setInput('');
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
          className={`w-full p-2.5 ${prefix ? 'pl-7' : 'pl-3'} bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-xs`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in duration-500">
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`${pendingLinks.length > 0 || showBulkAdd ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
            <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 relative overflow-hidden min-h-[480px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px]"></div>
              <div className="relative z-10 max-w-2xl mx-auto w-full space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  {!showBulkAdd && (
                    <button onClick={() => setShowBulkAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase hover:bg-white/10 transition-all">
                      <ListPlus className="w-4 h-4" /> Bulk Inbox
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black text-white tracking-tighter">Neural technical Inspector</h2>
                  <p className="text-slate-400 text-sm">Our AI navigates and extracts real data from any real estate portal.</p>
                </div>
                <div className="space-y-4">
                  <textarea
                    className="w-full p-7 bg-slate-800/50 border-2 border-slate-700 rounded-[2.5rem] text-white focus:border-indigo-500/50 min-h-[160px] outline-none transition-all resize-none text-xl tracking-tight"
                    placeholder="Paste the property link here..." value={input} onChange={(e) => setInput(e.target.value)}
                  />
                  {errorStatus && <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-xs font-bold"><AlertCircle className="w-5 h-5" />{errorStatus}</div>}
                </div>
                <button
                  onClick={() => handleAnalyzeWithInput(input)} disabled={isAnalyzing || !input.trim()}
                  className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black shadow-2xl hover:bg-indigo-500 disabled:bg-slate-800 transition-all flex items-center justify-center gap-4 text-xl"
                >
                  {isAnalyzing ? <Loader2 className="w-7 h-7 animate-spin" /> : <><Sparkles className="w-7 h-7" /> Inspect Property</>}
                </button>
              </div>
            </div>
          </div>

          {(showBulkAdd || pendingLinks.length > 0) && (
            <div className="lg:col-span-4 animate-in slide-in-from-right duration-500">
              {showBulkAdd ? (
                <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ListPlus className="w-4 h-4 text-indigo-600" /> Cloud Queue</h3>
                    <button onClick={() => setShowBulkAdd(false)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                  <textarea
                    className="flex-1 w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-slate-700 focus:border-indigo-500 outline-none text-sm resize-none"
                    placeholder={"Paste links...\nOne per line"} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <button onClick={handleAddBulkLinks} disabled={isSyncingInbox} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase mt-4 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    {isSyncingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Cloud"}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col max-h-[600px]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-indigo-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inbox</h3></div>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">{pendingLinks.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {pendingLinks.map((link) => (
                      <button key={link.id} onClick={() => handleSelectPendingLink(link)} className="w-full group bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left flex items-center justify-between">
                        <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-indigo-500 uppercase truncate">{new URL(link.url).hostname.replace('www.', '')}</p><p className="text-xs text-slate-400 truncate font-medium">{link.url}</p></div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
          <div className="xl:col-span-5">
            <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-2xl space-y-8 h-full flex flex-col">
              <div className="flex items-center justify-between border-b pb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Verification Engine</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Cross-check AI extractions</p>
                </div>
                <div className="text-right">
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> AI CONFIDENCE: {Math.round(analysisResult.confidence * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Full Property Title" type="text" value={editedData.title} onChange={(v:any) => setEditedData({...editedData, title: v})} icon={Home} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Price" prefix="€" value={editedData.price} onChange={(v:any) => setEditedData({...editedData, price: v})} icon={Euro} />
                  <FormField label="Neighborhood" type="text" value={editedData.location} onChange={(v:any) => setEditedData({...editedData, location: v})} icon={MapPin} />
                  <FormField label="Total m²" value={editedData.sqft} onChange={(v:any) => setEditedData({...editedData, sqft: v})} icon={Ruler} />
                  <FormField label="Rooms" value={editedData.rooms} onChange={(v:any) => setEditedData({...editedData, rooms: v})} icon={Layers} />
                </div>

                {/* Grounding Evidence */}
                {analysisResult.sources && analysisResult.sources.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <FileSearch className="w-3 h-3 text-indigo-500" /> Grounding Evidences
                    </p>
                    <div className="space-y-3">
                      {analysisResult.sources.map((chunk: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-slate-100">
                          <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                          <p className="text-[11px] text-slate-600 leading-tight font-medium">"{chunk.web?.title || 'Data found on portal'}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 mt-auto">
                <button onClick={handleConfirm} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  <CheckCircle2 className="w-6 h-6" /> VALIDATE & SAVE
                </button>
                <button onClick={() => setAnalysisResult(null)} className="px-10 bg-slate-100 text-slate-500 rounded-3xl font-bold text-sm hover:bg-slate-200 transition-all">Discard</button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl h-[750px] flex flex-col overflow-hidden relative">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl">
                  <button onClick={() => setActiveRefTab('snapshot')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'snapshot' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
                    <ImageIcon className="w-3 h-3 inline mr-2" /> Neural Snapshot
                  </button>
                  <button onClick={() => setActiveRefTab('live')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
                    <Monitor className="w-3 h-3 inline mr-2" /> Live Portal
                  </button>
                  <button onClick={() => setActiveRefTab('map')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'map' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>
                    <MapIcon className="w-3 h-3 inline mr-2" /> Satellite
                  </button>
                </div>
                <a href={input} target="_blank" className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-indigo-400 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all">
                  OPEN ORIGINAL <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="flex-1 bg-slate-800 relative overflow-hidden">
                {activeRefTab === 'snapshot' && (
                  <div className="w-full h-full relative group">
                    <img 
                      src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(input.trim())}?w=1600`} 
                      className="w-full h-full object-contain bg-white" 
                      alt="High Fidelity Preview"
                    />
                    <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><ImageIcon className="w-5 h-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">Source Snapshot</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Dynamic capture for verification</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeRefTab === 'live' && (
                  <div className="w-full h-full relative group">
                    <iframe 
                      src={input} 
                      className="w-full h-full border-none bg-white" 
                      title="Source Portal" 
                      sandbox="allow-same-origin allow-scripts"
                    />
                    {/* El overlay informativo para sitios bloqueados */}
                    {isIframeBlocked(input) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
                        <div className="max-w-md p-10 bg-slate-900 border border-white/10 rounded-[3rem] text-center shadow-3xl">
                           <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                              <AlertOctagon className="w-10 h-10" />
                           </div>
                           <h4 className="text-xl font-black text-white mb-2">Portal Security Active</h4>
                           <p className="text-slate-400 text-sm leading-relaxed mb-8">This portal (RE/MAX, Idealista, etc.) blocks embedded views for security. Use <b>"Neural Snapshot"</b> above or open the original site to validate.</p>
                           <button 
                             onClick={() => setActiveRefTab('snapshot')}
                             className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                           >
                              Switch to AI Snapshot
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeRefTab === 'map' && (
                  <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(editedData.exactAddress || editedData.location || 'Madrid')}&t=k&z=19&output=embed`} 
                    className="w-full h-full border-none opacity-90 contrast-[1.1]" 
                  />
                )}
                
                {/* Marco estético del simulador */}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-[3.5rem] shadow-inner"></div>
              </div>
              
              <div className="p-8 bg-indigo-600 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Neural Verdict</p>
                      <h4 className="text-2xl font-black">Deal Score: {analysisResult.dealScore}/100</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Investment Potential</p>
                    <p className="text-xs font-bold mt-1 max-w-xs line-clamp-2">"{analysisResult.analysis?.strategy || 'Analyzing investment viability...'}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
