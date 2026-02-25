
import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2, Star, ExternalLink, MessageSquare, Send, ChevronRight, Home, Camera, UploadCloud, X, LayoutGrid, Map as MapIcon, DollarSign, ArrowLeftRight, Activity, Trash2, Edit2, Plus, Check } from 'lucide-react';
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

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const result = await dataService.getSharedItinerary(sharedId);
        setData(result);
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

  const handleRequestVisit = async (property: any) => {
    if (!window.confirm(`¿Quieres solicitar una visita para ${property.title}?`)) return;

    try {
      // Find existing visit
      const existingVisit = data.visits.find((v: any) => v.propertyId === property.id);
      
      if (existingVisit) {
        // Add request to feedback
        const currentFeedback = parseFeedback(existingVisit);
        const newRequest: FeedbackItem = {
          id: crypto.randomUUID(),
          content: "👋 ¡Hola! Me gustaría coordinar una nueva visita a esta propiedad.",
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
          date: new Date().toISOString(), // Placeholder date
          time: 'A coordinar',
          contactName: 'Solicitud Web',
          contactPhone: '',
          checklist: [],
          notes: 'Solicitud de visita desde portal del cliente',
          status: 'Scheduled',
          clientFeedback: JSON.stringify([{
            id: crypto.randomUUID(),
            content: "👋 ¡Hola! Me gustaría visitar esta propiedad.",
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${itinerary.folder.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{itinerary.folder.name}</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Portal del Cliente</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            En Vivo
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro / Folder Details */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 tracking-tight text-slate-900">¡Hola! 👋</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 max-w-2xl">
              Bienvenido a tu espacio exclusivo. Aquí encontrarás el detalle de tu búsqueda, el itinerario de visitas y el acceso a todas las propiedades seleccionadas.
            </p>

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
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{itinerary.folder.description}</p>
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
          <div className="space-y-6 relative">
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-slate-200 hidden sm:block"></div>
            
            {visits.length > 0 ? (
              visits.map((visit: any, idx: number) => (
                <div key={visit.id} className="relative flex flex-col sm:flex-row gap-6 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-8 top-10 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 z-10 hidden sm:block"></div>
                  
                  <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-inner bg-slate-100">
                        <img 
                          src={visit.property.images[0] || 'https://picsum.photos/seed/prop/400/400'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {visit.time} HS
                          </span>
                          {visit.status === 'Completed' && (
                            <span className="text-emerald-500 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" /> Visitada
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{visit.property.title}</h3>
                        <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest mb-4">
                          <MapPin className="w-3 h-3 text-indigo-500" /> {visit.property.address}
                        </p>

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
                      </div>
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
                                // Auto-save rating when clicked
                                dataService.updateVisitFeedback(visit.id, visit.clientFeedback, visit.photos, star);
                                // Update local state to prevent reverting
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

                      {/* Feedback List */}
                      <div className="space-y-3 mb-4">
                        {parseFeedback(visit).map((item) => (
                          <div 
                            key={item.id} 
                            className={`rounded-2xl p-4 border group relative ${
                              item.author === 'agent' 
                                ? 'bg-indigo-50 border-indigo-100 ml-8' 
                                : 'bg-slate-50 border-slate-100 mr-8'
                            }`}
                          >
                            {editingFeedback[visit.id]?.id === item.id ? (
                              <div className="space-y-3">
                                <textarea 
                                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  value={editingFeedback[visit.id]?.content}
                                  onChange={(e) => setEditingFeedback(prev => ({
                                    ...prev,
                                    [visit.id]: { ...prev[visit.id]!, content: e.target.value }
                                  }))}
                                  rows={3}
                                />
                                
                                <div className="flex gap-2 overflow-x-auto py-2">
                                  {editingFeedback[visit.id]?.photos.map((url, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 group/photo">
                                      <img src={url} className="w-full h-full object-cover" alt="Edit" />
                                      <button 
                                        onClick={() => handleEditRemovePhoto(visit.id, url)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                      >
                                        <X className="w-4 h-4 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="w-16 h-16 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all shrink-0">
                                    <Plus className="w-5 h-5" />
                                    <input 
                                      type="file" 
                                      multiple 
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleEditPhotoUpload(visit.id, e)}
                                    />
                                  </label>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingFeedback(prev => ({ ...prev, [visit.id]: null }))}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateFeedbackItem(visit.id)}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                      item.author === 'agent' ? 'text-indigo-500' : 'text-slate-400'
                                    }`}>
                                      {item.author === 'agent' ? 'Agente' : 'Tú'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                      • {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  {item.author !== 'agent' && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => setEditingFeedback(prev => ({ ...prev, [visit.id]: item }))}
                                        className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteFeedbackItem(visit.id, item.id)}
                                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                
                                <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                                  item.author === 'agent' ? 'text-indigo-900' : 'text-slate-700'
                                }`}>{item.content}</p>
                                
                                {item.photos && item.photos.length > 0 && (
                                  <div className="flex gap-2 overflow-x-auto py-3 mt-2">
                                    {item.photos.map((url, i) => (
                                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 hover:ring-2 hover:ring-indigo-500/20 transition-all">
                                        <img src={url} className="w-full h-full object-cover" alt="Feedback" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
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
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Calendar className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay visitas programadas aún.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {properties && properties.length > 0 ? (
              properties.map((property: any) => (
                <div key={property.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="h-64 relative overflow-hidden shrink-0">
                    <img 
                      src={property.images[0] || 'https://picsum.photos/seed/prop/800/600'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={property.title} 
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-slate-100">
                      {property.status}
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
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Disposición</span>
                         <span className="text-sm font-black text-slate-700">{property.disposition || '-'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-slate-50">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Orientación</span>
                         <span className="text-sm font-black text-slate-700">{property.orientation || '-'}</span>
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
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Home className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay propiedades en esta carpeta.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[600px] w-full">
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
    </div>
  );
};

export default SharedItineraryView;
