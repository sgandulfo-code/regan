
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, FolderPlus, Search, ArrowRight, Clock, MapPin, ChevronRight, Briefcase, Heart, FileText, LayoutGrid, Map as MapIcon, Ruler, Layers, Home, Bed, Bath, Car, History, Building2, ShieldCheck, Euro, Cloud, Check, Loader2, Trash2, Pencil, Printer, X, Filter, ChevronDown, Star, DollarSign, RefreshCw, ArrowUpDown, Calendar, Timer, Activity, ArrowLeftRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import RenovationCalculator from './components/RenovationCalculator';
import ComparisonTool from './components/ComparisonTool';
import FolderFormModal from './components/FolderFormModal';
import PropertyMapView from './components/PropertyMapView';
import PropertyDetailModal from './components/PropertyDetailModal';
import ReportGenerator from './components/ReportGenerator';
import VisitAgenda from './components/VisitAgenda';
import DocumentVault from './components/DocumentVault';
import VisitFormModal from './components/VisitFormModal';
import DocumentFormModal from './components/DocumentFormModal';
import Auth from './components/Auth';
import { Property, PropertyStatus, UserRole, User, RenovationItem, SearchFolder, FolderStatus, TransactionType, Visit, PropertyDocument, DocCategory } from './types';
import { dataService } from './services/dataService';
import { supabase } from './services/supabase';

interface PropertyFilters {
  minPrice: string;
  maxPrice: string;
  minRooms: string;
  minBathrooms: string;
  minSqft: string;
  status: string;
  minRating: number;
}

type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'sqft-desc' | 'rating-desc';

const initialFilters: PropertyFilters = {
  minPrice: '',
  maxPrice: '',
  minRooms: '',
  minBathrooms: '',
  minSqft: '',
  status: '',
  minRating: 0
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [folders, setFolders] = useState<SearchFolder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportFolder, setReportFolder] = useState<SearchFolder | null>(null);
  const [editingFolder, setEditingFolder] = useState<SearchFolder | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncUserProfile(session.user.id);
      else setIsSyncing(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) syncUserProfile(session.user.id);
      else { setUser(null); setIsSyncing(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (userId: string) => {
    const profile = await dataService.getProfile(userId);
    if (profile) setUser(profile);
    setIsSyncing(false);
  };

  useEffect(() => { if (user) loadInitialData(); }, [user]);

  const loadInitialData = async () => {
    if (!user) return;
    setIsSyncing(true);
    const [fetchedFolders, fetchedProperties, fetchedVisits, fetchedDocs] = await Promise.all([
      dataService.getFolders(user.id), 
      dataService.getProperties(user.id),
      dataService.getVisits(user.id),
      dataService.getDocuments(user.id)
    ]);
    
    setFolders(fetchedFolders);
    setProperties(fetchedProperties);
    setVisits(fetchedVisits);
    setDocuments(fetchedDocs);
    setIsSyncing(false);
  };

  const handleFolderConfirm = async (data: Omit<SearchFolder, 'id' | 'createdAt' | 'color' | 'statusUpdatedAt'>) => {
    if (!user) return;
    setIsSyncing(true);
    if (editingFolder) {
      await dataService.updateFolder(editingFolder.id, data);
    } else {
      const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
      await dataService.createFolder({ ...data, color: colors[folders.length % colors.length] }, user.id);
    }
    await loadInitialData();
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setIsSyncing(false);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm("¿Borrar búsqueda? Se eliminarán todas las propiedades asociadas permanentemente.")) return;
    setIsSyncing(true);
    await dataService.deleteFolder(id);
    if (activeFolderId === id) setActiveFolderId(null);
    await loadInitialData();
    setIsSyncing(false);
  };

  const handleAddOrUpdateProperty = async (prop: Property) => {
    if (user?.role !== UserRole.BUYER || !user) return;
    setIsSyncing(true);
    if (propertyToEdit) {
      await dataService.updateProperty(prop.id, prop);
      setPropertyToEdit(null);
      setActiveTab('properties');
    } else {
      const folderToAssign = activeFolderId || (folders.length > 0 ? folders[0].id : null);
      if (!folderToAssign) { alert("Crea primero una carpeta de búsqueda."); setIsSyncing(false); return; }
      await dataService.createProperty({ ...prop, folderId: folderToAssign }, user.id);
      setActiveTab('properties');
    }
    await loadInitialData();
    setIsSyncing(false);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("¿Borrar propiedad?")) return;
    setIsSyncing(true);
    await dataService.deleteProperty(id);
    if (selectedProperty?.id === id) setSelectedProperty(null);
    await loadInitialData();
    setIsSyncing(false);
  };

  const handleUpdateReno = async (propertyId: string, items: RenovationItem[]) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateRenovations(propertyId, items, user.id);
    await loadInitialData();
    if (selectedProperty && selectedProperty.id === propertyId) {
      const updatedProp = properties.find(p => p.id === propertyId);
      if (updatedProp) setSelectedProperty(updatedProp);
    }
    setIsSyncing(false);
  };

  const handleUpdateStatus = async (propertyId: string, status: PropertyStatus) => {
    setIsSyncing(true);
    await dataService.updatePropertyStatus(propertyId, status);
    await loadInitialData();
    setIsSyncing(false);
  };

  const handleCreateVisit = async (visitData: Omit<Visit, 'id'>) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.createVisit(visitData, user.id);
    await loadInitialData();
    setIsVisitModalOpen(false);
    setIsSyncing(false);
  };

  const handleCompleteVisit = async (visitId: string, propertyId: string) => {
    setIsSyncing(true);
    await dataService.updateVisit(visitId, { status: 'Completed' });
    await dataService.updatePropertyStatus(propertyId, PropertyStatus.VISITED);
    await loadInitialData();
    setIsSyncing(false);
    alert("¡Visita completada! El activo ha sido marcado como 'Visitado'.");
  };

  const handleCreateDoc = async (docData: Omit<PropertyDocument, 'id' | 'createdAt'>) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.createDocument(docData, user.id);
    await loadInitialData();
    setIsDocModalOpen(false);
    setIsSyncing(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm("¿Borrar documento?")) return;
    setIsSyncing(true);
    await dataService.deleteDocument(id);
    await loadInitialData();
    setIsSyncing(false);
  };

  const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);
  
  const displayProperties = useMemo(() => {
    let filtered = properties;
    if (activeFolderId) filtered = filtered.filter(p => p.folderId === activeFolderId);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query))
      );
    }

    if (filters.minPrice) filtered = filtered.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) filtered = filtered.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.minRooms) filtered = filtered.filter(p => p.rooms >= Number(filters.minRooms));
    if (filters.minBathrooms) filtered = filtered.filter(p => p.bathrooms >= Number(filters.minBathrooms));
    if (filters.minSqft) filtered = filtered.filter(p => p.sqft >= Number(filters.minSqft));
    if (filters.status) filtered = filtered.filter(p => p.status === filters.status);
    if (filters.minRating > 0) filtered = filtered.filter(p => p.rating >= filters.minRating);
    
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'sqft-desc': return b.sqft - a.sqft;
        case 'rating-desc': return b.rating - a.rating;
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest': 
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [properties, activeFolderId, searchQuery, filters, sortBy]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '' && v !== 0).length;
  }, [filters]);

  useEffect(() => {
    setSearchQuery('');
    setFilters(initialFilters);
    setSortBy('newest');
  }, [activeFolderId, activeTab]);

  const getDaysElapsed = (date: string) => {
    const start = new Date(date).getTime();
    const now = new Date().getTime();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  const getStatusBadgeColor = (status: FolderStatus) => {
    switch (status) {
      case FolderStatus.PENDIENTE: return 'bg-amber-100 text-amber-600 border-amber-200';
      case FolderStatus.ABIERTA: return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case FolderStatus.CERRADA: return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  if (isSyncing && !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user.role} 
        folders={folders} 
        activeFolderId={activeFolderId} 
        setActiveFolderId={setActiveFolderId} 
        onLogout={() => supabase.auth.signOut()} 
        isSyncing={isSyncing}
        onEditFolder={(f) => { setEditingFolder(f); setIsFolderModalOpen(true); }}
        onDeleteFolder={handleDeleteFolder}
      />
      
      <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 w-full">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeFolder ? activeFolder.name : (activeTab === 'dashboard' ? 'Dashboard Estratégico' : activeTab === 'visits' ? 'Gestión de Visitas' : activeTab === 'documents' ? 'Bóveda Documental' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {activeFolder ? activeFolder.description : 'Gestión inteligente de activos para el Real Estate moderno'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {activeFolderId && activeFolder && activeTab === 'properties' && (
                <button 
                  onClick={() => { setReportFolder(activeFolder); setIsReportOpen(true); }}
                  className="bg-white border border-slate-200 text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Generar Informe PDF
                </button>
              )}

              {(activeTab === 'dashboard' || activeTab === 'properties') && (
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-3 h-3" /> Grid</button>
                  <button onClick={() => setViewMode('map')} className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}><MapIcon className="w-3 h-3" /> Map</button>
                </div>
              )}
              
              <div className="bg-white p-2 rounded-2xl shadow-sm border flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{user.name ? user.name[0] : 'U'}</div>
                <span className="text-sm font-bold pr-2">{user.name}</span>
              </div>
            </div>
          </div>

          {activeFolder && activeTab === 'properties' && (
            <div className="flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-3xl flex items-center gap-4 shadow-xl">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-indigo-400" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presupuesto</p><p className="text-lg font-black">${activeFolder.budget.toLocaleString()}</p></div>
              </div>
              <div className="bg-white border border-slate-200 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><ArrowLeftRight className="w-5 h-5 text-indigo-500" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Operación</p><p className="text-lg font-black text-slate-800 uppercase tracking-tight">{activeFolder.transactionType}</p></div>
              </div>
              <div className={`px-6 py-3 rounded-3xl flex items-center gap-4 border shadow-sm ${getStatusBadgeColor(activeFolder.status)}`}>
                <div className="w-10 h-10 bg-current/10 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5" /></div>
                <div><p className="text-[8px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Estado</p><p className="text-lg font-black uppercase tracking-tight">{activeFolder.status}</p></div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Timer className="w-5 h-5" /></div>
                <div><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Actividad</p><p className="text-lg font-black text-indigo-700">{getDaysElapsed(activeFolder.startDate)} <span className="text-xs opacity-70">Días</span></p></div>
              </div>
            </div>
          )}
        </header>

        {activeTab === 'visits' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setIsVisitModalOpen(true)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Programar Nueva Visita
              </button>
            </div>
            <VisitAgenda 
              visits={visits.filter(v => !activeFolderId || v.folderId === activeFolderId)} 
              properties={properties} 
              onCompleteVisit={handleCompleteVisit} 
              onCancelVisit={async (id) => {
                setIsSyncing(true);
                await dataService.updateVisit(id, { status: 'Cancelled' });
                await loadInitialData();
                setIsSyncing(false);
              }}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setIsDocModalOpen(true)}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Vincular Nuevo Documento
              </button>
            </div>
            <DocumentVault 
              documents={documents.filter(d => !activeFolderId || d.folderId === activeFolderId)} 
              folders={folders} 
              properties={properties} 
              onUpload={() => setIsDocModalOpen(true)} 
              onDelete={handleDeleteDoc} 
            />
          </div>
        )}

        {(activeTab === 'dashboard' || activeTab === 'properties') && (
          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={`Buscar en ${activeFolder ? activeFolder.name : 'todos los activos'}...`}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-11 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 shadow-sm'}`}
                >
                  <Filter className="w-4 h-4" /> Filtros
                  {activeFilterCount > 0 && <span className="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">{activeFilterCount}</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && !activeFolderId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {folders.map(f => (
              <div key={f.id} className="relative group">
                <button 
                  onClick={() => { setActiveFolderId(f.id); setActiveTab('properties'); }} 
                  className="w-full bg-white p-8 rounded-[4rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-100 transition-all text-left relative overflow-hidden h-full flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 ${f.color} rounded-2xl shadow-lg flex items-center justify-center text-white`}>
                       {f.transactionType === TransactionType.COMPRA ? <DollarSign className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">{f.name}</h3>
                  <p className="text-sm text-slate-400 font-medium mb-8 line-clamp-2 italic">{f.description}</p>
                  <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {properties.filter(p => p.folderId === f.id).length} Activos
                    </span>
                    <div className="w-12 h-12 rounded-[1.8rem] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </button>
              </div>
            ))}
            <button onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }} className="border-2 border-dashed border-slate-200 rounded-[4rem] p-8 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all min-h-[400px]">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6"><Plus className="w-10 h-10" /></div>
              <span className="text-[12px] font-black uppercase tracking-[0.4em]">Nueva Tesis</span>
            </button>
          </div>
        )}

        {activeTab === 'search' && (
          <PropertyForm onAdd={handleAddOrUpdateProperty} userId={user.id} activeFolderId={activeFolderId} propertyToEdit={propertyToEdit} onCancelEdit={() => { setPropertyToEdit(null); setActiveTab('properties'); }} />
        )}
        
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {displayProperties.length === 0 ? (
              <div className="bg-white rounded-[4rem] p-24 text-center border-2 border-dashed border-slate-100">
                <Home className="w-12 h-12 text-slate-200 mx-auto mb-8" />
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Sin resultados</h3>
                <button onClick={() => setActiveTab('search')} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all">Ingresar Activo</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {displayProperties.map((p, index) => <PropertyCard key={p.id} property={p} index={index} onSelect={setSelectedProperty} onStatusChange={(id, s) => handleUpdateStatus(id, s)} onEdit={(p) => { setPropertyToEdit(p); setActiveTab('search'); }} onDelete={handleDeleteProperty} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calculator' && properties.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {properties.slice(0, 4).map(p => <RenovationCalculator key={p.id} property={p} userRole={user.role} onUpdate={(items) => handleUpdateReno(p.id, items)} />)}
          </div>
        )}
      </main>

      <FolderFormModal isOpen={isFolderModalOpen} onClose={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} onConfirm={handleFolderConfirm} initialData={editingFolder} />
      
      <VisitFormModal 
        isOpen={isVisitModalOpen} 
        onClose={() => setIsVisitModalOpen(false)} 
        properties={properties} 
        folders={folders} 
        activeFolderId={activeFolderId} 
        onConfirm={handleCreateVisit} 
      />

      <DocumentFormModal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        properties={properties} 
        folders={folders} 
        activeFolderId={activeFolderId} 
        onConfirm={handleCreateDoc} 
      />

      {isReportOpen && reportFolder && <ReportGenerator folder={reportFolder} properties={properties.filter(p => p.folderId === reportFolder.id)} onClose={() => { setIsReportOpen(false); setReportFolder(null); }} />}
      {selectedProperty && <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} userRole={user.role} onUpdateReno={(items) => handleUpdateReno(selectedProperty.id, items)} />}
    </div>
  );
};

export default App;
