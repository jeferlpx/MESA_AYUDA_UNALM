import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';
import {
  ShieldAlert,
  Trash2,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Loader2,
  Lock,
  Layers,
  X,
} from 'lucide-react';

interface PurgeTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicketIds: number[];
  selectedTicketCodes?: string[];
  totalTicketsCount?: number;
  initialMode?: 'selected' | 'all';
  onPurgeSuccess: (deletedCount: number, message: string) => void;
}

export const PurgeTicketsModal: React.FC<PurgeTicketsModalProps> = ({
  isOpen,
  onClose,
  selectedTicketIds = [],
  selectedTicketCodes = [],
  totalTicketsCount = 0,
  initialMode = 'selected',
  onPurgeSuccess,
}) => {
  const [action, setAction] = useState<'selected' | 'all'>('selected');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setAction(selectedTicketIds.length > 0 ? initialMode : 'all');
      setPinDigits(['', '', '', '']);
      setErrorMessage(null);
      setIsSubmitting(false);
      // Auto-focus first PIN box after modal mount
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 150);
    }
  }, [isOpen, selectedTicketIds.length, initialMode]);

  const handleDigitChange = (index: number, value: string) => {
    // Solo permitir números
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      return;
    }

    // Si pega varios dígitos
    if (clean.length > 1) {
      const next = [...pinDigits];
      const chars = clean.slice(0, 4).split('');
      chars.forEach((c, i) => {
        if (i < 4) next[i] = c;
      });
      setPinDigits(next);
      const nextFocus = Math.min(chars.length, 3);
      inputRefs[nextFocus]?.current?.focus();
      return;
    }

    const next = [...pinDigits];
    next[index] = clean;
    setPinDigits(next);

    // Mover foco al siguiente input
    if (index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const currentPin = pinDigits.join('');
  const isPinComplete = currentPin.length === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isPinComplete) {
      setErrorMessage('Por favor ingrese los 4 dígitos de la clave maestra.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.purgeTickets({
        pin: currentPin,
        action,
        ticketIds: action === 'selected' ? selectedTicketIds : undefined,
      });

      if (res.success) {
        onPurgeSuccess(res.data?.deletedCount || 0, res.message || 'Eliminación completada');
        onClose();
      } else {
        setErrorMessage(res.message || 'Clave maestra incorrecta. Operación rechazada.');
        setPinDigits(['', '', '', '']);
        inputRefs[0]?.current?.focus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la eliminación de tickets.');
      setPinDigits(['', '', '', '']);
      inputRefs[0]?.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="lg">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-red-950 text-white border border-red-900/50 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex items-start space-x-3.5">
            <div className="p-3 bg-red-600/30 rounded-xl shrink-0 backdrop-blur-xs border border-red-500/30">
              <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-red-500/30 text-red-200 border border-red-500/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Admin General
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  Herramienta de Depuración & Limpieza
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                Eliminación Segura de Tickets
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Permite depurar tickets de prueba, registros erróneos o realizar un vaciado completo del sistema.
              </p>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-10 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Selector de Modo de Eliminación */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-unalm-600 dark:text-emerald-400" />
            <span>Alcance de la Eliminación</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1: Solo seleccionados */}
            <button
              type="button"
              disabled={selectedTicketIds.length === 0}
              onClick={() => {
                setAction('selected');
                setErrorMessage(null);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                action === 'selected'
                  ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                  : selectedTicketIds.length === 0
                  ? 'opacity-40 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Tickets Seleccionados
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                    {selectedTicketIds.length} item(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Elimina únicamente los tickets marcados en la tabla de la bandeja.
                </p>
              </div>
              {selectedTicketCodes.length > 0 && action === 'selected' && (
                <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/40 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {selectedTicketCodes.slice(0, 5).map((code) => (
                    <span
                      key={code}
                      className="px-1.5 py-0.5 bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800"
                    >
                      {code}
                    </span>
                  ))}
                  {selectedTicketCodes.length > 5 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{selectedTicketCodes.length - 5} más
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Opción 2: Vaciar todo */}
            <button
              type="button"
              onClick={() => {
                setAction('all');
                setErrorMessage(null);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                action === 'all'
                  ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Vaciar Todo el Sistema
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                    Purga Total
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Elimina todos los tickets registrados en la base de datos (ideal para limpiar pruebas).
                </p>
              </div>
              {totalTicketsCount > 0 && action === 'all' && (
                <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/40 text-[11px] text-red-700 dark:text-red-300 font-bold">
                  Total aproximado a eliminar: ~{totalTicketsCount} tickets
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-black block uppercase text-[11px] text-amber-800 dark:text-amber-300">
              Advertencia de Producción:
            </strong>
            Esta acción es irreversible y definitiva. Se eliminarán los registros de los tickets, sus comentarios, archivos adjuntos en disco, asignaciones técnicas y trazabilidad.
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold flex items-center space-x-2 animate-shake">
            <X className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario con PIN de 4 dígitos */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-3">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <KeyRound className="w-4 h-4 text-red-600" />
              <span>Ingrese la Clave Maestra / PIN de Seguridad *</span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Autorización de Administrador General requerida para desbloquear la depuración.
            </p>

            {/* Inputs de 4 dígitos tipo PIN bancario / 2FA */}
            <div className="flex justify-center items-center space-x-3 pt-2">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoComplete="off"
                  className={`w-12 h-14 text-center text-2xl font-black rounded-xl border transition-all ${
                    digit
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              ))}
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isPinComplete}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Eliminando tickets...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {action === 'selected'
                      ? `Eliminar (${selectedTicketIds.length}) Tickets`
                      : 'Confirmar Purga Total'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
