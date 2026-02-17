
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
      id: p.id, folderId: p.folder_id, title: p.title, url: p.url, address: p.address, exactAddress: p.exact_address, price: Number(p.price), fees: Number(p.fees),
      environments: p.environments, rooms: p.rooms, bathrooms: p.bathrooms, toilets: p.toilets, parking: p.parking, sqft: Number(p.sqft), coveredSqft: Number(p.covered_sqft),
      uncoveredSqft: Number(p.uncovered_sqft), age: p.age, floor: p.floor, status: p.status as PropertyStatus, rating: p.rating, notes: p.notes, images: p.images || [],
      renovationCosts: p.renovations ? p.renovations.map((r: any) => ({ id: r.id, category: r.category, description: r.description, estimatedCost: Number(r.estimated_cost) })) : [],
      createdAt: p.created_at
    })));
    setIsSyncing(false);
  };

  const handleCreateFolder = async (data: { name: string, description: string }) => {
    if (!user) return;
    setIsSyncing(true);
    const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
    const newFolder = await dataService.createFolder(
      { name: data.name, description: data.description, color: colors[folders.length % colors.length] },
      user.id
    );
    if (newFolder) {
      await loadInitialData();
      setActiveFolderId(newFolder.id);
      setActiveTab('search');
    }
    setIsFolderModalOpen(false);
    setIsSyncing(false);
  };

  const handleAddProperty = async (prop: Property) => {
    if (user?.role !== UserRole.BUYER || !user) return;
    setIsSyncing(true);
    const folderToAssign = activeFolderId || (folders.length > 0 ? folders[0].id : null);
    if (!folderToAssign) { alert("Create a search folder first."); setIsSyncing(false); return; }
    const created = await dataService.createProperty({ ...prop, folderId: folderToAssign }, user.id);
    if (created) { await loadInitialData(); setActiveTab('properties'); }
    setIsSyncing(false);
  };

  if (isSyncing && !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} folders={folders} activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId} onLogout={() => supabase.auth.signOut()} isSyncing={isSyncing} />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{folders.find(f => f.id === activeFolderId)?.name || 'Dashboard'}</h1>
            <p className="text-slate-500 font-medium">Neural Real Estate Brain</p>
          </div>
          <div className="bg-white p-2 rounded-2xl shadow-sm border flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{user.name[0]}</div><span className="text-sm font-bold pr-2">{user.name}</span></div>
        </header>
        {activeTab === 'dashboard' && !activeFolderId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {folders.map(f => (
              <button key={f.id} onClick={() => { setActiveFolderId(f.id); setActiveTab('properties'); }} className="bg-white p-8 rounded-[2rem] border hover:shadow-xl transition-all text-left">
                <div className={`w-12 h-12 ${f.color} rounded-xl mb-6 shadow-lg`}></div><h3 className="text-xl font-black mb-2">{f.name}</h3><p className="text-sm text-slate-400 font-medium mb-4">{f.description}</p>
                <div className="pt-4 border-t flex justify-between"><span className="text-xs font-black uppercase text-slate-300">{properties.filter(p => p.folderId === f.id).length} Props</span><ArrowRight className="w-4 h-4 text-indigo-600" /></div>
              </button>
            ))}
            <button onClick={() => setIsFolderModalOpen(true)} className="border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"><Plus className="w-8 h-8 mb-2" /><span className="text-xs font-black uppercase">New Search Folder</span></button>
          </div>
        )}
        {activeTab === 'search' && <PropertyForm onAdd={handleAddProperty} userId={user.id} activeFolderId={activeFolderId} />}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{properties.filter(p => p.folderId === activeFolderId).map(p => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onStatusChange={(id, s) => dataService.updatePropertyStatus(id, s)} />)}</div>
          </div>
        )}
      </main>
      <FolderFormModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onConfirm={handleCreateFolder} />
    </div>
  );
};

export default App;
