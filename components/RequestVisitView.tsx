import React from 'react';
import { Property, User } from '../types';
import { MapPin, Building, User as UserIcon, Phone, MessageSquare, ExternalLink } from 'lucide-react';

interface RequestVisitViewProps {
  properties: Property[];
  user: User;
}

const RequestVisitView: React.FC<RequestVisitViewProps> = ({ properties, user }) => {
  // Filter properties that have agent info and are not yet visited or are in a state where a visit might be requested
  // For now, let's show all properties that have agent info, or maybe filter by status if needed.
  // The prompt implies "visita solicitada a coordinar", which might mean existing visits in 'Pending' state,
  // OR properties where the user wants to initiate a visit.
  // Given "pedir visita al agente", it sounds like initiating or following up.
  // Let's assume we list properties that have agent info so the user can contact them.
  
  const propertiesWithAgent = properties.filter(p => p.agentWhatsapp || p.agentName);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pedir Visitas</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Coordina tus visitas directamente con los agentes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {propertiesWithAgent.map(property => (
          <div key={property.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 relative">
                <img 
                  src={property.images[0] || 'https://picsum.photos/seed/prop/200/200'} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-lg text-slate-900 truncate mb-1">{property.title}</h3>
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

            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-end">
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

        {propertiesWithAgent.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay propiedades con información de contacto de agentes.</p>
            <p className="text-slate-300 text-[10px] mt-2">Edita tus propiedades para agregar el WhatsApp del agente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestVisitView;
