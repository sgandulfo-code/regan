import React, { useState, useEffect } from 'react';
import { Property, TransactionType } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Calculator, ArrowRight, Building, FileText, Stamp, Briefcase, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FinancialAnalysisViewProps {
  properties: Property[];
}

const FinancialAnalysisView: React.FC<FinancialAnalysisViewProps> = ({ properties }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Analysis State
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [deedValue, setDeedValue] = useState(0);
  
  // Buy Side Percentages
  const [buyAgencyFeePct, setBuyAgencyFeePct] = useState(4);
  const [buyNotaryFeePct, setBuyNotaryFeePct] = useState(1.5);
  const [buyStampTaxPct, setBuyStampTaxPct] = useState(3.5);
  
  // Sell Side Percentages
  const [sellAgencyFeePct, setSellAgencyFeePct] = useState(3);
  const [sellTransferTaxPct, setSellTransferTaxPct] = useState(1.5); // ITI or similar
  const [sellNotaryFeePct, setSellNotaryFeePct] = useState(0); // Usually 0 for seller in some jurisdictions, but editable
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  useEffect(() => {
    if (selectedProperty) {
      setPurchasePrice(selectedProperty.price);
      setSalePrice(selectedProperty.price * 1.3); // Default estimated sale price (+30%)
      setDeedValue(selectedProperty.price);
    }
  }, [selectedProperty]);

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedProperty) {
    return (
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análisis Financiero</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Selecciona una propiedad para analizar costos de compra y venta</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar propiedad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => (
            <button 
              key={property.id}
              onClick={() => setSelectedPropertyId(property.id)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                  <Building className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  ${property.price.toLocaleString()}
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-1 truncate">{property.title}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide truncate">{property.address}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Calculations
  const renovationCost = selectedProperty.renovationCosts?.reduce((sum, item) => sum + item.estimatedCost, 0) || 0;
  
  // Buy Side
  const buyAgencyFee = (purchasePrice * buyAgencyFeePct) / 100;
  const buyNotaryFee = (deedValue * buyNotaryFeePct) / 100;
  const buyStampTax = (deedValue * buyStampTaxPct) / 100;
  const totalPurchaseCost = purchasePrice + buyAgencyFee + buyNotaryFee + buyStampTax + renovationCost;

  // Sell Side
  const sellAgencyFee = (salePrice * sellAgencyFeePct) / 100;
  const sellTransferTax = (deedValue * sellTransferTaxPct) / 100; // Usually on deed value
  const sellNotaryFee = (deedValue * sellNotaryFeePct) / 100;
  const totalSaleExpenses = sellAgencyFee + sellTransferTax + sellNotaryFee;
  const netSaleProceeds = salePrice - totalSaleExpenses;

  const potentialProfit = netSaleProceeds - totalPurchaseCost;
  const roi = (potentialProfit / totalPurchaseCost) * 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const CostRow = ({ label, value, pct, onChangePct, color = "slate" }: any) => (
    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-600">{label}</span>
          {onChangePct && (
            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <input 
                type="number" 
                value={pct} 
                onChange={(e) => onChangePct(parseFloat(e.target.value))}
                className="w-10 text-[9px] bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none p-0 text-center"
              />
              <span className="text-[9px]">%</span>
            </div>
          )}
        </div>
      </div>
      <span className="text-xs font-black text-slate-900">{formatCurrency(value)}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setSelectedPropertyId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowRight className="w-6 h-6 rotate-180 text-slate-400" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análisis Financiero</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">{selectedProperty.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BUY SIDE COLUMN */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Gastos de Compra</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inversión Total Requerida</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Precio de Compra</label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={purchasePrice} 
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Escrituración</label>
               <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={deedValue} 
                  onChange={(e) => setDeedValue(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xl font-bold text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <CostRow label="Honorarios Inmobiliaria" value={buyAgencyFee} pct={buyAgencyFeePct} onChangePct={setBuyAgencyFeePct} color="rose" />
              <CostRow label="Escribanía (s/ Escritura)" value={buyNotaryFee} pct={buyNotaryFeePct} onChangePct={setBuyNotaryFeePct} color="emerald" />
              <CostRow label="Impuesto Sellos (s/ Escritura)" value={buyStampTax} pct={buyStampTaxPct} onChangePct={setBuyStampTaxPct} color="amber" />
              <CostRow label="Reformas Estimadas" value={renovationCost} color="violet" />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total a Invertir</span>
                <span className="text-3xl font-black text-slate-900">{formatCurrency(totalPurchaseCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SELL SIDE COLUMN */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Gastos de Venta</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escenario de Salida / Venta</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Precio de Venta Estimado</label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={salePrice} 
                  onChange={(e) => setSalePrice(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <CostRow label="Honorarios Inmobiliaria" value={sellAgencyFee} pct={sellAgencyFeePct} onChangePct={setSellAgencyFeePct} color="rose" />
              <CostRow label="ITI / Impuestos (s/ Escritura)" value={sellTransferTax} pct={sellTransferTaxPct} onChangePct={setSellTransferTaxPct} color="amber" />
              <CostRow label="Gastos Escritura Vendedor" value={sellNotaryFee} pct={sellNotaryFeePct} onChangePct={setSellNotaryFeePct} color="emerald" />
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-end opacity-60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gastos Venta</span>
                <span className="text-lg font-black text-rose-500">-{formatCurrency(totalSaleExpenses)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Neto a Recibir</span>
                <span className="text-3xl font-black text-indigo-600">{formatCurrency(netSaleProceeds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY / ROI */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Calculator className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Resultado de la Operación</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Neto Venta - Total Inversión</p>
            </div>
          </div>
          
          <div className="flex items-center gap-12">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit / Loss</p>
              <p className={`text-4xl font-black ${potentialProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {potentialProfit >= 0 ? '+' : ''}{formatCurrency(potentialProfit)}
              </p>
            </div>
            <div className="text-right pl-12 border-l border-white/10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ROI Estimado</p>
              <p className={`text-4xl font-black ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {roi.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysisView;
