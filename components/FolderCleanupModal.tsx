import React, { useState, useEffect } from 'react';
import { Property, PropertyStatus } from '../types';
import { X, ExternalLink, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface FolderCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onAuditProperties: (propertyIds: string[], statuses: Record<string, PropertyStatus>) => void;
}

const BATCH_SIZE = 10;

const FolderCleanupModal: React.FC<FolderCleanupModalProps> = ({ isOpen, onClose, properties, onAuditProperties }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localStatuses, setLocalStatuses] = useState<Record<string, PropertyStatus>>({});

  // Filter out properties that are already discarded or don't have a URL
  const activeProperties = properties.filter(p => p.status !== PropertyStatus.DESCARTADA && p.url);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      const initialStatuses: Record<string, PropertyStatus> = {};
      activeProperties.forEach(p => {
        initialStatuses[p.id] = p.status;
      });
      setLocalStatuses(initialStatuses);
    }
  }, [isOpen, properties]);

  if (!isOpen) return null;

  const currentBatch = activeProperties.slice(currentIndex, currentIndex + BATCH_SIZE);
  const totalBatches = Math.ceil(activeProperties.length / BATCH_SIZE);
  const currentBatchNumber = Math.floor(currentIndex / BATCH_SIZE) + 1;

  const handleOpenLinks = () => {
    if (window.confirm(`Se abrirán ${currentBatch.length} pestañas nuevas en tu navegador. Asegúrate de permitir las ventanas emergentes (pop-ups) para este sitio.`)) {
      currentBatch.forEach(p => {
        window.open(p.url, '_blank');
      });
    }
  };

  const handleStatusChange = (propertyId: string, newStatus: PropertyStatus) => {
    setLocalStatuses(prev => ({
      ...prev,
      [propertyId]: newStatus
    }));
  };

  const handleSaveAndNext = () => {
    // Apply changes for the current batch
    const propertyIds = currentBatch.map(p => p.id);
    onAuditProperties(propertyIds, localStatuses);

    if (currentIndex + BATCH_SIZE < activeProperties.length) {
      setCurrentIndex(currentIndex + BATCH_SIZE);
    } else {
      onClose();
    }
  };

  if (activeProperties.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-8 text-center shadow-2xl border border-white/20">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Todo Limpio</h2>
          <p className="text-slate-500 text-sm mb-8">No hay propiedades activas con links para revisar en esta carpeta.</p>
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
              Auditoría de Links
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Lote {currentBatchNumber} de {totalBatches}
              </span>
            </h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Revisa rápidamente si las propiedades siguen publicadas.</p>
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
            {currentBatch.map((property, idx) => {
              const isDiscarded = localStatuses[property.id] === PropertyStatus.DESCARTADA;
              
              return (
                <div key={property.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isDiscarded ? 'bg-rose-50/50 border-rose-100 opacity-75' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                    <img src={property.images?.[0] || 'https://picsum.photos/seed/prop/100/100'} className="w-full h-full object-cover" alt="" />
                    {isDiscarded && (
                      <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${isDiscarded ? 'text-rose-900 line-through' : 'text-slate-800'}`}>{property.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-black text-indigo-600">{property.currency} {property.price.toLocaleString()}</span>
                      <a href={property.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 uppercase tracking-wider">
                        Ver Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStatusChange(property.id, property.status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${!isDiscarded ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Activa
                    </button>
                    <button
                      onClick={() => handleStatusChange(property.id, PropertyStatus.DESCARTADA)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${isDiscarded ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <X className="w-4 h-4" /> Caída
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
            {currentIndex + currentBatch.length} de {activeProperties.length} propiedades
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
              {currentIndex + BATCH_SIZE < activeProperties.length ? (
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

export default FolderCleanupModal;
