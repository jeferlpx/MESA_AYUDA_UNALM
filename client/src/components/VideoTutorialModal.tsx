import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Film, PlayCircle, Download, X, Sparkles, Volume2 } from 'lucide-react';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && videoRef.current) {
        // Toggle play/pause with spacebar if not focusing an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
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

  const videoUrl = '/manual/tutorial_MDA.mp4';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cinema Modal Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Video Tutorial HD</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                  Inducción al Sistema
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate mt-0.5">
                Capacitación Multimedia — Mesa de Ayuda UNALM
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={videoUrl}
              download="Video_Tutorial_Mesa_de_Ayuda_UNALM.mp4"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition-all active:scale-95"
              title="Descargar video tutorial en formato MP4"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Video</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar video (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="w-full bg-black relative flex items-center justify-center aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            playsInline
            controlsList="nodownload"
            className="w-full h-full object-contain max-h-[75vh]"
          >
            Tu navegador no soporta la reproducción de video HTML5. Puede descargarlo desde el botón superior.
          </video>
        </div>

        {/* Video Player Footer Tips */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-300">
              Aprenda el flujo completo de reporte, seguimiento y resolución de incidentes técnicos.
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            Atajos: Barra Espaciadora (Pausa/Play) • Tecla Esc (Cerrar)
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

