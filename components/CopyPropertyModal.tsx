import React, { useState } from 'react';
import { X, Copy, FolderOpen } from 'lucide-react';
import { Property, SearchFolder } from '../types';

interface CopyPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolderId: string) => void;
  property: Property | null;
  folders: SearchFolder[];
}

const CopyPropertyModal: React.FC<CopyPropertyModalProps> = ({ isOpen, onClose, onConfirm, property, folders }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  
  if (!isOpen || !property) return null;

  // Filter out the folder where the property currently is
  const availableFolders = folders.filter(f => f.id !== property.folderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFolderId) {
      onConfirm(selectedFolderId);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <Copy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Copiar Propiedad</h2>
                <p className="text-slate-500 text-sm font-medium truncate max-w-[200px]" title={property.title}>
                  {property.title}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                Carpeta Destino
              </label>
              <select
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
              >
                <option value="" disabled>Selecciona una carpeta...</option>
                {availableFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              {availableFolders.length === 0 && (
                <p className="text-xs text-rose-500 font-medium ml-2 mt-2">
                  No tienes otras carpetas disponibles para copiar esta propiedad.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedFolderId || availableFolders.length === 0}
                className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CopyPropertyModal;
