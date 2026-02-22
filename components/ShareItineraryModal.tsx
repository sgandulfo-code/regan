
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Eye, EyeOff, Settings, Globe, Loader2, MessageCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ShareItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  userId: string;
}

const ShareItineraryModal: React.FC<ShareItineraryModalProps> = ({ isOpen, onClose, folderId, userId }) => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    showPrices: true,
    showNotes: false,
    showChecklist: false
  });

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen, folderId]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await dataService.getFolderSharedLinks(folderId);
      setLinks(data);
      if (data.length > 0) {
        setSettings(data[0].settings);
      }
    } catch (error) {
      console.error('Error loading shared links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      await dataService.createSharedItinerary(folderId, userId, settings);
      await loadLinks();
    } catch (error) {
      console.error('Error creating shared link:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await dataService.toggleSharedItinerary(id, !currentStatus);
      await loadLinks();
    } catch (error) {
      console.error('Error toggling link status:', error);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/shared/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = (id: string) => {
    const url = `${window.location.origin}/shared/${id}`;
    const text = `Hola! Aquí tienes el itinerario de visitas que preparé: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Compartir Itinerario</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Link público para el cliente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Settings className="w-3 h-3" /> Configuración de Privacidad
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Mostrar Precios</span>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, showPrices: !prev.showPrices }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.showPrices ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showPrices ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Mostrar Notas del Arquitecto</span>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, showNotes: !prev.showNotes }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.showNotes ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showNotes ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Mostrar Checklist Técnico</span>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, showChecklist: !prev.showChecklist }))}
                  className={`w-10 h-5 rounded-full transition-all relative ${settings.showChecklist ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showChecklist ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Links List */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Links Generados</p>
              
              {loading ? (
                <div className="py-10 text-center"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /></div>
              ) : links.length > 0 ? (
                links.map((link) => (
                  <div key={link.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full ${link.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                        {window.location.origin}/shared/{link.id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleActive(link.id, link.isActive)}
                        className={`p-2 rounded-xl transition-all ${link.isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-50'}`}
                        title={link.isActive ? "Desactivar Link" : "Activar Link"}
                      >
                        {link.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => shareToWhatsApp(link.id)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-600 transition-all flex items-center gap-2"
                        title="Compartir por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(link.id)}
                        className="p-2 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all flex items-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No hay links activos</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleCreateLink}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              <LinkIcon className="w-5 h-5" /> GENERAR NUEVO LINK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareItineraryModal;
