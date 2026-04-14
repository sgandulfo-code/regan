import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { Check, X, Shield, Loader2, Users, ListChecks } from 'lucide-react';
import StageTemplateManager from './StageTemplateManager';

const AdminView: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'templates'>('users');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    setIsLoading(true);
    const users = await dataService.getPendingUsers();
    setPendingUsers(users);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: 'active' | 'rejected') => {
    try {
      await dataService.updateUserStatus(id, status);
      await loadPendingUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error al actualizar el estado del usuario');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Administración</h1>
            <p className="text-slate-500 mt-1">Gestiona la plataforma y configuraciones globales</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <Users className="w-5 h-5" /> Usuarios Pendientes
            {pendingUsers.length > 0 && (
              <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-xs ml-1">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <ListChecks className="w-5 h-5" /> Plantillas de Etapas
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Solicitudes Pendientes ({pendingUsers.length})</h2>
            </div>
            
            {pendingUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No hay solicitudes de acceso pendientes en este momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingUsers.map(user => (
                  <div key={user.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>{user.email}</span>
                        {user.whatsappNumber && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{user.whatsappNumber}</span>
                          </>
                        )}
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'rejected')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.id, 'active')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-sm shadow-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                        Aprobar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <StageTemplateManager />
        )}
      </div>
    </div>
  );
};

export default AdminView;
