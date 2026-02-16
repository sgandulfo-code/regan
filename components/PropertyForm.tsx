
import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Euro, Maximize, Home, ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, PencilLine, AlertCircle, ExternalLink, Eye, FileText, ChevronRight } from 'lucide-react';
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

  const isUrl = input.trim().startsWith('http');

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Step 1: Input Analysis */}
      {!analysisResult && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] -z-0"></div>
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">Intelligence Hub</h2>
              <p className="text-slate-400 text-lg">Paste a property link or description to start the extraction.</p>
            </div>

            <div className="relative group">
              <textarea
                className="w-full p-8 bg-slate-800/50 border-2 border-slate-700 rounded-[2rem] text-white placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 min-h-[180px] outline-none transition-all resize-none text-xl leading-relaxed"
                placeholder="https://www.idealista.com/inmueble/..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isAnalyzing}
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !input.trim()}
                className="mt-6 w-full bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-2xl hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center justify-center gap-3 text-lg active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Decoding Property Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Extract & Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Validation Station (Split View) */}
      {analysisResult && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in zoom-in-95 slide-in-from-top-10 duration-700">
          
          {/* LEFT: Data Inspector */}
          <div className="xl:col-span-7 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl relative overflow-hidden h-fit">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <PencilLine className="w-7 h-7 text-indigo-600" />
                    Fact-Check Station
                  </h3>
                  <p className="text-slate-400 font-medium">Please review and adjust the extracted data.</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">AI Confidence</div>
                   <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${analysisResult.confidence > 80 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                    {analysisResult.confidence}% Reliability
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    Title <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </label>
                  <input 
                    type="text" 
                    value={editedData.title}
                    onChange={(e) => setEditedData({...editedData, title: e.target.value})}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-800 text-lg transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    Price (€) <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </label>
                  <div className="relative group">
                    <Euro className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="number" 
                      value={editedData.price}
                      onChange={(e) => setEditedData({...editedData, price: Number(e.target.value)})}
                      className="w-full p-5 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-800 text-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    Surface (m²) <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </label>
                  <div className="relative group">
                    <Maximize className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="number" 
                      value={editedData.sqft}
                      onChange={(e) => setEditedData({...editedData, sqft: Number(e.target.value)})}
                      className="w-full p-5 pl-14 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-800 text-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    Rooms <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </label>
                  <input 
                    type="number" 
                    value={editedData.rooms}
                    onChange={(e) => setEditedData({...editedData, rooms: Number(e.target.value)})}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-800 text-xl text-center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    Bathrooms <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </label>
                  <input 
                    type="number" 
                    value={editedData.bathrooms}
                    onChange={(e) => setEditedData({...editedData, bathrooms: Number(e.target.value)})}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-slate-800 text-xl text-center"
                  />
                </div>
              </div>

              <div className="mt-10 p-6 bg-indigo-50 rounded-[1.5rem] border border-indigo-100 flex items-start gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-indigo-900 mb-1 flex items-center gap-2 uppercase text-[11px] tracking-widest">AI Strategic Advice</h4>
                  <p className="text-indigo-700/80 text-sm leading-relaxed font-medium italic">
                    "{analysisResult.analysis?.strategy}"
                  </p>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  APPROVE & ADD
                </button>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-8 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Reference Panel */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setActiveRefTab('preview')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeRefTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Link
                  </button>
                  <button 
                    onClick={() => setActiveRefTab('source')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeRefTab === 'source' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Source Text
                  </button>
                </div>
                {isUrl && (
                  <a href={input} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-xl transition-all">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>

              <div className="flex-1 overflow-hidden relative group">
                {activeRefTab === 'preview' ? (
                  isUrl ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 bg-white relative">
                        {/* Note: Many property sites block iframes. We show a friendly placeholder if it fails or use a direct link button */}
                        <iframe 
                          src={input} 
                          className="w-full h-full border-none"
                          title="Property Reference"
                        />
                        <div className="absolute inset-0 bg-slate-900/5 pointer-events-none"></div>
                        
                        {/* Overlay info if iframe is blocked or for better UX */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white shadow-2xl flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Reference</p>
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{input}</p>
                          </div>
                          <a 
                            href={input} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200"
                          >
                            Open Original <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                        <MapPin className="w-10 h-10" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">No Live Link</h4>
                      <p className="text-slate-500 text-sm max-w-[250px]">You pasted text instead of a URL. Check the Source Text tab to verify the data.</p>
                      <button 
                        onClick={() => setActiveRefTab('source')}
                        className="mt-6 text-indigo-600 text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4"
                      >
                        Switch to Source Text
                      </button>
                    </div>
                  )
                ) : (
                  <div className="h-full bg-slate-900 p-8 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Raw Extraction Buffer</span>
                    </div>
                    <pre className="text-indigo-300 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words opacity-80">
                      {input}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 blur-3xl rounded-full"></div>
               <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest">Property Appraisal</p>
                    <h4 className="text-3xl font-black">Investment Potential</h4>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-black">{analysisResult.dealScore}</p>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase">Points</p>
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
