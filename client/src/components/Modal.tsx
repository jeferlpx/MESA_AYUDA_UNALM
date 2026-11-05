import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/75 dark:bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 w-full ${maxWidthClasses[maxWidth]} max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header: Más compacto para ahorrar espacio vertical */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-xs">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                {subtitle}
              </p>
            )}
          </div>
          {/* Botón X con psicología del color rojo (alta visibilidad y accesibilidad inmediata) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/70 text-rose-600 dark:text-rose-400 border border-rose-200/90 dark:border-rose-800/70 shadow-xs hover:shadow-sm transition-all active:scale-90 cursor-pointer shrink-0 ml-2 group"
            title="Cerrar ventana (Escape)"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Modal Body: Contenedor con scroll garantizado y padding inferior seguro */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-24 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
