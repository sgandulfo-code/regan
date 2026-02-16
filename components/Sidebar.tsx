
import React from 'react';
import { ICONS } from '../constants';
import { UserRole, SearchFolder } from '../types';
import { Plus, LogOut, Cloud, Loader2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  folders: SearchFolder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  onLogout: () => void;
  isSyncing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  userRole = UserRole.BUYER,
  folders,
  activeFolderId,
  setActiveFolderId,
  onLogout,
  isSyncing
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'My Searches', icon: ICONS.Folder },
    { id: 'search', label: 'Smart Search', icon: ICONS.Plus, hidden: userRole !== UserRole.BUYER },
    { id: 'properties', label: 'All Properties', icon: ICONS.Heart },
    { id: 'calendar', label: 'Global Visits', icon: ICONS.Calendar },
    { id: 'calculator', label: 'Estimates', icon: ICONS.Calculator },
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

      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
        <p className="hidden md:block px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Main Menu</p>
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
            <span className={activeTab === item.id ? 'text-indigo-600 scale-110 transition-transform' : ''}>
              {item.icon}
            </span>
            <span className="hidden md:block">{item.label}</span>
          </button>
        ))}

        <div className="hidden md:block mt-8">
          <div className="px-3 flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Searches</p>
          </div>
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
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
                <div className={`w-2 h-2 rounded-full ${activeFolderId === folder.id ? 'bg-white' : folder.color.replace('bg-', 'bg-')}`}></div>
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 hidden md:block space-y-4">
        <div className="bg-slate-900 border-slate-800 rounded-2xl p-4 shadow-sm border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-1 text-slate-500">Database</p>
            <p className="font-bold text-white text-xs flex items-center gap-2">
              <Cloud className="w-3 h-3" /> Supabase
            </p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
