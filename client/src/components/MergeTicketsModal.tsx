import React, { useState } from 'react';
import { Modal } from './Modal';
import { Ticket } from '../types';
import { api } from '../services/api';
import { useToast } from './Toast';
import {
  GitMerge,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MergeTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTickets: Ticket[];
  onMergeSuccess: (principalCode: string, mergedCount: number) => void;
}

export const MergeTicketsModal: React.FC<MergeTicketsModalProps> = ({
  isOpen,
  onClose,
  selectedTickets,
  onMergeSuccess,
}) => {
  const toast = useToast();
  const [principalId, setPrincipalId] = useState<number>(() => {
    if (selectedTickets.length > 0) {
      // Por defecto el más antiguo o el primero
      return selectedTickets[0].id;
    }
    return 0;
  });

  const [motivo, setMotivo] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const quickReasons = [
    'Doble registro por error del solicitante',
    'Reporte simultáneo por llamada y formulario web',
    'Misma incidencia técnica reportada en el ambiente',
    'Requerimiento duplicado por urgencia',
  ];

  const handleSelectQuickReason = (reason: string) => {
    setMotivo((prev) => (prev ? `${prev}. ${reason}` : reason));
  };

  const handleConfirmMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!principalId) {
      setError('Debe seleccionar cuál de los tickets será el Principal (Maestro).');
      return;
    }

    if (!motivo.trim()) {
      setError('Debe ingresar un motivo o justificación técnica para la anidación.');
      return;
    }

    const secondaryIds = selectedTickets
      .map((t) => t.id)
      .filter((id) => id !== principalId);

    if (secondaryIds.length === 0) {
      setError('Debe haber al menos un ticket secundario para fusionar con el principal.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.mergeTickets(principalId, secondaryIds, motivo.trim());
      if (res.success) {
        toast.success(
          res.message ||
            `Se han unificado ${secondaryIds.length} tickets en el Ticket Principal #${res.data?.principalCode || ''}`
        );
        onMergeSuccess(res.data?.principalCode || '', secondaryIds.length);
        onClose();
      } else {
        setError(res.message || 'Error al fusionar tickets');
      }
    } catch (err: any) {
      setError(err.message || 'Error de comunicación al fusionar tickets');
    } finally {
      setSubmitting(false);
    }
  };

  const principalTicket = selectedTickets.find((t) => t.id === principalId) || selectedTickets[0];
  const secondaryTickets = selectedTickets.filter((t) => t.id !== principalId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unificar y Anidar Tickets Duplicados"
      maxWidth="3xl"
    >
      <form onSubmit={handleConfirmMerge} className="space-y-5">
        {/* Banner Informativo ITIL v4 */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/80 flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm mt-0.5">
            <GitMerge className="w-5 h-5" />
          </div>
          <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
            <p className="font-extrabold text-sm text-indigo-900 dark:text-indigo-100 flex items-center gap-1.5">
              <span>Gestión de Tickets Duplicados / Redundantes (ITIL v4)</span>
            </p>
            <p className="leading-relaxed">
              Seleccione cuál será el <strong className="underline">Ticket Principal (Maestro)</strong> que continuará la atención técnica y resolución. Los demás tickets se anidarán dentro de él, pasarán a estado <span className="font-bold">FUSIONADO</span> y no contarán como tickets abiertos pendientes en las colas.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Selector de Ticket Principal */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-unalm-600 dark:text-unalm-400" />
              <span>1. Seleccionar Ticket Principal (Maestro):</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {selectedTickets.length} tickets seleccionados para unificación
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
            {selectedTickets.map((t) => {
              const isSelectedPrincipal = t.id === principalId;
              return (
                <div
                  key={t.id}
                  onClick={() => setPrincipalId(t.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelectedPrincipal
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/80 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="ticketPrincipal"
                          checked={isSelectedPrincipal}
                          onChange={() => setPrincipalId(t.id)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                              t.modulo === 'SERVICIOS_GENERALES'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200'
                                : 'bg-unalm-100 text-unalm-900 border-unalm-300 dark:bg-unalm-950/50 dark:text-emerald-200'
                            }`}
                          >
                            {t.codigo_correlativo}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSelectedPrincipal
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isSelectedPrincipal ? '👑 Ticket Principal (Activo)' : '📎 Ticket Secundario (Se Anidará)'}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(t.creado_en || t.fecha_apertura).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {t.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {t.descripcion}
                        </p>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1 font-medium truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            {t.solicitante_nombre}
                          </span>
                          {t.solicitante_dependencia && (
                            <span className="flex items-center gap-1 truncate text-slate-500">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              {t.solicitante_dependencia}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivo o Justificación */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>2. Motivo de la Unificación / Anidación *</span>
            <span className="text-[11px] text-slate-400 font-normal">Obligatorio para auditoría</span>
          </label>

          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describa el motivo por el cual se unifican estos requerimientos (ej: Solicitudes duplicadas por el usuario para la misma falla de red/correo)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
            required
          />

          {/* Accesos rápidos a motivos frecuentes */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Sugerencias rápidas:
            </span>
            {quickReasons.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickReason(r)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen Final de la Operación */}
        {principalTicket && secondaryTickets.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Resultado de la consolidación:</span>
            </div>
            <div className="pl-6 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <p>
                • Ticket Principal Activo:{' '}
                <strong className="text-emerald-700 dark:text-emerald-300 font-mono">
                  #{principalTicket.codigo_correlativo}
                </strong>{' '}
                ({principalTicket.titulo})
              </p>
              <p>
                • Tickets Secundarios a Anidar ({secondaryTickets.length}):{' '}
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {secondaryTickets.map((t) => `#${t.codigo_correlativo}`).join(', ')}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Botones de Acción al final del formulario */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !principalId || secondaryTickets.length === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Unificando Tickets...</span>
              </>
            ) : (
              <>
                <GitMerge className="w-4 h-4" />
                <span>Confirmar y Anidar ({secondaryTickets.length + 1} Tickets)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
