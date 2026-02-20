
import React from 'react';
import { UserRole, SearchFolder } from '../types';
import { Home, Search, Heart, BarChart2, FolderOpen, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  folders: SearchFolder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  folders,
  activeFolderId,
  setActiveFolderId
}) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'properties', label: 'Propiedades', icon: <Heart className="w-5 h-5" /> },
    { id: 'comparison', label: 'Comparativa', icon: <BarChart2 className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            PB
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">PropBrain</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (item.id === 'dashboard') setActiveFolderId(null);
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
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tesis de Búsqueda</p>
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full flex items-center gap-3 p-3 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeFolderId === folder.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${activeFolderId === folder.id ? 'bg-white' : folder.color}`}></div>
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-slate-50">
        <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm">
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
