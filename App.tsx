
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Shield, FolderPlus, Search, ArrowRight, Clock, MapPin, ChevronRight, Briefcase, Heart, FileText, LayoutGrid, Map as MapIcon, Ruler, Layers, Home, Bed, Bath, Car, History, Building2, ShieldCheck, Euro } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import RenovationCalculator from './components/RenovationCalculator';
import ComparisonTool from './components/ComparisonTool';
import FolderFormModal from './components/FolderFormModal';
import PropertyMapView from './components/PropertyMapView';
import Auth from './components/Auth';
import { Property, PropertyStatus, UserRole, User, RenovationItem, SearchFolder } from './types';
import { MOCK_PROPERTIES, ICONS, MOCK_FOLDERS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [folders, setFolders] = useState<SearchFolder[]>(MOCK_FOLDERS);
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // Check for existing session
  useEffect(() => {
    const savedSession = localStorage.getItem('propbrain_session');
    if (savedSession) {
      setUser(JSON.parse(savedSession));
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('propbrain_session', JSON.stringify(loggedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('propbrain_session');
  };

  const filteredProperties = useMemo(() => {
    if (!activeFolderId) return properties;
    return properties.filter(p => p.folderId === activeFolderId);
  }, [properties, activeFolderId]);

  const activeFolder = useMemo(() => 
    folders.find(f => f.id === activeFolderId), 
  [folders, activeFolderId]);

  const handleAddProperty = (prop: Property) => {
    if (user?.role !== UserRole.BUYER) {
      alert("Only a Buyer can add new properties.");
      return;
    }
    const folderToAssign = activeFolderId || (folders.length > 0 ? folders[0].id : 'default');
    const propertyWithFolder = { ...prop, folderId: folderToAssign };
    
    setProperties([propertyWithFolder, ...properties]);
    setActiveTab('properties');
  };

  const handleUpdateStatus = (id: string, status: PropertyStatus) => {
    if (user?.role !== UserRole.BUYER) {
      alert("Only the Buyer (Owner) can change the property status.");
      return;
    }
    setProperties(properties.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleUpdateRenovation = (id: string, items: RenovationItem[]) => {
    setProperties(properties.map(p => p.id === id ? { ...p, renovationCosts: items } : p));
    if (selectedProperty?.id === id) {
      setSelectedProperty(prev => prev ? { ...prev, renovationCosts: items } : null);
    }
  };

  const handleCreateFolder = (data: { name: string, description: string }) => {
    const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
    const newFolder: SearchFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      description: data.description,
      color: colors[folders.length % colors.length],
      createdAt: new Date().toISOString()
    };
    setFolders([...folders, newFolder]);
    setActiveFolderId(newFolder.id);
    setActiveTab('properties');
    setIsFolderModalOpen(false);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
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
      />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Header */}
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
                  Technical lead for this specific portfolio
                </>
              ) : "Central control for your real estate acquisitions."}
            </p>
          </div>
          
          <div className="flex items-center gap-4 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 pr-5 rounded-2xl shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${user.role === UserRole.ARCHITECT ? 'bg-orange-500' : user.role === UserRole.CONTRACTOR ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-sm font-black text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Level 1: Folders Dashboard */}
        {activeTab === 'dashboard' && !activeFolderId && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map(folder => {
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
                  <FolderPlus className="w-8 h-8" />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">New Search Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'search' && (
            <div className="max-w-5xl mx-auto">
              {user.role === UserRole.BUYER ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${activeFolder?.color || 'bg-indigo-600'}`}></div>
                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Adding to Folder: <span className="font-black">{activeFolder?.name || 'My Searches'}</span></p>
                     </div>
                     <button onClick={() => setActiveTab('dashboard')} className="text-[10px] font-black text-indigo-600 uppercase underline">Change Folder</button>
                  </div>
                  <PropertyForm onAdd={handleAddProperty} />
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 p-20 text-center shadow-sm">
                  <Shield className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                  <h2 className="text-2xl font-black text-slate-800 mb-2">{user.role} Access Restricted</h2>
                  <p className="text-slate-400 max-w-sm mx-auto">Only Buyers can add new properties to the database. Please request a Buyer to add new leads.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              {activeFolderId && (
                <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    List View
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    Spatial Map
                  </button>
                </div>
              )}

              {filteredProperties.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-200 p-20 text-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <Heart className="w-12 h-12" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 mb-2">No properties here yet</h2>
                   <p className="text-slate-400 mb-8 max-w-xs mx-auto">Start by using Smart Search to extract your first property data from an advertisement.</p>
                   {user.role === UserRole.BUYER && (
                     <button onClick={() => setActiveTab('search')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-all">Go to Smart Search</button>
                   )}
                </div>
              ) : (
                <>
                  {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredProperties.map(p => (
                        <PropertyCard 
                          key={p.id} 
                          property={p} 
                          onSelect={setSelectedProperty} 
                          onStatusChange={handleUpdateStatus}
                          isEditable={user.role === UserRole.BUYER}
                        />
                      ))}
                    </div>
                  ) : (
                    <PropertyMapView 
                      properties={filteredProperties} 
                      onSelectProperty={setSelectedProperty} 
                    />
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <ComparisonTool properties={filteredProperties} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredProperties.map(p => (
                  <RenovationCalculator 
                    key={p.id} 
                    property={p} 
                    userRole={user.role}
                    onUpdate={(items) => handleUpdateRenovation(p.id, items)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <FolderFormModal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
        onConfirm={handleCreateFolder} 
      />

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="md:w-2/5 relative h-72 md:h-auto overflow-hidden">
              <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              <button onClick={() => setSelectedProperty(null)} className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40 transition-all md:hidden">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="md:w-3/5 p-12 overflow-y-auto bg-slate-50/30">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${activeFolder?.color || 'bg-indigo-600'}`}></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeFolder?.name || 'Property Detail'}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 leading-tight">{selectedProperty.title}</h2>
                  <p className="text-slate-500 font-medium flex items-center gap-2 mt-2"><MapPin className="w-4 h-4 text-indigo-500" /> {selectedProperty.address}</p>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 shadow-sm border border-slate-100 transition-all">
                  <Plus className="w-7 h-7 rotate-45" />
                </button>
              </div>

              {/* Technical Information Grid */}
              <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Acquisition Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Status" value={selectedProperty.status} icon={History} />
                  <DetailItem label="Total Price" value={`€${selectedProperty.price.toLocaleString()}`} icon={Euro} />
                  <DetailItem label="Monthly Fees" value={selectedProperty.fees ? `€${selectedProperty.fees.toLocaleString()}` : '€0'} icon={ShieldCheck} />
                  <DetailItem label="AI Score" value={`${selectedProperty.rating}/5 Stars`} icon={Search} />
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Structural Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem label="Environments" value={selectedProperty.environments} icon={Home} />
                  <DetailItem label="Bedrooms" value={selectedProperty.rooms} icon={Bed} />
                  <DetailItem label="Bathrooms" value={selectedProperty.bathrooms} icon={Bath} />
                  <DetailItem label="Toilets" value={selectedProperty.toilets || 0} icon={Bath} />
                  
                  <DetailItem label="Total m²" value={`${selectedProperty.sqft} m²`} icon={Ruler} />
                  <DetailItem label="Covered m²" value={`${selectedProperty.coveredSqft || selectedProperty.sqft} m²`} icon={Layers} />
                  <DetailItem label="Uncovered m²" value={`${selectedProperty.uncoveredSqft || 0} m²`} icon={Layers} />
                  <DetailItem label="Floor Level" value={selectedProperty.floor || 'Gnd'} icon={Building2} />
                  
                  <DetailItem label="Parking Spots" value={selectedProperty.parking || 0} icon={Car} />
                  <DetailItem label="Age (Years)" value={selectedProperty.age || 'Unknown'} icon={Clock} />
                </div>
              </div>

              <div className="space-y-10">
                <RenovationCalculator property={selectedProperty} userRole={user.role} onUpdate={(items) => handleUpdateRenovation(selectedProperty.id, items)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
