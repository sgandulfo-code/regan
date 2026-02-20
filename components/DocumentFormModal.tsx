
import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Save, Link, Layers, Home, Info } from 'lucide-react';
import { PropertyDocument, DocCategory, Property, SearchFolder } from '../types';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  folders: SearchFolder[];
  activeFolderId: string | null;
  onConfirm: (doc: Omit<PropertyDocument, 'id' | 'createdAt'>) => void;
}

const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ isOpen, onClose, properties, folders, activeFolderId, onConfirm }) => {
  const [formData, setFormData] = useState({
    folderId: activeFolderId || '',
    propertyId: '',
    name: '',
    category: DocCategory.OTHER,
    fileUrl: '',
    fileType: 'application/pdf'
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      folderId: activeFolderId || folders[0]?.id || '',
      propertyId: ''
    }));
  }, [isOpen, activeFolderId, folders]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.folderId || !formData.name || !formData.fileUrl) return;
    onConfirm(formData);
  };

  const filteredProperties = properties.filter(p => p.folderId === formData.folderId);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vincular Documento</h2>
                <p className="text-slate-400 text-sm font-medium">Bóveda técnica centralizada.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Info className="w-3 h-3" /> Nombre del Archivo
              </label>
              <input
                required
                type="text"
                placeholder="ej: Plano de Mensura Palermo.pdf"
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Categoría
                </label>
                <select
                  required
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as DocCategory })}
                >
                  {/* Fixed: Explicitly cast the category array to string[] to resolve TypeScript unknown type error */}
                  {(Object.values(DocCategory) as string[]).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Home className="w-3 h-3" /> Activo Relacionado (Opcional)
                </label>
                <select
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                >
                  <option value="">Carpeta General</option>
                  {filteredProperties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Link className="w-3 h-3" /> URL del Documento
              </label>
              <input
                required
                type="url"
                placeholder="https://drive.google.com/..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2.2rem] font-black shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> REGISTRAR DOCUMENTO
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentFormModal;