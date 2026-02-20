
import React from 'react';
import { UserRole, SearchFolder } from '../types';
import { Plus, LogOut, Loader2, Pencil, Trash2, Heart, FolderOpen, Calculator } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  folders: SearchFolder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onLogout: () => void;
  isSyncing?: boolean;
  onEditFolder: (folder: SearchFolder) => void;
  onDeleteFolder: (id: string) => void;
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
  onDeleteFolder
}) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Mis Búsquedas', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'search', label: 'Lead Collector', icon: <Plus className="w-5 h-5" />, hidden: userRole !== UserRole.BUYER },
    { id: 'properties', label: 'Propiedades', icon: <Heart className="w-5 h-5" /> },
    { id: 'calculator', label: 'Estimador Reformas', icon: <Calculator className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col transition-all duration-300 z-30">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            PB
          </div>
          <span className="hidden md:block font-bold text-xl text-slate-800 tracking-tight">PropBrain</span>
        </div>
        {isSyncing && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin hidden md:block" />}
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (item.id === 'dashboard') setActiveFolderId(null);
            }}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <span className={activeTab === item.id ? 'text-indigo-600 scale-110' : ''}>
              {item.icon}
            </span>
            <span className="hidden md:block text-sm">{item.label}</span>
          </button>
        ))}

        <div className="hidden md:block pt-8">
          <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tesis Activas</p>
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setActiveTab('properties');
                  }}
                  className={`w-full flex items-center gap-3 p-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    activeFolderId === folder.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${activeFolderId === folder.id ? 'bg-white' : folder.color}`}></div>
                  <span className="truncate pr-8">{folder.name}</span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                    className={`p-1 rounded hover:bg-white/20 ${activeFolderId === folder.id ? 'text-white' : 'text-slate-400'}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className={`p-1 rounded hover:bg-rose-500 hover:text-white ${activeFolderId === folder.id ? 'text-white' : 'text-slate-400'}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 hidden md:block space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
