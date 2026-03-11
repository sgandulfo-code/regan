import React, { useState } from 'react';
import { Check, ChevronRight, FileText, DollarSign, Info, X } from 'lucide-react';
import { TransactionType } from '../types';

export interface StageInfo {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
  requirements: {
    docs: string[];
    money: string[];
  };
}

export const STAGES_COMPRA: StageInfo[] = [
  {
    id: 'busqueda',
    title: 'Búsqueda',
    status: 'completed',
    description: 'Definición de tu perfil y selección de las mejores opciones del mercado.',
    requirements: {
      docs: [],
      money: []
    }
  },
  {
    id: 'visitas',
    title: 'Visitas',
    status: 'current',
    description: 'Recorremos las propiedades seleccionadas. Tu feedback es clave para ajustar la búsqueda.',
    requirements: {
      docs: [],
      money: []
    }
  },
  {
    id: 'reserva',
    title: 'Reserva',
    status: 'upcoming',
    description: 'Hacemos una oferta formal para retirar la propiedad del mercado y negociar las condiciones.',
    requirements: {
      docs: ['DNI / Pasaporte original y copia'],
      money: ['Monto de reserva (usualmente 1% al 5% del valor de la propiedad)']
    }
  },
  {
    id: 'boleto',
    title: 'Boleto',
    status: 'upcoming',
    description: 'Firma del compromiso de compraventa. El escribano revisa toda la documentación para tu tranquilidad.',
    requirements: {
      docs: ['Documentación personal completa', 'Justificación de fondos (si aplica)'],
      money: ['Refuerzo de pago (usualmente completa el 30% del valor total)', 'Honorarios inmobiliarios (si corresponde en esta etapa)']
    }
  },
  {
    id: 'escritura',
    title: 'Escritura',
    status: 'upcoming',
    description: 'Firma final ante escribano, pago del saldo y entrega de llaves. ¡Tu nueva casa!',
    requirements: {
      docs: ['DNI / Pasaporte'],
      money: ['Pago del saldo restante', 'Gastos de escrituración y honorarios del escribano']
    }
  }
];

export const STAGES_VENTA: StageInfo[] = [
  {
    id: 'tasacion',
    title: 'Tasación',
    status: 'completed',
    description: 'Evaluación profesional del valor de tu propiedad en el mercado actual.',
    requirements: {
      docs: ['Título de propiedad', 'Plano de la propiedad (opcional)'],
      money: []
    }
  },
  {
    id: 'autorizacion',
    title: 'Autorización',
    status: 'completed',
    description: 'Firma de la autorización de venta y preparación del material de marketing (fotos, videos).',
    requirements: {
      docs: ['DNI de los titulares', 'Autorización firmada'],
      money: []
    }
  },
  {
    id: 'comercializacion',
    title: 'Comercialización',
    status: 'current',
    description: 'Publicación en portales, difusión en la red y realización de visitas con clientes interesados.',
    requirements: {
      docs: [],
      money: []
    }
  },
  {
    id: 'reserva',
    title: 'Reserva',
    status: 'upcoming',
    description: 'Recepción de una oferta formal por parte de un comprador interesado.',
    requirements: {
      docs: [],
      money: []
    }
  },
  {
    id: 'boleto',
    title: 'Boleto',
    status: 'upcoming',
    description: 'Firma del compromiso de compraventa. El comprador entrega un refuerzo.',
    requirements: {
      docs: ['Documentación personal', 'Estado parcelario', 'Libre deuda de impuestos y expensas'],
      money: ['Cobro del refuerzo (usualmente 30% del valor)', 'Pago de honorarios inmobiliarios']
    }
  },
  {
    id: 'escritura',
    title: 'Escritura',
    status: 'upcoming',
    description: 'Firma final ante escribano, cobro del saldo y entrega de llaves al nuevo dueño.',
    requirements: {
      docs: ['DNI / Pasaporte', 'Título de propiedad original'],
      money: ['Cobro del saldo restante', 'Pago de gastos de escrituración correspondientes al vendedor']
    }
  }
];

interface ClientProgressBarProps {
  transactionType?: TransactionType;
  currentStageId?: string;
}

export default function ClientProgressBar({ transactionType = TransactionType.COMPRA, currentStageId }: ClientProgressBarProps) {
  const [selectedStage, setSelectedStage] = useState<StageInfo | null>(null);
  
  const baseStages = transactionType === TransactionType.VENTA ? STAGES_VENTA : STAGES_COMPRA;
  
  // Find the index of the current stage. If not found, default to 0.
  const currentIndex = currentStageId 
    ? baseStages.findIndex(s => s.id === currentStageId)
    : 0;
    
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  const STAGES = baseStages.map((stage, index) => ({
    ...stage,
    status: index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming'
  })) as StageInfo[];

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {transactionType === TransactionType.VENTA ? 'Tu proceso de venta' : 
             transactionType === TransactionType.ALQUILER || transactionType === TransactionType.ALQUILER_TEMPORARIO ? 'Tu proceso de alquiler' : 
             'Tu proceso de compra'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Hacé clic en los próximos pasos para ver qué vas a necesitar.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex items-start min-w-max px-2 pt-2">
            {STAGES.map((stage, index) => {
              const isLast = index === STAGES.length - 1;
              
              return (
                <React.Fragment key={stage.id}>
                  {/* Stage Node */}
                  <div 
                    className="flex flex-col items-center relative group cursor-pointer w-20 md:w-24"
                    onClick={() => setSelectedStage(stage)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                      stage.status === 'completed' 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : stage.status === 'current'
                          ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-md'
                          : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-400'
                    }`}>
                      {stage.status === 'completed' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`mt-3 text-[10px] md:text-xs font-bold uppercase tracking-wider text-center transition-colors ${
                      stage.status === 'completed' || stage.status === 'current'
                        ? 'text-slate-900'
                        : 'text-slate-400 group-hover:text-indigo-600'
                    }`}>
                      {stage.title}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {!isLast && (
                    <div className="w-8 md:w-16 h-0.5 mx-1 mt-6 relative">
                      <div className={`absolute inset-0 rounded-full ${
                        stage.status === 'completed' ? 'bg-indigo-600' : 'bg-slate-200'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Detail Modal */}
      {selectedStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedStage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    selectedStage.status === 'current' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedStage.status === 'completed' ? 'Completado' :
                     selectedStage.status === 'current' ? 'Etapa Actual' : 'Próximo Paso'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{selectedStage.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedStage(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 md:p-6 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedStage.description}
              </p>

              {(selectedStage.requirements.docs.length > 0 || selectedStage.requirements.money.length > 0) && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                    ¿Qué vas a necesitar?
                  </h4>
                  
                  {selectedStage.requirements.docs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-bold">Documentación</span>
                      </div>
                      <ul className="space-y-2">
                        {selectedStage.requirements.docs.map((doc, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedStage.requirements.money.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-bold">Dinero</span>
                      </div>
                      <ul className="space-y-2">
                        {selectedStage.requirements.money.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedStage(null)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
