import React, { useState, useMemo } from 'react';
import { ValuationDossier, Property } from '../types';
import { ArrowLeft, TrendingUp, MapPin, CheckCircle2, Circle, DollarSign, Calculator, BarChart3, Info, Target, Map, Edit2, Trash2, ArrowRightLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DossierComparablesMap from './DossierComparablesMap';
import DossierComparisonTable from './DossierComparisonTable';

interface ValuationDossierViewProps {
  dossier: ValuationDossier;
  subjectProperty: Property;
  allProperties: Property[];
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ValuationDossierView: React.FC<ValuationDossierViewProps> = ({ dossier, subjectProperty, allProperties, onBack, onEdit, onDelete }) => {
  const [simulatedPrice, setSimulatedPrice] = useState(dossier.targetPrice);
  const [chartMetric, setChartMetric] = useState<'pricePerSqft' | 'price'>('pricePerSqft');

  // 1. Calculate Net Sheet
  const exchangeRate = dossier.sellerCosts.exchangeRate || 1000;
  const priceInPesos = simulatedPrice * exchangeRate;
  const minimoNoImponible = 205332000;
  
  // Honorarios
  const commission = simulatedPrice * (dossier.sellerCosts.commissionPercentage / 100);
  
  // Impuesto de Sellos
  let taxesInPesos = 0;
  if (dossier.sellerCosts.isViviendaUnica) {
    const baseImponible = priceInPesos - minimoNoImponible;
    if (baseImponible > 0) {
      taxesInPesos = baseImponible * (dossier.sellerCosts.taxPercentage / 100);
    }
  } else {
    taxesInPesos = priceInPesos * (dossier.sellerCosts.taxPercentage / 100);
  }
  const taxes = taxesInPesos / exchangeRate;

  // ITI / Ganancias
  let iti = 0;
  if (!dossier.sellerCosts.boughtBefore2018 && !dossier.sellerCosts.isViviendaUnica) {
    const purchasePrice = dossier.sellerCosts.originalPurchasePrice || 0;
    if (purchasePrice > 0) {
      const ganancia = simulatedPrice - purchasePrice;
      if (ganancia > 0) {
        iti = ganancia * ((dossier.sellerCosts.itiPercentage || 15) / 100);
      }
    }
  }

  // Gastos de Escrituración
  let notaryPercentage = dossier.sellerCosts.notaryFeePercentage || 0.8;
  if (dossier.sellerCosts.hasTractoAbreviado) {
    notaryPercentage += 0.4;
  }
  const notaryPercentageFee = simulatedPrice * (notaryPercentage / 100);
  
  const fixedCosts = dossier.sellerCosts.notaryFees + dossier.sellerCosts.otherCosts + notaryPercentageFee;
  const netInPocket = simulatedPrice - commission - taxes - iti - fixedCosts;

  // 2. Prepare Chart Data
  const chartData = useMemo(() => {
    const data = dossier.comparables.map(comp => {
      const prop = allProperties.find(p => p.id === comp.propertyId);
      if (!prop) return null;
      const sqft = prop.coveredSqft || prop.sqft;
      const price = comp.type === 'sold' && comp.soldPrice ? comp.soldPrice : prop.price;
      return {
        id: comp.id,
        name: prop.title,
        shortName: prop.title.substring(0, 15) + '...',
        sqft: sqft,
        price: price,
        pricePerSqft: sqft > 0 ? Math.round(price / sqft) : 0,
        type: comp.type, // 'active' or 'sold'
      };
    }).filter(Boolean) as any[];

    // Add subject property
    const subjectSqft = subjectProperty.coveredSqft || subjectProperty.sqft;
    data.push({
      id: 'subject',
      name: 'Tu Propiedad',
      shortName: 'Tu Propiedad',
      sqft: subjectSqft,
      price: dossier.targetPrice,
      pricePerSqft: subjectSqft > 0 ? Math.round(dossier.targetPrice / subjectSqft) : 0,
      type: 'subject'
    });

    // Sort by the selected metric descending
    return data.sort((a, b) => b[chartMetric] - a[chartMetric]);
  }, [dossier, allProperties, subjectProperty, chartMetric]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold mb-1">{data.name}</p>
          <p className="text-slate-300">Precio Total: <span className="text-white font-bold">${data.price?.toLocaleString()}</span></p>
          <p className="text-slate-300">Valor m²: <span className="text-white font-bold">${data.pricePerSqft?.toLocaleString()}</span></p>
          <p className="text-slate-300">Superficie: <span className="text-white font-bold">{data.sqft} m²</span></p>
          <p className="text-slate-300 mt-1 uppercase tracking-widest text-[9px] font-black">
            {data.type === 'subject' ? 'Tu Propiedad' : data.type === 'sold' ? 'Vendido' : 'En Venta'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 print:pb-0 print:max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          {onEdit && (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          )}
          {onDelete && (
            <button 
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 font-bold text-xs uppercase tracking-widest transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Executive Summary (Hero) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8 print:break-inside-avoid">
        <div className="h-64 md:h-80 relative">
          <img src={subjectProperty.images[0]} alt={subjectProperty.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <div className="inline-block bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
              Análisis de Mercado
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{subjectProperty.title}</h1>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <MapPin className="w-4 h-4" /> {subjectProperty.address}
            </div>
          </div>
        </div>
        
        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-white">
          <div className="flex-1 w-full">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Valor de Mercado Sugerido</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">
                ${dossier.targetPrice.toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Rango: ${dossier.suggestedPriceMin.toLocaleString()} - ${dossier.suggestedPriceMax.toLocaleString()}
            </p>
          </div>
          <div className="w-full md:w-px h-px md:h-24 bg-slate-200"></div>
          <div className="flex-1 w-full flex flex-col md:items-end text-left md:text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiempo Estimado de Venta</p>
            <div className="text-4xl font-black text-indigo-600 tracking-tighter">
              {dossier.estimatedDaysOnMarket} <span className="text-xl text-indigo-400">días</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs">
              Basado en el ritmo de absorción actual del mercado para propiedades similares.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Market Analysis (Comparables) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-10 mb-8 print:break-inside-avoid">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Análisis de Comparables</h2>
            <p className="text-sm text-slate-500 font-medium">Propiedades similares en tu zona (Precio vs. m²)</p>
          </div>
        </div>

        {/* Map View */}
        <div className="mb-10">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Map className="w-4 h-4 text-indigo-600" /> Ubicación
          </h3>
          <DossierComparablesMap 
            subjectProperty={subjectProperty} 
            comparables={dossier.comparables} 
            allProperties={allProperties} 
          />
        </div>

        {/* Bar Chart */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Comparativa de Precios
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setChartMetric('pricePerSqft')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  chartMetric === 'pricePerSqft' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Valor m²
              </button>
              <button
                onClick={() => setChartMetric('price')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  chartMetric === 'price' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Precio Total
              </button>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="shortName" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tickFormatter={(value) => chartMetric === 'price' ? `$${(value / 1000)}k` : `$${value}`}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey={chartMetric} radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => {
                    let color = '#94a3b8'; // default
                    if (entry.type === 'subject') color = '#4f46e5'; // indigo-600
                    else if (entry.type === 'sold') color = '#10b981'; // emerald-500
                    else if (entry.type === 'active') color = '#f59e0b'; // amber-500
                    
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Tu Propiedad
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Vendidos (Realidad)
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div> En Venta (Competencia)
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" /> Comparación Detallada
          </h3>
          <DossierComparisonTable 
            subjectProperty={subjectProperty} 
            comparables={dossier.comparables} 
            allProperties={allProperties} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
        {/* Section 3: Seller Net Sheet */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-10 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Escenario Neto</h2>
              <p className="text-sm text-slate-500 font-medium">¿Cuánto dinero te queda en el bolsillo?</p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Simular Precio de Cierre
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-slate-400">$</span>
              <input 
                type="range" 
                min={dossier.suggestedPriceMin * 0.8} 
                max={dossier.suggestedPriceMax * 1.2} 
                step={1000}
                value={simulatedPrice}
                onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                className="flex-1 accent-emerald-500 print:hidden"
              />
              <span className="text-xl font-black text-slate-800 min-w-[100px] text-right print:text-left print:w-full">
                {simulatedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Precio de Venta</span>
              <span className="font-black text-slate-800">${simulatedPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Honorarios Inmobiliarios ({dossier.sellerCosts.commissionPercentage}%)</span>
              <span className="font-bold text-rose-500">-${commission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">
                Impuesto de Sellos ({dossier.sellerCosts.taxPercentage}%)
                {dossier.sellerCosts.isViviendaUnica && <span className="text-[10px] block text-slate-400">Con deducción vivienda única</span>}
              </span>
              <span className="font-bold text-rose-500">-${taxes.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            {iti > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">
                  ITI / Impuesto Cedular ({dossier.sellerCosts.itiPercentage || 15}%)
                  <span className="text-[10px] block text-slate-400">Sobre ganancia estimada</span>
                </span>
                <span className="font-bold text-rose-500">-${iti.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">
                Gastos de Escrituración ({dossier.sellerCosts.notaryFeePercentage || 0.8}%)
                {dossier.sellerCosts.hasTractoAbreviado && <span className="text-[10px] block text-slate-400">+0.4% Tracto Abreviado</span>}
              </span>
              <span className="font-bold text-rose-500">-${notaryPercentageFee.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            {(dossier.sellerCosts.notaryFees > 0 || dossier.sellerCosts.otherCosts > 0) && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-500">Gastos Fijos (Escribanía / Otros)</span>
                <span className="font-bold text-rose-500">-${(dossier.sellerCosts.notaryFees + dossier.sellerCosts.otherCosts).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Neto Estimado para el Vendedor</p>
                <p className="text-sm font-medium text-slate-500">Dinero limpio en mano</p>
              </div>
              <span className="text-4xl font-black text-emerald-500 tracking-tighter">
                ${netInPocket.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center">
              * Cálculo orientativo. Tipo de cambio aplicado: ${exchangeRate} (Dólar Blue).
            </p>
          </div>
        </div>

        {/* Section 4: Action Plan */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-10 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Plan de Marketing</h2>
              <p className="text-sm text-slate-500 font-medium">Nuestra estrategia para vender tu propiedad</p>
            </div>
          </div>

          <div className="space-y-4">
            {dossier.marketingPlan.map((action) => (
              <div key={action.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 transition-all group">
                <div className="mt-1">
                  {action.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">{action.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{action.description}</p>
                </div>
              </div>
            ))}
            {dossier.marketingPlan.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm font-medium">No hay acciones de marketing definidas aún.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuationDossierView;
