
import React from 'react';
import { X, Printer } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: { label: string; value: string | number }[];
  children: React.ReactNode;
  onClose: () => void;
  headerTag?: string;
  headerTagColor?: string;
}

const ReportLayout: React.FC<ReportLayoutProps> = ({ 
  title, 
  subtitle, 
  description, 
  metadata = [], 
  children, 
  onClose,
  headerTag = 'Reporte Confidencial',
  headerTagColor = 'bg-indigo-50 text-indigo-700 border-indigo-100'
}) => {
  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="report-overlay fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex justify-center overflow-y-auto py-10 px-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="report-container w-full max-w-[1200px] bg-white rounded-[3rem] shadow-2xl flex flex-col print:shadow-none print:rounded-none print:w-full print:max-w-none print:block">
        
        {/* Toolbar (Hidden in Print) */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-30 print:hidden rounded-t-[3rem]">
          <h2 className="text-xl font-black text-slate-900">Vista Previa del Informe</h2>
          <div className="flex gap-4">
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
            >
              <Printer className="w-4 h-4" /> Guardar como PDF / Imprimir
            </button>
            <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div id="report-content" className="p-16 space-y-12 print:p-10 print:space-y-6">
          {/* Standardized Header */}
          <header className="mb-12 print:mb-8">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6 print:hidden">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">PB</div>
                  <span className="font-bold text-slate-900 tracking-tight">PropBi Intelligence</span>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporte Confidencial</p>
               </div>
            </div>
            
            <div className="bg-slate-50 text-slate-900 p-10 rounded-[2.5rem] print:rounded-none print:p-0 print:bg-white relative overflow-hidden border border-slate-100 print:border-none">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${headerTagColor}`}>
                    {headerTag}
                  </div>
                  {subtitle && (
                    <div className="bg-white text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                      {subtitle}
                    </div>
                  )}
                </div>
                
                <h1 className="text-5xl font-black tracking-tighter mb-6 leading-tight text-slate-900">
                  {title}
                </h1>
                
                {description && (
                  <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100 print:border-slate-200 print:bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen Ejecutivo</h3>
                    <div 
                      className="text-slate-700 text-lg leading-relaxed font-medium prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                    
                    {metadata.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 border-t border-slate-100 pt-6 mt-6 print:grid-cols-4">
                        {metadata.map((item, idx) => (
                          <div key={idx}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="font-bold text-slate-900 text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-8 pt-6 border-t border-slate-200">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                     <p className="font-bold text-slate-900">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plataforma</p>
                     <p className="font-bold text-slate-900">PropBi Intelligence</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Report Content */}
          {children}

          {/* Standardized Footer */}
          <footer className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print:border-slate-200 print:pt-6 print:break-inside-avoid">
            <p>© {new Date().getFullYear()} PropBi Technical Intelligence</p>
            <p>Ref: {title}</p>
            <p>Uso Exclusivo & Confidencial</p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          html, body {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #root {
            display: none !important;
          }
          .report-overlay {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            backdrop-filter: none !important;
          }
          .report-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            height: auto !important;
            display: block !important;
            padding: 0 !important;
          }
          #report-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Fix for grid systems in chrome print */
          .grid {
            display: grid !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid-cols-3 {
             grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-4 {
             grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .print\\:grid-cols-6 {
             grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
          .col-span-12 {
            grid-column: span 12 / span 12 !important;
          }
          /* Force column spans in print */
          .print\\:grid-cols-12 {
             grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
          }
          section {
            page-break-inside: auto;
            margin-bottom: 2rem !important;
            display: block !important;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }
          th, td {
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ReportLayout;
