
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, FolderPlus, Search, ArrowRight, Clock, MapPin, ChevronRight, Briefcase, Heart, FileText, LayoutGrid, Map as MapIcon, Ruler, Layers, Home, Bed, Bath, Car, History, Building2, ShieldCheck, Euro, Cloud, Check, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import RenovationCalculator from './components/RenovationCalculator';
import ComparisonTool from './components/ComparisonTool';
import FolderFormModal from './components/FolderFormModal';
import PropertyMapView from './components/PropertyMapView';
import Auth from './components/Auth';
import { Property, PropertyStatus, UserRole, User, RenovationItem, SearchFolder } from './types';
import { dataService } from './services/dataService';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [folders, setFolders] = useState<SearchFolder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Supabase Auth Session Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserProfile(session.user.id);
      } else {
        setIsSyncing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsSyncing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (userId: string) => {
    const profile = await dataService.getProfile(userId);
    if (profile) {
      setUser(profile);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setIsSyncing(true);
    const [fetchedFolders, fetchedProperties] = await Promise.all([
      dataService.getFolders(),
      dataService.getProperties()
    ]);
    
    setFolders(fetchedFolders.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      color: f.color,
      createdAt: f.created_at
    })));

    setProperties(fetchedProperties.map((p: any) => ({
      id: p.id,
      folderId: p.folder_id,
      title: p.title,
      url: p.url,
      address: p.address,
      exactAddress: p.exact_address,
      price: Number(p.price),
      fees: Number(p.fees),
      environments: p.environments,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      toilets: p.toilets,
      parking: p.parking,
      sqft: Number(p.sqft),
      coveredSqft: Number(p.covered_sqft),
      uncoveredSqft: Number(p.uncovered_sqft),
      age: p.age,
      floor: p.floor,
      status: p.status as PropertyStatus,
      rating: p.rating,
      notes: p.notes,
      images: p.images || [],
      renovationCosts: p.renovations ? p.renovations.map((r: any) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        estimatedCost: Number(r.estimated_cost)
      })) : [], 
      createdAt: p.created_at
    })));
    setIsSyncing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredProperties = useMemo(() => {
    if (!activeFolderId) return properties;
    return properties.filter(p => p.folderId === activeFolderId);
  }, [properties, activeFolderId]);

  const activeFolder = useMemo(() => 
    folders.find(f => f.id === activeFolderId), 
  [folders, activeFolderId]);

  const handleAddProperty = async (prop: Property) => {
    if (user?.role !== UserRole.BUYER) return;
    
    setIsSyncing(true);
    const folderToAssign = activeFolderId || (folders.length > 0 ? folders[0].id : null);
    
    if (!folderToAssign) {
      alert("Please create a search folder first.");
      setIsSyncing(false);
      return;
    }

    const created = await dataService.createProperty({ ...prop, folderId: folderToAssign });
    if (created) {
      await loadInitialData(); 
      setActiveTab('properties');
    }
    setIsSyncing(false);
  };

  const handleUpdateStatus = async (id: string, status: PropertyStatus) => {
    if (user?.role !== UserRole.BUYER) return;
    setIsSyncing(true);
    await dataService.updatePropertyStatus(id, status);
    setProperties(properties.map(p => p.id === id ? { ...p, status } : p));
    setIsSyncing(false);
  };

  const handleUpdateRenovation = async (id: string, items: RenovationItem[]) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateRenovations(id, items, user.id);
    setProperties(properties.map(p => p.id === id ? { ...p, renovationCosts: items } : p));
    if (selectedProperty?.id === id) {
      setSelectedProperty(prev => prev ? { ...prev, renovationCosts: items } : null);
    }
    setIsSyncing(false);
  };

  const handleCreateFolder = async (data: { name: string, description: string }) => {
    setIsSyncing(true);
    const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
    const newFolder = await dataService.createFolder({
      name: data.name,
      description: data.description,
      color: colors[folders.length % colors.length]
    });
    
    if (newFolder) {
      await loadInitialData();
      setActiveFolderId(newFolder.id);
      setActiveTab('search');
    }
    setIsFolderModalOpen(false);
    setIsSyncing(false);
  };

  if (isSyncing && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const DetailItem = ({ label, value, icon: Icon }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-black text-slate-800">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user.role} 
        folders={folders}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeFolder ? activeFolder.name : (activeTab === 'dashboard' ? 'My Search Folders' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
              </h1>
              {activeFolder && (
                <div className={`w-3 h-3 rounded-full ${activeFolder.color}`}></div>
              )}
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              {activeFolder ? (
                <>
                  <Briefcase className="w-4 h-4" />
                  Portfolio synchronized with Supabase
                </>
              ) : "Your properties are safe in the cloud."}
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 pr-5 rounded-2xl shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${user.role === UserRole.ARCHITECT ? 'bg-orange-500' : user.role === UserRole.CONTRACTOR ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-sm font-black text-slate-800">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.role}</p>
                   {isSyncing ? <Cloud className="w-2.5 h-2.5 text-indigo-400 animate-pulse" /> : <Check className="w-2.5 h-2.5 text-emerald-500" />}
                </div>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && !activeFolderId && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map((folder: any) => {
                const propCount = properties.filter(p => p.folderId === folder.id).length;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setActiveFolderId(folder.id);
                      setActiveTab('properties');
                    }}
                    className="group bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all text-left relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${folder.color} opacity-5 blur-3xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
                    <div className="mb-6 flex justify-between items-start">
                      <div className={`w-14 h-14 ${folder.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                        <Search className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(folder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{folder.name}</h3>
                    <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">{folder.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-800">{propCount}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Properties</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                );
              })}
              <button 
                onClick={() => setIsFolderModalOpen(true)}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:bg-white hover:border-indigo-300 hover:text-indigo-500 transition-all group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center group-hover:border-indigo-200 group-hover:scale-110 transition-all">
                  <Plus className="w-8 h-8" />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">New Search Folder</span>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {activeTab === 'search' && (
             <div className="max-w-5xl mx-auto">
               <PropertyForm onAdd={handleAddProperty} userId={user.id} activeFolderId={activeFolderId} />
             </div>
          )}

          {activeTab === 'properties' && (
             <div className="space-y-8 animate-in fade-in duration-700">
               {activeFolderId && (
                 <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
                   <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>List View</button>
                   <button onClick={() => setViewMode('map')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Map View</button>
                 </div>
               )}
               {viewMode === 'list' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {filteredProperties.map(p => (
                     <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onStatusChange={handleUpdateStatus} isEditable={user.role === UserRole.BUYER} />
                   ))}
                 </div>
               ) : (
                 <PropertyMapView properties={filteredProperties} onSelectProperty={setSelectedProperty} />
               )}
             </div>
          )}

          {activeTab === 'calculator' && (
             <div className="space-y-12">
               <ComparisonTool properties={filteredProperties} />
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {filteredProperties.map(p => (
                   <RenovationCalculator key={p.id} property={p} userRole={user.role} onUpdate={(items) => handleUpdateRenovation(p.id, items)} />
                 ))}
               </div>
             </div>
          )}
        </div>
      </main>

      <FolderFormModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onConfirm={handleCreateFolder} />

      {selectedProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300">
            <div className="md:w-2/5 relative h-72 md:h-auto overflow-hidden">
              <img src={selectedProperty.images[0]} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedProperty(null)} className="absolute top-6 left-6 bg-white/20 p-3 rounded-full text-white md:hidden"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="md:w-3/5 p-12 overflow-y-auto bg-slate-50/30">
              <div className="flex justify-between items-start mb-8">
                <div><h2 className="text-3xl font-black text-slate-800">{selectedProperty.title}</h2><p className="text-slate-500 font-medium">{selectedProperty.address}</p></div>
                <button onClick={() => setSelectedProperty(null)} className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm border border-slate-100 rotate-45"><Plus className="w-7 h-7" /></button>
              </div>
              <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailItem label="Status" value={selectedProperty.status} icon={History} />
                <DetailItem label="Total Price" value={`€${selectedProperty.price.toLocaleString()}`} icon={Euro} />
                <DetailItem label="m²" value={selectedProperty.sqft} icon={Ruler} />
                <DetailItem label="AI Score" value={`${selectedProperty.rating}/5`} icon={Search} />
              </div>
              <RenovationCalculator property={selectedProperty} userRole={user.role} onUpdate={(items) => handleUpdateRenovation(selectedProperty.id, items)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
