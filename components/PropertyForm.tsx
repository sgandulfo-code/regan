
import React, { useState, useEffect } from 'react';
import { Sparkles, Map, Euro, Maximize, Home, Search as SearchIcon } from 'lucide-react';
import { parseSemanticSearch } from '../services/geminiService';
import { ICONS } from '../constants';
import { Property, PropertyStatus } from '../types';

interface PropertyFormProps {
  onAdd: (prop: Property) => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd }) => {
  const [semanticInput, setSemanticInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    url: '',
    address: '',
    price: 0,
    rooms: 0,
    bathrooms: 0,
    sqft: 0,
    status: PropertyStatus.WISHLIST,
    rating: 0,
    notes: '',
  });

  const handleSemanticParse = async () => {
    if (!semanticInput.trim()) return;
    setIsParsing(true);
    const result = await parseSemanticSearch(semanticInput);
    if (result) {
      setFormData(prev => ({
        ...prev,
        title: result.title || '',
        price: result.maxPrice || result.minPrice || 0,
        rooms: result.rooms || 0,
        bathrooms: result.bathrooms || 0,
        sqft: result.sqft || 0,
        address: result.location || '',
      }));
    }
    setIsParsing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: Property = {
      ...formData as Property,
      id: Math.random().toString(36).substr(2, 9),
      renovationCosts: [],
      images: [`https://picsum.photos/seed/${formData.title}/800/600`],
      createdAt: new Date().toISOString(),
    };
    onAdd(newProp);
    // Reset
    setFormData({
      title: '', url: '', address: '', price: 0, rooms: 0, bathrooms: 0, sqft: 0, status: PropertyStatus.WISHLIST, rating: 0, notes: '',
    });
    setSemanticInput('');
  };

  return (
    <div className="space-y-6">
      {/* AI Search Panel */}
      <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 bg-indigo-600">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-200" /> Smart AI Search
          </h2>
          <p className="text-indigo-100 text-sm mb-6">Describe the property you found and PropBrain will extract the technical details for you.</p>
          
          <div className="relative">
            <textarea
              className="w-full p-5 pr-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-indigo-200 focus:ring-2 focus:ring-white/50 focus:border-transparent min-h-[140px] outline-none transition-all shadow-inner"
              placeholder="Example: 'Spacious 3-bedroom attic with 2 baths near Retiro Park. It has a big terrace, roughly 110m2 and the asking price is 550,000€. Link is idealista.com/property123...'"
              value={semanticInput}
              onChange={(e) => setSemanticInput(e.target.value)}
            />
            <button
              onClick={handleSemanticParse}
              disabled={isParsing || !semanticInput}
              className="absolute right-4 bottom-4 bg-white text-indigo-600 p-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 disabled:bg-indigo-300 disabled:text-indigo-100 transition-all flex items-center gap-2"
            >
              {isParsing ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isParsing ? 'Analyzing...' : 'Extract Data'}
            </button>
          </div>
        </div>

        {/* Real-time Result Preview */}
        {formData.title && (
          <div className="bg-indigo-50 px-8 py-4 flex gap-6 overflow-x-auto border-b border-indigo-100 animate-in slide-in-from-top duration-300">
            {[
              { label: 'Location', val: formData.address || 'Pending', icon: <Map className="w-3 h-3" /> },
              { label: 'Price', val: `€${formData.price?.toLocaleString()}`, icon: <Euro className="w-3 h-3" /> },
              { label: 'Surface', val: `${formData.sqft}m²`, icon: <Maximize className="w-3 h-3" /> },
              { label: 'Layout', val: `${formData.rooms}r / ${formData.bathrooms}b`, icon: <Home className="w-3 h-3" /> },
            ].map((ext, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
                  {ext.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-tighter">{ext.label}</p>
                  <p className="text-sm font-bold text-indigo-900">{ext.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Property Title</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Give this property a name (e.g., The Sunny Loft)"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Source URL</label>
              <input
                type="url"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Paste the listing link here..."
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Price</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full p-3 pl-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
                <Euro className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Address (Validated by AI)</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Street, number, city..."
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rooms</label>
                <input
                  type="number"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  value={formData.rooms}
                  onChange={e => setFormData({...formData, rooms: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Baths</label>
                <input
                  type="number"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  value={formData.bathrooms}
                  onChange={e => setFormData({...formData, bathrooms: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sqft (m²)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  value={formData.sqft}
                  onChange={e => setFormData({...formData, sqft: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 text-lg"
          >
            {ICONS.Plus} Save to Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;
