
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Phone, CheckSquare, Square, ChevronRight, AlertCircle, CheckCircle2, MoreVertical, Plus, History, Share2, Star, MessageSquare, Image, Send, Trash2, Edit2 } from 'lucide-react';
import { Visit, Property, PropertyStatus, SearchFolder, FeedbackItem } from '../types';

interface VisitAgendaProps {
  visits: Visit[];
  properties: Property[];
  folders: SearchFolder[];
  onCompleteVisit: (visitId: string, propertyId: string) => void;
  onCancelVisit: (visitId: string) => void;
  onAddVisit: () => void;
  onShareItinerary?: () => void;
  onFeedbackUpdate?: (visitId: string, feedback: string, photos: string[], rating?: number) => void;
  onEditVisit?: (visit: Visit) => void;
  onDeleteVisit?: (visitId: string) => void;
}

const VisitAgenda: React.FC<VisitAgendaProps> = ({ visits, properties, folders, onCompleteVisit, onCancelVisit, onAddVisit, onShareItinerary, onFeedbackUpdate, onEditVisit, onDeleteVisit }) => {
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  
  const getPropertyData = (propertyId: string) => properties.find(p => p.id === propertyId);
  const getFolderData = (folderId: string) => folders.find(f => f.id === folderId);

  const parseFeedback = (visit: Visit): FeedbackItem[] => {
    if (!visit.clientFeedback) return [];
    try {
      if (visit.clientFeedback.trim().startsWith('[')) {
        const parsed = JSON.parse(visit.clientFeedback);
        return parsed.map((item: any) => ({
          ...item,
          author: item.author || 'client'
        }));
      }
      return [{
        id: 'legacy',
        content: visit.clientFeedback,
        photos: visit.photos || [],
        createdAt: visit.date || new Date().toISOString(),
        author: 'client'
      }];
    } catch (e) {
      return [{
        id: 'error',
        content: visit.clientFeedback,
        photos: visit.photos || [],
        createdAt: visit.date || new Date().toISOString(),
        author: 'client'
      }];
    }
  };

  const handleSendReply = (visit: Visit) => {
    if (!replyText[visit.id]?.trim() || !onFeedbackUpdate) return;

    const currentFeedback = parseFeedback(visit);
    const newReply: FeedbackItem = {
      id: crypto.randomUUID(),
      content: replyText[visit.id],
      photos: [],
      createdAt: new Date().toISOString(),
      author: 'agent'
    };

    const newFeedbackList = [...currentFeedback, newReply];
    const allPhotos = newFeedbackList.flatMap(item => item.photos);

    onFeedbackUpdate(visit.id, JSON.stringify(newFeedbackList), allPhotos, visit.rating);
    setReplyText(prev => ({ ...prev, [visit.id]: '' }));
  };

  const sortedVisits = [...visits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingVisits = sortedVisits.filter(v => v.status === 'Scheduled');
  const pastVisits = sortedVisits.filter(v => v.status === 'Completed' || v.status === 'Cancelled');

  const VisitCard = ({ visit }: { visit: Visit }) => {
    const property = getPropertyData(visit.propertyId) || visit.property;
    const folder = getFolderData(visit.folderId);
    if (!property) return null;

    const isToday = new Date(visit.date).toDateString() === new Date().toDateString();

    return (
      <div className={`bg-white rounded-[2.5rem] border ${isToday ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} p-8 ${folder ? 'pt-14' : ''} shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
        {folder && (
          <div className="absolute top-0 left-0 flex items-center gap-2 px-6 py-2 bg-slate-50 border-r border-b border-slate-100 rounded-br-2xl">
            <div className={`w-2 h-2 rounded-full ${folder.color}`}></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{folder.name}</span>
          </div>
        )}
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
              <div className="flex gap-2">
                {onEditVisit && (
                  <button 
                    onClick={() => onEditVisit(visit)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Editar Visita"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                {onDeleteVisit && (
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar esta visita?')) {
                        onDeleteVisit(visit.id);
                      }
                    }}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Eliminar Visita"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
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

            {(visit.clientFeedback || visit.rating || (visit.photos && visit.photos.length > 0) || onFeedbackUpdate) && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MessageSquare className="w-3.5 h-3.5" /> Feedback y Notas
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  {visit.rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= visit.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-400">({visit.rating}/5)</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {parseFeedback(visit).map((item) => (
                      <div key={item.id} className={`flex flex-col ${item.author === 'agent' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${
                          item.author === 'agent' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-200 text-slate-600 rounded-bl-none'
                        }`}>
                          <p className="text-sm font-medium whitespace-pre-wrap">{item.content}</p>
                          {item.photos && item.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2 mt-2">
                              {item.photos.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-white/20 shrink-0">
                                  <img src={url} className="w-full h-full object-cover" alt="Feedback" />
                                </a>
                              ))}
                            </div>
                          )}
                          <p className={`text-[9px] font-bold mt-2 uppercase tracking-widest ${
                            item.author === 'agent' ? 'text-indigo-200' : 'text-slate-300'
                          }`}>
                            {item.author === 'agent' ? 'Tú' : 'Cliente'} • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {onFeedbackUpdate && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200/50">
                      <input 
                        type="text"
                        placeholder="Escribir una respuesta o nota..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={replyText[visit.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [visit.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(visit);
                          }
                        }}
                      />
                      <button 
                        onClick={() => handleSendReply(visit)}
                        disabled={!replyText[visit.id]?.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        <div className="flex gap-3">
          {onShareItinerary && (
            <button 
              onClick={onShareItinerary}
              className="bg-white border border-slate-200 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Compartir Itinerario
            </button>
          )}
          <button 
            onClick={onAddVisit}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agendar Visita
          </button>
        </div>
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
              const p = getPropertyData(v.propertyId) || v.property;
              return (
                <div key={v.id} className="bg-white/50 p-6 rounded-3xl border border-slate-200 flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                    <img src={p?.images?.[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate text-sm">{p?.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(v.date).toLocaleDateString()} - {v.status}</p>
                    {(v.clientFeedback || v.rating) && (
                      <div className="flex items-center gap-2 mt-1">
                        {v.rating && <div className="flex text-amber-400"><Star className="w-3 h-3 fill-current" /> <span className="text-[10px] font-bold ml-1 text-slate-500">{v.rating}</span></div>}
                        {v.clientFeedback && <MessageSquare className="w-3 h-3 text-indigo-400" />}
                        {v.photos && v.photos.length > 0 && <Image className="w-3 h-3 text-emerald-400" />}
                      </div>
                    )}
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
