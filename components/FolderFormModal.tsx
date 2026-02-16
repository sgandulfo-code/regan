
import React, { useState } from 'react';
import { X, FolderPlus, Type, FileText, CheckCircle2 } from 'lucide-react';
import { SearchFolder } from '../types';

interface FolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folder: Omit<SearchFolder, 'id' | 'createdAt' | 'color'>) => void;
}

const FolderFormModal: React.FC<FolderFormModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onConfirm(formData);
    setFormData({ name: '', description: '' });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <FolderPlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Search</h2>
                <p className="text-slate-400 text-sm font-medium">Define a new property acquisition folder.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Folder Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Type className="w-3 h-3" />
                Folder Name
              </label>
              <input
                required
                autoFocus
                type="text"
                placeholder="e.g., Luxury Attics Madrid, Beach House Investment..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Strategic Goal
              </label>
              <textarea
                rows={3}
                placeholder="Describe your search criteria, budget limits, or target neighborhoods..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                INITIALIZE FOLDER
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
             Creation Date: {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
           </p>
        </div>
      </div>
    </div>
  );
};

export default FolderFormModal;
