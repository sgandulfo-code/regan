import React, { useState, useEffect } from 'react';
import { Property, TransactionType, SearchFolder } from '../types';
import { DollarSign, TrendingUp, TrendingDown, Calculator, ArrowRight, Building, FileText, Stamp, Briefcase, Search, Filter, MessageCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FinancialAnalysisViewProps {
  properties: Property[];
  folders: SearchFolder[];
}

const FinancialAnalysisView: React.FC<FinancialAnalysisViewProps> = ({ properties, folders }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  
  // Analysis State
  const [transactionPrice, setTransactionPrice] = useState(0);
  const [deedValue, setDeedValue] = useState(0);
  
  // Buy Side Percentages
  const [buyAgencyFeePct, setBuyAgencyFeePct] = useState(4);
  const [buyNotaryFeePct, setBuyNotaryFeePct] = useState(1.5);
  const [buyStampTaxPct, setBuyStampTaxPct] = useState(3.5);
  const [buyOtherPct, setBuyOtherPct] = useState(0);
  
  // Sell Side Percentages
  const [sellAgencyFeePct, setSellAgencyFeePct] = useState(3);
  const [sellTransferTaxPct, setSellTransferTaxPct] = useState(1.5); // ITI or similar
  const [sellNotaryFeePct, setSellNotaryFeePct] = useState(0); // Usually 0 for seller in some jurisdictions, but editable
  const [sellOtherPct, setSellOtherPct] = useState(0);

  // Shared Operation
  const [isSharedOperation, setIsSharedOperation] = useState(false);
  const [splitPct1, setSplitPct1] = useState(45);
  const [splitPct2, setSplitPct2] = useState(55);
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  useEffect(() => {
    if (selectedProperty) {
      setTransactionPrice(selectedProperty.price);
      setDeedValue(selectedProperty.price);
    }
  }, [selectedProperty]);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolderId === 'all' || p.folderId === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  if (!selectedProperty) {
    return (
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análisis de Operación</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Selecciona una propiedad para simular el cierre</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="all">Todas las Carpetas</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
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
                  {property.currency === 'ARS' ? '$' : 'U$S'} {property.price.toLocaleString()}
                </span>
              </div>
              {property.code && (
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5 block">{property.code}</span>
              )}
              <h3 className="font-black text-slate-900 text-lg mb-1 truncate">{property.title}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide truncate">{property.address}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Calculations
  
  // Buy Side
  const buyAgencyFee = (transactionPrice * buyAgencyFeePct) / 100;
  const buyNotaryFee = (deedValue * buyNotaryFeePct) / 100;
  const buyStampTax = (deedValue * buyStampTaxPct) / 100;
  const buyOtherCost = (transactionPrice * buyOtherPct) / 100;
  const totalBuyerCost = transactionPrice + buyAgencyFee + buyNotaryFee + buyStampTax + buyOtherCost;

  // Sell Side
  const sellAgencyFee = (transactionPrice * sellAgencyFeePct) / 100;
  const sellTransferTax = (deedValue * sellTransferTaxPct) / 100; // Usually on deed value
  const sellNotaryFee = (deedValue * sellNotaryFeePct) / 100;
  const sellOtherCost = (transactionPrice * sellOtherPct) / 100;
  const totalSellerExpenses = sellAgencyFee + sellTransferTax + sellNotaryFee + sellOtherCost;
  const netSellerProceeds = transactionPrice - totalSellerExpenses;

  // Agent Result
  const totalCommission = buyAgencyFee + sellAgencyFee;
  const sharedCommission = isSharedOperation ? totalCommission / 2 : totalCommission;
  const split1Result = sharedCommission * (splitPct1 / 100);
  const split2Result = sharedCommission * (splitPct2 / 100);

  // Metrics
  const buyerTotalPct = transactionPrice > 0 ? (totalBuyerCost / transactionPrice) * 100 : 0;
  const buyerTotalPerSqft = selectedProperty.sqft > 0 ? totalBuyerCost / selectedProperty.sqft : 0;
  
  const sellerNetPct = transactionPrice > 0 ? (netSellerProceeds / transactionPrice) * 100 : 0;
  const sellerNetPerSqft = selectedProperty.sqft > 0 ? netSellerProceeds / selectedProperty.sqft : 0;


  const formatCurrency = (val: number, currency: 'USD' | 'ARS' = 'USD') => {
    const symbol = currency === 'ARS' ? '$' : 'U$S';
    const formatted = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    return `${symbol} ${formatted}`;
  };

  const handleShare = (type: 'buyer' | 'seller') => {
    if (!selectedProperty) return;

    let text = '';
    
    if (type === 'buyer') {
      text = `*Análisis de Compra - ${selectedProperty.title}*\n` +
             `📍 ${selectedProperty.address}\n\n` +
             `Precio Propiedad: ${formatCurrency(transactionPrice, selectedProperty.currency)}\n` +
             `------------------\n` +
             `Gastos:\n` +
             `• Honorarios (${buyAgencyFeePct}%): ${formatCurrency(buyAgencyFee, selectedProperty.currency)}\n` +
             `• Escribanía (${buyNotaryFeePct}%): ${formatCurrency(buyNotaryFee, selectedProperty.currency)}\n` +
             `• Sellos (${buyStampTaxPct}%): ${formatCurrency(buyStampTax, selectedProperty.currency)}\n` +
             `• Otros: ${formatCurrency(buyOtherCost, selectedProperty.currency)}\n` +
             `------------------\n` +
             `*TOTAL A DESEMBOLSAR: ${formatCurrency(totalBuyerCost, selectedProperty.currency)}*\n` +
             `(${buyerTotalPct.toFixed(2)}% sobre valor - ${formatCurrency(buyerTotalPerSqft, selectedProperty.currency)}/m²)`;
    } else {
      text = `*Análisis de Venta - ${selectedProperty.title}*\n` +
             `📍 ${selectedProperty.address}\n\n` +
             `Precio Venta: ${formatCurrency(transactionPrice, selectedProperty.currency)}\n` +
             `------------------\n` +
             `Descuentos:\n` +
             `• Honorarios (${sellAgencyFeePct}%): -${formatCurrency(sellAgencyFee, selectedProperty.currency)}\n` +
             `• ITI/Impuestos (${sellTransferTaxPct}%): -${formatCurrency(sellTransferTax, selectedProperty.currency)}\n` +
             `• Escritura (${sellNotaryFeePct}%): -${formatCurrency(sellNotaryFee, selectedProperty.currency)}\n` +
             `• Otros: -${formatCurrency(sellOtherCost, selectedProperty.currency)}\n` +
             `------------------\n` +
             `*NETO A RECIBIR: ${formatCurrency(netSellerProceeds, selectedProperty.currency)}*\n` +
             `(${sellerNetPct.toFixed(2)}% del valor - ${formatCurrency(sellerNetPerSqft, selectedProperty.currency)}/m²)`;
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const CostRow = ({ label, value, pct, onChangePct, color = "slate", isNegative = false }: any) => (
    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-600">{label}</span>
          {onChangePct && (
            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <input 
                type="number" 
                step="0.01"
                value={pct} 
                onChange={(e) => onChangePct(parseFloat(e.target.value))}
                className="w-12 text-[9px] bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none p-0 text-center"
              />
              <span className="text-[9px]">%</span>
            </div>
          )}
        </div>
      </div>
      <span className={`text-xs font-black ${isNegative ? 'text-rose-500' : 'text-slate-900'}`}>
        {isNegative ? '-' : ''}{formatCurrency(value, selectedProperty?.currency)}
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setSelectedPropertyId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowRight className="w-6 h-6 rotate-180 text-slate-400" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análisis de Operación</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">{selectedProperty.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COMMON INPUTS */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
           <div className="flex-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Precio de Operación (Real)</label>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={transactionPrice} 
                  onChange={(e) => setTransactionPrice(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xl font-black text-slate-900 outline-none"
                />
              </div>
           </div>
           <div className="flex-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Escrituración (Fiscal)</label>
               <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <FileText className="w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={deedValue} 
                  onChange={(e) => setDeedValue(parseFloat(e.target.value))}
                  className="w-full bg-transparent text-xl font-bold text-slate-700 outline-none"
                />
              </div>
           </div>
        </div>

        {/* BUYER SIDE */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Lado Comprador</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total a Desembolsar</p>
              </div>
            </div>
            <button 
              onClick={() => handleShare('buyer')}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors"
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Precio Propiedad</span>
                <span className="text-xs font-black text-slate-900">{formatCurrency(transactionPrice, selectedProperty.currency)}</span>
              </div>
              <CostRow label="Honorarios Inmobiliaria" value={buyAgencyFee} pct={buyAgencyFeePct} onChangePct={setBuyAgencyFeePct} color="rose" />
              <CostRow label="Escribanía (s/ Escritura)" value={buyNotaryFee} pct={buyNotaryFeePct} onChangePct={setBuyNotaryFeePct} color="emerald" />
              <CostRow label="Impuesto Sellos (s/ Escritura)" value={buyStampTax} pct={buyStampTaxPct} onChangePct={setBuyStampTaxPct} color="amber" />
              <CostRow label="Otros Gastos" value={buyOtherCost} pct={buyOtherPct} onChangePct={setBuyOtherPct} color="slate" />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Operación</span>
                <span className="text-3xl font-black text-slate-900">{formatCurrency(totalBuyerCost, selectedProperty.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{buyerTotalPct.toFixed(2)}% del valor</span>
                <span>{formatCurrency(buyerTotalPerSqft, selectedProperty.currency)} / m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* SELLER SIDE */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Lado Vendedor</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neto a Recibir</p>
              </div>
            </div>
            <button 
              onClick={() => handleShare('seller')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600">Precio Venta</span>
                <span className="text-xs font-black text-slate-900">{formatCurrency(transactionPrice, selectedProperty.currency)}</span>
              </div>
              <CostRow label="Honorarios Inmobiliaria" value={sellAgencyFee} pct={sellAgencyFeePct} onChangePct={setSellAgencyFeePct} color="rose" isNegative />
              <CostRow label="ITI / Impuestos (s/ Escritura)" value={sellTransferTax} pct={sellTransferTaxPct} onChangePct={setSellTransferTaxPct} color="amber" isNegative />
              <CostRow label="Gastos Escritura" value={sellNotaryFee} pct={sellNotaryFeePct} onChangePct={setSellNotaryFeePct} color="emerald" isNegative />
              <CostRow label="Otros Gastos" value={sellOtherCost} pct={sellOtherPct} onChangePct={setSellOtherPct} color="slate" isNegative />
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Neto en Mano</span>
                <span className="text-3xl font-black text-indigo-600">{formatCurrency(netSellerProceeds, selectedProperty.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{sellerNetPct.toFixed(2)}% del valor</span>
                <span>{formatCurrency(sellerNetPerSqft, selectedProperty.currency)} / m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* AGENT RESULT */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <Briefcase className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Resultado del Agente</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Total Honorarios (Comprador + Vendedor)</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comisión Total</p>
              <p className="text-5xl font-black text-emerald-400">
                {formatCurrency(totalCommission, selectedProperty.currency)}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="sharedOperation"
                  checked={isSharedOperation}
                  onChange={(e) => setIsSharedOperation(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="sharedOperation" className="text-sm font-bold text-slate-300 cursor-pointer">
                  Operación Compartida (Divide el total en 2)
                </label>
              </div>
              {isSharedOperation && (
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Repartir</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {formatCurrency(sharedCommission, selectedProperty.currency)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400">Parte 1</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={splitPct1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitPct1(val);
                        setSplitPct2(100 - val);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-sm font-bold text-white outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-400 text-sm font-bold">%</span>
                  </div>
                </div>
                <p className="text-2xl font-black text-white text-right">
                  {formatCurrency(split1Result, selectedProperty.currency)}
                </p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400">Parte 2</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={splitPct2}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitPct2(val);
                        setSplitPct1(100 - val);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-sm font-bold text-white outline-none focus:border-emerald-500"
                    />
                    <span className="text-slate-400 text-sm font-bold">%</span>
                  </div>
                </div>
                <p className="text-2xl font-black text-white text-right">
                  {formatCurrency(split2Result, selectedProperty.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysisView;
