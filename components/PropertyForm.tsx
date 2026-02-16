
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, PencilLine, AlertCircle } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Editable state for the "Validation Station"
  const [editedData, setEditedData] = useState({
    title: '',
    price: 0,
    location: '',
    sqft: 0,
    rooms: 0,
    bathrooms: 0
  });

  useEffect(() => {
    if (analysisResult) {
      setEditedData({
        title: analysisResult.title || '',
        price: analysisResult.price || 0,
        location: analysisResult.location || '',
        sqft: analysisResult.sqft || 0,
        rooms: analysisResult.rooms || 0,
        bathrooms: analysisResult.bathrooms || 0
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
    
    const newProp: Property = {
      id: Math.random().toString(36).substr(2, 9),
      title: editedData.title,
      url: input.startsWith('http') ? input : '',
      address: editedData.location,
      price: editedData.price,
      rooms: editedData.rooms,
      bathrooms: editedData.bathrooms,
      sqft: editedData.sqft,
      status: PropertyStatus.WISHLIST,
      rating: Math.round(analysisResult.dealScore / 20) || 3,
      notes: analysisResult.analysis?.strategy || '',
      renovationCosts: [],
      images: [`https://picsum.photos/seed/${editedData.title}/800/600`],
      createdAt: new Date().toISOString(),
    };
    
    onAdd(newProp);
    setAnalysisResult(null);
    setInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Step 1: Input Analysis */}
      <div className={`bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border transition-all duration-500 ${analysisResult ? 'opacity-50 scale-95 blur-[1px]' : 'opacity-100 scale-100'}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI Hunter Lab</h2>
              <p className="text-slate-400 text-sm">Paste link or description. Our AI will extract the facts.</p>
            </div>
          </div>

          <div className="relative group">
            <textarea
              className="w-full p-6 pr-32 bg-slate-800/50 border border-slate-700 rounded-3xl text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[140px] outline-none transition-all resize-none text-lg"
              placeholder="Paste URL from Idealista, Fotocasa or your notes here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isAnalyzing}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className="absolute right-4 bottom-4 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-2 group-active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Validation Station (The Preview/Edit UI) */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 slide-in-from-top-10 duration-700">
          {/* Validation Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border-2 border-indigo-100 p-8 shadow-2xl shadow-indigo-100/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <PencilLine className="w-6 h-6 text-indigo-600" />
                    Validation Station
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">Verify the AI extractions before saving.</p>
                </div>
                {analysisResult.confidence < 70 && (
                  <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold border border-orange-100 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    Low confidence detection ({analysisResult.confidence}%)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Property Title</label>
                  <input 
                    type="text" 
                    value={editedData.title}
                    onChange={(e) => setEditedData({...editedData, title: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    type="text" 
                    value={editedData.location}
                    onChange={(e) => setEditedData({...editedData, location: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (€)</label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      value={editedData.price}
                      onChange={(e) => setEditedData({...editedData, price: Number(e.target.value)})}
                      className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">m²</label>
                    <input 
                      type="number" 
                      value={editedData.sqft}
                      onChange={(e) => setEditedData({...editedData, sqft: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rooms</label>
                    <input 
                      type="number" 
                      value={editedData.rooms}
                      onChange={(e) => setEditedData({...editedData, rooms: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Baths</label>
                    <input 
                      type="number" 
                      value={editedData.bathrooms}
                      onChange={(e) => setEditedData({...editedData, bathrooms: Number(e.target.value)})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Pros Identified
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis?.pros.map((pro: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                        {pro}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Critical Risks
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis?.cons.map((con: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-100">
                        {con}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
               
               <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Investment Verdict</p>
               <div className={`text-6xl font-black mb-4 ${analysisResult.dealScore > 70 ? 'text-green-400' : 'text-orange-400'}`}>
                 {analysisResult.dealScore}
               </div>
               
               <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8">
                 <p className="text-xs italic leading-relaxed text-indigo-100">
                   "{analysisResult.analysis?.strategy}"
                 </p>
               </div>

               <div className="w-full space-y-3">
                 <button
                    onClick={handleConfirm}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    APPROVE & SAVE
                  </button>
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="w-full bg-white/5 text-slate-400 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                  >
                    Cancel Analysis
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Link Reference</h4>
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl overflow-hidden">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <Maximize className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Source Material</p>
                  <p className="text-xs text-slate-600 truncate font-mono">{input.substring(0, 40)}...</p>
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
