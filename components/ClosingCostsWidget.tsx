import React, { useState, useEffect } from 'react';
import { TransactionType, Property } from '../types';
import { DollarSign, PieChart, Settings, Calculator, Info } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ClosingCostsWidgetProps {
  property: Property;
  transactionType: TransactionType;
}

interface CostItem {
  name: string;
  value: number;
  color: string;
  isPercentage: boolean;
  percentage?: number;
  editable?: boolean;
}

const ClosingCostsWidget: React.FC<ClosingCostsWidgetProps> = ({ property, transactionType }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default percentages
  const [agencyFeePct, setAgencyFeePct] = useState(0);
  const [notaryFeePct, setNotaryFeePct] = useState(1.5); // Escribanía
  const [stampTaxPct, setStampTaxPct] = useState(3.5); // Sellos
  const [otherCosts, setOtherCosts] = useState(0);
  const [deedValue, setDeedValue] = useState(property.price || 0);

  // Initialize agency fee based on transaction type
  useEffect(() => {
    switch (transactionType) {
      case TransactionType.COMPRA:
        setAgencyFeePct(4);
        break;
      case TransactionType.VENTA:
        setAgencyFeePct(3);
        break;
      case TransactionType.ALQUILER:
        setAgencyFeePct(4.15);
        break;
      case TransactionType.ALQUILER_TEMPORARIO:
        setAgencyFeePct(10); // Default, but editable
        break;
      default:
        setAgencyFeePct(4);
    }
  }, [transactionType]);

  // Calculations
  const price = property.price || 0;
  const renovationCost = property.renovationCosts?.reduce((sum, item) => sum + item.estimatedCost, 0) || 0;
  
  const agencyFee = (price * agencyFeePct) / 100;
  
  // Notary and Stamps usually only apply to Purchase/Sale
  const isPurchase = transactionType === TransactionType.COMPRA;
  const notaryFee = isPurchase ? (deedValue * notaryFeePct) / 100 : 0;
  const stampTax = isPurchase ? (deedValue * stampTaxPct) / 100 : 0;

  const totalCashNeeded = price + agencyFee + notaryFee + stampTax + renovationCost + otherCosts;

  const data = [
    { name: 'Propiedad', value: price, color: '#6366f1' }, // Indigo 500
    { name: 'Honorarios', value: agencyFee, color: '#f43f5e' }, // Rose 500
    ...(isPurchase ? [
      { name: 'Escribanía', value: notaryFee, color: '#10b981' }, // Emerald 500
      { name: 'Sellos', value: stampTax, color: '#f59e0b' }, // Amber 500
    ] : []),
    ...(renovationCost > 0 ? [{ name: 'Reformas', value: renovationCost, color: '#8b5cf6' }] : []), // Violet 500
    ...(otherCosts > 0 ? [{ name: 'Otros', value: otherCosts, color: '#64748b' }] : []), // Slate 500
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-none">Costo Real de Entrada</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Cash to Close</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
        >
          {isOpen ? <Settings className="w-5 h-5 text-indigo-500" /> : <Calculator className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="relative h-48 md:h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-slate-900">{formatCurrency(totalCashNeeded)}</span>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-bold text-slate-600">Precio Propiedad</span>
              </div>
              <span className="text-xs font-black text-slate-900">{formatCurrency(price)}</span>
            </div>

            {isOpen && isPurchase && (
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-xs font-bold text-slate-600">Valor Escrituración</span>
                </div>
                <input 
                  type="number" 
                  value={deedValue} 
                  onChange={(e) => setDeedValue(parseFloat(e.target.value))}
                  className="w-24 text-right text-xs font-black bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-600">Honorarios ({agencyFeePct}%)</span>
                  {isOpen && (
                    <input 
                      type="number" 
                      value={agencyFeePct} 
                      onChange={(e) => setAgencyFeePct(parseFloat(e.target.value))}
                      className="w-16 text-[10px] p-1 border rounded mt-1"
                    />
                  )}
                </div>
              </div>
              <span className="text-xs font-black text-slate-900">{formatCurrency(agencyFee)}</span>
            </div>

            {isPurchase && (
              <>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">Escribanía ({notaryFeePct}%)</span>
                      {isOpen && (
                        <input 
                          type="number" 
                          value={notaryFeePct} 
                          onChange={(e) => setNotaryFeePct(parseFloat(e.target.value))}
                          className="w-16 text-[10px] p-1 border rounded mt-1"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(notaryFee)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-600">Sellos ({stampTaxPct}%)</span>
                      {isOpen && (
                        <input 
                          type="number" 
                          value={stampTaxPct} 
                          onChange={(e) => setStampTaxPct(parseFloat(e.target.value))}
                          className="w-16 text-[10px] p-1 border rounded mt-1"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(stampTax)}</span>
                </div>
              </>
            )}

            {renovationCost > 0 && (
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="text-xs font-bold text-slate-600">Reformas Est.</span>
                </div>
                <span className="text-xs font-black text-slate-900">{formatCurrency(renovationCost)}</span>
              </div>
            )}
            
            {isOpen && (
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                  <span className="text-xs font-bold text-slate-600">Otros Gastos</span>
                </div>
                <input 
                  type="number" 
                  value={otherCosts} 
                  onChange={(e) => setOtherCosts(parseFloat(e.target.value))}
                  className="w-24 text-right text-xs font-black bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none"
                  placeholder="0"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {transactionType === TransactionType.ALQUILER_TEMPORARIO 
            ? "Los honorarios temporarios varían entre 5-20% según plazo y condiciones. Ajusta el porcentaje según corresponda."
            : "Cálculo estimado basado en porcentajes estándar de mercado. Los gastos de escrituración pueden variar según la jurisdicción."}
        </p>
      </div>
    </div>
  );
};

export default ClosingCostsWidget;
