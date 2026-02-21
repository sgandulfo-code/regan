
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, CheckSquare, Plus, Trash2, Home, Save } from 'lucide-react';
import { Visit, Property, SearchFolder } from '../types';

interface VisitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  folders: SearchFolder[];
  activeFolderId: string | null;
  onConfirm: (visit: Omit<Visit, 'id'>) => void;
  initialData?: Visit | null;
  userId: string;
}

const VisitFormModal: React.FC<VisitFormModalProps> = ({ isOpen, onClose, properties, folders, activeFolderId, onConfirm, initialData, userId }) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    folderId: activeFolderId || '',
    userId: userId,
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    contactName: '',
    contactPhone: '',
    checklist: [
      { task: 'Verificar presión de agua', completed: false },
      { task: 'Revisar humedades en paredes', completed: false },
      { task: 'Probar persianas y ventanas', completed: false }
    ],
    notes: '',
    // Use the explicit union type for status to allow all possible Visit status values
    status: 'Scheduled' as Visit['status']
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        propertyId: initialData.propertyId,
        folderId: initialData.folderId,
        date: initialData.date,
        time: initialData.time,
        contactName: initialData.contactName || '',
        contactPhone: initialData.contactPhone || '',
        checklist: initialData.checklist || [],
        notes: initialData.notes || '',
        status: initialData.status,
        userId: initialData.userId
      });
    } else {
      setFormData(prev => ({
        ...prev,
        userId: userId,
        folderId: activeFolderId || '',
        propertyId: properties.filter(p => p.folderId === activeFolderId)[0]?.id || ''
      }));
    }
  }, [initialData, isOpen, activeFolderId, properties, userId]);

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { task: '', completed: false }]
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const updateTask = (index: number, task: string) => {
    const newList = [...formData.checklist];
    newList[index].task = task;
    setFormData(prev => ({ ...prev, checklist: newList }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyId || !formData.date) return;
    onConfirm(formData);
  };

  const filteredProperties = properties.filter(p => !formData.folderId || p.folderId === formData.folderId);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-10">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Programar Visita</h2>
                <p className="text-slate-400 text-sm font-medium">Planifica tu inspección técnica.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Home className="w-3 h-3" /> Activo a Visitar
                </label>
                <select
                  required
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                >
                  <option value="">Selecciona una propiedad</option>
                  {filteredProperties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Contacto Inmobiliaria
                </label>
                <input
                  type="text"
                  placeholder="ej: Juan Pérez"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Fecha
                </label>
                <input
                  type="date"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Hora
                </label>
                <input
                  type="time"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <CheckSquare className="w-3 h-3" /> Checklist de Inspección
                </label>
                <button type="button" onClick={addTask} className="text-[10px] font-black text-indigo-600 uppercase hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar Punto
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {formData.checklist.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                    <input
                      type="text"
                      placeholder="Tarea a verificar..."
                      className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-xs text-slate-600"
                      value={item.task}
                      onChange={(e) => updateTask(idx, e.target.value)}
                    />
                    <button type="button" onClick={() => removeTask(idx)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2.2rem] font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
              <Save className="w-5 h-5" /> AGENDAR VISITA
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitFormModal;
