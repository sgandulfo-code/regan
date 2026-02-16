
import React, { useState } from 'react';
import { Plus, Shield, User as UserIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import RenovationCalculator from './components/RenovationCalculator';
import ComparisonTool from './components/ComparisonTool';
import { Property, PropertyStatus, UserRole, User } from './types';
import { MOCK_PROPERTIES, ICONS, MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Current session user simulation
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);

  const handleAddProperty = (prop: Property) => {
    if (currentUser.role !== UserRole.BUYER) {
      alert("Only a Buyer can add new properties to the database.");
      return;
    }
    setProperties([prop, ...properties]);
    setActiveTab('properties');
  };

  const handleUpdateStatus = (id: string, status: PropertyStatus) => {
    if (currentUser.role !== UserRole.BUYER) {
      alert("Only the Buyer (Owner) can change the property status.");
      return;
    }
    setProperties(properties.map(p => p.id === id ? { ...p, status } : p));
  };

  const handleUpdateRenovation = (id: string, items: any[]) => {
    // Both Buyer and Architect can update renovations
    setProperties(properties.map(p => p.id === id ? { ...p, renovationCosts: items } : p));
    if (selectedProperty?.id === id) {
      setSelectedProperty(prev => prev ? { ...prev, renovationCosts: items } : null);
    }
  };

  const switchRole = () => {
    const nextRole = currentUser.role === UserRole.BUYER ? UserRole.ARCHITECT : UserRole.BUYER;
    setCurrentUser({
      ...currentUser,
      role: nextRole,
      name: nextRole === UserRole.ARCHITECT ? "Maria Architect" : "Alejandro Buyer"
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              <span className={`text-xs px-2 py-1 rounded-md border ${currentUser.role === UserRole.ARCHITECT ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                {currentUser.role} View
              </span>
            </h1>
            <p className="text-slate-500">
              {currentUser.role === UserRole.BUYER 
                ? "Managing your real estate acquisitions." 
                : "Providing technical expertise for Alejandro's search."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={switchRole}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              title="Toggle role to test permissions"
            >
              <Shield className="w-4 h-4 text-orange-500" />
              Switch Role
            </button>
            <div className="flex items-center gap-2 bg-white border border-slate-200 py-1 pl-1 pr-3 rounded-xl shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${currentUser.role === UserRole.ARCHITECT ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Saved', value: properties.length, icon: ICONS.Heart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Visits Done', value: '12', icon: ICONS.CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Avg. m² Price', value: '€4,250', icon: ICONS.MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Collaborators', value: '3', icon: ICONS.Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-lg font-bold text-slate-800">Recent Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.slice(0, 2).map(p => (
                      <PropertyCard 
                        key={p.id} 
                        property={p} 
                        onSelect={setSelectedProperty} 
                        onStatusChange={handleUpdateStatus} 
                        isEditable={currentUser.role === UserRole.BUYER}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-800">Visit Agenda</h2>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    {[
                      { date: 'Today, 18:00', title: 'Attic Madrid Rio', addr: 'Paseo de la Chopera' },
                      { date: 'Tomorrow, 10:30', title: 'Industrial Loft', addr: 'Calle Palma' }
                    ].map((visit, i) => (
                      <div key={i} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-600 font-bold shrink-0">
                          <span className="text-xs uppercase">{visit.date.split(',')[0]}</span>
                          <span className="text-lg">{visit.date.split(' ')[1]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{visit.title}</p>
                          <p className="text-xs text-slate-500 truncate w-32">{visit.addr}</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100">
                      View Calendar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="max-w-4xl mx-auto">
              {currentUser.role === UserRole.BUYER ? (
                <PropertyForm onAdd={handleAddProperty} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800">Admin Only Access</h2>
                  <p className="text-slate-500">Architects cannot add new properties. Please switch back to Buyer role to use Smart Search.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(p => (
                <PropertyCard 
                  key={p.id} 
                  property={p} 
                  onSelect={setSelectedProperty} 
                  onStatusChange={handleUpdateStatus}
                  isEditable={currentUser.role === UserRole.BUYER}
                />
              ))}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="space-y-8">
              <ComparisonTool properties={properties} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {properties.map(p => (
                  <RenovationCalculator 
                    key={p.id} 
                    property={p} 
                    userRole={currentUser.role}
                    onUpdate={(items) => handleUpdateRenovation(p.id, items)} 
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                {ICONS.FileText}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Generate Search Dossier</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Create a professional PDF report with all your saved properties, renovation estimates, and professional notes for offline review.</p>
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                Export PDF Report
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="md:w-2/5 relative h-64 md:h-auto overflow-hidden">
              <img 
                src={selectedProperty.images[0]} 
                alt={selectedProperty.title} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 md:hidden"
              >
                {ICONS.Trash2}
              </button>
            </div>
            
            <div className="md:w-3/5 p-8 overflow-y-auto bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedProperty.title}</h2>
                  <p className="text-slate-500 flex items-center gap-1">{ICONS.MapPin} {selectedProperty.address}</p>
                </div>
                <button 
                  onClick={() => setSelectedProperty(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex gap-2 mb-8">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {selectedProperty.status}
                </span>
                <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                  {selectedProperty.sqft} m²
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold">
                  €{selectedProperty.price.toLocaleString()}
                </span>
              </div>

              <div className="space-y-6">
                <RenovationCalculator 
                  property={selectedProperty} 
                  userRole={currentUser.role}
                  onUpdate={(items) => handleUpdateRenovation(selectedProperty.id, items)} 
                />

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Collaborative Chat
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400">Project #{selectedProperty.id}</span>
                  </h4>
                  <div className="h-48 overflow-y-auto space-y-4 mb-4 pr-2">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700 shrink-0 uppercase tracking-tighter">Arch</div>
                      <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-xs">
                        <p className="font-bold mb-1 text-slate-800">Maria (Architect)</p>
                        <p className="text-slate-600 leading-relaxed">I've updated the kitchen estimates based on the sqft. The load-bearing walls seem okay, but we should verify the ceiling height in the attic.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start flex-row-reverse">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0 uppercase tracking-tighter">You</div>
                      <div className="bg-indigo-600 p-3 rounded-2xl rounded-tr-none text-xs text-white">
                        <p className="font-bold mb-1">Alejandro</p>
                        <p className="leading-relaxed">Thanks Maria. Is there enough room for a small home office in the master bedroom?</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Discuss with your team..."
                      className="w-full p-3 pr-12 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
