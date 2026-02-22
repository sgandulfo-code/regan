
import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2, Star, ExternalLink, MessageSquare, Send, ChevronRight, Home, Camera, UploadCloud, X } from 'lucide-react';
import { dataService } from '../services/dataService';

interface SharedItineraryViewProps {
  sharedId: string;
}

const SharedItineraryView: React.FC<SharedItineraryViewProps> = ({ sharedId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [photos, setPhotos] = useState<{ [key: string]: File[] }>({});
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

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

      await dataService.updateVisitFeedback(
        visitId, 
        feedback[visitId] || '', 
        uploadedUrls, 
        ratings[visitId]
      );

      // Update local state
      setData((prev: any) => ({
        ...prev,
        visits: prev.visits.map((v: any) => 
          v.id === visitId ? { 
            ...v, 
            clientFeedback: feedback[visitId],
            photos: uploadedUrls,
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

  const { itinerary, visits } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${itinerary.folder.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{itinerary.folder.name}</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Itinerario de Visitas</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            En Vivo
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 tracking-tight">¡Hola! 👋</h2>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Aquí tienes el cronograma detallado para nuestras visitas de hoy. Podrás ver la ubicación, horarios y dejar tus comentarios en tiempo real.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Timeline */}
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
                    {visit.clientFeedback || (visit.photos && visit.photos.length > 0) ? (
                      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> Tu Feedback Enviado
                        </p>
                        {visit.rating && (
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${star <= visit.rating ? 'fill-emerald-500 text-emerald-500' : 'text-emerald-200'}`} />
                            ))}
                          </div>
                        )}
                        {visit.clientFeedback && (
                          <p className="text-xs font-medium text-emerald-800 italic mb-2">"{visit.clientFeedback}"</p>
                        )}
                        {visit.photos && visit.photos.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto py-2">
                            {visit.photos.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-200 shrink-0">
                                <img src={url} className="w-full h-full object-cover" alt="Feedback" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Tu opinión
                          </label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star}
                                onClick={() => setRatings(prev => ({ ...prev, [visit.id]: star }))}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star className={`w-4 h-4 ${star <= (ratings[visit.id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <input 
                              type="text" 
                              placeholder="Escribe tus impresiones aquí..."
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                              value={feedback[visit.id] || ''}
                              onChange={(e) => setFeedback(prev => ({ ...prev, [visit.id]: e.target.value }))}
                            />
                            
                            {/* Photo Upload Preview */}
                            {photos[visit.id] && photos[visit.id].length > 0 && (
                              <div className="flex gap-2 overflow-x-auto py-2">
                                {photos[visit.id].map((file, idx) => (
                                  <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                                    <button 
                                      onClick={() => removePhoto(visit.id, idx)}
                                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-4 h-4 text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-indigo-600 cursor-pointer transition-all">
                              <Camera className="w-5 h-5" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                                onChange={(e) => handlePhotoSelect(visit.id, e)}
                              />
                            </label>
                            <button 
                              onClick={() => handleFeedbackSubmit(visit.id)}
                              disabled={submitting[visit.id] || (!feedback[visit.id] && (!photos[visit.id] || photos[visit.id].length === 0))}
                              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                            >
                              {submitting[visit.id] ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
