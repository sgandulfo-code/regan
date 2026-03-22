
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Heart, 
  LayoutGrid, 
  Map as MapIcon, 
  Home, 
  Plus, 
  Filter, 
  BarChart2, 
  Loader2, 
  Printer, 
  ArrowRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  ArrowLeftRight,
  Activity,
  Clock,
  CalendarDays,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
  Menu,
  List,
  Eye,
  EyeOff,
  FolderOpen,
  Layout
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import PropertyCard from './components/PropertyCard';
import PropertyRow from './components/PropertyRow';
import FolderRow from './components/FolderRow';
import PropertyForm from './components/PropertyForm';
import RenovationCalculator from './components/RenovationCalculator';
import ComparisonTool from './components/ComparisonTool';
import FolderFormModal from './components/FolderFormModal';
import PropertyMapView from './components/PropertyMapView';
import PropertyDetailModal from './components/PropertyDetailModal';
import ReportGenerator from './components/ReportGenerator';
import ShareFolderModal from './components/ShareFolderModal';
import VisitAgenda from './components/VisitAgenda';
import VisitFormModal from './components/VisitFormModal';
import SharedItineraryView from './components/SharedItineraryView';
import ShareItineraryModal from './components/ShareItineraryModal';
import RequestVisitView from './components/RequestVisitView';
import SettingsView from './components/SettingsView';
import FinancialAnalysisView from './components/FinancialAnalysisView';
import ValuationsDashboard from './components/ValuationsDashboard';
import TaxCalculator from './components/TaxCalculator';
import CalendarView from './components/CalendarView';
import ActivityFeed from './components/ActivityFeed';
import CriteriaTemplateManager from './components/CriteriaTemplateManager';
import DashboardView from './components/DashboardView';
import PendingLeadsList from './components/PendingLeadsList';
import Auth from './components/Auth';
import { STAGES_COMPRA, STAGES_VENTA } from './components/ClientProgressBar';
import { Property, PropertyStatus, UserRole, SearchFolder, FolderStatus, RenovationItem, SharePermission, Visit, TransactionType, AcquisitionReason } from './types';
import { dataService, InboxLink } from './services/dataService';
import { supabase } from './services/supabase';

type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'newest' | 'price-m2-asc' | 'price-m2-desc';

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'list'>('grid');
  const [folders, setFolders] = useState<SearchFolder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // States para Filtros y Orden
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'All'>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [acquisitionFilter, setAcquisitionFilter] = useState<AcquisitionReason | 'All'>('All');
  const [folderTransactionFilter, setFolderTransactionFilter] = useState<TransactionType | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<SearchFolder | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [sharingFolder, setSharingFolder] = useState<SearchFolder | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [inboxLinks, setInboxLinks] = useState<InboxLink[]>([]);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [leadToProcess, setLeadToProcess] = useState<InboxLink | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [isShareItineraryModalOpen, setIsShareItineraryModalOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const [f, p, v, il] = await Promise.all([
        dataService.getFolders(user.id),
        dataService.getProperties(user.id),
        dataService.getVisits(user.id, activeFolderId),
        dataService.getAllInboxLinks(user.id, null)
      ]);
      setFolders(f);
      setProperties(p);
      setVisits(v);
      setInboxLinks(il);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const updatedUser = await dataService.getProfile(user.id);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      if (path.startsWith('/shared/')) {
        setSharedId(path.replace('/shared/', ''));
      } else if (hash.startsWith('#/shared/')) {
        setSharedId(hash.replace('#/shared/', ''));
      } else if (hash.startsWith('#/folder/')) {
        const folderId = hash.replace('#/folder/', '');
        setActiveFolderId(folderId);
        setActiveTab('properties');
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) syncUserProfile(session.user.id);
      else setIsSyncing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) syncUserProfile(session.user.id);
      else { setUser(null); setIsSyncing(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (userId: string) => {
    const profile = await dataService.getProfile(userId);
    if (profile) setUser(profile);
    setIsSyncing(false);
  };

  useEffect(() => { if (user) loadData(); }, [user, activeFolderId]);

  useEffect(() => {
    if (user) {
      dataService.getVisits(user.id, activeFolderId).then(setVisits);
    }
  }, [user, activeFolderId]);

  const calculateDays = (dateString?: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleUpdateStatus = async (id: string, status: PropertyStatus) => {
    setIsSyncing(true);
    await dataService.updatePropertyStatus(id, status);
    await loadData();
    setIsSyncing(false);
  };

  const handleUpdateStage = async (folderId: string, stageId: string) => {
    setIsSyncing(true);
    await dataService.updateFolder(folderId, { stageId });
    await loadData();
    setIsSyncing(false);
  };

  const handleToggleVisibility = async (id: string, isPublic: boolean) => {
    setIsSyncing(true);
    await dataService.togglePropertyVisibility(id, isPublic);
    await loadData();
    setIsSyncing(false);
  };

  const handleAddProperty = async (prop: Property) => {
    if (!user) return;
    setIsSyncing(true);
    if (propertyToEdit) {
      await dataService.updateProperty(prop.id, prop);
    } else {
      const folderId = activeFolderId || folders[0]?.id;
      if (!folderId) { alert("Crea una carpeta primero"); return; }
      await dataService.createProperty({ ...prop, folderId }, user.id);
    }
    await loadData();
    setPropertyToEdit(null);
    setLeadToProcess(null);
    setActiveTab('properties');
    setIsSyncing(false);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("¿Borrar activo?")) return;
    setIsSyncing(true);
    await dataService.deleteProperty(id);
    await loadData();
    setIsSyncing(false);
  };

  const handleFolderConfirm = async (data: any) => {
    if (!user) return;
    setIsSyncing(true);
    if (editingFolder) {
      await dataService.updateFolder(editingFolder.id, data);
    } else {
      const colors = ['bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
      await dataService.createFolder({ ...data, color: colors[folders.length % colors.length] }, user.id);
    }
    await loadData();
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setIsSyncing(false);
  };

  const handleUpdateReno = async (items: RenovationItem[]) => {
    if (!selectedProperty || !user) return;
    setIsSyncing(true);
    await dataService.updateRenovations(selectedProperty.id, items, user.id);
    await loadData();
    const updated = properties.find(p => p.id === selectedProperty.id);
    if (updated) setSelectedProperty(updated);
    setIsSyncing(false);
  };

  const handleVisitConfirm = async (visitData: Omit<Visit, 'id'>) => {
    if (!user) return;
    console.log('Confirming visit:', visitData);
    setIsSyncing(true);
    try {
      if (editingVisit) {
        await dataService.updateVisit(editingVisit.id, visitData);
      } else {
        const result = await dataService.createVisit(visitData, user.id);
        if (!result) {
          alert("Error al registrar la visita. Por favor, verifica los datos.");
          return;
        }

        // Sync with Google Calendar if requested and connected
        if (visitData.syncToGoogle && user.googleAuth) {
          const property = properties.find(p => p.id === visitData.propertyId);
          const event = {
            summary: `Visita: ${property?.title || 'Propiedad'}`,
            location: property?.address || '',
            description: `Visita agendada desde PropBi.\nContacto: ${visitData.contactName}\nNotas: ${visitData.notes || ''}`,
            start: {
              dateTime: `${visitData.date}T${visitData.time}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: `${visitData.date}T${parseInt(visitData.time.split(':')[0]) + 1}:${visitData.time.split(':')[1]}:00`,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          };
          try {
            await dataService.createGoogleCalendarEvent(user.id, event);
          } catch (err) {
            console.error('Failed to sync to Google Calendar:', err);
            // Don't block the whole process if calendar sync fails
          }
        }
      }
      const v = await dataService.getVisits(user.id, activeFolderId);
      setVisits(v);
      setIsVisitModalOpen(false);
      setEditingVisit(null);
    } catch (error) {
      console.error('Error in handleVisitConfirm:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCompleteVisit = async (visitId: string, propertyId: string) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateVisit(visitId, { status: 'Completed' });
    await dataService.updatePropertyStatus(propertyId, PropertyStatus.VISITED);
    const v = await dataService.getVisits(user.id, activeFolderId);
    setVisits(v);
    await loadData();
    setIsSyncing(false);
  };

  const handleCancelVisit = async (visitId: string) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateVisit(visitId, { status: 'Cancelled' });
    const v = await dataService.getVisits(user.id, activeFolderId);
    setVisits(v);
    setIsSyncing(false);
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.deleteVisit(visitId);
    const v = await dataService.getVisits(user.id, activeFolderId);
    setVisits(v);
    setIsSyncing(false);
  };

  const handleUpdateVisitStatus = async (visitId: string, status: string) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateVisit(visitId, { status });
    const v = await dataService.getVisits(user.id, activeFolderId);
    setVisits(v);
    setIsSyncing(false);
  };

  const handleFeedbackUpdate = async (visitId: string, feedback: string, photos: string[], rating?: number) => {
    if (!user) return;
    setIsSyncing(true);
    await dataService.updateVisitFeedback(visitId, feedback, photos, rating);
    const v = await dataService.getVisits(user.id, activeFolderId);
    setVisits(v);
    setIsSyncing(false);
  };

  const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);
  
  const activeFolderPendingLeads = useMemo(() => {
    if (!activeFolderId) return [];
    return inboxLinks.filter(link => 
      link.folder_id === activeFolderId && 
      (link.status === 'enviado' || !link.status)
    );
  }, [inboxLinks, activeFolderId]);

  const activeFolderClientLeads = activeFolderPendingLeads.filter(l => l.added_by_client).length;
  const activeFolderAgentLeads = activeFolderPendingLeads.filter(l => !l.added_by_client).length;
  
  const canEdit = useMemo(() => {
    if (!activeFolder) return true;
    return activeFolder.permission === SharePermission.EDIT || activeFolder.permission === SharePermission.ADMIN;
  }, [activeFolder]);

  // MOTOR DE FILTRADO Y ORDENADO
  const displayProperties = useMemo(() => {
    let filtered = properties;
    
    // 1. Filtrar por carpeta activa
    if (activeFolderId) {
      filtered = filtered.filter(p => p.folderId === activeFolderId);
    }

    // 2. Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.address.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      );
    }

    // 3. Filtro por estado
    if (statusFilter !== 'All') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // 3.5 Filtro por origen (AcquisitionReason)
    if (acquisitionFilter !== 'All') {
      filtered = filtered.filter(p => p.acquisitionReason === acquisitionFilter);
    }

    // 4. Filtro por visibilidad
    if (visibilityFilter === 'visible') {
      filtered = filtered.filter(p => p.isPublic !== false);
    } else if (visibilityFilter === 'hidden') {
      filtered = filtered.filter(p => p.isPublic === false);
    }

    // 5. Ordenamiento
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'price-m2-asc': {
          const aM2 = a.price / (a.sqft || 1);
          const bM2 = b.price / (b.sqft || 1);
          return aM2 - bM2;
        }
        case 'price-m2-desc': {
          const aM2 = a.price / (a.sqft || 1);
          const bM2 = b.price / (b.sqft || 1);
          return bM2 - aM2;
        }
        case 'rating-desc': return b.rating - a.rating;
        case 'newest': 
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [properties, activeFolderId, searchQuery, statusFilter, visibilityFilter, acquisitionFilter, sortBy]);

  const filteredFolders = useMemo(() => {
    return folders.filter(f => folderTransactionFilter === 'All' || f.transactionType === folderTransactionFilter);
  }, [folders, folderTransactionFilter]);

  const pendingVisitsCount = useMemo(() => {
    return visits.filter(v => v.status === 'Pending').length;
  }, [visits]);

  const feedbackCount = useMemo(() => {
    return visits.filter(v => v.clientFeedback || v.rating || (v.clientChecklist && v.clientChecklist.some(i => i.response))).length;
  }, [visits]);

  if (sharedId) return <SharedItineraryView sharedId={sharedId} />;
  if (isSyncing && !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (!user) return <Auth />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          user={user}
          activeTab={activeTab} 
          setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
          userRole={user.role} 
          folders={folders} 
          activeFolderId={activeFolderId} 
          setActiveFolderId={(id) => { setActiveFolderId(id); setIsSidebarOpen(false); }}
          onLogout={() => supabase.auth.signOut()}
          isSyncing={isSyncing}
          onEditFolder={(f) => { setEditingFolder(f); setIsFolderModalOpen(true); }}
          onDeleteFolder={(id) => dataService.deleteFolder(id).then(loadData)}
          onShareFolder={(f) => setSharingFolder(f)}
          onShareItinerary={(folderId) => { setActiveFolderId(folderId); setIsShareItineraryModalOpen(true); }}
          pendingVisitsCount={pendingVisitsCount}
          feedbackCount={feedbackCount}
          onRefresh={refreshUser}
        />
      </div>
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar w-full">
        <header className="mb-6 md:mb-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white border border-slate-200 rounded-xl lg:hidden text-slate-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                  {activeFolder ? (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveFolderId(null)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all"
                        title="Volver al Dashboard"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      {activeFolder.name}
                    </div>
                  ) : (activeTab === 'dashboard' ? 'Dashboard Estratégico' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                  {activeFolder?.isShared && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      Compartido ({activeFolder.permission})
                    </span>
                  )}
                </h1>
                {!activeFolder && (
                  <p className="text-slate-500 font-medium max-w-2xl text-sm md:text-base mt-2">
                    Gestión inteligente de activos para el Real Estate moderno
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 ml-0 md:ml-4 w-full md:w-auto justify-between md:justify-end">
              {activeFolderId && activeTab === 'properties' && (
                <button 
                  onClick={() => setIsReportOpen(true)}
                  className="bg-white border border-slate-200 text-indigo-600 px-4 md:px-6 py-2 md:py-2.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Informe PDF</span>
                </button>
              )}
              <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 px-3 md:px-4 rounded-xl flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid className="w-3 h-3" /> <span className="hidden sm:inline">Grid</span></button>
                <button onClick={() => setViewMode('list')} className={`p-2 px-3 md:px-4 rounded-xl flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><List className="w-3 h-3" /> <span className="hidden sm:inline">List</span></button>
                <button onClick={() => setViewMode('map')} className={`p-2 px-3 md:px-4 rounded-xl flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><MapIcon className="w-3 h-3" /> <span className="hidden sm:inline">Map</span></button>
              </div>
              <div className="bg-white p-1.5 md:p-2 rounded-2xl shadow-sm border flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] md:text-xs">{user.name[0]}</div>
                <span className="text-xs md:sm font-bold pr-1 md:pr-2 hidden sm:inline">{user.name}</span>
              </div>
            </div>
          </div>

          {activeFolder && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-500">
              {activeFolder.welcomeMessage && (
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm">
                  <h3 className="text-indigo-900 font-bold mb-2 text-sm uppercase tracking-wider">Mensaje de Bienvenida</h3>
                  <p className="text-indigo-700 text-sm leading-relaxed whitespace-pre-wrap">{activeFolder.welcomeMessage}</p>
                </div>
              )}

              {activeFolder.description && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-slate-800 font-bold mb-2 text-sm uppercase tracking-wider">Observaciones</h3>
                  <div 
                    className="prose prose-sm max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: activeFolder.description }}
                  />
                </div>
              )}

              {activeFolder.imageUrl && (
                <div className="bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                  <div className="relative aspect-video rounded-[1.25rem] md:rounded-[2rem] overflow-hidden group">
                    <img 
                      src={activeFolder.imageUrl} 
                      alt={activeFolder.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    {!activeFolder.isImagePublic && (
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2 border border-white/10">
                        <EyeOff className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden xs:inline">Solo visible para ti</span><span className="xs:hidden">Privado</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Calendar className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Fecha Apertura</span>
                    <span className="text-xs font-black text-slate-700 leading-none">{activeFolder.startDate ? new Date(activeFolder.startDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><DollarSign className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Presupuesto Máx</span>
                    <span className="text-xs font-black text-slate-700 leading-none">${activeFolder.budget?.toLocaleString() || 0}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><ArrowLeftRight className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Operación</span>
                    <span className="text-xs font-black text-slate-700 leading-none uppercase">{activeFolder.transactionType || 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600"><Activity className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Estado Tesis</span>
                    <span className="text-xs font-black text-slate-700 leading-none uppercase">{activeFolder.status}</span>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-indigo-400"><Clock className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Momentum</span>
                    <span className="text-xs font-black text-white leading-none">{calculateDays(activeFolder.startDate)} Días Activa</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><ArrowRight className="w-3.5 h-3.5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Etapa del Cliente</span>
                    <select
                      value={activeFolder.stageId || ''}
                      onChange={(e) => handleUpdateStage(activeFolder.id, e.target.value)}
                      className="text-xs font-black text-slate-700 leading-none uppercase bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="">Seleccionar Etapa</option>
                      {(activeFolder.transactionType === TransactionType.VENTA ? STAGES_VENTA : STAGES_COMPRA).map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeFolderClientLeads > 0 && (
                  <div className="bg-indigo-600 border border-indigo-500 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-pulse">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white"><Activity className="w-3.5 h-3.5" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-0.5">Leads Cliente</span>
                      <span className="text-xs font-black text-white leading-none">{activeFolderClientLeads} Pendientes</span>
                    </div>
                  </div>
                )}

                {activeFolderAgentLeads > 0 && (
                  <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600"><Activity className="w-3.5 h-3.5" /></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Leads Usuario</span>
                      <span className="text-xs font-black text-slate-600">{activeFolderAgentLeads} Pendientes</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* TOOLBAR DE FILTROS Y ORDEN (Solo en vista de Propiedades) */}
        {activeTab === 'properties' && (
          <div className="mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por título o dirección..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 md:py-3.5 pl-12 pr-10 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                {(['All', ...Object.values(PropertyStatus)] as string[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {status === 'All' ? 'Todos' : status}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                {(['All', ...Object.values(AcquisitionReason)] as string[]).map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setAcquisitionFilter(reason as any)}
                    className={`px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${acquisitionFilter === reason ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {reason === 'All' ? 'Origen' : reason}
                  </button>
                ))}
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1"></div>

              <div className="relative group">
                <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group-hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-2">
                    {visibilityFilter === 'all' ? <Eye className="w-3.5 h-3.5 text-indigo-500" /> : 
                     visibilityFilter === 'visible' ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : 
                     <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Visibilidad: {
                      visibilityFilter === 'all' ? 'Todas' : 
                      visibilityFilter === 'visible' ? 'Visibles' : 'Ocultas'
                    }</span>
                  </div>
                  <ChevronDown className="w-3 h-3 ml-1 group-hover:rotate-180 transition-transform" />
                </div>
                
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button onClick={() => setVisibilityFilter('all')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50 flex items-center gap-2">
                    <Eye className="w-3 h-3" /> Todas
                  </button>
                  <button onClick={() => setVisibilityFilter('visible')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50 flex items-center gap-2">
                    <Eye className="w-3 h-3 text-emerald-500" /> Visibles
                  </button>
                  <button onClick={() => setVisibilityFilter('hidden')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <EyeOff className="w-3 h-3 text-slate-400" /> Ocultas
                  </button>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1"></div>

              <div className="relative group">
                <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group-hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ordenar: {
                      sortBy === 'price-asc' ? 'Precio Menor' : 
                      sortBy === 'price-desc' ? 'Precio Mayor' : 
                      sortBy === 'price-m2-asc' ? 'm² Menor' :
                      sortBy === 'price-m2-desc' ? 'm² Mayor' :
                      sortBy === 'rating-desc' ? 'Mejor Rating' : 'Más Recientes'
                    }</span>
                  </div>
                  <ChevronDown className="w-3 h-3 ml-1 group-hover:rotate-180 transition-transform" />
                </div>
                
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button onClick={() => setSortBy('newest')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50">Más Recientes</button>
                  <button onClick={() => setSortBy('price-asc')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50">Precio: Menor a Mayor</button>
                  <button onClick={() => setSortBy('price-desc')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50">Precio: Mayor a Menor</button>
                  <button onClick={() => setSortBy('price-m2-asc')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50">USD/m²: Menor a Mayor</button>
                  <button onClick={() => setSortBy('price-m2-desc')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors border-b border-slate-50">USD/m²: Mayor a Menor</button>
                  <button onClick={() => setSortBy('rating-desc')} className="w-full text-left px-5 py-4 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 hover:text-indigo-600 transition-colors">PropBrain Rating</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && !activeFolderId && (
          <DashboardView 
            user={user}
            properties={properties}
            folders={folders}
            visits={visits}
            inboxLinks={inboxLinks}
            onSetActiveTab={setActiveTab}
            onSelectProperty={setSelectedProperty}
            onSelectFolder={(id) => { setActiveFolderId(id); setActiveTab('properties'); }}
            onProcessLead={(lead) => {
              setLeadToProcess(lead);
              setActiveTab('search');
            }}
            onRejectLead={async (leadId) => {
              await dataService.removeInboxLink(leadId);
              loadData();
            }}
            onNewLead={() => setActiveTab('search')}
            onNewFolder={() => setIsFolderModalOpen(true)}
          />
        )}

        {activeTab === 'search' && (
          <PropertyForm 
            onAdd={handleAddProperty} 
            userId={user.id} 
            activeFolderId={activeFolderId} 
            propertyToEdit={propertyToEdit}
            leadToProcess={leadToProcess}
            onCancelEdit={() => { setPropertyToEdit(null); setLeadToProcess(null); setActiveTab('properties'); }}
            folders={folders}
          />
        )}

        {activeTab === 'properties' && activeFolderId && (
          <div className="mb-8">
            <PendingLeadsList 
              leads={inboxLinks.filter(l => l.folder_id === activeFolderId && (!l.status || l.status === 'enviado'))}
              folders={folders}
              onProcess={(lead) => {
                setLeadToProcess(lead);
                setActiveTab('search');
              }}
              onReject={async (leadId) => {
                await dataService.removeInboxLink(leadId);
                loadData();
              }}
            />
          </div>
        )}

        {activeTab === 'properties' && (
          viewMode === 'map' ? (
            <PropertyMapView properties={displayProperties} onSelectProperty={setSelectedProperty} />
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10" : "flex flex-col gap-3"}>
              {displayProperties.map((p, idx) => (
                viewMode === 'grid' ? (
                  <PropertyCard 
                    key={p.id} 
                    property={p} 
                    index={idx} 
                    onSelect={setSelectedProperty} 
                    onStatusChange={handleUpdateStatus}
                    onToggleVisibility={handleToggleVisibility}
                    onEdit={(p) => { setPropertyToEdit(p); setActiveTab('search'); }}
                    onDelete={handleDeleteProperty}
                    isEditable={canEdit}
                  />
                ) : (
                  <PropertyRow
                    key={p.id} 
                    property={p} 
                    index={idx} 
                    onSelect={setSelectedProperty} 
                    onStatusChange={handleUpdateStatus}
                    onToggleVisibility={handleToggleVisibility}
                    onEdit={(p) => { setPropertyToEdit(p); setActiveTab('search'); }}
                    onDelete={handleDeleteProperty}
                    isEditable={canEdit}
                  />
                )
              ))}
              {displayProperties.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No se encontraron activos con los filtros aplicados.</p>
                </div>
              )}
            </div>
          )
        )}

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {displayProperties.slice(0, 4).map(p => (
               <RenovationCalculator key={p.id} property={p} userRole={user.role} onUpdate={(items) => handleUpdateReno(items)} />
             ))}
          </div>
        )}

        {activeTab === 'financials' && <FinancialAnalysisView properties={properties} folders={folders} />}

        {activeTab === 'tax-calculator' && <TaxCalculator />}

        {activeTab === 'valuations' && (
          <ValuationsDashboard 
            folders={folders} 
            properties={properties} 
          />
        )}

        {activeTab === 'comparison' && <ComparisonTool properties={displayProperties} folder={activeFolder} />}

        {activeTab === 'request-visits' && user && (
          <RequestVisitView 
            properties={properties} 
            user={user} 
            visits={visits} 
            folders={folders} 
            onUpdateVisitStatus={handleUpdateVisitStatus}
          />
        )}

        {activeTab === 'visits' && (
          <VisitAgenda 
            visits={visits} 
            properties={properties} 
            folders={folders}
            onCompleteVisit={handleCompleteVisit} 
            onCancelVisit={handleCancelVisit}
            onAddVisit={() => setIsVisitModalOpen(true)}
            onShareItinerary={() => setIsShareItineraryModalOpen(true)}
            onFeedbackUpdate={handleFeedbackUpdate}
            onEditVisit={(visit) => { setEditingVisit(visit); setIsVisitModalOpen(true); }}
            onDeleteVisit={handleDeleteVisit}
          />
        )}

        {activeTab === 'google-calendar' && (
          <CalendarView user={user} />
        )}

        {activeTab === 'activity' && <ActivityFeed user={user} />}

        {activeTab === 'criteria-templates' && <CriteriaTemplateManager user={user} />}

        {activeTab === 'settings' && user && (
          <SettingsView user={user} onUpdateUser={setUser} />
        )}
      </main>

      <FolderFormModal isOpen={isFolderModalOpen} onClose={() => { setIsFolderModalOpen(false); setEditingFolder(null); }} onConfirm={handleFolderConfirm} initialData={editingFolder} />
      {selectedProperty && <PropertyDetailModal property={selectedProperty} onClose={() => setSelectedProperty(null)} userRole={user.role} onUpdateReno={handleUpdateReno} />}
      {isReportOpen && activeFolder && <ReportGenerator folder={activeFolder} properties={displayProperties} onClose={() => setIsReportOpen(false)} />}
      {sharingFolder && <ShareFolderModal folder={sharingFolder} onClose={() => setSharingFolder(null)} />}
      
      <VisitFormModal 
        isOpen={isVisitModalOpen} 
        onClose={() => { setIsVisitModalOpen(false); setEditingVisit(null); }} 
        properties={properties}
        folders={folders}
        activeFolderId={activeFolderId}
        onConfirm={handleVisitConfirm}
        initialData={editingVisit}
        userId={user?.id}
      />

      {activeFolderId && user && (
        <ShareItineraryModal 
          isOpen={isShareItineraryModalOpen}
          onClose={() => setIsShareItineraryModalOpen(false)}
          folderId={activeFolderId}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default App;
