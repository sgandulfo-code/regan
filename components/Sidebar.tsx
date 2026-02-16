
import React from 'react';
import { ICONS } from '../constants';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole = UserRole.BUYER }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: ICONS.Home },
    { id: 'search', label: 'Smart Search', icon: ICONS.Plus, hidden: userRole !== UserRole.BUYER },
    { id: 'properties', label: 'Properties', icon: ICONS.Heart },
    { id: 'calendar', label: 'Visits', icon: ICONS.Calendar },
    { id: 'calculator', label: 'Estimates', icon: ICONS.Calculator },
    { id: 'team', label: 'Team', icon: ICONS.Users },
    { id: 'reports', label: 'Dossiers', icon: ICONS.FileText },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
          PB
        </div>
        <span className="hidden md:block font-bold text-xl text-slate-800 tracking-tight">PropBrain</span>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {menuItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
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
      </nav>

      <div className="p-4 border-t border-slate-100 hidden md:block">
        <div className={`rounded-2xl p-4 shadow-sm border ${userRole === UserRole.ARCHITECT ? 'bg-orange-50 border-orange-100' : 'bg-slate-900 border-slate-800'}`}>
          <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${userRole === UserRole.ARCHITECT ? 'text-orange-400' : 'text-slate-500'}`}>Session Mode</p>
          <p className={`font-bold ${userRole === UserRole.ARCHITECT ? 'text-orange-900' : 'text-white'}`}>{userRole}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
