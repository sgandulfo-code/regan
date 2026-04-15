import React, { useState, useEffect } from 'react';
import { SearchFolder, Activity, ActivityType, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabase';
import { FileText, MessageSquare, CheckSquare, Upload, Plus, Clock, Check, BookOpen, Edit2, Trash2, X, Save } from 'lucide-react';
import { STAGES_VENTA, STAGES_COMPRA, StageInfo } from './ClientProgressBar';

interface CaptationLogProps {
  folder: SearchFolder;
  userId: string;
}

export default function CaptationLog({ folder, userId }: CaptationLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState<StageInfo[]>(folder.transactionType === TransactionType.VENTA ? STAGES_VENTA : STAGES_COMPRA);
  
  // Edit state
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadData();
  }, [folder.id, folder.transactionType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load stages
      const templates = await dataService.getStageTemplates(folder.transactionType || TransactionType.COMPRA);
      if (templates && templates.length > 0) {
        const mappedStages: StageInfo[] = templates.map(t => ({
          id: t.stage_id,
          title: t.title,
          status: 'upcoming',
          description: t.description,
          requirements: {
            docs: t.requirements_docs || [],
            money: t.requirements_money || []
          }
        }));
        setStages(mappedStages);
      } else {
        setStages(folder.transactionType === TransactionType.VENTA ? STAGES_VENTA : STAGES_COMPRA);
      }

      await loadActivities(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const loadActivities = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await dataService.getFolderActivities(folder.id);
      setActivities(data.filter(a => 
        a.type === ActivityType.LOG_NOTE || 
        a.type === ActivityType.LOG_DOCUMENT || 
        a.type === ActivityType.LOG_CHECKLIST
      ));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStage = stages.find(s => s.id === folder.stageId) || stages[0];

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await dataService.logActivity({
        folderId: folder.id,
        agentId: userId,
        type: ActivityType.LOG_NOTE,
        content: newNote,
        metadata: {}
      });
      setNewNote('');
      loadActivities();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditClick = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditContent(activity.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await dataService.updateActivity(id, editContent);
      setEditingActivityId(null);
      loadActivities(false);
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Error al actualizar el registro');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await dataService.deleteActivity(id);
      loadActivities(false);
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${folder.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(filePath);

      await dataService.logActivity({
        folderId: folder.id,
        agentId: userId,
        type: ActivityType.LOG_DOCUMENT,
        content: `Documento subido: ${file.name}`,
        metadata: {
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type
        }
      });

      loadActivities();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el documento');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleChecklistItem = async (item: string, type: 'docs' | 'money') => {
    const checklistActivity = activities.find(a => a.type === ActivityType.LOG_CHECKLIST && a.metadata?.stageId === currentStage.id);
    const currentState = checklistActivity?.metadata?.state || {};
    const key = `${type}_${item}`;
    const newState = { ...currentState, [key]: !currentState[key] };

    try {
      await dataService.logActivity({
        folderId: folder.id,
        agentId: userId,
        type: ActivityType.LOG_CHECKLIST,
        content: `Checklist actualizado: ${currentStage.title}`,
        metadata: {
          stageId: currentStage.id,
          state: newState
        }
      });
      loadActivities();
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const getChecklistState = (item: string, type: 'docs' | 'money') => {
    const checklistActivity = activities.find(a => a.type === ActivityType.LOG_CHECKLIST && a.metadata?.stageId === currentStage.id);
    if (!checklistActivity) return false;
    return !!checklistActivity.metadata?.state?.[`${type}_${item}`];
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Bitácora
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
        {/* Left Column: Checklist */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
            <h4 className="text-sm font-black text-indigo-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Checklist: {currentStage.title}
            </h4>
            
            {currentStage.requirements.docs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Documentación</p>
                <div className="space-y-2">
                  {currentStage.requirements.docs.map(doc => (
                    <label key={doc} className="flex items-start gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${getChecklistState(doc, 'docs') ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-200 group-hover:border-indigo-400'}`}>
                        {getChecklistState(doc, 'docs') && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${getChecklistState(doc, 'docs') ? 'text-indigo-400 line-through' : 'text-indigo-900'}`}>{doc}</span>
                      <input type="checkbox" className="hidden" checked={getChecklistState(doc, 'docs')} onChange={() => toggleChecklistItem(doc, 'docs')} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStage.requirements.money.length > 0 && (
              <div>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Financiero</p>
                <div className="space-y-2">
                  {currentStage.requirements.money.map(item => (
                    <label key={item} className="flex items-start gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${getChecklistState(item, 'money') ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-indigo-200 group-hover:border-indigo-400'}`}>
                        {getChecklistState(item, 'money') && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${getChecklistState(item, 'money') ? 'text-indigo-400 line-through' : 'text-indigo-900'}`}>{item}</span>
                      <input type="checkbox" className="hidden" checked={getChecklistState(item, 'money')} onChange={() => toggleChecklistItem(item, 'money')} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStage.requirements.docs.length === 0 && currentStage.requirements.money.length === 0 && (
              <p className="text-sm text-indigo-400 italic">No hay requisitos para esta etapa.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Inputs */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Agregar una anotación..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nota</span>
            </button>
            <label className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2 border border-slate-200">
              <Upload className="w-4 h-4" /> <span className="hidden sm:inline">{isUploading ? 'Subiendo...' : 'Documento'}</span>
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="mt-1">
                    {activity.type === ActivityType.LOG_NOTE ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
                    ) : activity.type === ActivityType.LOG_DOCUMENT ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><CheckSquare className="w-4 h-4" /></div>
                    )}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {activity.type === ActivityType.LOG_NOTE ? 'Anotación' : activity.type === ActivityType.LOG_DOCUMENT ? 'Documento' : 'Checklist'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(activity.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {/* Actions */}
                        {activity.agentId === userId && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {activity.type === ActivityType.LOG_NOTE && (
                              <button onClick={() => handleEditClick(activity)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteActivity(activity.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingActivityId === activity.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingActivityId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                            Cancelar
                          </button>
                          <button onClick={() => handleSaveEdit(activity.id)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                            <Save className="w-3.5 h-3.5" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{activity.content}</p>
                        
                        {activity.type === ActivityType.LOG_DOCUMENT && activity.metadata?.fileUrl && (
                          <a 
                            href={activity.metadata.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Ver Documento
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No hay registros en la bitácora aún.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
