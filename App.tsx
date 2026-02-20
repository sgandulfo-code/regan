
import React, { useState, useMemo } from 'react';
import { Search, MapPin, Heart, LayoutGrid, Map as MapIcon, Home, Plus, Filter, BarChart2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import ComparisonTool from './components/ComparisonTool';
import PropertyMapView from './components/PropertyMapView';
import PropertyDetailModal from './components/PropertyDetailModal';
import { Property, PropertyStatus, UserRole, SearchFolder, FolderStatus, RenovationItem } from './types';
import { MOCK_PROPERTIES, MOCK_FOLDERS, MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const folders = MOCK_FOLDERS;
  const user = MOCK_USER;

  const handleUpdateStatus = (id: string, status: PropertyStatus) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  // Added missing handlers for PropertyCard actions
  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleEditProperty = (p: Property) => {
    setSelectedProperty(p);
  };

  // Added missing handler for Renovation updates in PropertyDetailModal
  const handleUpdateReno = (items: RenovationItem[]) => {
    if (!selectedProperty) return;
    setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, renovationCosts: items } : p));
    setSelectedProperty(prev => prev ? { ...prev, renovationCosts: items } : null);
  };

  const activeFolder = useMemo(() => 
    folders.find(f => f.id === activeFolderId), 
    [activeFolderId]
  );
  
  const displayProperties = useMemo(() => {
    if (!activeFolderId) return properties;
    return properties.filter(p => p.folderId === activeFolderId);
  }, [properties, activeFolderId]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user.role} 
        folders={folders} 
        activeFolderId={activeFolderId} 
        setActiveFolderId={setActiveFolderId} 
      />
      
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeFolder ? activeFolder.name : 'Dashboard Estratégico'}
            </h1>
            <p className="text-slate-500 font-medium">
              {activeFolder ? activeFolder.description : 'PropBrain | Gestión inteligente de activos inmobiliarios'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-3 h-3" /> Grid
              </button>
              <button 
                onClick={() => setViewMode('map')} 
                className={`p-2 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                <MapIcon className="w-3 h-3" /> Map
              </button>
            </div>
            
            <div className="bg-white p-2 rounded-2xl shadow-sm border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">U</div>
              <span className="text-sm font-bold pr-2">{user.name}</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && !activeFolderId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {folders.map(f => (
              <button 
                key={f.id}
                onClick={() => setActiveFolderId(f.id)} 
                className="bg-white p-8 rounded-[3rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-100 transition-all text-left group"
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl shadow-lg flex items-center justify-center text-white mb-6`}>
                  <Home className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">{f.name}</h3>
                <p className="text-sm text-slate-400 font-medium mb-8 italic">{f.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{properties.filter(p => p.folderId === f.id).length} Activos</span>
                  <Plus className="w-4 h-4 group-hover:text-indigo-600" />
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'properties' || activeFolderId ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {displayProperties.map((p, idx) => (
                <PropertyCard 
                  key={p.id} 
                  property={p} 
                  index={idx} 
                  onSelect={setSelectedProperty} 
                  onStatusChange={handleUpdateStatus}
                  onEdit={handleEditProperty}
                  onDelete={handleDeleteProperty}
                />
              ))}
            </div>
          ) : (
            <PropertyMapView properties={displayProperties} onSelectProperty={setSelectedProperty} />
          )
        ) : null}

        {activeTab === 'comparison' && (
          <ComparisonTool properties={properties} />
        )}
      </main>

      {selectedProperty && (
        <PropertyDetailModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
          userRole={user.role} 
          onUpdateReno={handleUpdateReno}
        />
      )}
    </div>
  );
};

export default App;
