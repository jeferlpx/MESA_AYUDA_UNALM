import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Download, ExternalLink, X, FileText, Sparkles } from 'lucide-react';

interface ManualViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualViewerModal: React.FC<ManualViewerModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pdfUrl = '/manual/manual_mda.pdf';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Modal Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider">
                  Guía Oficial UNALM
                </span>
                <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                  Formato PDF Interactivo
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate mt-0.5">
                Manual de Usuario — Mesa de Ayuda OTIC
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Nueva Pestaña</span>
            </a>

            <a
              href={pdfUrl}
              download="Manual_Usuario_Mesa_de_Ayuda_UNALM.pdf"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-md transition-all active:scale-95"
              title="Descargar archivo PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 w-full bg-slate-950 relative overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0 bg-slate-900"
            title="Manual de Usuario Mesa de Ayuda"
          />

          {/* Fallback overlay (rendered behind iframe or if browser blocks pdf iframe) */}
          <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-sm font-bold text-slate-300">Visualizando Manual de Usuario</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Si su navegador no soporta la previsualización directa de documentos PDF, puede descargarlo o abrirlo en una nueva pestaña.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors"
            >
              Abrir Documento Directamente
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

