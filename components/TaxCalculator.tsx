import React, { useState } from 'react';
import { Calculator, Info, ChevronDown, ChevronUp } from 'lucide-react';

const TaxCalculator: React.FC = () => {
  const [mode, setMode] = useState<'seller' | 'buyer'>('seller');
  const [priceUSD, setPriceUSD] = useState<number | ''>('');
  const [exchangeRate, setExchangeRate] = useState<number>(1415);
  
  // Seller states
  const [sellerViviendaUnica, setSellerViviendaUnica] = useState(false);
  const [sellerTracto, setSellerTracto] = useState(false);
  const [sellerBoughtBefore2018, setSellerBoughtBefore2018] = useState(false);
  const [sellerPurchasePriceUSD, setSellerPurchasePriceUSD] = useState<number | ''>('');

  // Buyer states
  const [buyerViviendaUnica, setBuyerViviendaUnica] = useState(false);

  // Accordion state
  const [expandedNote, setExpandedNote] = useState<number | null>(null);

  // Constants
  const MINIMO_NO_IMPONIBLE = 205332000;

  // Calculations
  const price = Number(priceUSD) || 0;
  const pricePesos = price * exchangeRate;

  // Seller calculations
  const sellerBaseSellos = sellerViviendaUnica ? Math.max(0, pricePesos - MINIMO_NO_IMPONIBLE) : pricePesos;
  const sellerSellos = sellerBaseSellos * 0.0175;
  
  const sellerFactorEscritura = sellerTracto ? 0.012 : 0.008;
  const sellerEscritura = pricePesos * sellerFactorEscritura;

  let sellerITI = 0;
  if (!sellerBoughtBefore2018 && !sellerViviendaUnica) {
    const purchasePrice = Number(sellerPurchasePriceUSD) || 0;
    const gananciaPesos = (price - purchasePrice) * exchangeRate;
    if (gananciaPesos > 0) {
      sellerITI = gananciaPesos * 0.15;
    }
  }

  const sellerTotalPesos = sellerSellos + sellerEscritura + sellerITI;
  const sellerTotalUSD = exchangeRate > 0 ? sellerTotalPesos / exchangeRate : 0;

  // Buyer calculations
  const buyerBaseSellos = buyerViviendaUnica ? Math.max(0, pricePesos - MINIMO_NO_IMPONIBLE) : pricePesos;
  const buyerSellos = buyerBaseSellos * 0.0175;
  const buyerHonorarios = pricePesos * 0.02;
  const buyerGastosEscritura = pricePesos * 0.008;

  const buyerTotalPesos = buyerSellos + buyerHonorarios + buyerGastosEscritura;
  const buyerTotalUSD = exchangeRate > 0 ? buyerTotalPesos / exchangeRate : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  };

  const toggleNote = (index: number) => {
    setExpandedNote(expandedNote === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-[#08415c]" />
          Calculadora de Impuestos y Costos de Escritura
        </h1>
        <p className="text-slate-500 text-lg">
          Calcula fácilmente los impuestos y costos de escritura para compradores y vendedores de propiedades.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E9AFA3]/50 overflow-hidden mb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E9AFA3] to-[#E2A79A]"></div>
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">
              Ingresá el precio en dólares del inmueble
            </label>
            <p className="text-sm text-slate-500 mb-4">
              Ingresá el valor para obtener una estimación automática de los impuestos y gastos asociados a la operación.
            </p>
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">US$</span>
              <input
                type="number"
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej: 120000"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-[#E9AFA3] focus:ring-4 focus:ring-[#E9AFA3]/20 transition-all"
              />
            </div>
          </div>

          <div className="w-full md:w-auto bg-[#fff0ed] p-6 rounded-xl border border-[#E9AFA3]/30">
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Tipo de cambio aplicable (Dólar Blue):</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg bg-white text-base font-bold focus:outline-none focus:border-[#E9AFA3]"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Precio convertido a pesos:</p>
              <p className="text-2xl font-black text-slate-900">${formatCurrency(pricePesos)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* SELLER COLUMN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-[#08415c] px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-white uppercase tracking-wider">Cálculo del Vendedor</h3>
          </div>
          
          <div className="flex-1">
            {/* Sellos */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-8">
                  <h4 className="font-bold text-slate-900 uppercase mb-2">Impuesto a Sellos</h4>
                  <p className="text-sm text-slate-600 mb-1">
                    1,75% sobre el precio del inmueble, menos la deducción por mínimo no imponible si aplica.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-slate-500 uppercase mb-1">Costos</p>
                  <p className="text-lg font-bold text-slate-900">${formatCurrency(sellerSellos)}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellerViviendaUnica}
                    onChange={(e) => setSellerViviendaUnica(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#E9AFA3] rounded border-slate-300 focus:ring-[#E9AFA3]"
                  />
                  <span className="text-sm text-slate-700">
                    <strong className="block mb-1">Deducción por vivienda única</strong>
                    Aplica la deducción del mínimo no imponible ($205.332.000).
                  </span>
                </label>
              </div>
            </div>

            {/* Escritura */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-8">
                  <h4 className="font-bold text-slate-900 uppercase mb-2">Gastos de Escritura</h4>
                  <p className="text-sm text-slate-600 mb-1">
                    Estimación orientativa: 0,8% del precio de venta.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-slate-500 uppercase mb-1">Costos</p>
                  <p className="text-lg font-bold text-slate-900">${formatCurrency(sellerEscritura)}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellerTracto}
                    onChange={(e) => setSellerTracto(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#E9AFA3] rounded border-slate-300 focus:ring-[#E9AFA3]"
                  />
                  <span className="text-sm text-slate-700">
                    <strong className="block mb-1">Tracto abreviado</strong>
                    Suma un 0,4% al costo de escritura.
                  </span>
                </label>
              </div>
            </div>

            {/* Impuesto Cedular */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="pr-8">
                  <h4 className="font-bold text-slate-900 uppercase mb-2">Impuesto Cedular (EX ITI)</h4>
                  <div className="mb-4">
                    <label className="block text-sm text-slate-700 mb-2">Valor de adquisición (US$):</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">US$</span>
                      <input
                        type="number"
                        value={sellerPurchasePriceUSD}
                        onChange={(e) => setSellerPurchasePriceUSD(e.target.value ? Number(e.target.value) : '')}
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg font-bold focus:outline-none focus:border-[#E9AFA3] focus:ring-2 focus:ring-[#E9AFA3]/20"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    15% sobre la ganancia neta obtenida.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-slate-500 uppercase mb-1">Costos</p>
                  <p className="text-xl font-black text-[#08415c]">${formatCurrency(sellerITI)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sellerBoughtBefore2018}
                      onChange={(e) => setSellerBoughtBefore2018(e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#E9AFA3] rounded border-slate-300 focus:ring-[#E9AFA3]"
                    />
                    <span className="text-sm text-slate-700">
                      <strong className="block mb-1">Exención por fecha de compra</strong>
                      Adquirido antes del 1 de enero de 2018.
                    </span>
                  </label>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sellerViviendaUnica}
                      onChange={(e) => setSellerViviendaUnica(e.target.checked)}
                      className="mt-1 w-4 h-4 text-[#E9AFA3] rounded border-slate-300 focus:ring-[#E9AFA3]"
                    />
                    <span className="text-sm text-slate-700">
                      <strong className="block mb-1">Exención por vivienda única</strong>
                      Vivienda única, familiar y de uso permanente.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Totals Seller */}
          <div className="p-6 bg-[#fff0ed] border-t border-[#E9AFA3]/30 mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-900 uppercase text-sm">Total Impuestos y Costos:</span>
              <span className="text-xl font-black text-[#08415c]">${formatCurrency(sellerTotalPesos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 uppercase text-sm">Total Reflejado en Dólares:</span>
              <span className="text-xl font-black text-[#08415c]">US$ {formatCurrency(sellerTotalUSD)}</span>
            </div>
          </div>
        </div>

        {/* BUYER COLUMN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-[#08415c] px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-white uppercase tracking-wider">Cálculo del Comprador</h3>
          </div>
          
          <div className="flex-1">
            {/* Sellos */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-8">
                  <h4 className="font-bold text-slate-900 uppercase mb-2">Impuesto a Sellos</h4>
                  <p className="text-sm text-slate-600 mb-1">
                    1,75% sobre el precio del inmueble, menos la deducción por mínimo no imponible si aplica.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-slate-500 uppercase mb-1">Costos</p>
                  <p className="text-lg font-bold text-slate-900">${formatCurrency(buyerSellos)}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buyerViviendaUnica}
                    onChange={(e) => setBuyerViviendaUnica(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#E9AFA3] rounded border-slate-300 focus:ring-[#E9AFA3]"
                  />
                  <span className="text-sm text-slate-700">
                    <strong className="block mb-1">Deducción por vivienda única</strong>
                    Aplica la deducción del mínimo no imponible ($205.332.000).
                  </span>
                </label>
              </div>
            </div>

            {/* Gastos de Escritura */}
            <div className="p-6">
              <h4 className="font-bold text-slate-900 uppercase mb-4">Gastos de Escritura</h4>
              
              <div className="flex justify-between items-start mb-6">
                <div className="pr-8">
                  <p className="text-sm font-bold text-slate-700 mb-1">Honorarios del Escribano</p>
                  <p className="text-sm text-slate-600">
                    En torno al 2% del precio de venta.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-lg font-bold text-slate-900">${formatCurrency(buyerHonorarios)}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-start">
                <div className="pr-8">
                  <p className="text-sm font-bold text-slate-700 mb-1">Gastos varios de escritura</p>
                  <p className="text-sm text-slate-600">
                    Estimación orientativa: 0,8% del precio de venta.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-lg font-bold text-slate-900">${formatCurrency(buyerGastosEscritura)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Totals Buyer */}
          <div className="p-6 bg-[#fff0ed] border-t border-[#E9AFA3]/30 mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-900 uppercase text-sm">Total Impuestos y Costos:</span>
              <span className="text-xl font-black text-[#08415c]">${formatCurrency(buyerTotalPesos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 uppercase text-sm">Total Reflejado en Dólares:</span>
              <span className="text-xl font-black text-[#08415c]">US$ {formatCurrency(buyerTotalUSD)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes / Accordion */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#08415c]" />
            Notas y Aclaraciones
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              title: "HONORARIOS PROFESIONALES DEL AGENTE INMOBILIARIO",
              content: "Los honorarios inmobiliarios se calculan como un porcentaje sobre el valor de venta de la propiedad, acordados con la inmobiliaria interviniente en el momento de la autorización de venta o al firmar la reserva de compra. Corresponden a un 2% a 3% más IVA del valor de la operación para la parte vendedora (según el precio del inmueble) y un 4% más IVA para la parte compradora."
            },
            {
              title: "1 – IMPUESTO CEDULAR",
              content: "Desde la sanción de la Ley de Bases en 2024 se ha eliminado el Impuesto a la Transferencia de Inmuebles que representaba el 1,5% del valor de escrituración y se abonaba si el propietario tenía más de un inmueble. Para la venta de propiedades adquiridas con posterioridad al 1 de enero de 2018 (cuando la operación es realizada por una persona física o sucesión indivisa) este impuesto ya se había modificado por el impuesto Cedular (a la “Ganancia” obtenida en la venta del inmueble). Este impuesto continúa vigente y resulta de calcular un 15% de la diferencia entre el costo de compra y el de venta (descontados los impuestos y costos relacionados a la compraventa). El pago debe realizarse en el período fiscal siguiente al de la venta, y en oportunidad del vencimiento de las declaraciones juradas anuales. Según la Resolución General 4190-E, el escribano no está obligado a retener este impuesto al momento de la escritura. Por lo tanto, es responsabilidad del vendedor liquidar y pagar el tributo en los plazos establecidos por la normativa vigente. En resumen, la venta de propiedades adquiridas antes del 1 de enero de 2018 actualmente no pagan ningún impuesto a la transferencia, en cambio las adquiridas con posterioridad a esa fecha pagan el Impuesto Cedular al momento de la escritura. Aclaración: Esta herramienta está diseñada para propiedades que se encuentran a nombre de personas físicas, en caso de tratarse de persona jurídica, el impuesto a la transferencia no se aplica, sino que en su lugar el Escribano retendrá un 3% a cuenta del Impuesto a las Ganancias que pague la sociedad por esta venta, pero dependerá de otros factores relacionados con la empresa propietaria del bien. Por otro lado, continúa la exención de este impuesto para propiedades que son vivienda única, familiar y de uso permanente (el inmueble vendido debe ser reemplazado por otro antes del año)."
            },
            {
              title: "2 – IMPUESTO A SELLOS",
              content: "Desde el año 2023, el impuesto es de 3,5% sobre el valor de compra-venta y es de uso y costumbre pagar la mitad del mismo cada parte de la operación. En el caso de que el comprador de la propiedad esté adquiriendo vivienda única, familiar y de uso permanente se aplicará una base no imponible que a enero de 2025 se ha actualizado a 205.332.000 de pesos (vale aclarar que la modificación de este importe no imponible se ha actualizado solamente para las transacciones de viviendas, no oficinas, ni locales, ni otros inmuebles). Es decir que al precio de la propiedad (en pesos) se resta este monto y sobre el saldo se aplica el 3,5% correspondiente (que abonará mitad cada parte). En caso de no tratarse vivienda única permanente del comprador, el porcentaje se aplica sobre el total del precio de compra-venta de la propiedad. Para el cálculo de precio de la propiedad en pesos se toma el valor del dólar del Banco de la Nación Argentina (BNA), tipo vendedor, del día hábil anterior al de la firma de la escritura traslativa de dominio. En el caso de cocheras, si la misma se encuentra dentro del mismo edificio del inmueble principal y su valor no excede el mínimo no imponible, no tributa el impuesto. Además los compradores y vendedores deben ser los mismos y la transferencia debe realizarse en el mismo acto escritural. En el caso de un usufructo cuando se transfiere la propiedad, se eximirá del impuesto como en las compraventas porque se trata de una cesión de dominio parcial."
            },
            {
              title: "3 – GASTOS DE ESCRITURA",
              content: "La parte vendedora correrá con los siguientes costos, según correspondan o no en cada operación: Diligenciamientos. Estudio de títulos, Certificados administrativos, Certificados registrales, Catastro (finca), Libre certificado de ABL, Planilla de la UIF, Desafectación de Bien de familia, Derecho desafectación de bien de familia y documento habilitante. Todos ellos serán específicamente detallados en la proforma confeccionada por el Escribano interviniente. No corresponde al vendedor pagar honorarios del Escribano ya que los mismos son abonados por el comprador. En promedio, los costos de la parte vendedora representan aproximadamente entre un 0,6% y un 1% del valor de la escritura, según el precio de la propiedad (esto sucede ya que algunos costos son fijos, no variables al precio del inmueble, por lo que representan un porcentaje menor si el inmueble es más caro y un porcentaje mayor si es más económico). En el caso de la parte compradora, los costos podrán ser los siguientes, según apliquen o no a cada caso: Aporte notarial, sello matriz y copia, foja elaborada, derecho de inscripción, planillas, F3, bien de familia, aporte bien de familia, derecho de escritura bien de familia, inscripción bien de familia, derecho de escritura, documento habilitante. En total rondan también entre el 0,6% y el 1% del valor de la escritura. Es por este motivo que hemos tomado 0,8% como valor de estimación para esta herramienta orientativa."
            },
            {
              title: "4 – TRACTO ABREVIADO",
              content: "Si la propiedad que se transfiere cuenta con una declaratoria de herederos pero no inscripta aún en el registro de la propiedad, la escritura se realiza mediante el formato llamado Tracto Abreviado, cuyo costo es de un 0,4% del valor de la escritura."
            },
            {
              title: "5 – HONORARIOS DEL ESCRIBANO",
              content: "En el caso de la parte compradora, si le corresponde pagar honorarios profesionales del Escribano (y es la parte que lo elige). Los mismos dependen del presupuesto de cada profesional pero en general representan entre el 1,5 y el 2% más IVA del valor de venta de la propiedad."
            },
            {
              title: "6 – AVISO LEGAL Y DECLARACIÓN DE RESPONSABILIDAD",
              content: "Toda la información presentada en esta herramienta ha sido actualizada al 1 de enero de 2025 y tiene un carácter meramente orientativo. Las tasas, impuestos y costos mencionados están sujetos a posibles modificaciones, por lo que los resultados obtenidos son aproximados y no deben considerarse definitivos. Se recomienda consultar con el escribano interviniente para obtener un presupuesto (proforma) preciso y acorde a la situación específica de la operación a realizar."
            }
          ].map((note, index) => (
            <div key={index} className="bg-white">
              <button
                onClick={() => toggleNote(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800 text-sm">{note.title}</span>
                {expandedNote === index ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedNote === index && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed">
                  {note.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;
