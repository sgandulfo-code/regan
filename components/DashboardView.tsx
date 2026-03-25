
import React, { useMemo, useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Home, 
  Calendar as CalendarIcon, 
  Activity, 
  TrendingUp, 
  Star, 
  Plus, 
  Search,
  ArrowUpRight,
  DollarSign,
  MapPin,
  ChevronRight,
  Clock,
  User as UserIcon,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { Property, SearchFolder, Visit, PropertyStatus, User, AcquisitionReason, TransactionType, FolderStatus } from '../types';
import { InboxLink, dataService } from '../services/dataService';
import PendingLeadsList from './PendingLeadsList';

interface DashboardViewProps {
  user: User;
  properties: Property[];
  folders: SearchFolder[];
  visits: Visit[];
  inboxLinks?: InboxLink[];
  onSetActiveTab: (tab: string) => void;
  onSelectProperty: (p: Property) => void;
  onSelectFolder: (folderId: string) => void;
  onProcessLead: (lead: InboxLink) => void;
  onRejectLead: (leadId: string) => void;
  onNewLead: () => void;
  onNewFolder: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  user,
  properties, 
  folders, 
  visits, 
  inboxLinks = [],
  onSetActiveTab,
  onSelectProperty,
  onSelectFolder,
  onProcessLead,
  onRejectLead,
  onNewLead,
  onNewFolder
}) => {
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    const fetchGoogleEvents = async () => {
      if (user?.googleAuth) {
        try {
          setLoadingCalendar(true);
          const events = await dataService.getGoogleCalendarEvents(user.id);
          setGoogleEvents(events || []);
        } catch (error) {
          console.error('Error fetching google events:', error);
        } finally {
          setLoadingCalendar(false);
        }
      }
    };
    fetchGoogleEvents();
  }, [user?.id, user?.googleAuth]);

  const calculateDays = (dateString?: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Stats calculations
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    properties.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  const folderData = useMemo(() => {
    const stats: Record<string, any> = {
      'Búsqueda Venta': { total: 0, budget: 0, [FolderStatus.ABIERTA]: 0, [FolderStatus.PENDIENTE]: 0, [FolderStatus.CERRADA]: 0, totalDays: 0 },
      'Búsqueda Alquiler': { total: 0, budget: 0, [FolderStatus.ABIERTA]: 0, [FolderStatus.PENDIENTE]: 0, [FolderStatus.CERRADA]: 0, totalDays: 0 },
      'Captación Venta': { total: 0, budget: 0, [FolderStatus.ABIERTA]: 0, [FolderStatus.PENDIENTE]: 0, [FolderStatus.CERRADA]: 0, totalDays: 0 },
      'Captación Alquiler': { total: 0, budget: 0, [FolderStatus.ABIERTA]: 0, [FolderStatus.PENDIENTE]: 0, [FolderStatus.CERRADA]: 0, totalDays: 0 },
    };

    folders.forEach(f => {
      const folderProps = properties.filter(p => p.folderId === f.id);
      const isCaptacion = folderProps.some(p => p.acquisitionReason === AcquisitionReason.CAPTACION);
      
      const isVenta = f.transactionType === TransactionType.VENTA || f.transactionType === TransactionType.COMPRA;
      const isAlquiler = f.transactionType === TransactionType.ALQUILER || f.transactionType === TransactionType.ALQUILER_TEMPORARIO;

      let typeKey = '';
      if (isCaptacion) {
        typeKey = isVenta ? 'Captación Venta' : 'Captación Alquiler';
      } else {
        typeKey = isVenta ? 'Búsqueda Venta' : 'Búsqueda Alquiler';
      }

      if (stats[typeKey]) {
        stats[typeKey].total++;
        stats[typeKey].budget += (f.budget || 0);
        stats[typeKey][f.status]++;
        
        const days = calculateDays(f.statusUpdatedAt || f.createdAt);
        stats[typeKey].totalDays += days;
      }
    });

    return Object.entries(stats).map(([name, values]) => ({
      name,
      ...values,
      avgDays: values.total > 0 ? Math.round(values.totalDays / values.total) : 0
    })).filter(d => d.total > 0);
  }, [folders, properties, calculateDays]);

  const topProperties = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }, [properties]);

  const upcomingVisits = useMemo(() => {
    return visits
      .filter(v => v.status === 'Confirmed' || v.status === 'Scheduled')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
      .slice(0, 3);
  }, [visits]);

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Combine visits and google events for today
    const combined: any[] = [];
    
    // Add visits
    visits
      .filter(v => v.date === today && (v.status === 'Confirmed' || v.status === 'Scheduled'))
      .forEach(v => {
        const property = properties.find(p => p.id === v.propertyId);
        combined.push({
          id: v.id,
          time: v.time,
          title: property?.title || 'Visita Propiedad',
          location: property?.address,
          type: 'visit',
          original: v
        });
      });
      
    // Add google events
    googleEvents.forEach(e => {
      const start = e.start?.dateTime || e.start?.date;
      if (start && start.startsWith(today)) {
        const time = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '00:00';
        combined.push({
          id: e.id,
          time,
          title: e.summary || '(Sin título)',
          location: e.location,
          type: 'google',
          original: e
        });
      }
    });
    
    return combined.sort((a, b) => a.time.localeCompare(b.time));
  }, [visits, googleEvents, properties]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#059669', '#94a3b8', '#f43f5e'];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Quick Access Hero */}
      <section className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <TrendingUp className="w-60 h-60" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Bienvenido de nuevo, <span className="text-indigo-400">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
              Tu portafolio tiene <span className="text-white">{properties.length} activos</span> distribuidos en <span className="text-white">{folders.length} tesis de inversión</span>.
            </p>

            {/* Calendario del Día */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" /> Calendario del Día
                </h3>
                {loadingCalendar && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
              </div>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                
                <div className="space-y-4 relative">
                  {todayEvents.length > 0 ? (
                    todayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:bg-indigo-600 group-hover:border-indigo-400 transition-all">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                        </div>
                        
                        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer" onClick={() => event.type === 'visit' ? onSetActiveTab('visits') : window.open(event.original.htmlLink, '_blank')}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{event.time}</span>
                            {event.type === 'visit' ? (
                              <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Visita</span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Google</span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white mb-1">{event.title}</h4>
                          {event.location && (
                            <p className="text-[9px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="ml-12 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">No tienes eventos programados para hoy</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onNewLead}
                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-400 hover:text-white transition-all active:scale-95 shadow-xl"
              >
                <Plus className="w-4 h-4" /> Capturar Lead
              </button>
              <button 
                onClick={onNewFolder}
                className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95"
              >
                <FolderOpen className="w-4 h-4" /> Nueva Tesis
              </button>
            </div>
          </div>
          
          <div className="flex gap-6">
             <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prop Score Avg</p>
                <p className="text-4xl font-black text-indigo-400">
                  {(properties.reduce((acc, p) => acc + (p.rating || 0), 0) / (properties.length || 1)).toFixed(1)}
                </p>
                <div className="flex justify-center gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(properties.reduce((acc, p) => acc + (p.rating || 0), 0) / (properties.length || 1)) ? 'text-indigo-400 fill-current' : 'text-white/10'}`} />
                  ))}
                </div>
             </div>
             <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 text-center min-w-[140px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visitas Hoy</p>
                <p className="text-4xl font-black text-emerald-400">
                  {visits.filter(v => v.date === new Date().toISOString().split('T')[0]).length}
                </p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2">Confirmadas</p>
             </div>
          </div>
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Status Distribution */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Pipeline Status
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Folder Distribution */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-500" /> Distribución de Carpetas
              </h3>
              <div className="flex gap-4 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Presupuesto Total: <span className="text-indigo-600">${folders.reduce((acc, f) => acc + (f.budget || 0), 0).toLocaleString()}</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Promedio Permanencia: <span className="text-amber-600">{Math.round(folders.reduce((acc, f) => acc + calculateDays(f.statusUpdatedAt || f.createdAt), 0) / (folders.length || 1))} días</span>
                </p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Búsqueda vs Captación</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={folderData} layout="vertical" margin={{ left: 20, right: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[220px]">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">{label}</p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Carpetas</span>
                              <span className="text-sm font-black text-slate-900">{data.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Presupuesto Total</span>
                              <span className="text-sm font-black text-indigo-600">${data.budget.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Promedio Días</span>
                              <span className="text-sm font-black text-amber-600">{data.avgDays} d</span>
                            </div>
                            <div className="pt-2 border-t border-slate-50">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                  <p className="text-[8px] font-black text-emerald-500 uppercase">Abiertas</p>
                                  <p className="text-xs font-black">{data[FolderStatus.ABIERTA]}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[8px] font-black text-amber-500 uppercase">Pend.</p>
                                  <p className="text-xs font-black">{data[FolderStatus.PENDIENTE]}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Cerr.</p>
                                  <p className="text-xs font-black">{data[FolderStatus.CERRADA]}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                <Bar dataKey={FolderStatus.ABIERTA} name="Abierta" stackId="a" fill="#10b981" barSize={30} />
                <Bar dataKey={FolderStatus.PENDIENTE} name="Pendiente" stackId="a" fill="#f59e0b" barSize={30} />
                <Bar dataKey={FolderStatus.CERRADA} name="Cerrada" stackId="a" fill="#94a3b8" radius={[0, 10, 10, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Assets & Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Rated Assets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Top Rated Assets
            </h3>
            <button 
              onClick={() => onSetActiveTab('properties')}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {topProperties.map(p => (
              <div 
                key={p.id} 
                onClick={() => onSelectProperty(p)}
                className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                      {p.status}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-2 h-2 ${i < (p.rating || 0) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 truncate">{p.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {p.address.split(',')[0]}
                    </p>
                    <p className="text-[10px] font-black text-slate-900">${p.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            ))}
            {topProperties.length === 0 && (
              <div className="py-10 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay activos puntuados aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Agenda */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" /> Próximas Visitas
            </h3>
            <button 
              onClick={() => onSetActiveTab('calendar')}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Ver Agenda
            </button>
          </div>
          <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm space-y-6">
            {upcomingVisits.map(visit => {
              const property = properties.find(p => p.id === visit.propertyId);
              const visitDate = new Date(visit.date + 'T' + visit.time);
              return (
                <div key={visit.id} className="flex items-center gap-4 group">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                      {visitDate.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="text-lg font-black leading-none mt-1">{visitDate.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-800 truncate">{property?.title || 'Propiedad Desconocida'}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {visit.time}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <UserIcon className="w-2.5 h-2.5" /> {visit.clientName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              );
            })}
            {upcomingVisits.length === 0 && (
              <div className="py-10 text-center">
                <CalendarIcon className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay visitas confirmadas</p>
              </div>
            )}
            <button 
              onClick={() => onSetActiveTab('visits')}
              className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Gestionar Visitas
            </button>
          </div>
        </div>
      </div>

      {/* Leads Section */}
      {(() => {
        const pendingLeads = inboxLinks
          .filter(l => !l.status || l.status === 'enviado')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (pendingLeads.length === 0) return null;

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Leads Pendientes
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Mostrando los últimos 4 leads. Para ver todos, ve al Lead Collector.
                </p>
              </div>
              <button 
                onClick={() => onSetActiveTab('search')}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Ver todos ({pendingLeads.length})
              </button>
            </div>
            <PendingLeadsList 
              leads={pendingLeads.slice(0, 4)}
              folders={folders}
              onProcess={onProcessLead}
              onReject={onRejectLead}
            />
          </div>
        );
      })()}

      {/* Folders Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-500" /> Tesis de Inversión
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestiona tus carpetas activas</p>
          </div>
          <button 
            onClick={onNewFolder}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Tesis
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => {
            const folderProperties = properties.filter(p => p.folderId === folder.id);
            const days = calculateDays(folder.startDate);
            
            // Leads pendientes de procesar
            const pendingLeads = inboxLinks.filter(link => 
              link.folder_id === folder.id && 
              (link.status === 'enviado' || !link.status)
            );
            
            const clientLeads = pendingLeads.filter(l => l.added_by_client).length;
            const agentLeads = pendingLeads.filter(l => !l.added_by_client).length;

            return (
              <button 
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:shadow-xl hover:border-indigo-100 transition-all text-left group relative overflow-hidden flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${folder.color} rounded-2xl shadow-lg flex items-center justify-center text-white`}>
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      folder.status === 'Abierta' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      folder.status === 'Pendiente' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                      'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                      {folder.status}
                    </span>
                    {folder.startDate && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(folder.startDate).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-900 mb-1 truncate tracking-tight">{folder.name}</h4>
                  {folder.description && (
                    <p className="text-[10px] text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">
                      {folder.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Propiedades</span>
                      <span className="text-xs font-black text-slate-700">{folderProperties.length}</span>
                    </div>
                    
                    {(clientLeads > 0 || agentLeads > 0) && (
                      <div className="flex items-center gap-3 px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        {clientLeads > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Leads Cliente</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              <span className="text-xs font-black text-indigo-600">{clientLeads}</span>
                            </div>
                          </div>
                        )}
                        {agentLeads > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Leads Usuario</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span className="text-xs font-black text-slate-600">{agentLeads}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {folder.transactionType && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Operación</span>
                        <span className="text-xs font-black text-slate-700">{folder.transactionType}</span>
                      </div>
                    )}
                    {days > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Días</span>
                        <span className="text-xs font-black text-indigo-600">{days}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Presupuesto</span>
                    <span className="text-xs font-black text-slate-700">${folder.budget?.toLocaleString()}</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
