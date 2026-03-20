
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Save, Info } from 'lucide-react';
import { CriteriaTemplate, CriteriaField } from '../types';
import { motion, Reorder } from 'motion/react';

interface CriteriaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<CriteriaTemplate, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  editingTemplate: CriteriaTemplate | null;
}

const CriteriaTemplateModal: React.FC<CriteriaTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<CriteriaField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description || '');
      setFields(editingTemplate.fields);
    } else {
      setName('');
      setDescription('');
      setFields([
        { id: crypto.randomUUID(), label: 'Estado General', type: 'rating', required: true },
        { id: crypto.randomUUID(), label: 'Luminosidad', type: 'rating', required: true },
        { id: crypto.randomUUID(), label: 'Ubicación', type: 'rating', required: true }
      ]);
    }
  }, [editingTemplate, isOpen]);

  const addField = () => {
    const newField: CriteriaField = {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CriteriaField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        id: editingTemplate?.id,
        name,
        description,
        fields,
        agentId: editingTemplate?.agentId || '' // This will be set by the caller if needed
      });
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Criterios'}
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Define los puntos clave a evaluar</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre de la Plantilla</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Inversores, Primera Vivienda, Captación..."
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Para qué tipo de cliente o búsqueda es esta plantilla?"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-300 min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campos de Evaluación</label>
              <button 
                onClick={addField}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Campo
              </button>
            </div>

            <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-3">
              {fields.map((field) => (
                <Reorder.Item 
                  key={field.id} 
                  value={field}
                  className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 group hover:border-indigo-200 transition-all"
                >
                  <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-indigo-300">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Nombre del criterio (ej: Luminosidad)"
                      className="bg-white px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all text-sm font-bold text-slate-700"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                      className="bg-white px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 transition-all text-sm font-bold text-slate-700"
                    >
                      <option value="rating">Rating (1-5 Estrellas)</option>
                      <option value="boolean">Si / No (Check)</option>
                      <option value="text">Texto Corto</option>
                      <option value="number">Valor Numérico</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => removeField(field.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {fields.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No hay campos definidos</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || fields.length === 0}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editingTemplate ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CriteriaTemplateModal;
