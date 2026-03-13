import React, { useState, useEffect } from 'react';
import { SearchFolder, Property, ValuationDossier, ValuationComparable, MarketingAction } from '../types';
import { X, Save, Plus, Trash2, MapPin, Search, CheckCircle2 } from 'lucide-react';
import { dataService } from '../services/dataService';

interface ValuationDossierFormProps {
  folders: SearchFolder[];
  properties: Property[];
  onClose: () => void;
  onSaved: () => void;
  dossierToEdit?: ValuationDossier | null;
}

const ValuationDossierForm: React.FC<ValuationDossierFormProps> = ({ folders, properties, onClose, onSaved, dossierToEdit }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [folderId, setFolderId] = useState<string>(dossierToEdit?.folderId || '');
  const [propertyId, setPropertyId] = useState<string>(dossierToEdit?.propertyId || '');
  const [targetPrice, setTargetPrice] = useState<number>(dossierToEdit?.targetPrice || 0);
  const [suggestedPriceMin, setSuggestedPriceMin] = useState<number>(dossierToEdit?.suggestedPriceMin || 0);
  const [suggestedPriceMax, setSuggestedPriceMax] = useState<number>(dossierToEdit?.suggestedPriceMax || 0);
  const [estimatedDaysOnMarket, setEstimatedDaysOnMarket] = useState<number>(dossierToEdit?.estimatedDaysOnMarket || 30);
  
  const [comparables, setComparables] = useState<ValuationComparable[]>(dossierToEdit?.comparables || []);
  const [marketingPlan, setMarketingPlan] = useState<MarketingAction[]>(dossierToEdit?.marketingPlan || [
    { id: 'm1', title: 'Fotografía Profesional', description: 'Sesión de fotos HDR y video con dron.', completed: false },
    { id: 'm2', title: 'Tour Virtual 360°', description: 'Creación de un recorrido inmersivo.', completed: false },
    { id: 'm3', title: 'Publicación Destacada', description: 'Posicionamiento premium en portales.', completed: false },
  ]);
  const [sellerCosts, setSellerCosts] = useState(dossierToEdit?.sellerCosts || {
    commissionPercentage: 3,
    taxPercentage: 1.75, // Impuesto de Sellos
    notaryFeePercentage: 0.8, // Gastos de Escrituración
    itiPercentage: 15, // ITI o Ganancias
    notaryFees: 0,
    otherCosts: 0,
    exchangeRate: 1000,
    isViviendaUnica: false,
    hasTractoAbreviado: false,
    boughtBefore2018: false,
    originalPurchasePrice: 0
  });

  // Derived data
  const folderProperties = properties.filter(p => p.folderId === folderId);
  const subjectProperty = properties.find(p => p.id === propertyId);
  const availableComparables = folderProperties.filter(p => p.id !== propertyId);

  // Auto-fill prices when subject changes
  useEffect(() => {
    if (subjectProperty && targetPrice === 0) {
      setTargetPrice(subjectProperty.price);
      setSuggestedPriceMin(subjectProperty.price * 0.95);
      setSuggestedPriceMax(subjectProperty.price * 1.05);
    }
  }, [subjectProperty]);

  const handleToggleComparable = (prop: Property) => {
    const exists = comparables.find(c => c.propertyId === prop.id);
    if (exists) {
      setComparables(comparables.filter(c => c.propertyId !== prop.id));
    } else {
      setComparables([...comparables, {
        id: `comp-${Date.now()}`,
        propertyId: prop.id,
        type: 'active',
        daysOnMarket: 30
      }]);
    }
  };

  const handleUpdateComparable = (id: string, updates: Partial<ValuationComparable>) => {
    setComparables(comparables.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSave = async () => {
    if (!folderId || !propertyId) return;
    setIsSaving(true);
    try {
      const dossierData = {
        folderId,
        propertyId,
        targetPrice,
        suggestedPriceMin,
        suggestedPriceMax,
        estimatedDaysOnMarket,
        comparables,
        marketingPlan,
        sellerCosts,
        notes: dossierToEdit?.notes || '',
        isPublished: dossierToEdit?.isPublished || false
      };

      if (dossierToEdit) {
        await dataService.updateValuationDossier(dossierToEdit.id, dossierData);
      } else {
        await dataService.createValuationDossier(dossierData);
      }
      onSaved();
    } catch (error) {
      console.error('Error saving dossier:', error);
      alert('Error al guardar el dossier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {dossierToEdit ? 'Editar Dossier de Tasación' : 'Crear Dossier de Tasación'}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Paso {step} de 3
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">1. Selecciona la Carpeta/Cliente</label>
                <select 
                  value={folderId} 
                  onChange={(e) => { setFolderId(e.target.value); setPropertyId(''); setComparables([]); }}
                  disabled={!!dossierToEdit}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar carpeta...</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {folderId && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">2. Propiedad a Tasar (Sujeto)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {folderProperties.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => !dossierToEdit && setPropertyId(p.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex gap-4 ${propertyId === p.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200 bg-white'} ${dossierToEdit ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        <img src={p.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{p.title}</h4>
                          <p className="text-xs text-slate-500 truncate mt-1"><MapPin className="w-3 h-3 inline" /> {p.address}</p>
                          <p className="text-xs font-black text-indigo-600 mt-1">${p.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {folderProperties.length === 0 && (
                      <p className="text-sm text-slate-500 col-span-full">No hay propiedades en esta carpeta.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Selecciona Propiedades Comparables</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableComparables.map(p => {
                    const isSelected = comparables.some(c => c.propertyId === p.id);
                    const compData = comparables.find(c => c.propertyId === p.id);

                    return (
                      <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
                        <div 
                          className="flex gap-4 cursor-pointer mb-3"
                          onClick={() => handleToggleComparable(p)}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center mt-1 shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300'}`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{p.title}</h4>
                            <p className="text-xs font-black text-slate-500 mt-1">${p.price.toLocaleString()} • {p.coveredSqft || p.sqft} m²</p>
                          </div>
                        </div>

                        {isSelected && compData && (
                          <div className="pl-9 space-y-3 pt-3 border-t border-indigo-100">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateComparable(compData.id, { type: 'active' })}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${compData.type === 'active' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                              >
                                En Venta
                              </button>
                              <button 
                                onClick={() => handleUpdateComparable(compData.id, { type: 'sold' })}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${compData.type === 'sold' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                              >
                                Vendido
                              </button>
                            </div>
                            {compData.type === 'sold' && (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Precio de Cierre ($)</label>
                                <input 
                                  type="number" 
                                  value={compData.soldPrice || p.price}
                                  onChange={(e) => handleUpdateComparable(compData.id, { soldPrice: Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Valores Sugeridos</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Precio Objetivo ($)</label>
                    <input 
                      type="number" 
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-indigo-600 outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Mínimo ($)</label>
                      <input 
                        type="number" 
                        value={suggestedPriceMin}
                        onChange={(e) => setSuggestedPriceMin(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Máximo ($)</label>
                      <input 
                        type="number" 
                        value={suggestedPriceMax}
                        onChange={(e) => setSuggestedPriceMax(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Días Estimados en Mercado</label>
                    <input 
                      type="number" 
                      value={estimatedDaysOnMarket}
                      onChange={(e) => setEstimatedDaysOnMarket(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Costs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Costos del Vendedor</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Honorarios (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={sellerCosts.commissionPercentage}
                        onChange={(e) => setSellerCosts({...sellerCosts, commissionPercentage: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo de Cambio (Dólar Blue)</label>
                      <input 
                        type="number" 
                        value={sellerCosts.exchangeRate || 1000}
                        onChange={(e) => setSellerCosts({...sellerCosts, exchangeRate: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={sellerCosts.isViviendaUnica || false}
                          onChange={(e) => setSellerCosts({...sellerCosts, isViviendaUnica: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-700">Es vivienda única, familiar y de uso permanente</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={sellerCosts.hasTractoAbreviado || false}
                          onChange={(e) => setSellerCosts({...sellerCosts, hasTractoAbreviado: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-700">Incluye trámite de Tracto Abreviado (+0.4% escritura)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={sellerCosts.boughtBefore2018 || false}
                          onChange={(e) => setSellerCosts({...sellerCosts, boughtBefore2018: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-700">Inmueble adquirido antes del 1 de enero de 2018</span>
                      </label>
                    </div>

                    {!sellerCosts.boughtBefore2018 && !sellerCosts.isViviendaUnica && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Valor de Compra Original (US$)</label>
                        <input 
                          type="number" 
                          value={sellerCosts.originalPurchasePrice || 0}
                          onChange={(e) => setSellerCosts({...sellerCosts, originalPurchasePrice: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                          placeholder="Para cálculo de Impuesto Cedular"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Impuesto de Sellos (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={sellerCosts.taxPercentage}
                        onChange={(e) => setSellerCosts({...sellerCosts, taxPercentage: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ITI / Ganancias (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={sellerCosts.itiPercentage || 0}
                        onChange={(e) => setSellerCosts({...sellerCosts, itiPercentage: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Gastos de Escrituración (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={sellerCosts.notaryFeePercentage || 0}
                        onChange={(e) => setSellerCosts({...sellerCosts, notaryFeePercentage: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Escribanía Fijo ($)</label>
                      <input 
                        type="number" 
                        value={sellerCosts.notaryFees}
                        onChange={(e) => setSellerCosts({...sellerCosts, notaryFees: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Otros Gastos Fijos ($)</label>
                      <input 
                        type="number" 
                        value={sellerCosts.otherCosts}
                        onChange={(e) => setSellerCosts({...sellerCosts, otherCosts: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-widest"
            >
              Atrás
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              disabled={!propertyId}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Dossier'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValuationDossierForm;
