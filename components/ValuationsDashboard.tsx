import React, { useState } from 'react';
import { SearchFolder, Property, ValuationDossier } from '../types';
import { TrendingUp, Plus, FileText, MapPin, DollarSign, Calendar, Target, ArrowRight } from 'lucide-react';
import ValuationDossierView from './ValuationDossierView';

interface ValuationsDashboardProps {
  folders: SearchFolder[];
  properties: Property[];
  onSelectDossier: (dossierId: string) => void;
  onCreateDossier: () => void;
}

const ValuationsDashboard: React.FC<ValuationsDashboardProps> = ({ folders, properties, onSelectDossier, onCreateDossier }) => {
  const [dossiers, setDossiers] = useState<ValuationDossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

  // Initialize mock dossier when properties load
  React.useEffect(() => {
    if (properties.length > 0 && dossiers.length === 0) {
      // Find a subject property and some comparables
      const subject = properties[0];
      const comparables = properties.slice(1, 4).map((p, i) => ({
        id: `comp-${i}`,
        propertyId: p.id,
        type: i % 2 === 0 ? 'active' : 'sold' as 'active' | 'sold',
        soldPrice: i % 2 !== 0 ? p.price * 0.95 : undefined,
        soldDate: i % 2 !== 0 ? new Date().toISOString() : undefined,
        daysOnMarket: Math.floor(Math.random() * 60) + 15
      }));

      setDossiers([
        {
          id: 'mock-dossier-1',
          folderId: subject.folderId,
          propertyId: subject.id,
          suggestedPriceMin: subject.price * 0.95,
          suggestedPriceMax: subject.price * 1.05,
          targetPrice: subject.price,
          estimatedDaysOnMarket: 45,
          comparables,
          marketingPlan: [
            { id: 'm1', title: 'Fotografía Profesional', description: 'Sesión de fotos HDR y video con dron para destacar los mejores ángulos.', completed: true },
            { id: 'm2', title: 'Tour Virtual 360°', description: 'Creación de un recorrido inmersivo para filtrar curiosos y atraer compradores reales.', completed: false },
            { id: 'm3', title: 'Publicación Destacada', description: 'Posicionamiento premium en los principales portales inmobiliarios (Zonaprop, Argenprop).', completed: false },
            { id: 'm4', title: 'Campaña en Redes Sociales', description: 'Anuncios segmentados en Instagram y Facebook apuntando a compradores calificados.', completed: false }
          ],
          sellerCosts: {
            commissionPercentage: 3,
            taxPercentage: 1.5,
            notaryFees: 1200,
            otherCosts: 500
          },
          notes: 'Propiedad en excelente estado, lista para publicar.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublished: true
        }
      ]);
    }
  }, [properties]);

  // Helper to find property details
  const getProperty = (id: string) => properties.find(p => p.id === id);

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
          onClick={onCreateDossier}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Nueva Tasación
        </button>
      </div>

      {dossiers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No tienes tasaciones activas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Crea tu primer Dossier de Tasación Interactivo para sorprender a los propietarios y justificar el precio de mercado con datos reales.
          </p>
          <button 
            onClick={onCreateDossier}
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
                    <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      Ver Dossier <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ValuationsDashboard;
