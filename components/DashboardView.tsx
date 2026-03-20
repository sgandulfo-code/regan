
import React, { useMemo } from 'react';
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
  User as UserIcon
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
  CartesianGrid 
} from 'recharts';
import { Property, SearchFolder, Visit, PropertyStatus, User } from '../types';
import { InboxLink } from '../services/dataService';

interface DashboardViewProps {
  user: User;
  properties: Property[];
  folders: SearchFolder[];
  visits: Visit[];
  inboxLinks?: InboxLink[];
  onSetActiveTab: (tab: string) => void;
  onSelectProperty: (p: Property) => void;
  onSelectFolder: (folderId: string) => void;
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
  onNewLead,
  onNewFolder
}) => {
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
    return folders.map(f => {
      const folderProps = properties.filter(p => p.folderId === f.id);
      const avgPricePerM2 = folderProps.length > 0 
        ? Math.round(folderProps.reduce((acc, p) => acc + (p.price / p.sqft), 0) / folderProps.length)
        : 0;
      return {
        name: f.name.length > 15 ? f.name.substring(0, 12) + '...' : f.name,
        count: folderProps.length,
        avgPrice: avgPricePerM2
      };
    }).filter(f => f.count > 0).slice(0, 5);
  }, [folders, properties]);

  const topProperties = useMemo(() => {
    return [...properties]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }, [properties]);

  const upcomingVisits = useMemo(() => {
    return visits
      .filter(v => v.status === 'Confirmed')
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
      .slice(0, 3);
  }, [visits]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

        {/* Price Comparison */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Valor por m² por Tesis
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Top 5 Carpetas Activas</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={folderData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'USD/m²']}
                />
                <Bar 
                  dataKey="avgPrice" 
                  fill="#6366f1" 
                  radius={[0, 10, 10, 0]} 
                  barSize={30}
                />
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
