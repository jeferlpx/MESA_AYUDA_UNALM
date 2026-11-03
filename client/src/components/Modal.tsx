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
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 w-full ${maxWidthClasses[maxWidth]} transform transition-all overflow-hidden animate-in zoom-in-95 duration-200 my-auto`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 backdrop-blur-xs">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all active:scale-90 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-7 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
