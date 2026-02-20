
import React, { useState } from 'react';
import { FileText, Search, Filter, Download, ExternalLink, Trash2, Plus, Shield, Clock, File, MoreVertical, LayoutGrid, List, BookOpen, Layers, DollarSign, Activity, MapPin } from 'lucide-react';
import { PropertyDocument, DocCategory, SearchFolder, Property } from '../types';

interface DocumentVaultProps {
  documents: PropertyDocument[];
  folders: SearchFolder[];
  properties: Property[];
  onUpload: (doc: Omit<PropertyDocument, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ documents, folders, properties, onUpload, onDelete }) => {
  const [filter, setFilter] = useState<DocCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === 'All' || doc.category === filter;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDocIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-rose-500" />;
    if (type.includes('image')) return <File className="w-6 h-6 text-emerald-500" />;
    return <File className="w-6 h-6 text-slate-400" />;
  };

  const getCategoryColor = (cat: DocCategory) => {
    switch (cat) {
      case DocCategory.LEGAL: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case DocCategory.TECHNICAL: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case DocCategory.FINANCIAL: return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bóveda de Documentos</h2>
          <p className="text-slate-500 font-medium">Gestión inteligente de activos digitales y legales</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
          <Plus className="w-4 h-4" /> Subir Documento
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por nombre de archivo..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {/* Fixed: Explicitly cast the category array to string[] to resolve TypeScript unknown type error */}
          {(['All', ...Object.values(DocCategory)] as string[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {cat === 'All' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => {
            const prop = properties.find(p => p.id === doc.propertyId);
            const folder = folders.find(f => f.id === doc.folderId);
            return (
              <div key={doc.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    {getDocIcon(doc.fileType)}
                  </div>
                  <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{doc.name}</h4>
                  <div className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border mb-4 ${getCategoryColor(doc.category)}`}>
                    {doc.category}
                  </div>
                  
                  <div className="space-y-2 mb-8">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                      <Layers className="w-3 h-3 text-indigo-500" /> Tesis: <span className="text-slate-700">{folder?.name || 'General'}</span>
                    </p>
                    {prop && (
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-emerald-500" /> Activo: <span className="text-slate-700">{prop.title}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex gap-3">
                  <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 text-center">
            <BookOpen className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay documentos que coincidan con los criterios.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <h3 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
              <Shield className="w-8 h-8 text-indigo-400" /> 
              PropBrain SecureVault™
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Todos tus documentos técnicos y legales están encriptados y centralizados. Comparte acceso directo con tu arquitecto o escribano para agilizar los tiempos de cierre.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center min-w-[120px]">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Docs</p>
              <p className="text-2xl font-black">{documents.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center min-w-[120px]">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Verificados</p>
              <p className="text-2xl font-black">{Math.round(documents.length * 0.8)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;