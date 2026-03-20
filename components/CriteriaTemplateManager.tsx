
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Copy, 
  MoreVertical, 
  Layout, 
  CheckCircle2, 
  X,
  Loader2,
  Settings2,
  Info
} from 'lucide-react';
import { CriteriaTemplate, User } from '../types';
import { dataService } from '../services/dataService';
import CriteriaTemplateModal from './CriteriaTemplateModal';
import { motion, AnimatePresence } from 'motion/react';

interface CriteriaTemplateManagerProps {
  user: User;
}

const CriteriaTemplateManager: React.FC<CriteriaTemplateManagerProps> = ({ user }) => {
  const [templates, setTemplates] = useState<CriteriaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CriteriaTemplate | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      const data = await dataService.getCriteriaTemplates(user.id);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user.id]);

  const handleSave = async (templateData: Omit<CriteriaTemplate, 'id' | 'createdAt'> & { id?: string }) => {
    if (templateData.id) {
      await dataService.updateCriteriaTemplate(templateData.id, templateData);
    } else {
      await dataService.createCriteriaTemplate({
        ...templateData,
        agentId: user.id
      });
    }
    await loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      await dataService.deleteCriteriaTemplate(id);
      await loadTemplates();
    }
  };

  const handleDuplicate = async (template: CriteriaTemplate) => {
    await dataService.createCriteriaTemplate({
      agentId: user.id,
      name: `${template.name} (Copia)`,
      description: template.description,
      fields: template.fields
    });
    await loadTemplates();
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Plantillas de Criterios</h2>
          <p className="text-slate-500 font-medium">Estandariza la evaluación de propiedades para tus clientes.</p>
        </div>
        <button 
          onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nueva Plantilla
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input
          type="text"
          placeholder="Buscar plantillas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white rounded-[2rem] border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={template.id}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative"
            >
              <div className="absolute top-6 right-6">
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {activeMenu === template.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden">
                        <button 
                          onClick={() => { setEditingTemplate(template); setIsModalOpen(true); setActiveMenu(null); }}
                          className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50 flex items-center gap-3"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button 
                          onClick={() => { handleDuplicate(template); setActiveMenu(null); }}
                          className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50 flex items-center gap-3"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicar
                        </button>
                        <button 
                          onClick={() => { handleDelete(template.id); setActiveMenu(null); }}
                          className="w-full text-left px-5 py-4 text-[9px] font-black text-rose-500 uppercase hover:bg-rose-50 transition-colors flex items-center gap-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <Layout className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 line-clamp-1">{template.name}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2 min-h-[40px]">
                {template.description || 'Sin descripción'}
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Campos ({template.fields.length})</span>
                  <Settings2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.fields.slice(0, 3).map((field) => (
                    <span 
                      key={field.id}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-bold border border-slate-100"
                    >
                      {field.label}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-bold border border-indigo-100">
                      +{template.fields.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Info className="w-12 h-12 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">No hay plantillas</h3>
            <p className="text-slate-400 font-medium">Comienza creando tu primera plantilla de criterios.</p>
          </div>
        )}
      </div>

      <CriteriaTemplateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTemplate(null); }}
        onSave={handleSave}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};

export default CriteriaTemplateManager;
