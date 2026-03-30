import React, { useState, useEffect } from 'react';
import { SearchFolder, Client, TransactionType } from '../types';
import { dataService } from '../services/dataService';
import { Plus, Users, Search, Phone, Mail, Calendar, Briefcase, Building, ChevronRight, MapPin, DollarSign, Home, Edit, Trash2, X } from 'lucide-react';
import ClientModal from './ClientModal';

interface CRMViewProps {
  userId: string;
  folders: SearchFolder[];
  onFolderSelect: (folderId: string) => void;
  onRefresh: () => void;
}

const STAGES_COMPRA = [
  'Búsqueda',
  'Visitas',
  'Reserva',
  'Boleto',
  'Escritura'
];

const STAGES_VENTA = [
  'Tasación',
  'Autorización',
  'Comercialización',
  'Reserva',
  'Boleto',
  'Escritura'
];

export const CRMView: React.FC<CRMViewProps> = ({ userId, folders, onFolderSelect, onRefresh }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'clients'>('kanban');
  const [pipelineType, setPipelineType] = useState<'compra' | 'venta'>('compra');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, [userId]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClients(userId);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (folderId: string, newStage: string) => {
    try {
      const stageIdMap: Record<string, string> = {
        'Búsqueda': 'busqueda',
        'Visitas': 'visitas',
        'Reserva': 'reserva',
        'Boleto': 'boleto',
        'Escritura': 'escritura',
        'Tasación': 'tasacion',
        'Autorización': 'autorizacion',
        'Comercialización': 'comercializacion'
      };
      
      const newStageId = stageIdMap[newStage] || newStage.toLowerCase().replace(/[^a-z0-9]/g, '');

      await dataService.updateFolder(folderId, { 
        stage: newStage,
        stageId: newStageId
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating folder stage:', error);
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      setError(null);
      if (editingClient) {
        await dataService.updateClient(editingClient.id, clientData);
      } else {
        await dataService.createClient(clientData, userId);
      }
      setIsClientModalOpen(false);
      setEditingClient(null);
      loadClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error?.message || 'Error al guardar el cliente');
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      setError(null);
      await dataService.deleteClient(clientToDelete);
      setClientToDelete(null);
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Error al eliminar el cliente');
      setClientToDelete(null);
    }
  };

  const handleDeleteClient = (id: string) => {
    setClientToDelete(id);
  };

  const handleDragStart = (e: React.DragEvent, folderId: string) => {
    e.dataTransfer.setData('folderId', folderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const folderId = e.dataTransfer.getData('folderId');
    if (folderId) {
      await handleStageChange(folderId, newStage);
    }
  };

  const renderKanban = () => {
    const currentStages = pipelineType === 'venta' ? STAGES_VENTA : STAGES_COMPRA;
    const defaultStage = currentStages[0];
    
    const filteredFolders = folders.filter(f => {
      // Si la operación es Venta, va al pipeline de Venta.
      // Si es Compra, Alquiler, Alquiler Temporario o no está definido, va al pipeline de Compra.
      const isCaptacion = f.operation_type?.startsWith('Captación');
      if (pipelineType === 'venta') {
        return f.transactionType === TransactionType.VENTA || isCaptacion;
      } else {
        return f.transactionType !== TransactionType.VENTA && !isCaptacion;
      }
    });

    return (
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px]">
        {currentStages.map(stage => {
          const stageFolders = filteredFolders.filter(f => {
            // Si la carpeta no tiene stage o tiene un stage que no pertenece a este pipeline, lo mandamos al primero
            const folderStage = f.stage || defaultStage;
            if (!currentStages.includes(folderStage) && stage === defaultStage) return true;
            return folderStage === stage;
          });
          
          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 flex flex-col bg-slate-50/50 rounded-3xl border border-slate-100 p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-700">{stage}</h3>
                <span className="bg-white text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm border border-slate-100">
                  {stageFolders.length}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {stageFolders.map(folder => (
                  <div 
                    key={folder.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder.id)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color || '#6366f1' }} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{folder.operation_type || folder.transactionType || 'Operación'}</span>
                      </div>
                      <div className="relative">
                        <select 
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 outline-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 w-8"
                          value={currentStages.includes(folder.stage || '') ? folder.stage : defaultStage}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStageChange(folder.id, e.target.value);
                          }}
                        >
                          {currentStages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="text-slate-400 hover:text-indigo-600 p-1" onClick={(e) => e.stopPropagation()}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 mb-1">{folder.name}</h4>
                    
                    {folder.client && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {folder.client.name.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 font-medium truncate">{folder.client.name}</span>
                      </div>
                    )}
                    
                    {(folder.budget_min || folder.budget_max || folder.budget) && (
                      <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {folder.budget_min || folder.budget_max 
                          ? `${folder.budget_min ? folder.budget_min.toLocaleString() : '0'} - ${folder.budget_max ? folder.budget_max.toLocaleString() : 'Max'}`
                          : folder.budget?.toLocaleString() || '0'}
                      </div>
                    )}
                  </div>
                ))}
                
                {stageFolders.length === 0 && (
                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-medium p-6 text-center">
                    Arrastra operaciones aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderClients = () => {
    const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const clientFolders = folders.filter(f => f.client_id === client.id);
          
          return (
            <div key={client.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{client.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md mt-1 inline-block">
                      {client.client_type || 'Prospecto'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingClient(client); setIsClientModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {client.email}
                  </div>
                )}
                {client.occupation && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {client.occupation}
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Operaciones Activas ({clientFolders.length})</h4>
                <div className="space-y-2">
                  {clientFolders.map(folder => (
                    <div key={folder.id} onClick={() => onFolderSelect(folder.id)} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color || '#6366f1' }} />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{folder.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{folder.stage || 'Lead'}</span>
                    </div>
                  ))}
                  {clientFolders.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Sin operaciones activas</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No se encontraron clientes</h3>
            <p className="text-slate-500">Intenta con otra búsqueda o añade un nuevo cliente.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">CRM & Pipeline</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestiona tus clientes y el embudo de ventas</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {viewMode === 'kanban' && (
            <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
              <button 
                onClick={() => setPipelineType('compra')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${pipelineType === 'compra' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <Home className="w-4 h-4" />
                Compra / Alquiler
              </button>
              <button 
                onClick={() => setPipelineType('venta')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${pipelineType === 'venta' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <Building className="w-4 h-4" />
                Venta
              </button>
            </div>
          )}

          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => setViewMode('clients')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'clients' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              Directorio
            </button>
          </div>
          
          <button 
            onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {viewMode === 'clients' && (
        <div className="mb-8 relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        viewMode === 'kanban' ? renderKanban() : renderClients()
      )}

      <ClientModal 
        isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }}
        onConfirm={handleSaveClient}
        initialData={editingClient}
      />

      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-800 mb-2">¿Eliminar cliente?</h3>
            <p className="text-slate-500 text-sm mb-6">
              ¿Estás seguro de eliminar este cliente? Las operaciones asociadas quedarán sin cliente asignado. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteClient}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
