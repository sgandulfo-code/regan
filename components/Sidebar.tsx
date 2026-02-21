
import React from 'react';
import { UserRole, SearchFolder } from '../types';
import { Home, Plus, Heart, Calculator, FolderOpen, LogOut, Loader2, Pencil, Trash2, Cpu, Users, Calendar } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  folders: SearchFolder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onLogout?: () => void;
  isSyncing?: boolean;
  onEditFolder?: (folder: SearchFolder) => void;
  onDeleteFolder?: (id: string) => void;
  onShareFolder?: (folder: SearchFolder) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  userRole = UserRole.BUYER,
  folders,
  activeFolderId,
  setActiveFolderId,
  onLogout,
  isSyncing,
  onEditFolder,
  onDeleteFolder,
  onShareFolder
}) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'search', label: 'Lead Collector', icon: <Plus className="w-5 h-5" />, hidden: userRole !== UserRole.BUYER },
    { id: 'properties', label: 'Propiedades', icon: <Heart className="w-5 h-5" /> },
    { id: 'visits', label: 'Visitas', icon: <Calendar className="w-5 h-5" /> },
    { id: 'calculator', label: 'Estimador Reformas', icon: <Calculator className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-72 lg:w-64 bg-white border-r border-slate-200 h-screen flex flex-col z-30 shadow-2xl lg:shadow-none">
      <div className="p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            PB
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-800 tracking-tight leading-none">PropBrain</span>
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
              if (item.id === 'dashboard' || item.id === 'visits') setActiveFolderId(null);
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
              activeTab === item.id && !activeFolderId
                ? 'bg-indigo-50 text-indigo-700 font-black shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="pt-8">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tesis Activas</p>
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setActiveTab('properties');
                  }}
                  className={`w-full flex items-center gap-3 p-3 px-4 rounded-xl text-xs font-bold transition-all ${
                    activeFolderId === folder.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${activeFolderId === folder.id ? 'bg-white' : folder.color}`}></div>
                  <span className="truncate pr-8">{folder.name}</span>
                  {folder.isShared && (
                    <Users className={`w-3 h-3 ml-auto ${activeFolderId === folder.id ? 'text-white/70' : 'text-slate-400'}`} />
                  )}
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onShareFolder && !folder.isShared && (
                    <button onClick={(e) => { e.stopPropagation(); onShareFolder(folder); }} className="p-1 text-slate-400 hover:text-emerald-600" title="Compartir"><Users className="w-3 h-3" /></button>
                  )}
                  {onEditFolder && !folder.isShared && (
                    <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} className="p-1 text-slate-400 hover:text-indigo-600"><Pencil className="w-3 h-3" /></button>
                  )}
                  {onDeleteFolder && (
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4">
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
