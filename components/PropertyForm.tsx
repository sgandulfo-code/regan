
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, PencilLine, AlertCircle, ExternalLink, Eye, FileText, ChevronRight, Car, Layers, History, Ruler, Info } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
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

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setErrorStatus(null);
    
    const result = await parseSemanticSearch(input);
    
    if (result?.error === 'QUOTA_EXCEEDED') {
      setErrorStatus('AI Quota Exceeded. Please wait 60 seconds or try again later.');
      setAnalysisResult(null);
    } else if (result) {
      setAnalysisResult(result);
    } else {
      setErrorStatus('Unexpected error during extraction. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    
    // Generamos imagen de satélite basada en la dirección extraída
    const addressForMap = editedData.exactAddress || editedData.location || 'Madrid';
    const propertyImage = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(addressForMap)}&zoom=19&size=1200x800&maptype=satellite&markers=color:red%7C${encodeURIComponent(addressForMap)}&key=`;

    const newProp: Property = {
      id: Math.random().toString(36).substr(2, 9),
      folderId: '',
      title: editedData.title,
      url: input.trim().startsWith('http') ? input.trim() : '',
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
        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-800 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <div className="w-20 h-20 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Spatial Data Extractor</h2>
            <p className="text-slate-400 text-lg">Automatically map location and extract technical data from any property listing.</p>
            
            <div className="space-y-4">
              <textarea
                className={`w-full p-8 bg-slate-800/50 border-2 ${errorStatus ? 'border-rose-500/50' : 'border-slate-700'} rounded-[2rem] text-white placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[160px] outline-none transition-all resize-none text-xl leading-relaxed`}
                placeholder="Paste URL or description here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              {errorStatus && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-400 text-sm font-bold animate-pulse">
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
              {isAnalyzing ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="w-6 h-6" />}
              {isAnalyzing ? 'Connecting to AI...' : 'Analyze & Map Property'}
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-xl">
              <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Spatial Verification</h3>
                  <p className="text-slate-400 font-medium text-sm">Verify extraction before pinning to map.</p>
                </div>
                <div className="px-5 py-2 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                  AI Conf: {analysisResult.confidence}%
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField label="Title" type="text" value={editedData.title} onChange={(val:any) => setEditedData({...editedData, title: val})} icon={Home} />
                  </div>
                  <FormField label="Exact Address (Map Center)" type="text" value={editedData.exactAddress} onChange={(val:any) => setEditedData({...editedData, exactAddress: val})} icon={MapPin} />
                  <FormField label="Neighborhood" type="text" value={editedData.location} onChange={(val:any) => setEditedData({...editedData, location: val})} icon={Maximize} />
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Price" prefix="€" value={editedData.price} onChange={(val:any) => setEditedData({...editedData, price: val})} icon={Euro} />
                  <FormField label="Monthly Fees" prefix="€" value={editedData.fees} onChange={(val:any) => setEditedData({...editedData, fees: val})} icon={ShieldCheck} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <FormField label="Total m²" value={editedData.sqft} onChange={(val:any) => setEditedData({...editedData, sqft: val})} icon={Ruler} />
                  <FormField label="Covered m²" value={editedData.coveredSqft} onChange={(val:any) => setEditedData({...editedData, coveredSqft: val})} icon={Layers} />
                  <FormField label="Uncovered m²" value={editedData.uncoveredSqft} onChange={(val:any) => setEditedData({...editedData, uncoveredSqft: val})} icon={ChevronRight} />
                  <FormField label="Age" value={editedData.age} onChange={(val:any) => setEditedData({...editedData, age: val})} icon={History} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <FormField label="Amb" value={editedData.environments} onChange={(val:any) => setEditedData({...editedData, environments: val})} />
                  <FormField label="Dorm" value={editedData.rooms} onChange={(val:any) => setEditedData({...editedData, rooms: val})} />
                  <FormField label="Baths" value={editedData.bathrooms} onChange={(val:any) => setEditedData({...editedData, bathrooms: val})} />
                  <FormField label="Toilets" value={editedData.toilets} onChange={(val:any) => setEditedData({...editedData, toilets: val})} />
                  <FormField label="Park" value={editedData.parking} onChange={(val:any) => setEditedData({...editedData, parking: val})} icon={Car} />
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  VALIDATE & PIN TO MAP
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

          <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden h-[450px] flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Satellite Verification</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editedData.exactAddress || editedData.location)}`} target="_blank" className="p-2 text-indigo-400 hover:bg-white/5 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
              </div>
              <div className="flex-1 overflow-hidden relative">
                 <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(editedData.exactAddress || editedData.location || 'Madrid')}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-none opacity-90 contrast-[1.2]"
                    title="Spatial Preview"
                 />
                 <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900 rounded-[2.5rem]"></div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">AI Verdict</p>
                 <span className="text-4xl font-black">{analysisResult.dealScore}/100</span>
               </div>
               <div className="bg-white/10 rounded-2xl p-5">
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
