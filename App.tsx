
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, FolderPlus, Search, ArrowRight, Clock, MapPin, ChevronRight, Briefcase, Heart, FileText, LayoutGrid, Map as MapIcon, Ruler, Layers, Home, Bed, Bath, Car, History, Building2, ShieldCheck, Euro, Cloud, Check, Loader2, Trash2, Pencil, Printer, X, Filter, ChevronDown, Star, DollarSign, RefreshCw, ArrowUpDown } from 'lucide-react';
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
import { Property, PropertyStatus, UserRole, User, RenovationItem, SearchFolder } from './types';
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
    
    setFolders(fetchedFolders.map((f: any) => ({ 
      id: f.id, name: f.name, description: f.description, color: f.color, createdAt: f.created_at 
    })));
    
    setProperties(fetchedProperties.map((p: any) => ({
      id: p.id,
      title: p.title, url: p.url, address: p.address, exactAddress: p.exact_address, price: Number(p.price), fees: Number(p.fees),
      environments: p.environments, rooms: p.rooms, bathrooms: p.bathrooms, toilets: p.toilets, parking: p.parking, sqft: Number(p.sqft), coveredSqft: Number(p.covered_sqft),
      uncoveredSqft: Number(p.uncovered_sqft), age: p.age, floor: p.floor, status: p.status as PropertyStatus, rating: p.rating, notes: p.notes, images: p.images || [],
      renovationCosts: p.renovations ? p.renovations.map((r: any) => ({ id: r.id, category: r.category, description: r.description, estimatedCost: Number(r.estimated_cost) })) : [],
      createdAt: p.created_at,
      folderId: p.folder_id 
    })));
    setIsSyncing(false);
  };

  const handleFolderConfirm = async (data: { name: string, description: string }) => {
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
      if (!folderToAssign) { alert("Create a search folder first."); setIsSyncing(false); return; }
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
    
    // 1. Filtro por carpeta
    if (activeFolderId) {
      filtered = filtered.filter(p => p.folderId === activeFolderId);
    }
    
    // 2. Filtro por búsqueda de texto (Search Query)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query))
      );
    }

    // 3. Filtros Técnicos Avanzados
    if (filters.minPrice) filtered = filtered.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) filtered = filtered.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.minRooms) filtered = filtered.filter(p => p.rooms >= Number(filters.minRooms));
    if (filters.minBathrooms) filtered = filtered.filter(p => p.bathrooms >= Number(filters.minBathrooms));
    if (filters.minSqft) filtered = filtered.filter(p => p.sqft >= Number(filters.minSqft));
    if (filters.status) filtered = filtered.filter(p => p.status === filters.status);
    if (filters.minRating > 0) filtered = filtered.filter(p => p.rating >= filters.minRating);
    
    // 4. Ordenación (Sorting)
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

  // Limpiar búsqueda al cambiar de carpeta o pestaña
  useEffect(() => {
    setSearchQuery('');
    setFilters(initialFilters);
    setSortBy('newest');
  }, [activeFolderId, activeTab]);

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
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeFolder ? activeFolder.name : (activeTab === 'dashboard' ? 'Mis Búsquedas' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeFolder ? activeFolder.description : 'Plataforma inteligente para compradores de propiedades'}
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
        </header>

        {(activeTab === 'dashboard' || activeTab === 'properties') && (
          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={`Search in ${activeFolder ? activeFolder.name : 'all assets'}...`}
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
                    <option value="newest">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="sqft-desc">Surface: Largest First</option>
                    <option value="rating-desc">Top Rated (AI)</option>
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
                  Advanced Filters
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Price Range</label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Bed className="w-3 h-3" /> Rooms & Baths</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min Rooms" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.minRooms}
                      onChange={(e) => setFilters({...filters, minRooms: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="Min Baths" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                      value={filters.minBathrooms}
                      onChange={(e) => setFilters({...filters, minBathrooms: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Surface (min m²)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                    value={filters.minSqft}
                    onChange={(e) => setFilters({...filters, minSqft: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Status & Rating</label>
                  <div className="flex flex-col gap-2">
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all uppercase tracking-widest"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">Any Status</option>
                      {Object.values(PropertyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-1 items-center justify-between px-2 bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Min Stars:</span>
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
                    Showing {displayProperties.length} of {activeFolder ? properties.filter(p => p.folderId === activeFolderId).length : properties.length} properties
                  </p>
                  <button 
                    onClick={() => setFilters(initialFilters)}
                    className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && !activeFolderId && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
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
                        title="Editar carpeta"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-500 hover:text-rose-600 shadow-xl border border-slate-100 transition-all hover:scale-110"
                        title="Borrar carpeta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => { setActiveFolderId(f.id); setActiveTab('properties'); }} 
                      className="w-full bg-white p-8 rounded-[2rem] border border-slate-200 hover:shadow-xl hover:border-indigo-100 transition-all text-left relative overflow-hidden h-full flex flex-col"
                    >
                      <div className={`w-12 h-12 ${f.color} rounded-xl mb-6 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform`}></div>
                      <h3 className="text-xl font-black mb-2 text-slate-800">{f.name}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2 leading-relaxed flex-1">
                        {f.description || 'Sin descripción definida'}
                      </p>
                      <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          {properties.filter(p => p.folderId === f.id).length} Propiedades
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => { setEditingFolder(null); setIsFolderModalOpen(true); }} 
                  className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all min-h-[220px]"
                >
                  <Plus className="w-10 h-10 mb-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Nueva Búsqueda</span>
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
              <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  {searchQuery || activeFilterCount > 0 ? <Search className="w-10 h-10 text-slate-300" /> : <Home className="w-10 h-10 text-slate-300" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {searchQuery || activeFilterCount > 0 ? 'No results found for your filters' : 'No properties here yet'}
                </h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">
                  {searchQuery || activeFilterCount > 0 ? 'Try adjusting your filters or resetting the search parameters.' : 'Start by adding a property listing from any portal.'}
                </p>
                {searchQuery || activeFilterCount > 0 ? (
                  <button 
                    onClick={() => { setSearchQuery(''); setFilters(initialFilters); }}
                    className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Reset all criteria
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                  >
                    Add Property
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {displayProperties.map(p => (
                      <PropertyCard 
                        key={p.id} 
                        property={p} 
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
