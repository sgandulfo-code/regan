import React from 'react';
import { SearchFolder, FolderStatus } from '../types';
import { Home, CalendarDays, ArrowRight } from 'lucide-react';

interface FolderRowProps {
  folder: SearchFolder;
  propertiesCount: number;
  daysActive: number;
  onClick: () => void;
}

const FolderRow: React.FC<FolderRowProps> = ({ folder, propertiesCount, daysActive, onClick }) => {
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <button 
      onClick={onClick}
      className="w-full bg-white p-4 rounded-2xl border border-slate-200 hover:shadow-md hover:border-indigo-100 transition-all text-left group flex items-center gap-4"
    >
      {/* Icon */}
      <div className={`w-12 h-12 ${folder.color} rounded-xl shadow-sm flex items-center justify-center text-white shrink-0`}>
        <Home className="w-6 h-6" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight truncate">{folder.name}</h3>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {new Date(folder.startDate || '').toLocaleDateString()}
            </span>
        </div>

        <div className="hidden md:block md:col-span-3">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                folder.status === FolderStatus.ABIERTA ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                folder.status === FolderStatus.PENDIENTE ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
                {folder.status}
            </span>
             <p className="text-[9px] text-slate-400 font-medium mt-1 truncate">{stripHtml(folder.description)}</p>
        </div>

        <div className="hidden md:flex md:col-span-3 gap-4">
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Presupuesto</p>
                <p className="text-xs font-black text-slate-700 leading-none">${folder.budget?.toLocaleString()}</p>
             </div>
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Operación</p>
                <p className="text-xs font-black text-slate-700 leading-none">{folder.transactionType}</p>
             </div>
        </div>

        <div className="hidden md:flex md:col-span-2 items-center justify-end gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Activos</span>
                <span className="text-sm font-black text-slate-800 leading-none mt-0.5">{propertiesCount}</span>
            </div>
            <div className="w-[1px] h-6 bg-slate-100"></div>
            <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter leading-none">Días</span>
                <span className="text-sm font-black text-indigo-600 leading-none mt-0.5">{daysActive}</span>
            </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};

export default FolderRow;
