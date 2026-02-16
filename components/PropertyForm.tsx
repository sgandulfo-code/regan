
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, PencilLine, AlertCircle, ExternalLink, Eye, FileText, ChevronRight, Car, Layers, History, Ruler } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeRefTab, setActiveRefTab] = useState<'preview' | 'source'>('preview');
  
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
    if (analysisResult) {
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

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    const result = await parseSemanticSearch(input);
    if (result) {
      setAnalysisResult(result);
    }
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    
    const isInputUrl = input.trim().startsWith('http');
    
    // Generamos el screenshot del link si es una URL válida
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

  const isUrl = input.trim().startsWith('http');

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
        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-800 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="w-20 h-20 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">AI Multi-Source Extractor</h2>
            <p className="text-slate-400 text-lg">Paste a URL to automatically screenshot the ad and extract all technical data.</p>
            <textarea
              className="w-full p-8 bg-slate-800/50 border-2 border-slate-700 rounded-[2rem] text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[160px] outline-none transition-all resize-none text-xl leading-relaxed"
              placeholder="https://www.idealista.com/..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 disabled:bg-slate-800 transition-all flex items-center justify-center gap-3 text-lg"
            >
              {isAnalyzing ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-6 h-6" />}
              {isAnalyzing ? 'Extracting Technical Data...' : 'Start Extraction & Screenshot'}
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
          {/* LEFT: Technical Inspector */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Technical Verification</h3>
                  <p className="text-slate-400 font-medium text-sm">Contrast the AI extraction with the screenshot on the right.</p>
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
                  SAVE VALIDATED SHEET
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

          {/* RIGHT: Source Inspector */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden h-[600px] flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-2">
                  <button onClick={() => setActiveRefTab('preview')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeRefTab === 'preview' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>Screenshot</button>
                  <button onClick={() => setActiveRefTab('source')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeRefTab === 'source' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>Source</button>
                </div>
                {isUrl && <a href={input} target="_blank" className="p-2 text-indigo-400 hover:bg-white/5 rounded-lg"><ExternalLink className="w-4 h-4" /></a>}
              </div>
              <div className="flex-1 overflow-hidden relative">
                {activeRefTab === 'preview' && isUrl ? (
                  <div className="w-full h-full p-4 overflow-hidden">
                    <img 
                      src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(input.trim())}?w=1200`} 
                      className="w-full h-full object-contain rounded-xl grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-zoom-in" 
                      alt="Source Screenshot" 
                    />
                  </div>
                ) : (
                  <div className="p-8 font-mono text-xs text-indigo-300/60 leading-relaxed whitespace-pre-wrap overflow-y-auto h-full">
                    {input}
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-[2.5rem]"></div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Investment Verdict</p>
                 <span className="text-4xl font-black">{analysisResult.dealScore}/100</span>
               </div>
               <div className="bg-white/10 rounded-2xl p-5 mb-0">
                  <p className="text-sm font-medium italic leading-relaxed opacity-90">
                    "{analysisResult.analysis?.strategy}"
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;
