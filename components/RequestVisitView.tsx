import React, { useState } from 'react';
import { Property, User, Visit, SearchFolder } from '../types';
import { MapPin, Building, User as UserIcon, Phone, MessageSquare, FolderOpen, History, CheckCircle2, Clock } from 'lucide-react';

interface RequestVisitViewProps {
  properties: Property[];
  user: User;
  visits: Visit[];
  folders: SearchFolder[];
  onUpdateVisitStatus?: (visitId: string, status: string) => void;
  onEditVisit?: (visit: Visit) => void;
}

const RequestVisitView: React.FC<RequestVisitViewProps> = ({ properties, user, visits, folders, onUpdateVisitStatus, onEditVisit }) => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  // Filter properties that have agent info
  const propertiesWithAgent = properties.filter(p => p.agentWhatsapp || p.agentName);

  const pendingRequests = propertiesWithAgent.filter(p => {
    const visit = visits.find(v => v.propertyId === p.id);
    return visit && visit.status === 'Pending';
  });

  const historyRequests = propertiesWithAgent.filter(p => {
    const visit = visits.find(v => v.propertyId === p.id);
    return visit && (visit.status === 'Requested' || visit.status === 'Confirmed' || visit.status === 'Completed' || visit.status === 'Cancelled');
  });

  const displayProperties = activeTab === 'pendientes' ? pendingRequests : historyRequests;

  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Sin Carpeta';
  };

  const handleStatusChange = (propertyId: string, newStatus: string) => {
    const visit = visits.find(v => v.propertyId === propertyId);
    if (visit && onUpdateVisitStatus) {
      onUpdateVisitStatus(visit.id, newStatus);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight">Pedir a Inmobiliarias</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mt-1">Coordina las visitas solicitadas por tus clientes directamente con los agentes</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl inline-flex self-start md:self-auto">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'pendientes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" /> Pedidos del Cliente
            {pendingRequests.length > 0 && (
              <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'historial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" /> Historial de Pedidos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {displayProperties.map(property => {
          const visit = visits.find(v => v.propertyId === property.id);
          
          return (
            <div key={property.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-bl-2xl border-b border-l border-indigo-100 flex items-center gap-2">
                 <FolderOpen className="w-3 h-3 text-indigo-500" />
                 <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{getFolderName(property.folderId)}</span>
              </div>

              <div className="flex gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 relative">
                  <img 
                    src={property.images[0] || 'https://picsum.photos/seed/prop/200/200'} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  
                  {visit?.status === 'Requested' && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3" /> Pedida a Inmob.
                    </div>
                  )}
                  {visit?.status === 'Confirmed' && (
                    <div className="absolute top-2 left-2 bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Confirmada
                    </div>
                  )}
                  {visit?.status === 'Completed' && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Realizada
                    </div>
                  )}
                  {visit?.status === 'Cancelled' && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3" /> Cancelada
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {property.code && (
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5 block">{property.code}</span>
                  )}
                  <h3 className="font-bold text-base md:text-lg text-slate-900 truncate mb-1">{property.title}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-4">
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

              <div className="mt-4 pt-4 md:mt-6 md:pt-6 border-t border-slate-50 flex flex-col gap-3">
                {property.agentWhatsapp ? (
                  <a 
                    href={`https://wa.me/${property.agentWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, soy ${user.name}. Me interesa visitar la propiedad: ${property.title} (${property.url || 'Link no disponible'}). `)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-500 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contactar por WhatsApp
                  </a>
                ) : (
                  <button disabled className="w-full bg-slate-100 text-slate-400 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Sin WhatsApp
                  </button>
                )}
                
                <div className="flex gap-2">
                  {visit?.status === 'Pending' && (
                    <button 
                      onClick={() => handleStatusChange(property.id, 'Requested')}
                      className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Marcar como Pedida a Inmob.
                    </button>
                  )}
                  {(visit?.status === 'Pending' || visit?.status === 'Requested') && (
                    <button 
                      onClick={() => {
                        if (visit && onEditVisit) {
                          onEditVisit({ ...visit, status: 'Confirmed' });
                        } else {
                          handleStatusChange(property.id, 'Confirmed');
                        }
                      }}
                      className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Confirmada
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {displayProperties.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            {activeTab === 'pendientes' ? (
              <>
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No hay pedidos de visitas pendientes de coordinar.</p>
                <p className="text-slate-300 text-[10px] mt-2">Asegúrate de tener visitas en estado "Pedido del Cliente" y datos del agente cargados.</p>
              </>
            ) : (
              <>
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No hay historial de visitas pedidas o confirmadas.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestVisitView;
