
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
import Auth from './components/Auth';
import { Property, PropertyStatus, UserRole, User, RenovationItem, SearchFolder, FolderStatus, TransactionType } from './types';
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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
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
    const [fetchedFolders, fetchedProperties] = await Promise.all([
      dataService.getFolders(user.id), 
      dataService.getProperties(user.id)
    ]);
    
    setFolders(fetchedFolders);
    
    setProperties(fetchedProperties.map((p: any) => ({
      id: p.id,
      title: p.title, url: p.url, address: p.address, exactAddress: p.exact_address, price: Number(p.price), fees: Number(p.fees),
      environments: p.environments, rooms: p.rooms, bathrooms: p.bathrooms, toilets: p.toilets, parking: p.parking, sqft: Number(p.sqft), coveredSqft: Number(p.covered_sqft),
      uncoveredSqft: Number(p.uncovered_sqft), age: p.age, floor: p.floor, status: p.status as PropertyStatus, rating: p.rating, notes: p.notes, images: p.images || [],
      renovationCosts: p.renovations ? p.renovations.map((r: any) => ({ id: r.id, category: r.category, description: r.description, estimated_cost: Number(r.estimated_cost) })) : [],
      createdAt: p.created_at,
      folderId: p.folder_id 
    })));
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

  const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);
  
  const displayProperties = useMemo(() => {
    let filtered = properties;
    
    if (activeFolderId) {
      filtered = filtered.filter(p => p.folderId === activeFolderId);
    }
    
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

  const handleOpenReport = (folder: SearchFolder) => {
    setReportFolder(folder);
    setIsReportOpen(true);
  };

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
                {activeFolder ? activeFolder.name : (activeTab === 'dashboard' ? 'Dashboard Estratégico' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {activeFolder ? activeFolder.description : 'Gestión inteligente de activos para el Real Estate moderno'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {activeFolderId && activeFolder && (
                <button 
                  onClick={() => handleOpenReport(activeFolder)}
                  className="bg-white border border-slate-200 text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Generar Informe PDF
                </button>
              )}

              {(activeTab === 'dashboard' || activeTab === 'properties') && (
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-3 h-3" /> Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <MapIcon className="w-3 h-3" /> Map
                  </button>
                </div>
              )}
              
              <div className="bg-white p-2 rounded-2xl shadow-sm border flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <span className="text-sm font-bold pr-2">{user.name}</span>
              </div>
            </div>
          </div>

          {activeFolder && (
            <div className="flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-3xl flex items-center gap-4 shadow-xl">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presupuesto</p>
                  <p className="text-lg font-black">${activeFolder.budget.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Operación</p>
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{activeFolder.transactionType}</p>
                </div>
              </div>

              <div className={`px-6 py-3 rounded-3xl flex items-center gap-4 border shadow-sm ${getStatusBadgeColor(activeFolder.status)}`}>
                <div className="w-10 h-10 bg-current/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Estado</p>
                  <p className="text-lg font-black uppercase tracking-tight">{activeFolder.status}</p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Actividad</p>
                  <p className="text-lg font-black text-indigo-700">
                    {getDaysElapsed(activeFolder.startDate)} <span className="text-xs opacity-70">Días</span>
                  </p>
                </div>
              </div>
              
              <div className="ml-auto hidden xl:flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-3xl text-slate-400 border border-slate-200/50">
                <Home className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {displayProperties.length} Propiedades vinculadas
                </span>
              </div>
            </div>
          )}
        </header>

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
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-white border border-slate-200 text-slate-600 pl-11 pr-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm min-w-[180px]"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Antiguas primero</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="sqft-desc">Superficie: Mayor primero</option>
                    <option value="rating-desc">Mejor Calificadas (AI)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 shadow-sm'}`}
                >
                  <Filter className="w-4 h-4" /> 
                  Filtros Avanzados
                  {activeFilterCount > 0 && (
                    <span className="bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] animate-in zoom-in">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl animate-in slide-in-from-top-4 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Rango Precio</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Bed className="w-3 h-3" /> Amb. & Baños</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min Amb." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.minRooms}
                      onChange={(e) => setFilters({...filters, minRooms: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="Min Baños" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.minBathrooms}
                      onChange={(e) => setFilters({...filters, minBathrooms: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Superficie (min m²)</label>
                  <input 
                    type="number" 
                    placeholder="ej: 100" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                    value={filters.minSqft}
                    onChange={(e) => setFilters({...filters, minSqft: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Estado & Rating</label>
                  <div className="flex flex-col gap-2">
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all uppercase tracking-widest"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">Cualquier Estado</option>
                      {Object.values(PropertyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-1 items-center justify-between px-2 bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Min Rating:</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(num => (
                          <button 
                            key={num} 
                            onClick={() => setFilters({...filters, minRating: filters.minRating === num ? 0 : num})}
                            className={`transition-all ${filters.minRating >= num ? 'text-amber-500 scale-110' : 'text-slate-300'}`}
                          >
                            <Star className={`w-4 h-4 ${filters.minRating >= num ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">
                    Mostrando {displayProperties.length} de {activeFolder ? properties.filter(p => p.folderId === activeFolderId).length : properties.length} activos
                  </p>
                  <button 
                    onClick={() => setFilters(initialFilters)}
                    className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && !activeFolderId && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                {folders.map(f => (
                  <div key={f.id} className="relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenReport(f); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-500 hover:text-indigo-600 shadow-xl border border-slate-100 transition-all hover:scale-110"
                        title="Ver informe"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingFolder(f); setIsFolderModalOpen(true); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-500 hover:text-indigo-600 shadow-xl border border-slate-100 transition-all hover:scale-110"
                        title="Editar tesis"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-500 hover:text-rose-600 shadow-xl border border-slate-100 transition-all hover:scale-110"
                        title="Archivar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => { setActiveFolderId(f.id); setActiveTab('properties'); }} 
                      className="w-full bg-white p-8 rounded-[4rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-100 transition-all text-left relative overflow-hidden h-full flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 ${f.color} rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform flex items-center justify-center text-white`}>
                           {f.transactionType === TransactionType.COMPRA ? <DollarSign className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-1.5 ${getStatusBadgeColor(f.status)}`}>
                            <Activity className="w-3 h-3" />
                            {f.status}
                          </span>
                          <span className="text-[10px] font-black text-slate-900 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                            <ArrowLeftRight className="w-3 h-3 text-indigo-500" />
                            {f.transactionType}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">{f.name}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-8 line-clamp-2 leading-relaxed flex-1 italic">
                        {f.description || 'Sin descripción estratégica definida'}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-900 p-5 rounded-[2.5rem] text-white">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5">Presupuesto Máx.</p>
                          <p className="text-xl font-black">${f.budget.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-50/50 p-5 rounded-[2.5rem] border border-indigo-100/50">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
                            <Timer className="w-3 h-3" /> Actividad
                          </p>
                          <p className="text-xl font-black text-indigo-700">
                            {getDaysElapsed(f.startDate)} <span className="text-[10px] opacity-70">Días</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex -space-x-3 overflow-hidden">
                           {[...Array(Math.min(3, properties.filter(p => p.folderId === f.id).length))].map((_, i) => (
                             <div key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-200 overflow-hidden">
                                <img src={properties.filter(p => p.folderId === f.id)[i].images[0]} className="h-full w-full object-cover" />
                             </div>
                           ))}
                           <span className="flex items-center justify-center h-8 w-8 rounded-full ring-4 ring-white bg-slate-50 text-[10px] font-black text-slate-400">
                              {properties.filter(p => p.folderId === f.id).length}
                           </span>
                        </div>
                        <div className="w-12 h-12 rounded-[1.8rem] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          <ArrowRight className="w-6 h-6" />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }} 
                  className="border-2 border-dashed border-slate-200 rounded-[4rem] p-8 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all min-h-[400px] group"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                    <Plus className="w-10 h-10" />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-[0.4em]">Nueva Tesis</span>
                </button>
              </div>
            ) : (
              <PropertyMapView 
                properties={properties} 
                onSelectProperty={setSelectedProperty} 
              />
            )}
          </>
        )}

        {activeTab === 'search' && (
          <PropertyForm 
            onAdd={handleAddOrUpdateProperty} 
            userId={user.id} 
            activeFolderId={activeFolderId} 
            propertyToEdit={propertyToEdit}
            onCancelEdit={() => { setPropertyToEdit(null); setActiveTab('properties'); }}
          />
        )}
        
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {displayProperties.length === 0 ? (
              <div className="bg-white rounded-[4rem] p-24 text-center border-2 border-dashed border-slate-100 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  {searchQuery || activeFilterCount > 0 ? <Search className="w-12 h-12 text-slate-200" /> : <Home className="w-12 h-12 text-slate-200" />}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                  {searchQuery || activeFilterCount > 0 ? 'Sin resultados para la búsqueda' : 'No hay activos registrados'}
                </h3>
                <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                  {searchQuery || activeFilterCount > 0 ? 'Ajusta los filtros o borra los términos de búsqueda para encontrar lo que buscas.' : 'Comienza capturando enlaces de propiedades desde portales inmobiliarios.'}
                </p>
                {searchQuery || activeFilterCount > 0 ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setFilters(initialFilters); }}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                  >
                    Resetear Criterios
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Ingresar Activo
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
                    {displayProperties.map((p, index) => (
                      <PropertyCard 
                        key={p.id} 
                        property={p} 
                        index={index}
                        onSelect={setSelectedProperty} 
                        onStatusChange={(id, s) => handleUpdateStatus(id, s)} 
                        onEdit={(p) => { setPropertyToEdit(p); setActiveTab('search'); }}
                        onDelete={handleDeleteProperty}
                      />
                    ))}
                  </div>
                ) : (
                  <PropertyMapView 
                    properties={displayProperties} 
                    onSelectProperty={setSelectedProperty} 
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <FolderFormModal 
        isOpen={isFolderModalOpen} 
        onClose={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} 
        onConfirm={handleFolderConfirm} 
        initialData={editingFolder}
      />

      {isReportOpen && reportFolder && (
        <ReportGenerator 
          folder={reportFolder}
          properties={properties.filter(p => p.folderId === reportFolder.id)}
          onClose={() => { setIsReportOpen(false); setReportFolder(null); }}
        />
      )}
      
      {selectedProperty && (
        <PropertyDetailModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
          userRole={user.role}
          onUpdateReno={(items) => handleUpdateReno(selectedProperty.id, items)}
        />
      )}
    </div>
  );
};

export default App;
