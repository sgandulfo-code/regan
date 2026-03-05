import React from 'react';
import { Property, User, Visit, SearchFolder } from '../types';
import { MapPin, Building, User as UserIcon, Phone, MessageSquare, FolderOpen } from 'lucide-react';

interface RequestVisitViewProps {
  properties: Property[];
  user: User;
  visits: Visit[];
  folders: SearchFolder[];
}

const RequestVisitView: React.FC<RequestVisitViewProps> = ({ properties, user, visits, folders }) => {
  // Filter properties that have agent info AND have a visit in 'Pending' status
  const propertiesToRequest = properties.filter(p => {
    const hasAgentInfo = p.agentWhatsapp || p.agentName;
    if (!hasAgentInfo) return false;

    const visit = visits.find(v => v.propertyId === p.id);
    // "A coordinar" usually maps to 'Pending' status in this app context
    return visit && visit.status === 'Pending';
  });

  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Sin Carpeta';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Pedir Visitas</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Coordina tus visitas pendientes directamente con los agentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {propertiesToRequest.map(property => (
          <div key={property.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-bl-2xl border-b border-l border-indigo-100 flex items-center gap-2">
               <FolderOpen className="w-3 h-3 text-indigo-500" />
               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{getFolderName(property.folderId)}</span>
            </div>

            <div className="flex gap-4 md:gap-6 mt-4 md:mt-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 relative">
                <img 
                  src={property.images[0] || 'https://picsum.photos/seed/prop/200/200'} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-base md:text-lg text-slate-900 truncate mb-1">{property.title}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-4">
                  <MapPin className="w-3 h-3" /> {property.address}
                </p>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  {property.realEstateAgency && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate">{property.realEstateAgency}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <UserIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wide truncate">{property.agentName || 'Agente'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 md:mt-6 md:pt-6 border-t border-slate-50 flex justify-end">
              {property.agentWhatsapp ? (
                <a 
                  href={`https://wa.me/${property.agentWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, soy ${user.name}. Me interesa visitar la propiedad: ${property.title} (${property.url || 'Link no disponible'}). `)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  Pedir Visita al Agente
                </a>
              ) : (
                <button disabled className="bg-slate-100 text-slate-400 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Sin WhatsApp
                </button>
              )}
            </div>
          </div>
        ))}

        {propertiesToRequest.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay visitas pendientes de coordinar con información de agente.</p>
            <p className="text-slate-300 text-[10px] mt-2">Asegúrate de tener visitas en estado "Pendiente" y datos del agente cargados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestVisitView;
