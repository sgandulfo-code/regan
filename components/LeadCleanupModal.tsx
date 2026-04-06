import React, { useState, useEffect } from 'react';
import { InboxLink } from '../services/dataService';
import { X, ExternalLink, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface LeadCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: InboxLink[];
  onAuditLeads: (leadIds: string[], unavailabilities: Record<string, boolean>) => void;
}

const BATCH_SIZE = 10;

const LeadCleanupModal: React.FC<LeadCleanupModalProps> = ({ isOpen, onClose, leads, onAuditLeads }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localStatuses, setLocalStatuses] = useState<Record<string, boolean>>({});

  // Filter out leads that don't have a URL
  const activeLeads = leads.filter(l => l.url);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      const initialStatuses: Record<string, boolean> = {};
      activeLeads.forEach(l => {
        initialStatuses[l.id] = !!l.isUnavailable;
      });
      setLocalStatuses(initialStatuses);
    }
  }, [isOpen, leads]);

  if (!isOpen) return null;

  const currentBatch = activeLeads.slice(currentIndex, currentIndex + BATCH_SIZE);
  const totalBatches = Math.ceil(activeLeads.length / BATCH_SIZE);
  const currentBatchNumber = Math.floor(currentIndex / BATCH_SIZE) + 1;

  const handleOpenLinks = () => {
    if (window.confirm(`Se abrirán ${currentBatch.length} pestañas nuevas en tu navegador. Asegúrate de permitir las ventanas emergentes (pop-ups) para este sitio.`)) {
      currentBatch.forEach(l => {
        if (l.url) window.open(l.url, '_blank');
      });
    }
  };

  const handleStatusChange = (leadId: string, isUnavailable: boolean) => {
    setLocalStatuses(prev => ({
      ...prev,
      [leadId]: isUnavailable
    }));
  };

  const handleSaveAndNext = () => {
    // Apply changes for the current batch
    const leadIds = currentBatch.map(l => l.id);
    onAuditLeads(leadIds, localStatuses);

    if (currentIndex + BATCH_SIZE < activeLeads.length) {
      setCurrentIndex(currentIndex + BATCH_SIZE);
    } else {
      onClose();
    }
  };

  if (activeLeads.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-8 text-center shadow-2xl border border-white/20">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Todo Limpio</h2>
          <p className="text-slate-500 text-sm mb-8">No hay leads pendientes con links para revisar.</p>
          <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Auditoría de Leads
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Lote {currentBatchNumber} de {totalBatches}
              </span>
            </h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Revisa si los links sugeridos siguen publicados.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition-all shadow-sm border border-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Paso 1: Abre los links</p>
              <p className="text-indigo-200 text-xs">Se abrirán {currentBatch.length} pestañas en tu navegador.</p>
            </div>
          </div>
          <button 
            onClick={handleOpenLinks}
            className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Abrir {currentBatch.length} Links
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="space-y-3">
            {currentBatch.map((lead, idx) => {
              const isUnavailable = localStatuses[lead.id];
              
              return (
                <div key={lead.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isUnavailable ? 'bg-rose-50/50 border-rose-100 opacity-75' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 flex items-center justify-center">
                    <ExternalLink className={`w-6 h-6 ${isUnavailable ? 'text-rose-300' : 'text-slate-300'}`} />
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${isUnavailable ? 'text-rose-900 line-through' : 'text-slate-800'}`}>
                      {lead.url ? new URL(lead.url).hostname : 'Link sin URL'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <a href={lead.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 uppercase tracking-wider truncate max-w-[200px]">
                        {lead.url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange(lead.id, false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${!isUnavailable ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Activo
                    </button>
                    <button
                      onClick={() => handleStatusChange(lead.id, true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isUnavailable ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <X className="w-4 h-4" /> Caído
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {currentIndex + currentBatch.length} de {activeLeads.length} leads
          </div>
          <div className="flex gap-3">
            {currentIndex > 0 && (
              <button 
                onClick={() => setCurrentIndex(currentIndex - BATCH_SIZE)}
                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            <button 
              onClick={handleSaveAndNext}
              className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
            >
              {currentIndex + BATCH_SIZE < activeLeads.length ? (
                <>Guardar y Siguiente <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Guardar y Finalizar <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeadCleanupModal;
