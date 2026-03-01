
import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2, Star, ExternalLink, MessageSquare, Send, ChevronRight, Home, Camera, UploadCloud, X, LayoutGrid, Map as MapIcon, DollarSign, ArrowLeftRight, Activity, Trash2, Edit2, Plus, Check, History, Image, AlertCircle, Phone, User, CheckSquare, Square, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { dataService } from '../services/dataService';
import PropertyMapView from './PropertyMapView';
import { FeedbackItem } from '../types';

interface SharedItineraryViewProps {
  sharedId: string;
}

const SharedItineraryView: React.FC<SharedItineraryViewProps> = ({ sharedId }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'properties' | 'map'>('timeline');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [photos, setPhotos] = useState<{ [key: string]: File[] }>({});
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [editingFeedback, setEditingFeedback] = useState<{ [key: string]: FeedbackItem | null }>({});
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPropertyForRequest, setSelectedPropertyForRequest] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [agentProfile, setAgentProfile] = useState<any>(null);

  // Sorting State
  const [sortBy, setSortBy] = useState<'price' | 'pricePerSqft' | 'sqft' | 'rooms'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const result = await dataService.getSharedItinerary(sharedId);
        setData(result);
        
        if (result?.itinerary?.folder?.userId) {
          const profile = await dataService.getProfile(result.itinerary.folder.userId);
          if (profile) setAgentProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching shared itinerary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, [sharedId]);

  const handlePhotoSelect = (visitId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files);
      setPhotos(prev => ({
        ...prev,
        [visitId]: [...(prev[visitId] || []), ...newPhotos]
      }));
    }
  };

  const removePhoto = (visitId: string, index: number) => {
    setPhotos(prev => ({
      ...prev,
      [visitId]: prev[visitId].filter((_, i) => i !== index)
    }));
  };

  const parseFeedback = (visit: any): FeedbackItem[] => {
    if (!visit.clientFeedback) return [];
    try {
      if (visit.clientFeedback.trim().startsWith('[')) {
        const parsed = JSON.parse(visit.clientFeedback);
        return parsed.map((item: any) => ({
          ...item,
          author: item.author || 'client'
        }));
      }
      // Legacy format
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

  const handleFeedbackSubmit = async (visitId: string) => {
    if (!feedback[visitId] && (!photos[visitId] || photos[visitId].length === 0)) return;
    
    setSubmitting(prev => ({ ...prev, [visitId]: true }));
    try {
      let uploadedUrls: string[] = [];
      
      // Upload photos first
      if (photos[visitId] && photos[visitId].length > 0) {
        uploadedUrls = await Promise.all(
          photos[visitId].map(file => dataService.uploadVisitPhoto(file))
        );
      }

      const visit = data.visits.find((v: any) => v.id === visitId);
      const currentFeedback = parseFeedback(visit);
      
      const newItem: FeedbackItem = {
        id: crypto.randomUUID(),
        content: feedback[visitId] || '',
        photos: uploadedUrls,
        createdAt: new Date().toISOString(),
        author: 'client'
      };

      const newFeedbackList = [...currentFeedback, newItem];
      
      // Aggregate all photos for backward compatibility
      const allPhotos = newFeedbackList.flatMap(item => item.photos);

      await dataService.updateVisitFeedback(
        visitId, 
        JSON.stringify(newFeedbackList), 
        allPhotos, 
        ratings[visitId]
      );

      // Update local state
      setData((prev: any) => ({
        ...prev,
        visits: prev.visits.map((v: any) => 
          v.id === visitId ? { 
            ...v, 
            clientFeedback: JSON.stringify(newFeedbackList),
            photos: allPhotos,
            rating: ratings[visitId]
          } : v
        )
      }));
      
      setFeedback(prev => ({ ...prev, [visitId]: '' }));
      setPhotos(prev => ({ ...prev, [visitId]: [] }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error al enviar feedback. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(prev => ({ ...prev, [visitId]: false }));
    }
  };

  const handleUpdateFeedbackItem = async (visitId: string) => {
    const updatedItem = editingFeedback[visitId];
    if (!updatedItem) return;

    const visit = data.visits.find((v: any) => v.id === visitId);
    const currentFeedback = parseFeedback(visit);
    
    const newFeedbackList = currentFeedback.map(item => 
      item.id === updatedItem.id ? { ...updatedItem, updatedAt: new Date().toISOString() } : item
    );
    
    const allPhotos = newFeedbackList.flatMap(item => item.photos);

    try {
      await dataService.updateVisitFeedback(
        visitId, 
        JSON.stringify(newFeedbackList), 
        allPhotos,
        visit.rating
      );

      setData((prev: any) => ({
        ...prev,
        visits: prev.visits.map((v: any) => 
          v.id === visitId ? { 
            ...v, 
            clientFeedback: JSON.stringify(newFeedbackList),
            photos: allPhotos
          } : v
        )
      }));
      setEditingFeedback(prev => ({ ...prev, [visitId]: null }));
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const handleEditPhotoUpload = async (visitId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && editingFeedback[visitId]) {
      const files = Array.from(e.target.files);
      try {
        const uploadedUrls = await Promise.all(
          files.map(file => dataService.uploadVisitPhoto(file))
        );
        
        setEditingFeedback(prev => ({
          ...prev,
          [visitId]: {
            ...prev[visitId]!,
            photos: [...prev[visitId]!.photos, ...uploadedUrls]
          }
        }));
      } catch (error) {
        console.error('Error uploading photos:', error);
      }
    }
  };

  const handleEditRemovePhoto = (visitId: string, photoUrl: string) => {
    if (editingFeedback[visitId]) {
      setEditingFeedback(prev => ({
        ...prev,
        [visitId]: {
          ...prev[visitId]!,
          photos: prev[visitId]!.photos.filter(p => p !== photoUrl)
        }
      }));
    }
  };

  const handleDeleteFeedbackItem = async (visitId: string, itemId: string) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    
    const visit = data.visits.find((v: any) => v.id === visitId);
    const currentFeedback = parseFeedback(visit);
    const newFeedbackList = currentFeedback.filter(item => item.id !== itemId);
    const allPhotos = newFeedbackList.flatMap(item => item.photos);

    try {
      await dataService.updateVisitFeedback(
        visitId, 
        JSON.stringify(newFeedbackList), 
        allPhotos,
        visit.rating
      );

      setData((prev: any) => ({
        ...prev,
        visits: prev.visits.map((v: any) => 
          v.id === visitId ? { 
            ...v, 
            clientFeedback: JSON.stringify(newFeedbackList),
            photos: allPhotos
          } : v
        )
      }));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleDeleteVisitRequest = async (visitId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta solicitud de visita?')) return;
    
    try {
      await dataService.deleteVisit(visitId);
      setData((prev: any) => ({
        ...prev,
        visits: prev.visits.filter((v: any) => v.id !== visitId)
      }));
      alert('Solicitud de visita cancelada.');
    } catch (error) {
      console.error('Error deleting visit request:', error);
      alert('Error al cancelar la solicitud.');
    }
  };

  const handleEditVisitRequest = (visit: any) => {
    const feedback = parseFeedback(visit);
    const firstMessage = feedback.length > 0 ? feedback[0].content : '';
    
    setSelectedPropertyForRequest(visit.property);
    setRequestMessage(firstMessage);
    setIsRequestModalOpen(true);
  };

  const handleRequestVisit = (property: any) => {
    setSelectedPropertyForRequest(property);
    setRequestMessage('');
    setIsRequestModalOpen(true);
  };

  const submitVisitRequest = async () => {
    if (!selectedPropertyForRequest) return;
    
    const message = requestMessage.trim() || "👋 ¡Hola! Me gustaría visitar esta propiedad.";
    const property = selectedPropertyForRequest;

    try {
      // Find existing visit
      const existingVisit = data.visits.find((v: any) => v.propertyId === property.id);
      
      if (existingVisit) {
        // Add request to feedback
        const currentFeedback = parseFeedback(existingVisit);
        const newRequest: FeedbackItem = {
          id: crypto.randomUUID(),
          content: message,
          photos: [],
          createdAt: new Date().toISOString(),
          author: 'client'
        };
        
        const newFeedbackList = [...currentFeedback, newRequest];
        const allPhotos = newFeedbackList.flatMap(item => item.photos);

        await dataService.updateVisitFeedback(
          existingVisit.id, 
          JSON.stringify(newFeedbackList), 
          allPhotos, 
          existingVisit.rating
        );

        // Update local state
        setData((prev: any) => ({
          ...prev,
          visits: prev.visits.map((v: any) => 
            v.id === existingVisit.id ? { 
              ...v, 
              clientFeedback: JSON.stringify(newFeedbackList),
              photos: allPhotos
            } : v
          )
        }));
        
        alert('Solicitud enviada! Tu consultor la verá en la agenda.');
      } else {
        // Create a new visit request
        const newVisitData = {
          propertyId: property.id,
          folderId: data.itinerary.folderId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          time: '09:00:00', // Default time
          contactName: 'Solicitud Web',
          contactPhone: '',
          checklist: [],
          notes: 'Solicitud de visita desde portal del cliente',
          status: 'Pending',
          clientFeedback: JSON.stringify([{
            id: crypto.randomUUID(),
            content: message,
            photos: [],
            createdAt: new Date().toISOString(),
            author: 'client'
          }])
        };

        const createdVisit = await dataService.createVisit(newVisitData, data.itinerary.folder.userId);
        
        if (createdVisit) {
          // Add property data to the visit for display
          const visitWithProperty = {
            ...createdVisit,
            property: property,
            propertyId: property.id
          };

          setData((prev: any) => ({
            ...prev,
            visits: [...prev.visits, visitWithProperty]
          }));
          
          alert('Solicitud de visita creada! Tu consultor se pondrá en contacto contigo.');
        } else {
          alert('Error al crear la solicitud. Por favor intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error requesting visit:', error);
      alert('Error al solicitar visita.');
    } finally {
      setIsRequestModalOpen(false);
      setSelectedPropertyForRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white animate-bounce shadow-xl mb-4">
          <Home className="w-8 h-8" />
        </div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando tu itinerario personalizado...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Itinerario no encontrado</h1>
        <p className="text-slate-500 max-w-xs mx-auto">El link es inválido o el itinerario ya no está activo. Por favor, contacta a tu consultor.</p>
      </div>
    );
  }

  const { itinerary, visits, properties } = data;
  
  const sortedVisits = [...(visits || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const activeVisits = sortedVisits.filter((v: any) => v.status === 'Scheduled' || v.status === 'Pending' || v.status === 'Confirmed');
  const pastVisits = sortedVisits.filter((v: any) => v.status === 'Completed' || v.status === 'Cancelled');

  const sortedProperties = properties ? [...properties].sort((a: any, b: any) => {
    let valA, valB;
    switch (sortBy) {
      case 'price':
        valA = a.price;
        valB = b.price;
        break;
      case 'pricePerSqft':
        valA = a.sqft > 0 ? a.price / a.sqft : 0;
        valB = b.sqft > 0 ? b.price / b.sqft : 0;
        break;
      case 'sqft':
        valA = a.sqft;
        valB = b.sqft;
        break;
      case 'rooms':
        valA = a.rooms;
        valB = b.rooms;
        break;
      default:
        return 0;
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  }) : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className={`w-12 h-12 ${itinerary.folder.color} rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform active:scale-95`}
              title="Recargar"
            >
              <Home className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{itinerary.folder.name}</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {agentProfile?.whatsappNumber ? (
              <a 
                href={`https://wa.me/${agentProfile.whatsappNumber}?text=${encodeURIComponent(`Hola ${agentProfile.name}, `)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                En Vivo
              </a>
            ) : (
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                En Vivo
              </div>
            )}
            {agentProfile?.email && (
              <p className="text-[10px] font-medium text-slate-400">{agentProfile.email}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro / Folder Details */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-4 tracking-tight text-slate-900">¡Hola! 👋</h2>
            
            {itinerary.folder.welcomeMessage && (
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm mb-6">
                <h3 className="text-indigo-900 font-bold mb-2 text-sm uppercase tracking-wider">Mensaje de Bienvenida</h3>
                <p className="text-slate-900 text-sm leading-relaxed whitespace-pre-wrap">{itinerary.folder.welcomeMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presupuesto</span>
                </div>
                <p className="text-lg font-black text-slate-800">${itinerary.folder.budget?.toLocaleString() || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operación</span>
                </div>
                <p className="text-lg font-black text-slate-800">{itinerary.folder.transactionType || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                </div>
                <p className="text-lg font-black text-slate-800">{itinerary.folder.status || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</span>
                </div>
                <p className="text-lg font-black text-slate-800">{itinerary.folder.startDate ? new Date(itinerary.folder.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {itinerary.folder.description && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones</span>
                </div>
                <div 
                  className="text-sm font-medium text-slate-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: itinerary.folder.description }}
                />
              </div>
            )}
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 inline-flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" /> Agenda
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === 'properties' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Propiedades
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <MapIcon className="w-4 h-4" /> Mapa
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'timeline' && (
          <div className="space-y-12">
            <div className="space-y-6">
              {activeVisits.length > 0 ? (
                activeVisits.map((visit: any) => {
                  // Fix timezone issue by appending time or using local date comparison
                  const today = new Date();
                  const visitDateObj = new Date(visit.date + 'T00:00:00');
                  const isToday = today.toDateString() === visitDateObj.toDateString();
                  
                  // Determine status based on legacy logic
                  let displayStatus = 'Pending';
                  if (visit.status === 'Pending' || (visit.status === 'Scheduled' && visit.notes?.includes('(Horario a coordinar)'))) {
                    displayStatus = 'Pending';
                  } else if (visit.status === 'Confirmed' || visit.status === 'Scheduled') {
                    displayStatus = 'Confirmed';
                  } else if (visit.status === 'Completed') {
                    displayStatus = 'Completed';
                  } else if (visit.status === 'Cancelled') {
                    displayStatus = 'Cancelled';
                  }
                  
                  return (
                    <div key={visit.id} className={`bg-white rounded-[2.5rem] border ${isToday ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
                      {isToday && (
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                          Visita Hoy
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-48 h-48 rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative">
                          <img src={visit.property.images[0] || 'https://picsum.photos/seed/prop/400/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          <div className="absolute top-3 left-3 z-10">
                            {displayStatus === 'Pending' && (
                              <span className="bg-amber-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> A Confirmar
                              </span>
                            )}
                            {displayStatus === 'Confirmed' && (
                              <span className="bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Confirmada
                              </span>
                            )}
                            {displayStatus === 'Completed' && (
                              <span className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Realizada
                              </span>
                            )}
                            {displayStatus === 'Cancelled' && (
                              <span className="bg-slate-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                                <X className="w-3 h-3" /> Cancelada
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{visit.property.title}</h3>
                              <p className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {visit.property.address}
                              </p>
                            </div>
                            
                            {displayStatus === 'Pending' && (
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" /> A Confirmar
                                </span>
                                <button 
                                  onClick={() => handleEditVisitRequest(visit)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Modificar Solicitud"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteVisitRequest(visit.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Cancelar Solicitud"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {displayStatus === 'Confirmed' && (
                              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Confirmada
                              </span>
                            )}
                            {displayStatus === 'Completed' && (
                              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Realizada
                              </span>
                            )}
                            {displayStatus === 'Cancelled' && (
                              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5">
                                <X className="w-3 h-3" /> Cancelada
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Fecha</p>
                              <p className="text-sm font-black text-slate-700">
                                {new Date(visit.date + 'T00:00:00').toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Hora</p>
                              <p className="text-sm font-black text-slate-700">{visit.time} HS</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Contacto</p>
                              <p className="text-sm font-black text-slate-700 truncate">{visit.contactName || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Teléfono</p>
                              <p className="text-sm font-black text-indigo-600">{visit.contactPhone || 'N/A'}</p>
                            </div>
                          </div>

                          {itinerary.settings.showChecklist && visit.checklist && visit.checklist.length > 0 && (
                            <div className="space-y-3 mb-8">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckSquare className="w-3.5 h-3.5" /> Checklist de Inspección
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {visit.checklist.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                                    {item.completed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Square className="w-3 h-3 text-slate-300" />}
                                    {item.task}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {itinerary.settings.showPrices && (
                            <p className="text-indigo-600 font-black text-lg mb-4">
                              ${visit.property.price.toLocaleString()}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <a 
                              href={visit.property.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3" /> Ver Ficha
                            </a>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.property.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <MapPin className="w-3 h-3" /> Cómo llegar
                            </a>
                          </div>

                          {/* Feedback Section */}
                          <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> 
                                Feedback & Notas
                              </h4>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button 
                                    key={star}
                                    onClick={() => {
                                      setRatings(prev => ({ ...prev, [visit.id]: star }));
                                      dataService.updateVisitFeedback(visit.id, visit.clientFeedback, visit.photos, star);
                                      setData((prev: any) => ({
                                        ...prev,
                                        visits: prev.visits.map((v: any) => 
                                          v.id === visit.id ? { ...v, rating: star } : v
                                        )
                                      }));
                                    }}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star className={`w-3.5 h-3.5 ${star <= (visit.rating || ratings[visit.id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3 mb-4">
                              {parseFeedback(visit).map((item) => (
                                <div key={item.id} className={`flex flex-col ${item.author === 'agent' ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                                    item.author === 'agent' 
                                      ? 'bg-indigo-600 text-white rounded-br-none' 
                                      : 'bg-white border border-slate-200 text-slate-600 rounded-bl-none'
                                  }`}>
                                    {editingFeedback[visit.id]?.id === item.id ? (
                                      <div className="space-y-3">
                                        <textarea 
                                          className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-medium outline-none text-white placeholder:text-white/50"
                                          value={editingFeedback[visit.id]?.content}
                                          onChange={(e) => setEditingFeedback(prev => ({
                                            ...prev,
                                            [visit.id]: { ...prev[visit.id]!, content: e.target.value }
                                          }))}
                                          rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => setEditingFeedback(prev => ({ ...prev, [visit.id]: null }))}
                                            className="px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                                          >
                                            Cancelar
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateFeedbackItem(visit.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                                          >
                                            <Check className="w-3 h-3" /> Guardar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex justify-between items-start mb-2 gap-4">
                                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                            item.author === 'agent' ? 'text-indigo-200' : 'text-slate-400'
                                          }`}>
                                            {item.author === 'agent' ? 'Agente' : 'Tú'} • {new Date(item.createdAt).toLocaleDateString()}
                                          </span>
                                          {item.author !== 'agent' && (
                                            <button 
                                              onClick={() => setEditingFeedback(prev => ({ ...prev, [visit.id]: item }))}
                                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
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
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add New Feedback */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-1 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                              <div className="flex gap-2 p-2">
                                <textarea 
                                  placeholder="Agregar nota o comentario..."
                                  className="flex-1 bg-transparent text-sm font-medium outline-none resize-none h-10 py-2 px-2"
                                  value={feedback[visit.id] || ''}
                                  onChange={(e) => setFeedback(prev => ({ ...prev, [visit.id]: e.target.value }))}
                                />
                                <div className="flex flex-col gap-1">
                                  <label className="w-8 h-8 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-indigo-600 cursor-pointer transition-all">
                                    <Camera className="w-4 h-4" />
                                    <input 
                                      type="file" 
                                      multiple 
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handlePhotoSelect(visit.id, e)}
                                    />
                                  </label>
                                  <button 
                                    onClick={() => handleFeedbackSubmit(visit.id)}
                                    disabled={submitting[visit.id] || (!feedback[visit.id] && (!photos[visit.id] || photos[visit.id].length === 0))}
                                    className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                                  >
                                    {submitting[visit.id] ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                              {/* Photo Preview */}
                              {photos[visit.id] && photos[visit.id].length > 0 && (
                                <div className="flex gap-2 overflow-x-auto p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                  {photos[visit.id].map((file, idx) => (
                                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                      <button 
                                        onClick={() => removePhoto(visit.id, idx)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
                  <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No tienes visitas pendientes.</p>
                </div>
              )}
            </div>

            {pastVisits.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 pt-10 border-t border-slate-100">
                  <History className="w-4 h-4" /> Historial de Visitas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastVisits.map((v: any) => (
                    <div key={v.id} className="bg-white/50 p-6 rounded-3xl border border-slate-200 flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0">
                        <img src={v.property.images[0]} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{v.property.title}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(v.date).toLocaleDateString()} - {v.status === 'Completed' ? 'Realizada' : 'Cancelada'}</p>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-600 text-[10px] font-black uppercase tracking-widest px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="price">Precio</option>
                  <option value="pricePerSqft">Valor m²</option>
                  <option value="sqft">Superficie</option>
                  <option value="rooms">Ambientes</option>
                </select>
                <div className="w-px h-4 bg-slate-200"></div>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  title={sortOrder === 'asc' ? "Orden Ascendente" : "Orden Descendente"}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedProperties && sortedProperties.length > 0 ? (
                sortedProperties.map((property: any) => {
                  const visit = visits.find((v: any) => v.propertyId === property.id);
                  let displayStatus = null;
                  
                  if (visit) {
                    if (visit.status === 'Pending' || (visit.status === 'Scheduled' && visit.notes?.includes('(Horario a coordinar)'))) {
                      displayStatus = 'Pending';
                    } else if (visit.status === 'Confirmed' || visit.status === 'Scheduled') {
                      displayStatus = 'Confirmed';
                    } else if (visit.status === 'Completed') {
                      displayStatus = 'Completed';
                    } else if (visit.status === 'Cancelled') {
                      displayStatus = 'Cancelled';
                    }
                  }

                  return (
                    <div key={property.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                      <div className="h-64 relative overflow-hidden shrink-0">
                        <img 
                          src={property.images[0] || 'https://picsum.photos/seed/prop/800/600'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt={property.title} 
                        />
                        <div className="absolute top-4 left-4 z-10">
                          {displayStatus === 'Pending' && (
                            <span className="bg-amber-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> A Confirmar
                            </span>
                          )}
                          {displayStatus === 'Confirmed' && (
                            <span className="bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Confirmada
                            </span>
                          )}
                          {displayStatus === 'Completed' && (
                            <span className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Realizada
                            </span>
                          )}
                          {displayStatus === 'Cancelled' && (
                            <span className="bg-slate-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20 flex items-center gap-1.5">
                              <X className="w-3 h-3" /> Cancelada
                            </span>
                          )}
                        </div>
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-slate-100">
                          {property.status}
                        </div>
                        {property.acquisitionReason && (
                          <div className="bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/10">
                            {property.acquisitionReason}
                          </div>
                        )}
                      </div>
                      {itinerary.settings.showPrices && (
                        <div className="absolute bottom-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg">
                          ${property.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 leading-tight">{property.title}</h3>
                      <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest mb-6">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {property.address}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ambientes</span>
                          <span className="font-black text-slate-800 text-lg">{property.environments}</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sup. Total</span>
                          <span className="font-black text-slate-800 text-lg">{property.sqft} m²</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Baños</span>
                          <span className="font-black text-slate-800 text-lg">{property.bathrooms}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8 flex-1">
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Dormitorios</span>
                           <span className="text-sm font-black text-slate-700">{property.rooms}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Toilettes</span>
                           <span className="text-sm font-black text-slate-700">{property.toilets || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cocheras</span>
                           <span className="text-sm font-black text-slate-700">{property.parking || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sup. Cubierta</span>
                           <span className="text-sm font-black text-slate-700">{property.coveredSqft || 0} m²</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sup. Descubierta</span>
                           <span className="text-sm font-black text-slate-700">{property.uncoveredSqft || 0} m²</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Antigüedad</span>
                           <span className="text-sm font-black text-slate-700">{property.age || 0} años</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expensas</span>
                           <span className="text-sm font-black text-slate-700">${property.fees?.toLocaleString() || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Piso</span>
                           <span className="text-sm font-black text-slate-700">{property.floor || '-'}</span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-auto">
                        <button 
                          onClick={() => handleRequestVisit(property)}
                          className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                        >
                          <Calendar className="w-4 h-4" /> Solicitar Visita
                        </button>
                        <a 
                          href={property.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Ver Ficha Completa
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                  <Home className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay propiedades en esta carpeta.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[85vh] lg:h-[750px] w-full">
            <PropertyMapView 
              properties={properties} 
              onSelectProperty={(p) => {
                 if (p.url) window.open(p.url, '_blank');
              }} 
            />
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center space-y-4 pt-10">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 font-black mx-auto shadow-sm">
            PB
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Powered by PropBrain Intelligence
          </p>
        </div>
      </main>
      {/* Request Visit Modal */}
      {isRequestModalOpen && selectedPropertyForRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Solicitar Visita</h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <img 
                  src={selectedPropertyForRequest.images[0]} 
                  className="w-16 h-16 rounded-xl object-cover" 
                  alt="" 
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedPropertyForRequest.title}</h4>
                  <p className="text-xs text-slate-500">{selectedPropertyForRequest.address}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Mensaje para tu consultor
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  rows={4}
                  placeholder="Hola, me gustaría visitar esta propiedad el día..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  * Tu solicitud quedará registrada en el historial de la visita.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-6 py-3 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={submitVisitRequest}
                className="px-6 py-3 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedItineraryView;
