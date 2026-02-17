
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, ChevronRight, Car, Layers, History, Ruler, Map as MapIcon, ImageIcon, Link as LinkIcon, ListPlus, Trash2, ArrowRight, Monitor, AlertOctagon, Loader2, X } from 'lucide-react';
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
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'map'>('live');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  
  const [editedData, setEditedData] = useState<any>({
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
      setErrorStatus('AI Quota Exceeded (429). Reset in 60s.');
      setAnalysisResult(null);
    } else if (result) {
      setAnalysisResult(result);
      setActiveRefTab(trimmedInput.startsWith('http') ? 'live' : 'map');
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
            <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-800 relative overflow-hidden min-h-[450px] flex flex-col justify-center">
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
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Neural technical Inspector</h2>
                  <p className="text-slate-400 text-sm">Paste a property link to extract tech specs instantly.</p>
                </div>
                <div className="space-y-4">
                  <textarea
                    className="w-full p-6 bg-slate-800/50 border-2 border-slate-700 rounded-[2rem] text-white focus:border-indigo-500/50 min-h-[140px] outline-none transition-all resize-none text-lg"
                    placeholder="https://..." value={input} onChange={(e) => setInput(e.target.value)}
                  />
                  {errorStatus && <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-xs font-bold"><AlertCircle className="w-5 h-5" />{errorStatus}</div>}
                </div>
                <button
                  onClick={() => handleAnalyzeWithInput(input)} disabled={isAnalyzing || !input.trim()}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 disabled:bg-slate-800 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> Run AI Inspection</>}
                </button>
              </div>
            </div>
          </div>

          {(showBulkAdd || pendingLinks.length > 0) && (
            <div className="lg:col-span-4 animate-in slide-in-from-right duration-500">
              {showBulkAdd ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><ListPlus className="w-4 h-4 text-indigo-600" /> Inbox Capture</h3>
                    <button onClick={() => setShowBulkAdd(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
                  </div>
                  <textarea
                    className="flex-1 w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-slate-700 focus:border-indigo-500 outline-none text-sm resize-none"
                    placeholder={"Paste links...\nOne per line"} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <button onClick={handleAddBulkLinks} disabled={isSyncingInbox} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase mt-4 flex items-center justify-center gap-2">
                    {isSyncingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Cloud Queue"}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col max-h-[600px]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-indigo-600" /><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analysis Queue</h3></div>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">{pendingLinks.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {pendingLinks.map((link) => (
                      <button key={link.id} onClick={() => handleSelectPendingLink(link)} className="w-full group bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all text-left flex items-center justify-between">
                        <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-indigo-500 uppercase truncate">{new URL(link.url).hostname}</p><p className="text-xs text-slate-400 truncate">{link.url}</p></div>
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
          <div className="xl:col-span-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <div><h3 className="text-xl font-black text-slate-800">Verification Engine</h3><p className="text-slate-400 text-xs">Verify the neural extractions below.</p></div>
                <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black border border-green-100">AI CONFIDENCE: {analysisResult.confidence}%</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><FormField label="Title" type="text" value={editedData.title} onChange={(v:any) => setEditedData({...editedData, title: v})} icon={Home} /></div>
                <FormField label="Price" prefix="€" value={editedData.price} onChange={(v:any) => setEditedData({...editedData, price: v})} icon={Euro} />
                <FormField label="Neighborhood" type="text" value={editedData.location} onChange={(v:any) => setEditedData({...editedData, location: v})} icon={MapPin} />
                <FormField label="Sqm Total" value={editedData.sqft} onChange={(v:any) => setEditedData({...editedData, sqft: v})} icon={Ruler} />
                <FormField label="Rooms" value={editedData.rooms} onChange={(v:any) => setEditedData({...editedData, rooms: v})} icon={Layers} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleConfirm} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all">
                  <CheckCircle2 className="w-5 h-5" /> VALIDATE & SAVE
                </button>
                <button onClick={() => setAnalysisResult(null)} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs">Discard</button>
              </div>
            </div>
          </div>
          <div className="xl:col-span-6">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl h-[650px] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-2">
                  <button onClick={() => setActiveRefTab('live')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeRefTab === 'live' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-3 h-3 inline mr-2" /> Live Source</button>
                  <button onClick={() => setActiveRefTab('map')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeRefTab === 'map' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><MapIcon className="w-3 h-3 inline mr-2" /> Map Check</button>
                </div>
                <a href={input} target="_blank" className="text-indigo-400 text-[10px] font-black uppercase flex items-center gap-2">Open Original <ExternalLink className="w-3 h-3" /></a>
              </div>
              <div className="flex-1 bg-slate-800 relative group">
                {activeRefTab === 'live' ? (
                  <div className="w-full h-full">
                    <iframe src={input} className="w-full h-full border-none bg-white" title="Source" />
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                      <div className="p-6 text-center text-white"><AlertOctagon className="w-8 h-8 mx-auto mb-2 text-amber-500" /><p className="text-xs font-bold">Portal blocks iframe? Use "Open Original" button.</p></div>
                    </div>
                  </div>
                ) : (
                  <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(editedData.exactAddress || editedData.location || 'Madrid')}&t=k&z=19&output=embed`} className="w-full h-full border-none" />
                )}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-[2.5rem]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
