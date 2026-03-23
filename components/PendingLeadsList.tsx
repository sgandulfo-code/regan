
import React from 'react';
import { InboxLink } from '../services/dataService';
import { 
  ExternalLink, 
  Plus, 
  Trash2, 
  User as UserIcon, 
  Clock, 
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  XCircle,
  FolderOpen
} from 'lucide-react';

import { Property, SearchFolder } from '../types';

interface PendingLeadsListProps {
  leads: InboxLink[];
  folders?: SearchFolder[];
  onProcess: (lead: InboxLink) => void;
  onReject: (leadId: string) => void;
}

const PendingLeadsList: React.FC<PendingLeadsListProps> = ({ leads, folders = [], onProcess, onReject }) => {
  if (leads.length === 0) return null;

  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Carpeta desconocida';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString();
  };

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <LinkIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Leads Pendientes</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sugerencias del cliente y captaciones rápidas</p>
        </div>
        <div className="ml-auto bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          {leads.length} {leads.length === 1 ? 'Pendiente' : 'Pendientes'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leads.map((lead) => (
          <div 
            key={lead.id} 
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lead.added_by_client ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                  {lead.file_url ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTime(lead.created_at)}
                  </span>
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    {lead.added_by_client ? (
                      <>
                        <UserIcon className="w-3 h-3 text-indigo-500" />
                        Sugerido vía Portal Cliente
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        Captado vía Lead Collector (Agente)
                      </>
                    )}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                    <FolderOpen className="w-3 h-3" /> {getFolderName(lead.folder_id)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onReject(lead.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Descartar"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 mb-6">
              {lead.url ? (
                <a 
                  href={lead.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-indigo-600 hover:underline break-all flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {lead.url}
                </a>
              ) : lead.file_url ? (
                <a 
                  href={lead.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-indigo-600 hover:underline break-all flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  Ver Archivo Adjunto
                </a>
              ) : (
                <span className="text-sm font-bold text-slate-400 italic">Sin contenido</span>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onProcess(lead)}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Convertir a Propiedad
              </button>
              <button 
                onClick={() => onReject(lead.id)}
                className="px-4 bg-slate-50 text-slate-400 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
              >
                Descartar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingLeadsList;
