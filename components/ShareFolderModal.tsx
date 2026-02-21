
import React, { useState, useEffect } from 'react';
import { X, Send, UserPlus, Shield, Trash2, Loader2, Mail } from 'lucide-react';
import { SearchFolder, FolderShare, SharePermission } from '../types';
import { dataService } from '../services/dataService';

interface ShareFolderModalProps {
  folder: SearchFolder;
  onClose: () => void;
}

const ShareFolderModal: React.FC<ShareFolderModalProps> = ({ folder, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>(SharePermission.VIEW);
  const [shares, setShares] = useState<FolderShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadShares();
  }, [folder.id]);

  const loadShares = async () => {
    setIsLoading(true);
    const data = await dataService.getFolderShares(folder.id);
    setShares(data);
    setIsLoading(false);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    try {
      await dataService.shareFolder(folder.id, email.trim(), permission);
      setEmail('');
      await loadShares();
    } catch (error) {
      console.error('Error sharing folder:', error);
      alert('Error al compartir la carpeta');
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!window.confirm('¿Eliminar acceso para este usuario?')) return;
    await dataService.removeFolderShare(shareId);
    await loadShares();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${folder.color} flex items-center justify-center text-white shadow-sm`}>
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Compartir Carpeta</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{folder.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Invitar por email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
                  required
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as SharePermission)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-600"
                >
                  <option value={SharePermission.VIEW}>Ver</option>
                  <option value={SharePermission.EDIT}>Editar</option>
                  <option value={SharePermission.ADMIN}>Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSending || !email}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Invitación
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              Personas con acceso
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : shares.length === 0 ? (
                <p className="text-center py-4 text-sm text-slate-400 italic">No hay colaboradores aún</p>
              ) : (
                shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{share.userEmail}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{share.permission}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Los colaboradores podrán ver y/o editar los activos y documentos dentro de esta carpeta según los permisos asignados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareFolderModal;
