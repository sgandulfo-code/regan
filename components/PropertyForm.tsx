
import React, { useState } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { ICONS } from '../constants';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
      title: analysisResult.title,
      url: '', // Potentially extract from input if it was a URL
      address: analysisResult.location || 'Address pending',
      price: analysisResult.price || 0,
      rooms: analysisResult.rooms || 0,
      bathrooms: analysisResult.bathrooms || 0,
      sqft: analysisResult.sqft || 0,
      status: PropertyStatus.WISHLIST,
      rating: Math.round(analysisResult.dealScore / 20) || 3,
      notes: analysisResult.analysis?.strategy || '',
      renovationCosts: [],
      images: [`https://picsum.photos/seed/${analysisResult.title}/800/600`],
      createdAt: new Date().toISOString(),
    };
    
    onAdd(newProp);
    setAnalysisResult(null);
    setInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Bar Area */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-0"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">AI Hunter Lab</h2>
              <p className="text-slate-400 text-sm">Paste a link, a chat description, or raw property notes.</p>
            </div>
          </div>

          <div className="relative group">
            <textarea
              className="w-full p-6 pr-32 bg-slate-800/50 border border-slate-700 rounded-3xl text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[160px] outline-none transition-all resize-none text-lg"
              placeholder="Ex: 'I found a 2br apartment in Chamberí for 420k. It has a terrace, needs a full kitchen renovation. It is on Calle Almagro...'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className="absolute right-4 bottom-4 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-2 group-active:scale-95"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isAnalyzing ? 'Analyzing Potential...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Output View */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
          {/* Left: Tactical Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                  Strategic Analysis
                </h3>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Opportunity Score</p>
                  <p className={`text-4xl font-black ${analysisResult.dealScore > 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {analysisResult.dealScore}<span className="text-lg text-slate-300">/100</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths
                  </h4>
                  <ul className="space-y-3">
                    {analysisResult.analysis?.pros.map((pro: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-green-50/50 p-3 rounded-xl border border-green-100">
                        <span className="text-green-600 font-bold">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Risks
                  </h4>
                  <ul className="space-y-3">
                    {analysisResult.analysis?.cons.map((con: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                        <span className="text-orange-600 font-bold">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="bg-indigo-50 rounded-2xl p-6 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Lightbulb className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 mb-1">Recommended Strategy</h4>
                    <p className="text-indigo-700 text-sm leading-relaxed">{analysisResult.analysis?.strategy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical Card Preview & Action */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl sticky top-8">
              <div className="h-48 relative">
                <img src={`https://picsum.photos/seed/${analysisResult.title}/800/600`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                  <h4 className="text-white font-bold text-xl">{analysisResult.title}</h4>
                  <p className="text-white/70 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> {analysisResult.location}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Price</p>
                    <p className="text-lg font-black text-slate-800">€{analysisResult.price?.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Surface</p>
                    <p className="text-lg font-black text-slate-800">{analysisResult.sqft}m²</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-medium text-slate-600 px-2">
                  <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-slate-400" /> {analysisResult.rooms} Rooms</span>
                  <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4 text-slate-400" /> {analysisResult.bathrooms} Baths</span>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Confirm & Add Property
                  </button>
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                  >
                    Discard Analysis
                  </button>
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
