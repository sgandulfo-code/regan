
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  user: User | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await dataService.getGoogleCalendarEvents(user.id);
        setEvents(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        setError(err.message || 'No se pudieron cargar los eventos del calendario');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Cargando eventos de Google Calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-rose-900 mb-2">Error de Conexión</h3>
        <p className="text-rose-700 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mi Calendario</h2>
          <p className="text-slate-500 text-sm">Próximos eventos sincronizados con Google Calendar</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Sincronizado
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No hay eventos próximos</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Tus visitas confirmadas y eventos personales de Google Calendar aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 min-w-[100px] border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-400">
                    {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleDateString('es-AR', { month: 'short' }) : '---'}
                  </span>
                  <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-700">
                    {event.start?.dateTime ? new Date(event.start.dateTime).getDate() : '--'}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                    {event.summary || '(Sin título)'}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>
                        {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Todo el día'}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="truncate max-w-[200px]">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 italic">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={event.htmlLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Ver en Google Calendar"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
