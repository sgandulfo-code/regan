
import React from 'react';
import { Calendar, Clock, MapPin, User, Phone, CheckSquare, Square, ChevronRight, AlertCircle, CheckCircle2, MoreVertical, Plus, History } from 'lucide-react';
import { Visit, Property, PropertyStatus } from '../types';

interface VisitAgendaProps {
  visits: Visit[];
  properties: Property[];
  onCompleteVisit: (visitId: string, propertyId: string) => void;
  onCancelVisit: (visitId: string) => void;
}

const VisitAgenda: React.FC<VisitAgendaProps> = ({ visits, properties, onCompleteVisit, onCancelVisit }) => {
  
  const getPropertyData = (propertyId: string) => properties.find(p => p.id === propertyId);

  const sortedVisits = [...visits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingVisits = sortedVisits.filter(v => v.status === 'Scheduled');
  const pastVisits = sortedVisits.filter(v => v.status === 'Completed' || v.status === 'Cancelled');

  const VisitCard = ({ visit }: { visit: Visit }) => {
    const property = getPropertyData(visit.propertyId);
    if (!property) return null;

    const isToday = new Date(visit.date).toDateString() === new Date().toDateString();

    return (
      <div className={`bg-white rounded-[2.5rem] border ${isToday ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
        {isToday && (
          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest animate-pulse">
            Visita Hoy
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-48 h-48 rounded-[2rem] overflow-hidden shrink-0 shadow-lg">
            <img src={property.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{property.title}</h3>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {property.address}
                </p>
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Fecha</p>
                <p className="text-sm font-black text-slate-700">{new Date(visit.date).toLocaleDateString()}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Hora</p>
                <p className="text-sm font-black text-slate-700">{visit.time} HS</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Contacto</p>
                <p className="text-sm font-black text-slate-700 truncate">{visit.contactName}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Teléfono</p>
                <p className="text-sm font-black text-indigo-600">{visit.contactPhone}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5" /> Checklist de Inspección
              </p>
              <div className="flex flex-wrap gap-2">
                {visit.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                    {item.completed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Square className="w-3 h-3 text-slate-300" />}
                    {item.task}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 justify-center">
            <button 
              onClick={() => onCompleteVisit(visit.id, visit.propertyId)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Marcar Realizada
            </button>
            <button 
              onClick={() => onCancelVisit(visit.id)}
              className="bg-white border border-slate-200 text-slate-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
            >
              Cancelar Visita
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <Calendar className="w-4 h-4 text-indigo-600" /> Próximas Visitas Programadas
        </h2>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agendar Visita
        </button>
      </div>

      <div className="space-y-6">
        {upcomingVisits.length > 0 ? (
          upcomingVisits.map(v => <VisitCard key={v.id} visit={v} />)
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
            <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No tienes visitas pendientes para esta semana.</p>
          </div>
        )}
      </div>

      {pastVisits.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 pt-10 border-t border-slate-100">
            <History className="w-4 h-4" /> Historial de Visitas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastVisits.map(v => {
              const p = getPropertyData(v.propertyId);
              return (
                <div key={v.id} className="bg-white/50 p-6 rounded-3xl border border-slate-200 flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                    <img src={p?.images[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate text-sm">{p?.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(v.date).toLocaleDateString()} - {v.status}</p>
                  </div>
                  {v.status === 'Completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitAgenda;
