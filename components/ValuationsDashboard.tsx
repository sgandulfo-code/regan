import React, { useState, useEffect } from 'react';
import { SearchFolder, Property, ValuationDossier } from '../types';
import { TrendingUp, Plus, FileText, MapPin, DollarSign, Calendar, Target, ArrowRight, Loader2, Edit2, Trash2 } from 'lucide-react';
import ValuationDossierView from './ValuationDossierView';
import ValuationDossierForm from './ValuationDossierForm';
import { dataService } from '../services/dataService';

interface ValuationsDashboardProps {
  folders: SearchFolder[];
  properties: Property[];
}

const ValuationsDashboard: React.FC<ValuationsDashboardProps> = ({ folders, properties }) => {
  const [dossiers, setDossiers] = useState<ValuationDossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<ValuationDossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDossiers = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getValuationDossiers();
      setDossiers(data);
    } catch (error) {
      console.error('Error loading dossiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDossiers();
  }, []);

  // Helper to find property details
  const getProperty = (id: string) => properties.find(p => p.id === id);

  const handleEdit = (dossier: ValuationDossier) => {
    setEditingDossier(dossier);
    setIsFormOpen(true);
    setSelectedDossierId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este dossier de tasación? Esta acción no se puede deshacer.')) {
      try {
        await dataService.deleteValuationDossier(id);
        setSelectedDossierId(null);
        loadDossiers();
      } catch (error) {
        console.error('Error deleting dossier:', error);
        alert('Error al eliminar el dossier');
      }
    }
  };

  if (selectedDossierId) {
    const dossier = dossiers.find(d => d.id === selectedDossierId);
    const subjectProperty = getProperty(dossier?.propertyId || '');
    
    if (dossier && subjectProperty) {
      return (
        <div className="p-6 md:p-8">
          <ValuationDossierView 
            dossier={dossier} 
            subjectProperty={subjectProperty} 
            allProperties={properties}
            onBack={() => setSelectedDossierId(null)}
            onEdit={() => handleEdit(dossier)}
            onDelete={() => handleDelete(dossier.id)}
          />
        </div>
      );
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            Dossiers de Tasación
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gestiona tus captaciones y presentaciones de precio (Smart CMA).</p>
        </div>
        <button 
          onClick={() => {
            setEditingDossier(null);
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Nueva Tasación
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : dossiers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No tienes tasaciones activas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Crea tu primer Dossier de Tasación Interactivo para sorprender a los propietarios y justificar el precio de mercado con datos reales.
          </p>
          <button 
            onClick={() => {
              setEditingDossier(null);
              setIsFormOpen(true);
            }}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Primera Tasación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dossiers.map(dossier => {
            const property = getProperty(dossier.propertyId);
            if (!property) return null;

            return (
              <div key={dossier.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-indigo-100 transition-all group cursor-pointer" onClick={() => setSelectedDossierId(dossier.id)}>
                <div className="h-40 relative overflow-hidden">
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg truncate">{property.title}</h3>
                    <div className="flex items-center gap-1 text-slate-300 text-xs mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{property.address}</span>
                    </div>
                  </div>
                  {dossier.isPublished && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Publicado
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio Sugerido</p>
                      <p className="text-xl font-black text-slate-800">${dossier.targetPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Días en Mercado</p>
                      <p className="text-lg font-bold text-indigo-600">~{dossier.estimatedDaysOnMarket}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(dossier.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(dossier);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(dossier.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <ValuationDossierForm 
          folders={folders}
          properties={properties}
          dossierToEdit={editingDossier}
          onClose={() => {
            setIsFormOpen(false);
            setEditingDossier(null);
          }}
          onSaved={() => {
            setIsFormOpen(false);
            setEditingDossier(null);
            loadDossiers();
          }}
        />
      )}
    </div>
  );
};

export default ValuationsDashboard;
