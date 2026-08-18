import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { TransactionType } from '../types';
import { Plus, Trash2, Edit2, Save, X, FileText, DollarSign, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { STAGES_COMPRA, STAGES_VENTA } from './ClientProgressBar';

export default function StageTemplateManager() {
  const [transactionType, setTransactionType] = useState<string>('Venta');

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [newDoc, setNewDoc] = useState('');
  const [newMoney, setNewMoney] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [transactionType]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getStageTemplates(transactionType);
      
      // If no templates exist in DB, we should show the default ones so the user can save them
      if (data.length === 0) {
        const defaultStages = (transactionType === 'Venta' || transactionType === 'Captación Alquiler') ? STAGES_VENTA : STAGES_COMPRA;
        const mapped = defaultStages.map((s, index) => ({
          id: `temp_${s.id}`,
          transaction_type: transactionType,
          stage_id: s.id,
          title: s.title,
          description: s.description,
          requirements_docs: s.requirements.docs,
          requirements_money: s.requirements.money,
          order_index: index,
          isNew: true
        }));
        setTemplates(mapped);
      } else {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: any) => {
    setEditingId(template.id);
    setEditForm({ ...template });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
    setNewDoc('');
    setNewMoney('');
  };

  const handleSave = async () => {
    try {
      const toSave = { ...editForm };
      if (toSave.isNew) {
        delete toSave.id; // Let Supabase generate UUID
        delete toSave.isNew;
      }
      await dataService.saveStageTemplate(toSave);
      setEditingId(null);
      setEditForm(null);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar la plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta etapa?')) return;
    
    try {
      if (!id.startsWith('temp_')) {
        await dataService.deleteStageTemplate(id);
      }
      // Re-load or just remove locally if it was a temp one
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar la etapa');
    }
  };

  const handleAddDoc = () => {
    if (!newDoc.trim()) return;
    setEditForm({
      ...editForm,
      requirements_docs: [...(editForm.requirements_docs || []), newDoc.trim()]
    });
    setNewDoc('');
  };

  const handleRemoveDoc = (index: number) => {
    const newDocs = [...editForm.requirements_docs];
    newDocs.splice(index, 1);
    setEditForm({ ...editForm, requirements_docs: newDocs });
  };

  const handleAddMoney = () => {
    if (!newMoney.trim()) return;
    setEditForm({
      ...editForm,
      requirements_money: [...(editForm.requirements_money || []), newMoney.trim()]
    });
    setNewMoney('');
  };

  const handleRemoveMoney = (index: number) => {
    const newMoneyArr = [...editForm.requirements_money];
    newMoneyArr.splice(index, 1);
    setEditForm({ ...editForm, requirements_money: newMoneyArr });
  };

  const handleAddNewStage = () => {
    // Genera una nueva etapa temporal para edición
    const newStage = {
      id: `temp_new_${Date.now()}`,
      transaction_type: transactionType,
      stage_id: `stage_${Date.now()}`,
      title: 'Nueva Etapa',
      description: '',
      requirements_docs: [],
      requirements_money: [],
      order_index: templates.length,
      isNew: true
    };
    setTemplates([...templates, newStage]);
    setEditingId(newStage.id);
    setEditForm({ ...newStage });
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === templates.length - 1) return;

    const newTemplates = [...templates];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newTemplates[index];
    newTemplates[index] = newTemplates[targetIndex];
    newTemplates[targetIndex] = temp;

    // Update order_index
    newTemplates.forEach((t, i) => {
      t.order_index = i;
    });

    setTemplates(newTemplates);

    // Save orders to backend if they are already saved items
    const updates = newTemplates
      .filter(t => !t.isNew)
      .map(t => ({ id: t.id, order_index: t.order_index }));

    if (updates.length > 0) {
      try {
        await dataService.updateStageOrders(updates);
      } catch (error) {
        console.error('Error updating orders:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
          <button
            onClick={() => setTransactionType('Venta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              transactionType === 'Venta' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Venta
          </button>
          <button
            onClick={() => setTransactionType('Compra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              transactionType === 'Compra' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Compra
          </button>
          <button
            onClick={() => setTransactionType('Captación Alquiler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              transactionType === 'Captación Alquiler' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ofrecer Alquiler
          </button>
          <button
            onClick={() => setTransactionType('Búsqueda Alquiler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              transactionType === 'Búsqueda Alquiler' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Buscar Alquiler
          </button>
        </div>
        <button 
          onClick={handleAddNewStage}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Nueva Etapa
        </button>
      </div>

      <div className="relative pl-6">
        {/* Vertical Timeline Line */}
        <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-slate-200 rounded-full" />
        
        <div className="space-y-4 relative">
          {templates.map((template, index) => (
            <div key={template.id} className="relative flex items-start gap-4 group">
              {/* Timeline Dot & Number */}
              <div className="relative z-10 flex flex-col items-center gap-2 pt-2">
                <div className="w-8 h-8 bg-white border-2 border-indigo-600 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                  {index + 1}
                </div>
              </div>
              
              {/* Card */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200">
                {editingId === template.id ? (
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-800">
                        {template.isNew ? 'Nueva Etapa' : `Editar Etapa: ${template.title}`}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                          <Save className="w-4 h-4" /> Guardar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Título de la Etapa</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Descripción</label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Documentos */}
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Requisitos Documentales
                          </h4>
                          <div className="space-y-2 mb-3">
                            {(editForm.requirements_docs || []).map((doc: string, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-indigo-100 text-sm text-slate-700">
                                <span>{doc}</span>
                                <button onClick={() => handleRemoveDoc(i)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nuevo documento..."
                              value={newDoc}
                              onChange={(e) => setNewDoc(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddDoc()}
                              className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button onClick={handleAddDoc} className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-200"><Plus className="w-5 h-5" /></button>
                          </div>
                        </div>

                        {/* Dinero */}
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                          <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Requisitos Financieros
                          </h4>
                          <div className="space-y-2 mb-3">
                            {(editForm.requirements_money || []).map((item: string, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-100 text-sm text-slate-700">
                                <span>{item}</span>
                                <button onClick={() => handleRemoveMoney(i)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nuevo requisito..."
                              value={newMoney}
                              onChange={(e) => setNewMoney(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddMoney()}
                              className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button onClick={handleAddMoney} className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-200"><Plus className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start gap-4 sm:gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">{template.title}</h3>
                        {template.isNew && (
                          <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit">No guardado</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{template.description}</p>
                      
                      <div className="flex flex-wrap gap-4">
                        {template.requirements_docs?.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                            <FileText className="w-3.5 h-3.5" /> {template.requirements_docs.length} docs
                          </div>
                        )}
                        {template.requirements_money?.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                            <DollarSign className="w-3.5 h-3.5" /> {template.requirements_money.length} items
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center w-full md:w-auto justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
                      <div className="flex gap-1 mr-2 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button 
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === templates.length - 1}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleEdit(template)}
                        className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium shrink-0"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="flex items-center justify-center p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-medium shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
