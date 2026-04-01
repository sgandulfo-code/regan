
import React from 'react';
import { UserRole, SearchFolder, User, Property } from '../types';
import { Home, Plus, Heart, Calculator, FolderOpen, LogOut, Loader2, Pencil, Trash2, Cpu, Users, Calendar, Globe, Settings, MessageSquare, ArrowLeftRight, TrendingUp, Activity, Layout, MapPin, Inbox, Shield } from 'lucide-react';
import { dataService, InboxLink } from '../services/dataService';

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  folders: SearchFolder[];
  properties: Property[];
  inboxLinks?: InboxLink[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onLogout?: () => void;
  isSyncing?: boolean;
  onEditFolder?: (folder: SearchFolder) => void;
  onDeleteFolder?: (id: string) => void;
  onShareFolder?: (folder: SearchFolder) => void;
  onShareItinerary?: (folderId: string) => void;
  onSelectProperty?: (property: Property) => void;
  pendingVisitsCount?: number;
  feedbackCount?: number;
  onRefresh?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user,
  activeTab, 
  setActiveTab, 
  userRole = UserRole.BUYER,
  folders,
  properties,
  inboxLinks = [],
  activeFolderId,
  setActiveFolderId,
  onLogout,
  isSyncing,
  onEditFolder,
  onDeleteFolder,
  onShareFolder,
  onShareItinerary,
  onSelectProperty,
  pendingVisitsCount = 0,
  feedbackCount = 0,
  onRefresh
}) => {
  
  const handleConnectGoogle = async () => {
    if (!user) return;
    try {
      const { url } = await dataService.getGoogleAuthUrl(user.id);
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Error connecting Google:', error);
      alert('Error al conectar con Google Calendar');
    }
  };

  const unassignedLeadsCount = inboxLinks.filter(l => l.folder_id === null && (!l.status || l.status === 'enviado')).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'crm', label: 'CRM & Pipeline', icon: <Users className="w-5 h-5" />, hidden: userRole !== UserRole.AGENT && userRole !== UserRole.ADMIN },
    { id: 'activity', label: 'Feed de Actividad', icon: <Activity className="w-5 h-5" />, hidden: userRole !== UserRole.AGENT && userRole !== UserRole.ADMIN },
    { 
      id: 'search', 
      label: 'Inbox Global', 
      icon: <Inbox className="w-5 h-5" />, 
      hidden: userRole !== UserRole.BUYER && userRole !== UserRole.AGENT && userRole !== UserRole.ADMIN,
      badge: unassignedLeadsCount > 0 ? unassignedLeadsCount : undefined
    },
    { id: 'properties', label: 'Propiedades', icon: <Heart className="w-5 h-5" /> },
    { 
      id: 'visits', 
      label: 'Visitas', 
      icon: <Calendar className="w-5 h-5" />, 
      badge: pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      feedbackBadge: feedbackCount > 0 ? feedbackCount : undefined 
    },
    { id: 'google-calendar', label: 'Calendario', icon: <Calendar className="w-5 h-5" />, hidden: !user?.googleAuth },
    { id: 'request-visits', label: 'Pedir Visitas', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'comparison', label: 'Comparador', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'valuations', label: 'Dossier de Tasación', icon: <TrendingUp className="w-5 h-5" />, hidden: userRole !== UserRole.AGENT && userRole !== UserRole.ADMIN },
    { id: 'criteria-templates', label: 'Plantillas', icon: <Layout className="w-5 h-5" />, hidden: userRole !== UserRole.AGENT && userRole !== UserRole.ADMIN },
    { id: 'tax-calculator', label: 'Calculadora de Gastos', icon: <Calculator className="w-5 h-5" /> },
    { id: 'financials', label: 'Análisis Financiero', icon: <Calculator className="w-5 h-5" /> },
    { id: 'calculator', label: 'Estimador Reformas', icon: <Pencil className="w-5 h-5" /> },
    { id: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
    { id: 'admin', label: 'Administración', icon: <Shield className="w-5 h-5" />, hidden: userRole !== UserRole.ADMIN },
  ];

  return (
    <aside className="w-72 lg:w-64 bg-white border-r border-slate-200 h-screen flex flex-col z-30 shadow-2xl lg:shadow-none">
      <div className="p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            PB
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-800 tracking-tight leading-none">PropBi</span>
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setActiveFolderId(null);
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              activeTab === item.id && !activeFolderId
                ? 'bg-indigo-50 text-indigo-700 font-black shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.icon}
            <span className="text-sm flex-1 text-left">{item.label}</span>
            <div className="flex gap-1">
              {(item as any).feedbackBadge && (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {(item as any).feedbackBadge}
                </span>
              )}
              {(item as any).badge && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {(item as any).badge}
                </span>
              )}
            </div>
          </button>
        ))}

        <div className="pt-8">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tesis Activas</p>
          <div className="space-y-1">
            {folders.map(folder => {
              const folderProperties = properties.filter(p => p.folderId === folder.id);
              const isActive = activeFolderId === folder.id;
              const folderLeadsCount = inboxLinks.filter(l => l.folder_id === folder.id && (!l.status || l.status === 'enviado')).length;

              return (
                <div key={folder.id} className="group relative">
                  <button
                    onClick={() => {
                      setActiveFolderId(folder.id);
                      setActiveTab('properties');
                    }}
                    className={`w-full flex items-center gap-3 p-3 px-4 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {folder.imageUrl ? (
                      <div className="w-4 h-4 rounded-md overflow-hidden shrink-0 border border-white/20">
                        <img 
                          src={folder.imageUrl} 
                          alt={folder.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : folder.color}`}></div>
                    )}
                    <span className="truncate pr-8 flex-1 text-left">{folder.name}</span>
                    {folderLeadsCount > 0 && (
                      <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                        {folderLeadsCount}
                      </span>
                    )}
                    {folder.isShared && folderLeadsCount === 0 && (
                      <Users className={`w-3 h-3 ml-auto ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
                    )}
                  </button>
                  
                  {/* Properties under folder */}
                  {isActive && folderProperties.length > 0 && (
                    <div className="mt-1 ml-6 space-y-1 border-l border-indigo-200 pl-2 animate-in slide-in-from-left-2 duration-200">
                      {folderProperties.map(prop => (
                        <button
                          key={prop.id}
                          onClick={() => onSelectProperty?.(prop)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-slate-50 transition-all text-left"
                        >
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{prop.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="absolute right-2 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onShareFolder && !folder.isShared && (
                      <button onClick={(e) => { e.stopPropagation(); onShareFolder(folder); }} className={`p-1 ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-emerald-600'}`} title="Compartir"><Users className="w-3 h-3" /></button>
                    )}
                    {onShareItinerary && (
                      <button onClick={(e) => { e.stopPropagation(); onShareItinerary(folder.id); }} className={`p-1 ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-indigo-600'}`} title="Compartir Itinerario"><Globe className="w-3 h-3" /></button>
                    )}
                    {onEditFolder && !folder.isShared && (
                      <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} className={`p-1 ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-indigo-600'}`}><Pencil className="w-3 h-3" /></button>
                    )}
                    {onDeleteFolder && (
                      <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className={`p-1 ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-rose-600'}`}><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 space-y-2">
        <button 
          onClick={handleConnectGoogle}
          className={`w-full flex items-center gap-3 p-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
            user?.googleAuth 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{user?.googleAuth ? 'Google Conectado' : 'Conectar Google'}</span>
        </button>

        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
               <Cpu className="w-3 h-3" />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</span>
           </div>
           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">1.0A</span>
        </div>
      </div>

      {onLogout && (
        <div className="p-6 pt-0 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
