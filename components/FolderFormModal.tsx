
import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Type, FileText, CheckCircle2, Save, Calendar, Activity, DollarSign, ArrowLeftRight, Camera, UploadCloud, Eye, EyeOff } from 'lucide-react';
import { SearchFolder, FolderStatus, TransactionType } from '../types';
import Editor from 'react-simple-wysiwyg';
import { dataService } from '../services/dataService';

interface FolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folder: Omit<SearchFolder, 'id' | 'createdAt' | 'color' | 'statusUpdatedAt'>) => void;
  initialData?: SearchFolder | null;
}

const FolderFormModal: React.FC<FolderFormModalProps> = ({ isOpen, onClose, onConfirm, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: FolderStatus.PENDIENTE,
    transactionType: TransactionType.COMPRA,
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    welcomeMessage: '',
    imageUrl: '',
    isImagePublic: true
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        status: initialData.status || FolderStatus.PENDIENTE,
        transactionType: initialData.transactionType || TransactionType.COMPRA,
        budget: initialData.budget || 0,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        welcomeMessage: initialData.welcomeMessage || '',
        imageUrl: initialData.imageUrl || '',
        isImagePublic: initialData.isImagePublic ?? true
      });
    } else {
      setFormData({ 
        name: '', 
        description: '', 
        status: FolderStatus.PENDIENTE, 
        transactionType: TransactionType.COMPRA,
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        welcomeMessage: '',
        imageUrl: '',
        isImagePublic: true
      });
    }
  }, [initialData, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      try {
        const url = await dataService.uploadFolderImage(file);
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error al subir la imagen');
      } finally {
        setUploading(false);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <FolderPlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {initialData ? 'Ajustar Parámetros' : 'Nueva Tesis de Búsqueda'}
                </h2>
                <p className="text-slate-400 text-sm font-medium">Define los límites y objetivos de adquisición.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Type className="w-3 h-3" />
                Nombre del Objetivo
              </label>
              <input
                required
                autoFocus
                type="text"
                placeholder="ej: Inversión Monoambiente Recoleta..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <ArrowLeftRight className="w-3 h-3" />
                  Operación
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {Object.values(TransactionType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, transactionType: type })}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.transactionType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Presupuesto Máx.
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full p-5 pl-10 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={formData.budget === 0 ? '' : formData.budget}
                    placeholder="0"
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Estado Inicial
                </label>
                <select
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FolderStatus })}
                >
                  {Object.values(FolderStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Inicio de Búsqueda
                </label>
                <input
                  type="date"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Mensaje de Bienvenida
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Bienvenido a tu búsqueda personalizada..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Notas Estratégicas
              </label>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                <Editor
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  containerProps={{ style: { height: '200px', border: 'none' } }}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" /> Imagen de Portada
              </label>
              <div className="flex flex-col gap-4">
                {formData.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 group">
                    <img 
                      src={formData.imageUrl} 
                      alt="Folder cover" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                      {uploading ? <Activity className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-600">Haz clic para subir</p>
                      <p className="text-xs text-slate-400">JPG, PNG o WEBP</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}

                {formData.imageUrl && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isImagePublic ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                        {formData.isImagePublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Visibilidad en Shared</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {formData.isImagePublic ? 'Público: se verá en el link compartido' : 'Privado: solo tú lo verás'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isImagePublic: !prev.isImagePublic }))}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.isImagePublic ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${formData.isImagePublic ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                {initialData ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                {initialData ? 'GUARDAR' : 'CREAR TESIS'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FolderFormModal;
