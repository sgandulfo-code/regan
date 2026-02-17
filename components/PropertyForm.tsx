
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, PencilLine, AlertCircle, ExternalLink, Eye, FileText, ChevronRight, Car, Layers, History, Ruler, Info, Map as MapIcon, Image as ImageIcon, Link as LinkIcon, ListPlus, Trash2, ArrowRight, Monitor, AlertOctagon } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [pendingLinks, setPendingLinks] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeRefTab, setActiveRefTab] = useState<'live' | 'map'>('live');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  
  const [editedData, setEditedData] = useState<any>({
    title: '',
    price: 0,
    fees: 0,
    location: '',
    exactAddress: '',
    environments: 0,
    rooms: 0,
    bathrooms: 0,
    toilets: 0,
    parking: 0,
    sqft: 0,
    coveredSqft: 0,
    uncoveredSqft: 0,
    age: 0,
    floor: ''
  });

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

  const handleAddBulkLinks = () => {
    const lines = bulkInput.split('\n');
    const urls = lines
      .map(line => line.trim())
      .filter(line => line.startsWith('http'));
    
    if (urls.length > 0) {
      setPendingLinks(prev => [...new Set([...prev, ...urls])]);
      setBulkInput('');
      setShowBulkAdd(false);
    }
  };

  const handleSelectPendingLink = (link: string) => {
    setInput(link);
    setPendingLinks(prev => prev.filter(l => l !== link));
    handleAnalyzeWithInput(link);
  };

  const handleAnalyze = async () => {
    handleAnalyzeWithInput(input);
  };

  const handleAnalyzeWithInput = async (targetInput: string) => {
    const trimmedInput = targetInput.trim();
    if (!trimmedInput) return;
    setIsAnalyzing(true);
    setErrorStatus(null);
    
    const result = await parseSemanticSearch(trimmedInput);
    
    if (result?.error === 'QUOTA_EXCEEDED') {
      setErrorStatus('AI Quota Exceeded (429). Please wait 60s for the free tier to reset.');
      setAnalysisResult(null);
    } else if (result) {
      setAnalysisResult(result);
      setActiveRefTab(trimmedInput.startsWith('http') ? 'live' : 'map');
    } else {
      setErrorStatus('Could not parse property. Check the URL/Text and try again.');
    }
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    
    const isInputUrl = input.trim().startsWith('http');
    const propertyImage = isInputUrl 
      ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(input.trim())}?w=1200`
      : `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80`;

    const newProp: Property = {
      id: Math.random().toString(36).substr(2, 9),
      folderId: '',
      title: editedData.title,
      url: isInputUrl ? input.trim() : '',
      address: editedData.location,
      exactAddress: editedData.exactAddress,
      price: editedData.price,
      fees: editedData.fees,
      environments: editedData.environments,
      rooms: editedData.rooms,
      bathrooms: editedData.bathrooms,
      toilets: editedData.toilets,
      parking: editedData.parking,
      sqft: editedData.sqft,
      coveredSqft: editedData.coveredSqft,
      uncoveredSqft: editedData.uncoveredSqft,
      age: editedData.age,
      floor: editedData.floor,
      status: PropertyStatus.WISHLIST,
      rating: Math.round(analysisResult.dealScore / 20) || 3,
      notes: analysisResult.analysis?.strategy || '',
      renovationCosts: [],
      images: [propertyImage],
      createdAt: new Date().toISOString(),
    };
    
    onAdd(newProp);
    setAnalysisResult(null);
    setInput('');
  };

  const FormField = ({ label, value, onChange, type = "number", icon: Icon, prefix }: any) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="relative group">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{prefix}</span>}
        <input 
          type={type} 
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          className={`w-full p-3.5 ${prefix ? 'pl-8' : 'pl-4'} bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all text-sm`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Search Panel */}
          <div className={`${pendingLinks.length > 0 || showBulkAdd ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-500`}>
            <div className="bg-slate-900 rounded-[3rem] p-10 md:p-12 shadow-2xl border border-slate-800 relative overflow-hidden h-full min-h-[450px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px]"></div>
              <div className="relative z-10 max-w-2xl mx-auto w-full space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  {!showBulkAdd && (
                    <button 
                      onClick={() => setShowBulkAdd(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      <ListPlus className="w-4 h-4" /> Bulk Link Inbox
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">Neural Technical Inspector</h2>
                  <p className="text-slate-400 text-sm">Paste a property URL or description to begin analysis.</p>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    className={`w-full p-6 bg-slate-800/50 border-2 ${errorStatus ? 'border-rose-500/50' : 'border-slate-700'} rounded-[2rem] text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[140px] outline-none transition-all resize-none text-lg leading-relaxed`}
                    placeholder="Paste the link from Zillow, Remax, Idealista, etc..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  
                  {errorStatus && (
                    <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-xs font-bold animate-pulse">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {errorStatus}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !input.trim()}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 disabled:bg-slate-800 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  {isAnalyzing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Run AI Inspection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel: Bulk Add or Link Inbox */}
          {(showBulkAdd || pendingLinks.length > 0) && (
            <div className="lg:col-span-4 animate-in slide-in-from-right duration-500">
              {showBulkAdd ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-indigo-600" /> Link Inbox
                    </h3>
                    <button onClick={() => setShowBulkAdd(false)} className="text-slate-400 hover:text-slate-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">Paste multiple URLs (one per line)</p>
                  <textarea
                    autoFocus
                    className="flex-1 w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-sm transition-all resize-none"
                    placeholder={"https://idealista.com/...\nhttps://fotocasa.es/..."}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                  />
                  <button
                    onClick={handleAddBulkLinks}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Load into Queue
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl h-full flex flex-col max-h-[600px]">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analysis Queue</h3>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">{pendingLinks.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {pendingLinks.map((link, idx) => {
                      let domain = "Link";
                      try { domain = new URL(link).hostname.replace('www.', ''); } catch(e) {}
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectPendingLink(link)}
                          className="w-full group bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all text-left flex items-center justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mb-0.5">{domain}</p>
                            <p className="text-xs text-slate-400 font-medium truncate">{link}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                    <button 
                      onClick={() => setShowBulkAdd(true)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                    >
                      + Add More
                    </button>
                    <button 
                      onClick={() => setPendingLinks([])}
                      className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
          <div className="xl:col-span-6 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Validation Panel</h3>
                  <p className="text-slate-400 font-medium text-sm">Compare AI data with the source on the right.</p>
                </div>
                <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${analysisResult.confidence > 80 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                  AI Certainty: {analysisResult.confidence}%
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Property Title" type="text" value={editedData.title} onChange={(val:any) => setEditedData({...editedData, title: val})} icon={Home} />
                  </div>
                  <FormField label="Exact Address" type="text" value={editedData.exactAddress} onChange={(val:any) => setEditedData({...editedData, exactAddress: val})} icon={MapPin} />
                  <FormField label="Neighborhood/City" type="text" value={editedData.location} onChange={(val:any) => setEditedData({...editedData, location: val})} icon={Maximize} />
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Listing Price" prefix="€" value={editedData.price} onChange={(val:any) => setEditedData({...editedData, price: val})} icon={Euro} />
                  <FormField label="Monthly Fees" prefix="€" value={editedData.fees} onChange={(val:any) => setEditedData({...editedData, fees: val})} icon={ShieldCheck} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <FormField label="Total m²" value={editedData.sqft} onChange={(val:any) => setEditedData({...editedData, sqft: val})} icon={Ruler} />
                  <FormField label="Covered m²" value={editedData.coveredSqft} onChange={(val:any) => setEditedData({...editedData, coveredSqft: val})} icon={Layers} />
                  <FormField label="Uncovered m²" value={editedData.uncoveredSqft} onChange={(val:any) => setEditedData({...editedData, uncoveredSqft: val})} icon={ChevronRight} />
                  <FormField label="Age (Years)" value={editedData.age} onChange={(val:any) => setEditedData({...editedData, age: val})} icon={History} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <FormField label="Environments" value={editedData.environments} onChange={(val:any) => setEditedData({...editedData, environments: val})} />
                  <FormField label="Bedrooms" value={editedData.rooms} onChange={(val:any) => setEditedData({...editedData, rooms: val})} />
                  <FormField label="Baths" value={editedData.bathrooms} onChange={(val:any) => setEditedData({...editedData, bathrooms: val})} />
                  <FormField label="Toilets" value={editedData.toilets} onChange={(val:any) => setEditedData({...editedData, toilets: val})} />
                  <FormField label="Parking" value={editedData.parking} onChange={(val:any) => setEditedData({...editedData, parking: val})} icon={Car} />
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  CONFIRM & SAVE
                </button>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-10 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-6 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden h-[750px] flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveRefTab('live')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'live' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Monitor className="w-3 h-3" /> Live Source View
                  </button>
                  <button 
                    onClick={() => setActiveRefTab('map')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRefTab === 'map' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <MapIcon className="w-3 h-3" /> Satellite Check
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {input.trim().startsWith('http') && (
                    <a href={input} target="_blank" className="p-2 text-indigo-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-black uppercase">
                      Open in New Tab <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden relative bg-slate-800">
                {activeRefTab === 'live' ? (
                  input.trim().startsWith('http') ? (
                    <div className="w-full h-full relative group">
                      <iframe 
                        src={input.trim()}
                        className="w-full h-full border-none bg-white"
                        title="Source Preview"
                      />
                      {/* Overlay for sites that block iframes */}
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center max-w-xs">
                          <AlertOctagon className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                          <p className="text-white font-bold text-sm">Site blocks embedded view?</p>
                          <p className="text-slate-400 text-[10px] mt-2 leading-relaxed">Some portals like Idealista or Zillow block iframes. Use the button above to open the original link.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center">
                      <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                      <p className="font-bold">No URL Source Available</p>
                      <p className="text-xs opacity-60 mt-2">Analysis was based on plain text description.</p>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full relative">
                    <iframe 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(editedData.exactAddress || editedData.location || 'Madrid')}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-none opacity-90 contrast-[1.2]"
                        title="Spatial Preview"
                    />
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-[2.5rem]"></div>
              </div>
              
              <div className="p-6 bg-indigo-600 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">IA Verdict</p>
                      <p className="font-black text-xl">Deal Score: {analysisResult.dealScore}/100</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white/10 rounded-2xl">
                   <p className="text-xs font-medium italic leading-relaxed opacity-90">
                    "{analysisResult.analysis?.strategy || 'Reviewing investment potential based on available data...'}"
                   </p>
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
