import React, { useState } from 'react';
import { Property, SearchFolder, PropertyStatus } from '../types';
import { X, Save, Building, MapPin, Ruler, DollarSign, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface AppraisalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  folderId: string;
  userId: string;
}

const AppraisalFormModal: React.FC<AppraisalFormModalProps> = ({ isOpen, onClose, onSaved, folderId, userId }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({
    title: 'Propiedad a Tasar',
    url: '',
    address: '',
    price: 0,
    environments: 1,
    rooms: 1,
    bathrooms: 1,
    sqft: 0,
    coveredSqft: 0,
    uncoveredSqft: 0,
    age: 0,
    status: PropertyStatus.SUGERIDA,
    rating: 0,
    isSubjectProperty: true,
    propertyType: 'Departamento',
    disposition: 'Frente',
    orientation: 'Norte',
    condition: 'Muy Bueno',
    luminosity: 'Buena',
    expenses: 0,
    amenities: [],
    images: [],
    saleReason: '',
    urgency: 'Media',
    ownerExpectedPrice: 0
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.createProperty({
        ...formData,
        folderId
      }, userId);
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving appraisal property:', error);
      alert('Error al guardar la propiedad');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Ficha Técnica de Captación</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Propiedad a Tasar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Ubicación */}
          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" /> Ubicación Estratégica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dirección / Barrio</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" placeholder="Ej. Av. Libertador 1234, Palermo" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Disposición</label>
                <select name="disposition" value={formData.disposition} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="Frente">Frente</option>
                  <option value="Contrafrente">Contrafrente</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Interno">Interno</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Orientación</label>
                <select name="orientation" value={formData.orientation} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="Norte">Norte</option>
                  <option value="Sur">Sur</option>
                  <option value="Este">Este</option>
                  <option value="Oeste">Oeste</option>
                  <option value="Noreste">Noreste</option>
                  <option value="Noroeste">Noroeste</option>
                  <option value="Sureste">Sureste</option>
                  <option value="Suroeste">Suroeste</option>
                </select>
              </div>
            </div>
          </section>

          {/* Tipología y Superficies */}
          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-indigo-500" /> Tipología y Superficies
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Propiedad</label>
                <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="Departamento">Departamento</option>
                  <option value="Casa">Casa</option>
                  <option value="PH">PH</option>
                  <option value="Lote">Lote</option>
                  <option value="Local">Local</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">M² Totales</label>
                <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">M² Cubiertos</label>
                <input type="number" name="coveredSqft" value={formData.coveredSqft} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ambientes</label>
                <input type="number" name="environments" value={formData.environments} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dormitorios</label>
                <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Baños</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Antigüedad (Años)</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </section>

          {/* Estado y Gastos */}
          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" /> Estado y Gastos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="A Estrenar">A Estrenar</option>
                  <option value="Excelente">Excelente</option>
                  <option value="Muy Bueno">Muy Bueno</option>
                  <option value="Bueno">Bueno</option>
                  <option value="A Refaccionar">A Refaccionar</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Luminosidad</label>
                <select name="luminosity" value={formData.luminosity} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="Excelente">Excelente</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Mala">Mala</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Expensas ($)</label>
                <input type="number" name="expenses" value={formData.expenses} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </section>

          {/* Expectativas */}
          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-500" /> Expectativas del Propietario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo de Venta</label>
                <select name="saleReason" value={formData.saleReason} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="">Seleccionar...</option>
                  <option value="Achicarse">Achicarse</option>
                  <option value="Agrandarse">Agrandarse</option>
                  <option value="Viaje/Mudanza">Viaje/Mudanza</option>
                  <option value="Sucesión">Sucesión</option>
                  <option value="Inversión">Inversión</option>
                  <option value="Divorcio">Divorcio</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Urgencia</label>
                <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <option value="Alta">Alta (Vender ya)</option>
                  <option value="Media">Media (Normal)</option>
                  <option value="Baja">Baja (Sin apuro)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Pretendido (USD)</label>
                <input type="number" name="ownerExpectedPrice" value={formData.ownerExpectedPrice} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : (
              <>
                <Save className="w-4 h-4" /> Guardar Ficha
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppraisalFormModal;
