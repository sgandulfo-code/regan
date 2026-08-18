
import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2, Star, ExternalLink, MessageSquare, Send, ChevronRight, ChevronDown, Home, Camera, UploadCloud, X, LayoutGrid, Map as MapIcon, DollarSign, ArrowLeftRight, Activity as ActivityIcon, Trash2, Edit2, Plus, Check, History, Image, AlertCircle, Phone, User, CheckSquare, Square, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Filter, List, Compass, Lightbulb, Heart, FileText } from 'lucide-react';
import { dataService } from '../services/dataService';
import PropertyMapView from './PropertyMapView';
import ComparisonTool from './ComparisonTool';
import { FeedbackItem, FunnelStage, ActivityType, PropertyStatus, Activity } from '../types';

import SharedPropertyRow from './SharedPropertyRow';
import ClientProgressBar from './ClientProgressBar';

interface SharedItineraryViewProps {
  sharedId: string;
}

const SharedItineraryView: React.FC<SharedItineraryViewProps> = ({ sharedId }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'properties' | 'map' | 'leads'>('timeline');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Leads State
  const [inboxLinks, setInboxLinks] = useState<any[]>([]);
  const [publicActivities, setPublicActivities] = useState<Activity[]>([]);
  const [linksText, setLinksText] = useState('');
  const [isSubmittingLinks, setIsSubmittingLinks] = useState(false);
  const [pendingInboxFiles, setPendingInboxFiles] = useState<File[]>([]);

  // Sorting State
  const [sortBy, setSortBy] = useState<'price' | 'pricePerSqft' | 'sqft' | 'rooms'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter State
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');
  const [filterBedrooms, setFilterBedrooms] = useState<number | ''>('');
  const [filterMinSqft, setFilterMinSqft] = useState<number | ''>('');
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Comparison State
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Custom Fields State
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [selectedPropertyForCustomField, setSelectedPropertyForCustomField] = useState<any>(null);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleComparison = (id: string) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(prev => prev.filter(pId => pId !== id));
    } else {
      if (comparisonIds.length < 4) {
        setComparisonIds(prev => [...prev, id]);
      } else {
        showToast("Puedes comparar hasta 4 propiedades.");
      }
    }
  };

  useEffect(() => {
    const originalTitle = document.title;
    const fetchSharedData = async () => {
      try {
        // Record view
        dataService.recordItineraryView(sharedId);

        const result = await dataService.getSharedItinerary(sharedId);
        setData(result);
        
        if (result?.itinerary?.folder?.name) {
          document.title = `${result.itinerary.folder.name} | PropBi`;
        }
        
        if (result?.itinerary?.folder?.userId) {
          const profile = await dataService.getProfile(result.itinerary.folder.userId);
          if (profile) setAgentProfile(profile);
          
          // Log activity: Itinerary viewed
          dataService.logActivity({
            folderId: result.itinerary.folderId,
            agentId: result.itinerary.folder.userId,
            type: ActivityType.ITINERARY_VIEWED,
            content: `El cliente vio el itinerario compartido: ${result.itinerary.folder.name}`,
            metadata: { sharedId }
          });

          // Fetch inbox links for this folder
          const links = await dataService.getInboxLinks(result.itinerary.folder.userId, result.itinerary.folderId);
          setInboxLinks(links);
          
          // Fetch public activities for this folder
          const activities = await dataService.getPublicActivities(result.itinerary.folderId);
          setPublicActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching shared itinerary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();

    return () => {
      document.title = originalTitle;
    };
  }, [sharedId]);

  const handleSubmitLinks = async () => {
    if ((!linksText.trim() && pendingInboxFiles.length === 0) || !data?.itinerary?.folder?.userId) return;

    setIsSubmittingLinks(true);
    try {
      const urls = linksText.split(/[\n,]+/).map(url => url.trim()).filter(url => url.length > 0);
      
      let uploadedFiles: { url: string, type: string }[] = [];
      if (pendingInboxFiles.length > 0) {
        uploadedFiles = await Promise.all(
          pendingInboxFiles.map(file => dataService.uploadInboxFile(file))
        );
      }

      await dataService.addInboxLinks(urls, data.itinerary.folder.userId, data.itinerary.folderId, true, uploadedFiles);
      
      // Log activity: New lead/suggestion
      dataService.logActivity({
        folderId: data.itinerary.folderId,
        agentId: data.itinerary.folder.userId,
        type: ActivityType.NEW_LEAD,
        content: `El cliente envió una nueva sugerencia/link en la carpeta ${data.itinerary.folder.name}`,
        metadata: { links: urls.length > 0 ? urls : uploadedFiles.map(f => f.url) }
      });

      setLinksText('');
      setPendingInboxFiles([]);
      
      // Refresh links
      const updatedLinks = await dataService.getInboxLinks(data.itinerary.folder.userId, data.itinerary.folderId);
      setInboxLinks(updatedLinks);
      
      showToast('¡Sugerencias enviadas con éxito! Tu consultor las revisará pronto.');
    } catch (error) {
      console.error('Error submitting links:', error);
      showToast('Hubo un error al enviar las sugerencias. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmittingLinks(false);
    }
  };

  const handleClientChecklistUpdate = async (visitId: string, itemId: string, updates: any) => {
    const visit = data.visits.find((v: any) => v.id === visitId);
    if (!visit || !visit.clientChecklist) return;

    const newChecklist = visit.clientChecklist.map((item: any) => 
      item.id === itemId ? { ...item, ...updates } : item
    );

    // Optimistic update
    setData((prev: any) => ({
      ...prev,
      visits: prev.visits.map((v: any) => 
        v.id === visitId ? { ...v, clientChecklist: newChecklist } : v
      )
    }));

    try {
      await dataService.updateVisitClientChecklist(visitId, newChecklist);
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const handleChecklistPhotoUpload = async (visitId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      try {
        // Upload photos
        const uploadedUrls = await Promise.all(
          files.map(file => dataService.uploadVisitPhoto(file))
        );
        
        // Get current photos
        const visit = data.visits.find((v: any) => v.id === visitId);
        const item = visit.clientChecklist.find((i: any) => i.id === itemId);
        const currentPhotos = item.photos || [];
        
        // Update checklist
        handleClientChecklistUpdate(visitId, itemId, { photos: [...currentPhotos, ...uploadedUrls] });
      } catch (error) {
        console.error('Error uploading checklist photos:', error);
        showToast('Error al subir fotos. Intenta de nuevo.');
      }
    }
  };

  const handleRemoveChecklistPhoto = (visitId: string, itemId: string, photoUrl: string) => {
    const visit = data.visits.find((v: any) => v.id === visitId);
    const item = visit.clientChecklist.find((i: any) => i.id === itemId);
    const currentPhotos = item.photos || [];
    
    handleClientChecklistUpdate(visitId, itemId, { photos: currentPhotos.filter((p: string) => p !== photoUrl) });
  };

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

      // Log activity: Visit feedback
      dataService.logActivity({
        folderId: data.itinerary.folderId,
        agentId: data.itinerary.folder.userId,
        type: ActivityType.VISIT_FEEDBACK,
        content: `El cliente dejó feedback para la visita en ${visit?.property?.title || 'una propiedad'}`,
        metadata: { visitId, rating: ratings[visitId], feedback: feedback[visitId] }
      });

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
      showToast('Error al enviar feedback. Por favor intenta de nuevo.');
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
      showToast('Solicitud de visita cancelada.');
    } catch (error) {
      console.error('Error deleting visit request:', error);
      showToast('Error al cancelar la solicitud.');
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

        // Log activity: Visit requested (existing)
        dataService.logActivity({
          folderId: data.itinerary.folderId,
          agentId: data.itinerary.folder.userId,
          type: ActivityType.VISIT_REQUESTED,
          content: `El cliente solicitó una visita para ${property.title}`,
          metadata: { propertyId: property.id, message }
        });

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
        
        showToast('Solicitud enviada! Tu consultor la verá en la agenda.');
      } else {
        // Create a new visit request
        let clientData = data.itinerary.folder?.client;
        if (Array.isArray(clientData)) {
          clientData = clientData.length > 0 ? clientData[0] : undefined;
        }

        const newVisitData = {
          propertyId: property.id,
          folderId: data.itinerary.folderId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          time: '09:00:00', // Default time
          contactName: 'Solicitud Web',
          contactPhone: '',
          clientName: clientData?.name || '',
          clientPhone: clientData?.phone || '',
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
          // Log activity: Visit requested (new)
          dataService.logActivity({
            folderId: data.itinerary.folderId,
            agentId: data.itinerary.folder.userId,
            type: ActivityType.VISIT_REQUESTED,
            content: `El cliente solicitó una visita para ${property.title}`,
            metadata: { propertyId: property.id, message }
          });

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
          
          showToast('Solicitud de visita creada! Tu consultor se pondrá en contacto contigo.');
        } else {
          showToast('Error al crear la solicitud. Por favor intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error requesting visit:', error);
      showToast('Error al solicitar visita.');
    } finally {
      setIsRequestModalOpen(false);
      setSelectedPropertyForRequest(null);
    }
  };

  const existingCustomFieldKeys = Array.from<string>(new Set(
    (data?.properties || []).flatMap((p: any) => 
      Object.entries(p.clientCustomFields || {}).map(([key, field]: [string, any]) => 
        typeof field === 'object' && field !== null ? field.label : key
      )
    )
  ));

  const defaultSuggestions = ['Luz Natural', 'Nivel de Ruido', 'Estado General', 'Espacio Verde', 'Potencial de Reforma'];
  const allSuggestedKeys = Array.from(new Set([...existingCustomFieldKeys, ...defaultSuggestions]));

  const handleSaveCustomField = async () => {
    if (!selectedPropertyForCustomField || !customFieldName.trim() || !customFieldValue.trim()) return;

    const property = selectedPropertyForCustomField;
    const updatedFields = {
      ...(property.clientCustomFields || {}),
      [customFieldName.trim()]: customFieldValue.trim()
    };

    // Optimistic update
    setData((prev: any) => ({
      ...prev,
      properties: prev.properties.map((p: any) => 
        p.id === property.id ? { ...p, clientCustomFields: updatedFields } : p
      )
    }));

    setIsCustomFieldModalOpen(false);
    setCustomFieldName('');
    setCustomFieldValue('');

    try {
      await dataService.updatePropertyCustomFields(property.id, updatedFields);
      
      // Log activity: Property criteria
      dataService.logActivity({
        folderId: data.itinerary.folderId,
        agentId: data.itinerary.folder.userId,
        type: ActivityType.PROPERTY_CRITERIA,
        content: `El cliente agregó el criterio "${customFieldName}: ${customFieldValue}" a la propiedad ${property.title}`,
        metadata: { propertyId: property.id, fieldName: customFieldName, fieldValue: customFieldValue }
      });
    } catch (err) {
      console.error('Error saving custom field:', err);
      showToast('Error al guardar el criterio.');
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      await dataService.updatePropertyStatus(propertyId, newStatus);
      
      // Update local state
      setData((prev: any) => ({
        ...prev,
        properties: prev.properties.map((p: any) => 
          p.id === propertyId ? { ...p, status: newStatus } : p
        )
      }));
      
      const property = data.properties.find((p: any) => p.id === propertyId);
      
      // Log activity
      dataService.logActivity({
        folderId: data.itinerary.folderId,
        agentId: data.itinerary.folder.userId,
        type: ActivityType.STATUS_CHANGED,
        content: `El cliente cambió el estado de la propiedad ${property?.title || ''} a ${newStatus}`,
        metadata: { propertyId, newStatus }
      });
      
      showToast(`Estado actualizado a ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error al actualizar el estado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white animate-bounce shadow-xl mb-4">
          <Home className="w-8 h-8" />
        </div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Cargando tu itinerario personalizado...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Itinerario no encontrado</h1>
        <p className="text-slate-500 max-w-xs mx-auto">El link es inválido o el itinerario ya no está activo. Por favor, contacta a tu consultor.</p>
      </div>
    );
  }

  const { itinerary, visits, properties } = data;
  
  const sortedVisits = [...(visits || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const activeVisits = sortedVisits.filter((v: any) => v.status === 'Scheduled' || v.status === 'Pending' || v.status === 'Confirmed' || v.status === 'Requested');
  const pastVisits = sortedVisits.filter((v: any) => v.status === 'Completed' || v.status === 'Cancelled');

  const sortedProperties = properties ? [...properties].sort((a: any, b: any) => {
    // First, sort by status 'Elegida'
    const aIsElegida = a.status === PropertyStatus.ELEGIDA || a.status === 'Elegida';
    const bIsElegida = b.status === PropertyStatus.ELEGIDA || b.status === 'Elegida';
    if (aIsElegida && !bIsElegida) return -1;
    if (!aIsElegida && bIsElegida) return 1;

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

  const filteredProperties = sortedProperties.filter((p: any) => {
    if (p.isPublic === false) return false;
    if (filterPriceMin !== '' && p.price < Number(filterPriceMin)) return false;
    if (filterPriceMax !== '' && p.price > Number(filterPriceMax)) return false;
    if (filterBedrooms !== '' && p.rooms < Number(filterBedrooms)) return false;
    if (filterMinSqft !== '' && p.sqft < Number(filterMinSqft)) return false;
    
    // Custom filters
    for (const [key, value] of Object.entries(customFilters)) {
      if (!value) continue;
      
      let foundMatch = false;
      if (p.clientCustomFields) {
        for (const [fKey, fValue] of Object.entries(p.clientCustomFields)) {
          const label = typeof fValue === 'object' && fValue !== null ? (fValue as any).label : fKey;
          const val = typeof fValue === 'object' && fValue !== null ? (fValue as any).value : fValue;
          if (label === key && String(val) === value) {
            foundMatch = true;
            break;
          }
        }
      }
      if (!foundMatch) return false;
    }
    
    return true;
  });

  const renderVisitCard = (visit: any) => {
    const today = new Date();
    const visitDateObj = new Date(visit.date + 'T00:00:00');
    const isToday = today.toDateString() === visitDateObj.toDateString();
    
    // Determine status based on legacy logic
    let displayStatus = 'Pending';
    if (visit.status === 'Pending' || (visit.status === 'Scheduled' && visit.notes?.includes('(Horario a coordinar)'))) {
      displayStatus = 'Pending';
    } else if (visit.status === 'Requested') {
      displayStatus = 'Requested';
    } else if (visit.status === 'Confirmed' || visit.status === 'Scheduled') {
      displayStatus = 'Confirmed';
    } else if (visit.status === 'Completed') {
      displayStatus = 'Completed';
    } else if (visit.status === 'Cancelled') {
      displayStatus = 'Cancelled';
    }
    
    return (
      <div key={visit.id} className={`bg-white rounded-[2rem] md:rounded-[2.5rem] border ${isToday ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} p-5 md:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${visit.status === 'Cancelled' ? 'opacity-70 grayscale' : ''}`}>
        {isToday && visit.status !== 'Cancelled' && visit.status !== 'Completed' && (
          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-bold uppercase tracking-wider animate-pulse">
            Visita Hoy
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className="w-full lg:w-48 h-40 md:h-48 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative">
            <img src={visit.property.images[0] || 'https://picsum.photos/seed/prop/400/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
            <div className="absolute top-3 left-3 z-10">
              {displayStatus === 'Pending' && (
                <span className="bg-slate-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> A Confirmar
                </span>
              )}
              {displayStatus === 'Requested' && (
                <span className="bg-amber-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> En Gestión
                </span>
              )}
              {displayStatus === 'Confirmed' && (
                <span className="bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Confirmada
                </span>
              )}
              {displayStatus === 'Completed' && (
                <span className="bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Realizada
                </span>
              )}
              {displayStatus === 'Cancelled' && (
                <span className="bg-slate-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Cancelada
                </span>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mb-1">{visit.property.title}</h3>
                <div className="flex items-start gap-1.5 md:gap-2">
                  <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider leading-relaxed break-words">
                    {visit.property.address}
                  </p>
                </div>
              </div>
              
              {displayStatus === 'Pending' && (
                <div className="flex items-center gap-2">
                  <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200 flex items-center gap-1.5">
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
              {displayStatus === 'Requested' && (
                <div className="flex items-center gap-2">
                  <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-100 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> En Gestión
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
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Confirmada
                </span>
              )}
              {displayStatus === 'Completed' && (
                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Realizada
                </span>
              )}
              {displayStatus === 'Cancelled' && (
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200 flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Cancelada
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Fecha</p>
                <p className="text-xs md:text-sm font-bold text-slate-700">
                  {new Date(visit.date + 'T00:00:00').toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </p>
              </div>
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Hora</p>
                <p className="text-xs md:text-sm font-bold text-slate-700">{visit.time} HS</p>
              </div>
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Contacto</p>
                <p className="text-xs md:text-sm font-bold text-slate-700 truncate">{agentProfile?.name || visit.contactName || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Teléfono</p>
                <p className="text-xs md:text-sm font-bold text-indigo-600">{agentProfile?.whatsappNumber || visit.contactPhone || 'N/A'}</p>
              </div>
            </div>

            {itinerary.settings.showChecklist && visit.checklist && visit.checklist.length > 0 && (
              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5" /> Checklist de Inspección
                </p>
                <div className="flex flex-wrap gap-2">
                  {visit.checklist.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold text-slate-600 shadow-sm">
                      {item.completed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Square className="w-3 h-3 text-slate-300" />}
                      {item.task}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itinerary.settings.showPrices && (
              <p className="text-indigo-600 font-bold text-lg mb-4">
                {visit.property.currency === 'ARS' ? '$' : 'U$S'} {visit.property.price.toLocaleString()}
              </p>
            )}

            <div className="flex gap-2">
              <a 
                href={visit.property.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3 h-3" /> Ver Ficha
              </a>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.property.address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-3 h-3" /> Cómo llegar
              </a>
            </div>

            {/* Client Checklist Section */}
            {visit.clientChecklist && visit.clientChecklist.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> 
                  Tu Evaluación
                </h4>
                <div className="space-y-3">
                  {visit.clientChecklist.map((item: any) => (
                    <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleClientChecklistUpdate(visit.id, item.id, { response: 'yes' })}
                            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                              item.response === 'yes' 
                                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200' 
                                : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Sí</span>
                          </button>
                          <button
                            onClick={() => handleClientChecklistUpdate(visit.id, item.id, { response: 'no' })}
                            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                              item.response === 'no' 
                                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-200' 
                                : 'bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">No</span>
                          </button>
                          <button
                            onClick={() => handleClientChecklistUpdate(visit.id, item.id, { response: 'maybe' })}
                            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                              item.response === 'maybe' 
                                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-200' 
                                : 'bg-white text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-200'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Quizás</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments and Photos */}
                      <div className="flex gap-2 items-start pt-2 border-t border-slate-200/50">
                        <textarea
                          placeholder="Nota opcional..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-10 min-h-[40px]"
                          value={item.comment || ''}
                          onChange={(e) => handleClientChecklistUpdate(visit.id, item.id, { comment: e.target.value })}
                        />
                        <label className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all shrink-0">
                          <Camera className="w-4 h-4" />
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleChecklistPhotoUpload(visit.id, item.id, e)}
                          />
                        </label>
                      </div>

                      {/* Photo Preview */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {item.photos.map((url: string, idx: number) => (
                            <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                              <img src={url} className="w-full h-full object-cover" alt="Checklist" />
                              <button 
                                onClick={() => handleRemoveChecklistPhoto(visit.id, item.id, url)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
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
                            <span className={`text-xs font-bold uppercase tracking-wider ${
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
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => window.location.reload()}
              className={`w-10 h-10 md:w-12 md:h-12 ${itinerary.folder.color} rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform active:scale-95`}
              title="Recargar"
            >
              <Home className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px] md:max-w-none">{itinerary.folder.name}</h1>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-0.5 md:mt-1">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {agentProfile?.whatsappNumber ? (
              <a 
                href={`https://wa.me/${agentProfile.whatsappNumber}?text=${encodeURIComponent(`Hola ${agentProfile.name}, `)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-50 text-emerald-600 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 md:gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="hidden md:inline">En Vivo</span>
                <span className="md:hidden">Chat</span>
              </a>
            ) : (
              <div className="bg-emerald-50 text-emerald-600 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 md:gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="hidden md:inline">En Vivo</span>
                <span className="md:hidden">Online</span>
              </div>
            )}
            {agentProfile?.email && (
              <a href={`mailto:${agentProfile.email}`} className="text-[10px] md:text-xs text-slate-400 font-medium hover:text-indigo-600 transition-colors">
                {agentProfile.email}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
        {/* Intro / Folder Details */}
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight text-slate-900">
              ¡Hola{itinerary.folder.client?.name ? ` ${itinerary.folder.client.name}` : ''}! 👋
            </h2>
            
            {itinerary.folder.welcomeMessage && (
              <div className="bg-indigo-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-100 shadow-sm mb-6">
                <h3 className="text-indigo-900 font-bold mb-2 text-xs md:text-sm uppercase tracking-wider">Mensaje de Bienvenida</h3>
                <p className="text-slate-900 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{itinerary.folder.welcomeMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuesto</span>
                </div>
                <p className="text-base md:text-lg font-bold text-slate-800">${itinerary.folder.budget?.toLocaleString() || 'N/A'}</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Operación</span>
                </div>
                <p className="text-base md:text-lg font-bold text-slate-800">{itinerary.folder.transactionType || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <ActivityIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                </div>
                <p className="text-base md:text-lg font-bold text-slate-800">{itinerary.folder.status || 'N/A'}</p>
              </div>

              <div className="bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</span>
                </div>
                <p className="text-base md:text-lg font-bold text-slate-800">{itinerary.folder.startDate ? new Date(itinerary.folder.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {itinerary.folder.description && (
              <div className="bg-slate-50 rounded-xl md:rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observaciones</span>
                </div>
                <div 
                  className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: itinerary.folder.description }}
                />
              </div>
            )}

            {itinerary.folder.imageUrl && itinerary.folder.isImagePublic !== false && (
              <div className="mt-4 md:mt-6 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                <img 
                  src={itinerary.folder.imageUrl} 
                  alt={itinerary.folder.name} 
                  className="w-full aspect-video object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
        </div>

        {/* Progress Bar */}
        <ClientProgressBar 
          transactionType={itinerary.folder.transactionType} 
          operationType={itinerary.folder.operationType}
          currentStageId={itinerary.folder.stageId}
        />

        {/* Desktop Navigation (Hidden on Mobile) */}
        <div className="hidden md:flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 inline-flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" /> Agenda
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'properties' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Propiedades
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <MapIcon className="w-4 h-4" /> Mapa
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'leads' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Send className="w-4 h-4" /> Sugerencias
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 md:hidden z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'timeline' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'timeline' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'properties' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutGrid className={`w-5 h-5 ${activeTab === 'properties' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Props</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'map' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <MapIcon className={`w-5 h-5 ${activeTab === 'map' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Mapa</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'leads' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Send className={`w-5 h-5 ${activeTab === 'leads' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sugerir</span>
          </button>
        </div>

        {/* Content */}


        {activeTab === 'timeline' && (
          <div className="space-y-12">
            {/* Novedades Section */}
            {publicActivities.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <ActivityIcon className="w-4 h-4" /> Últimas Novedades
                </h3>
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-6 md:p-8 space-y-6">
                    {publicActivities.map(activity => (
                      <div key={activity.id} className="flex gap-4 border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                        <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          {activity.type === ActivityType.LOG_NOTE ? <MessageSquare className="w-5 h-5" /> :
                           activity.type === ActivityType.LOG_DOCUMENT ? <FileText className="w-5 h-5" /> :
                           <CheckSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {activity.type === ActivityType.LOG_NOTE ? 'Anotación' :
                               activity.type === ActivityType.LOG_DOCUMENT ? 'Documento' : 'Checklist'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(activity.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-sm md:text-base text-slate-700 whitespace-pre-wrap">{activity.content}</p>
                          {activity.type === ActivityType.LOG_DOCUMENT && activity.metadata?.fileUrl && (
                            <a 
                              href={activity.metadata.fileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                            >
                              <FileText className="w-4 h-4" /> Ver Documento
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Calendar className="w-4 h-4" /> Próximas Visitas
              </h3>
              {activeVisits.length > 0 ? (
                activeVisits.map((visit: any) => renderVisitCard(visit))
              ) : (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
                  <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No tienes visitas pendientes.</p>
                </div>
              )}
            </div>

            {pastVisits.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 pt-10 border-t border-slate-100">
                  <History className="w-4 h-4" /> Historial de Visitas
                </h3>
                <div className="space-y-6">
                  {pastVisits.map((v: any) => renderVisitCard(v))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Tip Banner */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 md:p-5 flex items-start gap-3 md:gap-4 shadow-sm">
              <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
                <Lightbulb className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-lg md:text-xl font-bold text-indigo-900 mb-1.5">Tip: Califica y compara</h4>
                <p className="text-base md:text-lg text-indigo-700/80 font-medium leading-relaxed">
                  Usa el botón <strong>"+ Agregar Criterio"</strong> en cada propiedad para crear tus propias etiquetas (ej. "Luz Natural", "Nivel de Ruido" o "Potencial de reforma"). Luego podrás usar los filtros para encontrar exactamente lo que buscas.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Filter className="w-4 h-4" /> Filtros {showFilters ? '(-)' : '(+)'}
                </button>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 outline-none cursor-pointer"
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
                  <div className="w-px h-4 bg-slate-200"></div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista Cuadrícula"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Vista Lista"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Mín</label>
                    <input 
                      type="number" 
                      value={filterPriceMin}
                      onChange={(e) => setFilterPriceMin(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Máx</label>
                    <input 
                      type="number" 
                      value={filterPriceMax}
                      onChange={(e) => setFilterPriceMax(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Sin límite"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dormitorios</label>
                    <select 
                      value={filterBedrooms}
                      onChange={(e) => setFilterBedrooms(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Cualquiera</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sup. Mín (m²)</label>
                    <input 
                      type="number" 
                      value={filterMinSqft}
                      onChange={(e) => setFilterMinSqft(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Custom Field Filters */}
                  {existingCustomFieldKeys.length > 0 && (
                    <div className="col-span-2 md:col-span-4 pt-4 mt-2 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Filtros por Criterios Propios
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {existingCustomFieldKeys.map(key => {
                          const uniqueValues = Array.from(new Set(
                            (data?.properties || [])
                              .map((p: any) => {
                                if (!p.clientCustomFields) return null;
                                for (const [fKey, fValue] of Object.entries(p.clientCustomFields)) {
                                  const label = typeof fValue === 'object' && fValue !== null ? (fValue as any).label : fKey;
                                  const val = typeof fValue === 'object' && fValue !== null ? (fValue as any).value : fValue;
                                  if (label === key) return val;
                                }
                                return null;
                              })
                              .filter((val: any) => val !== null && val !== undefined && val !== '')
                          ));
                          
                          if (uniqueValues.length === 0) return null;
                          
                          return (
                            <div key={key}>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title={key}>{key}</label>
                              <select 
                                value={customFilters[key] || ''}
                                onChange={(e) => setCustomFilters(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                <option value="">Cualquiera</option>
                                {uniqueValues.map((val: any) => (
                                  <option key={String(val)} value={String(val)}>{String(val)}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-4"}>
              {filteredProperties && filteredProperties.length > 0 ? (
                filteredProperties.map((property: any, index: number) => {
                  const visit = visits.find((v: any) => v.propertyId === property.id);
                  let displayStatus = null;
                  
                  if (visit) {
                    if (visit.status === 'Pending' || (visit.status === 'Scheduled' && visit.notes?.includes('(Horario a coordinar)'))) {
                      displayStatus = 'Pending';
                    } else if (visit.status === 'Requested') {
                      displayStatus = 'Requested';
                    } else if (visit.status === 'Confirmed' || visit.status === 'Scheduled') {
                      displayStatus = 'Confirmed';
                    } else if (visit.status === 'Completed') {
                      displayStatus = 'Completed';
                    } else if (visit.status === 'Cancelled') {
                      displayStatus = 'Cancelled';
                    }
                  }

                  if (viewMode === 'list') {
                    return (
                      <SharedPropertyRow
                        key={property.id}
                        property={property}
                        index={index}
                        onSelect={(p) => { if (p.url) window.open(p.url, '_blank'); }}
                        onCompare={toggleComparison}
                        isCompared={comparisonIds.includes(property.id)}
                        onRequestVisit={handleRequestVisit}
                        onStatusChange={handleStatusChange}
                        onAddCustomField={(p) => {
                          setSelectedPropertyForCustomField(p);
                          setCustomFieldName('');
                          setCustomFieldValue('');
                          setIsCustomFieldModalOpen(true);
                        }}
                      />
                    );
                  }

                  const isElegida = property.status === PropertyStatus.ELEGIDA || (property.status as string) === 'Elegida';
                  
                  return (
                    <div 
                      key={property.id} 
                      className={`rounded-[2rem] md:rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col ${
                        isElegida 
                          ? 'bg-pink-50/30 border-pink-300 ring-4 ring-pink-50' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="h-56 md:h-64 relative overflow-hidden shrink-0">
                        <img 
                          src={property.images[0] || 'https://picsum.photos/seed/prop/800/600'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt={property.title} 
                        />
                        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10">
                          {displayStatus === 'Pending' && (
                            <span className="bg-slate-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> A Confirmar
                            </span>
                          )}
                          {displayStatus === 'Requested' && (
                            <span className="bg-amber-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> En Gestión
                            </span>
                          )}
                          {displayStatus === 'Confirmed' && (
                            <span className="bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Confirmada
                            </span>
                          )}
                          {displayStatus === 'Completed' && (
                            <span className="bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" /> Realizada
                            </span>
                          )}
                          {displayStatus === 'Cancelled' && (
                            <span className="bg-slate-500/90 backdrop-blur-md text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
                              <X className="w-3 h-3" /> Cancelada
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col items-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComparison(property.id);
                            }}
                            className={`bg-white/90 backdrop-blur-sm px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border transition-colors flex items-center gap-1.5 md:gap-2 ${
                              comparisonIds.includes(property.id)
                                ? 'border-indigo-500 text-indigo-600 ring-2 ring-indigo-500/20'
                                : 'border-slate-100 text-slate-500 hover:text-indigo-600'
                            }`}
                          >
                            {comparisonIds.includes(property.id) ? (
                              <CheckSquare className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            ) : (
                              <Square className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            )}
                            Comparar
                          </button>
                          {(property.status === PropertyStatus.SUGERIDA || property.status === PropertyStatus.ELEGIDA || (property.status as string) === 'Sugerida' || (property.status as string) === 'Elegida') ? (
                            <div className="relative inline-block">
                              <select
                                className={`pl-2.5 pr-6 py-1 md:pl-3 md:pr-7 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border cursor-pointer outline-none appearance-none transition-colors ${
                                  isElegida 
                                    ? 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200' 
                                    : 'bg-white/90 backdrop-blur-sm text-slate-600 border-slate-100 hover:bg-slate-50'
                                }`}
                                value={property.status}
                                onChange={(e) => handleStatusChange(property.id, e.target.value as PropertyStatus)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value={PropertyStatus.SUGERIDA}>{PropertyStatus.SUGERIDA}</option>
                                <option value={PropertyStatus.ELEGIDA}>{PropertyStatus.ELEGIDA}</option>
                              </select>
                              <ChevronDown className={`w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isElegida ? 'text-pink-500' : 'text-slate-400'}`} />
                            </div>
                          ) : (
                            <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm border border-slate-100">
                              {property.status}
                            </div>
                          )}
                        {property.acquisitionReason && (
                          <div className="bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm border border-white/10">
                            {property.acquisitionReason}
                          </div>
                        )}
                      </div>
                      {itinerary.settings.showPrices && (
                        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg">
                          {property.currency === 'ARS' ? '$' : 'U$S'} {property.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 md:p-8 flex-1 flex flex-col">
                      {property.code && (
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">{property.code}</span>
                      )}
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mb-1 md:mb-2 leading-tight flex items-start gap-2">
                        <span>{property.title}</span>
                        {isElegida && <Heart className="w-5 h-5 text-pink-500 fill-pink-500 shrink-0 mt-0.5" />}
                      </h3>
                      <div className="flex items-start gap-1.5 mb-4 md:mb-6">
                        <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider leading-relaxed break-words">
                          {property.address}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
                        <div className={`rounded-xl md:rounded-2xl p-2 md:p-3 text-center border transition-colors ${sortBy === 'rooms' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                          <span className={`block text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 md:mb-1 ${sortBy === 'rooms' ? 'text-indigo-600' : 'text-slate-400'}`}>Ambientes</span>
                          <span className={`font-bold text-base md:text-lg ${sortBy === 'rooms' ? 'text-indigo-900' : 'text-slate-800'}`}>{property.environments}</span>
                        </div>
                        <div className={`rounded-xl md:rounded-2xl p-2 md:p-3 text-center border transition-colors ${sortBy === 'sqft' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                          <span className={`block text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 md:mb-1 ${sortBy === 'sqft' ? 'text-indigo-600' : 'text-slate-400'}`}>Sup. Total</span>
                          <span className={`font-bold text-base md:text-lg ${sortBy === 'sqft' ? 'text-indigo-900' : 'text-slate-800'}`}>{property.sqft} m²</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl md:rounded-2xl p-2 md:p-3 text-center border border-slate-100">
                          <span className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Baños</span>

                          <span className="font-bold text-slate-800 text-lg">{property.bathrooms}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8 flex-1">
                         {/* Custom Fields */}
                         {property.clientCustomFields && Object.entries(property.clientCustomFields).map(([key, field]: [string, any]) => {
                           const label = typeof field === 'object' && field !== null ? field.label : key;
                           const value = typeof field === 'object' && field !== null ? field.value : field;
                           const type = typeof field === 'object' && field !== null ? field.type : 'text';
                           
                           return (
                           <div key={key} className="flex justify-between items-center py-2 border-b border-indigo-50 bg-indigo-50/30 -mx-5 px-5 md:-mx-8 md:px-8">
                             <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1.5">
                               <Star className="w-3.5 h-3.5" /> {label}
                             </span>
                             <span className="text-sm font-bold text-indigo-700">
                               {type === 'boolean' ? (value ? 'Sí' : 'No') : 
                                type === 'rating' ? `${value}/5` : 
                                String(value || 'N/A')}
                             </span>
                           </div>
                         )})}
                         
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Dormitorios</span>
                           <span className="text-sm font-bold text-slate-700">{property.rooms}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Toilettes</span>
                           <span className="text-sm font-bold text-slate-700">{property.toilets || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cocheras</span>
                           <span className="text-sm font-bold text-slate-700">{property.parking || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sup. Cubierta</span>
                           <span className="text-sm font-bold text-slate-700">{property.coveredSqft || 0} m²</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sup. Descubierta</span>
                           <span className="text-sm font-bold text-slate-700">{property.uncoveredSqft || 0} m²</span>
                         </div>
                         <div className={`flex justify-between items-center py-2 border-b transition-colors ${sortBy === 'pricePerSqft' ? 'border-indigo-100 bg-indigo-50/50 -mx-5 px-5 md:-mx-8 md:px-8' : 'border-slate-50'}`}>
                           <span className={`text-xs font-bold uppercase tracking-wide ${sortBy === 'pricePerSqft' ? 'text-indigo-600' : 'text-slate-400'}`}>Valor m²</span>
                           <span className={`text-sm font-bold ${sortBy === 'pricePerSqft' ? 'text-indigo-700' : 'text-slate-700'}`}>
                             {property.currency === 'ARS' ? '$' : 'U$S'} {property.sqft > 0 ? Math.round(property.price / property.sqft).toLocaleString() : 'N/A'}
                           </span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Antigüedad</span>
                           <span className="text-sm font-bold text-slate-700">{property.age || 0} años</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expensas</span>
                           <span className="text-sm font-bold text-slate-700">${property.fees?.toLocaleString() || 0}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-50">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Piso</span>
                           <span className="text-sm font-bold text-slate-700">{property.floor || '-'}</span>
                         </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-auto">
                        <button 
                          onClick={() => {
                            setSelectedPropertyForCustomField(property);
                            setCustomFieldName('');
                            setCustomFieldValue('');
                            setIsCustomFieldModalOpen(true);
                          }}
                          className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 border border-indigo-100"
                        >
                          <Plus className="w-4 h-4" /> Agregar Criterio
                        </button>
                        <button 
                          onClick={() => handleRequestVisit(property)}
                          className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                        >
                          <Calendar className="w-4 h-4" /> Pedir Visita
                        </button>
                        <a 
                          href={property.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
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
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">No hay propiedades en esta carpeta.</p>
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

        {activeTab === 'leads' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Sugerir Propiedades</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Envía links o archivos para que tu consultor los analice</p>
                </div>
              </div>

              <div className="space-y-4">
                <textarea
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  placeholder="Pega aquí los links de las propiedades que te interesan (uno por línea o separados por comas)..."
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />

                {/* File Upload for Suggestions */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {pendingInboxFiles.map((file, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 group">
                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{file.name}</span>
                        <button 
                          onClick={() => setPendingInboxFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Subir Imagen o Documento</span>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files) {
                          setPendingInboxFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                  </label>
                </div>

                <button
                  onClick={handleSubmitLinks}
                  disabled={isSubmittingLinks || (!linksText.trim() && pendingInboxFiles.length === 0)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingLinks ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Enviar Sugerencias
                    </>
                  )}
                </button>
              </div>
            </div>

            {inboxLinks.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 px-2">
                  <History className="w-4 h-4 text-slate-400" /> Historial de Sugerencias
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inboxLinks.map((link: any) => {
                    const isCaido = link.status === 'caido';
                    return (
                    <div key={link.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3 group ${isCaido ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors relative ${isCaido ? 'bg-rose-50 text-rose-400 group-hover:bg-rose-100 group-hover:text-rose-500' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        {link.file_url ? (
                          link.file_type?.startsWith('image/') ? <Image className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        {isCaido && (
                          <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate ${isCaido ? 'text-rose-400' : 'text-slate-400'}`}>
                          {link.file_url ? (link.file_type?.startsWith('image/') ? 'Imagen' : 'Documento') : (() => {
                            try {
                              return new URL(link.url).hostname.replace('www.', '');
                            } catch {
                              return 'Link';
                            }
                          })()}
                        </p>
                        <a href={link.file_url || link.url} target="_blank" rel="noreferrer" className={`text-xs font-bold break-all block transition-colors ${isCaido ? 'text-rose-600 line-through opacity-70 hover:text-rose-700' : 'text-slate-700 hover:text-indigo-600'}`}>
                          {link.file_url ? 'Ver Archivo' : link.url}
                        </a>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isCaido ? 'text-rose-400' : 'text-slate-400'}`}>
                          <Clock className="w-3 h-3" />
                          {(() => {
                            const date = new Date(link.created_at);
                            const datePart = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            const timePart = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                            return `${datePart} ${timePart}`;
                          })()}
                        </div>
                        <div className={`text-[8px] font-bold uppercase tracking-widest ${isCaido ? 'text-rose-500' : 'text-slate-400'}`}>
                          {isCaido ? 'No Disponible' : (link.added_by_client ? 'Sugerido por ti' : 'Agregado por Agente')}
                        </div>
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          link.status === 'procesado' ? 'bg-emerald-100 text-emerald-600' :
                          link.status === 'rechazado' ? 'bg-rose-100 text-rose-600' :
                          isCaido ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {link.status === 'procesado' ? 'Procesado' :
                           link.status === 'rechazado' ? 'Rechazado' :
                           isCaido ? 'Caída' :
                           'Enviado'}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center space-y-4 pt-10">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-600 font-bold mx-auto shadow-sm">
            PB
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Powered by PropBi Intelligence
          </p>
        </div>
      </main>
      {/* Comparison Floating Bar */}
      {comparisonIds.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 w-[90%] md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs">
              {comparisonIds.length}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Seleccionadas</span>
          </div>
          <button
            onClick={() => setIsComparisonOpen(true)}
            className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors"
          >
            Ver Comparación
          </button>
          <button
            onClick={() => setComparisonIds([])}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comparison Modal */}
      {isComparisonOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl relative">
              <button
                onClick={() => setIsComparisonOpen(false)}
                className="absolute top-8 right-8 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-50"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
              <ComparisonTool
                properties={properties.filter((p: any) => comparisonIds.includes(p.id))}
                folder={itinerary.folder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Request Visit Modal */}
      {isRequestModalOpen && selectedPropertyForRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Solicitar Visita</h3>
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 md:p-4 rounded-2xl border border-slate-100">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
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

            <div className="p-5 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={submitVisitRequest}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors uppercase tracking-wider shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {isCustomFieldModalOpen && selectedPropertyForCustomField && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Agregar Criterio</h3>
              <button onClick={() => setIsCustomFieldModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Criterio</label>
                {allSuggestedKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allSuggestedKeys.map((key: string) => (
                      <button
                        key={key}
                        onClick={() => setCustomFieldName(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${customFieldName === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder="Ej. Luz Natural, Ruido, Potencial..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Valor</label>
                <input
                  type="text"
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  placeholder="Ej. Alta, Bajo, 5 estrellas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsCustomFieldModalOpen(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomField}
                disabled={!customFieldName.trim() || !customFieldValue.trim()}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedItineraryView;
