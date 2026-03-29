import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, Calendar, DollarSign, Home } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (client: Partial<Client>) => void;
  initialData?: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onConfirm, initialData }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        client_type: 'Comprador',
        lead_source: 'Referido',
        timeframe: '1-3 meses',
        needs_to_sell: false,
        financial_status: 'Pre-aprobado',
        family_composition: '',
        pets: '',
        occupation: '',
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-2xl font-black text-slate-800">
            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Información Básica</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Perfil del Negocio */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Perfil de Negocio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Cliente</label>
                  <select
                    value={formData.client_type || 'Comprador'}
                    onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="Comprador">Comprador</option>
                    <option value="Vendedor">Vendedor</option>
                    <option value="Inversor">Inversor</option>
                    <option value="Inquilino">Inquilino</option>
                    <option value="Propietario">Propietario (Alquiler)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Origen del Lead</label>
                  <select
                    value={formData.lead_source || 'Referido'}
                    onChange={e => setFormData({ ...formData, lead_source: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="Referido">Referido</option>
                    <option value="Portal Inmobiliario">Portal Inmobiliario</option>
                    <option value="Redes Sociales">Redes Sociales</option>
                    <option value="Cartel">Cartel</option>
                    <option value="Base de Datos">Base de Datos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Plazo (Timeframe)</label>
                  <select
                    value={formData.timeframe || '1-3 meses'}
                    onChange={e => setFormData({ ...formData, timeframe: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="Inmediato">Inmediato</option>
                    <option value="1-3 meses">1 a 3 meses</option>
                    <option value="3-6 meses">3 a 6 meses</option>
                    <option value="Más de 6 meses">Más de 6 meses</option>
                    <option value="Solo mirando">Solo mirando</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado Financiero</label>
                  <select
                    value={formData.financial_status || 'Pre-aprobado'}
                    onChange={e => setFormData({ ...formData, financial_status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="Efectivo disponible">Efectivo disponible</option>
                    <option value="Pre-aprobado">Crédito Pre-aprobado</option>
                    <option value="Necesita vender">Necesita vender para comprar</option>
                    <option value="Consultando crédito">Consultando crédito</option>
                    <option value="Desconocido">Desconocido</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.needs_to_sell || false}
                      onChange={e => setFormData({ ...formData, needs_to_sell: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">¿Necesita vender para comprar?</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Perfil Personal */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Perfil Personal (360°)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Composición Familiar</label>
                  <input
                    type="text"
                    value={formData.family_composition || ''}
                    onChange={e => setFormData({ ...formData, family_composition: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Ej. Pareja con 2 hijos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mascotas</label>
                  <input
                    type="text"
                    value={formData.pets || ''}
                    onChange={e => setFormData({ ...formData, pets: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Ej. 1 Perro mediano"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ocupación / Profesión</label>
                  <input
                    type="text"
                    value={formData.occupation || ''}
                    onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    placeholder="Ej. Abogado, Médico, Emprendedor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.birthdate || ''}
                    onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas Adicionales</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[100px]"
                  placeholder="Intereses, hobbies, requerimientos especiales..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!formData.name) return alert('El nombre es obligatorio');
              onConfirm(formData);
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientModal;
