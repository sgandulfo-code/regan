
import React, { useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { Property, RenovationItem, UserRole } from '../types';
import { suggestRenovationCosts } from '../services/geminiService';
import { ICONS } from '../constants';

interface RenoCalcProps {
  property: Property;
  userRole: UserRole;
  onUpdate: (items: RenovationItem[]) => void;
}

const RenovationCalculator: React.FC<RenoCalcProps> = ({ property, userRole, onUpdate }) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const canEdit = userRole === UserRole.BUYER || userRole === UserRole.ARCHITECT;
  const isArchitect = userRole === UserRole.ARCHITECT;

  const handleAiSuggestions = async () => {
    if (!canEdit) return;
    setIsSuggesting(true);
    const suggestions = await suggestRenovationCosts(property.title, property.address);
    if (suggestions.length > 0) {
      const newItems: RenovationItem[] = suggestions.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...s
      }));
      onUpdate([...property.renovationCosts, ...newItems]);
    }
    setIsSuggesting(false);
  };

  const totalReno = property.renovationCosts.reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isArchitect ? 'ring-2 ring-orange-500/20 border-orange-200' : 'border-slate-200'}`}>
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            {ICONS.Calculator} Renovation Estimator
            {isArchitect && <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Expert Access</span>}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Property: {property.title}</p>
        </div>
        
        {canEdit && (
          <button
            onClick={handleAiSuggestions}
            disabled={isSuggesting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              isArchitect 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } disabled:opacity-50`}
          >
            {isSuggesting ? (
               <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : <Sparkles className="w-3 h-3" />}
            {isSuggesting ? 'Parsing...' : 'AI Suggestions'}
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="space-y-4 mb-6">
          {property.renovationCosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm italic">No technical items added yet.</p>
              {canEdit && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Use AI suggestions to populate typical costs</p>}
            </div>
          ) : (
            property.renovationCosts.map((item) => (
              <div key={item.id} className="group relative flex justify-between items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0 hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.category}</h4>
                  <p className="text-xs text-slate-500 max-w-[200px]">{item.description}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="font-mono font-bold text-slate-700">${item.estimatedCost.toLocaleString()}</span>
                  {isArchitect && (
                    <button className="text-[10px] text-orange-600 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity underline">
                      Edit Estimate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`rounded-2xl p-5 space-y-3 shadow-inner ${isArchitect ? 'bg-orange-50' : 'bg-slate-900 text-white'}`}>
          <div className="flex justify-between text-xs font-semibold opacity-70 uppercase tracking-widest">
            <span>Purchase Price</span>
            <span>${property.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold uppercase tracking-widest">
            <span>Renovation Budget</span>
            <span className={isArchitect ? 'text-orange-600' : 'text-orange-400'}>+${totalReno.toLocaleString()}</span>
          </div>
          <div className={`pt-3 border-t flex justify-between font-bold text-xl ${isArchitect ? 'border-orange-200 text-slate-800' : 'border-white/10 text-white'}`}>
            <span className="text-sm self-center">TOTAL PROJECT</span>
            <span>${(property.price + totalReno).toLocaleString()}</span>
          </div>
        </div>
        
        {!canEdit && (
          <div className="mt-4 flex items-center gap-2 justify-center text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-slate-100 py-2 rounded-lg">
            <Shield className="w-3 h-3" />
            Read-only Access
          </div>
        )}
      </div>
    </div>
  );
};

export default RenovationCalculator;
