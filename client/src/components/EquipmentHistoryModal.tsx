import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { Ticket } from '../types';
import { StatusBadge } from './Badge';
import { Laptop, Clock, Calendar, CheckCircle2, User, Wrench, AlertCircle, FileText, ChevronRight, Inbox } from 'lucide-react';

interface EquipmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  numeroInventario: string;
  currentTicketId?: number;
  onSelectTicketDetail?: (ticketId: number) => void;
}

export const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({
  isOpen,
  onClose,
  numeroInventario,
  currentTicketId,
  onSelectTicketDetail,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !numeroInventario) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getEquipmentHistory(numeroInventario);
        if (isMounted) {
          if (res.success && Array.isArray(res.data)) {
            setTickets(res.data);
          } else {
            setTickets([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error al obtener el historial del bien patrimonial');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, numeroInventario]);

  const handleTicketClick = (ticketId: number) => {
    if (onSelectTicketDetail) {
      onSelectTicketDetail(ticketId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Atenciones del Bien Institucional"
      subtitle={`Trazabilidad de requerimientos para el equipo N°: ${numeroInventario}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Header Summary Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                N° de Inventario / Código Patrimonial
              </span>
              <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                {numeroInventario}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              {loading ? 'Consultando...' : `${tickets.length} ${tickets.length === 1 ? 'atención registrada' : 'atenciones registradas'}`}
            </span>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cargando historial de atenciones del bien...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No hay tickets previos registrados con este código patrimonial.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Este requerimiento será el primero en la hoja de vida técnica de este equipo institucional.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {tickets.map((t) => {
              const isCurrent = t.id === currentTicketId;
              const formattedDate = new Date(t.fecha_apertura).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {t.codigo_correlativo}
                      </span>
                      <StatusBadge status={t.estado} />
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                          Ticket actual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Title & Service category */}
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mb-1">
                    {t.titulo}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {t.descripcion}
                  </p>

                  {/* Solucion detail if available */}
                  {t.solucion_detalle && (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl mb-3 text-[11px] text-emerald-900 dark:text-emerald-200">
                      <div className="font-extrabold flex items-center space-x-1.5 mb-0.5 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Informe Técnico / Solución Aplicada:</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">
                        {t.solucion_detalle}
                      </p>
                    </div>
                  )}

                  {/* Footer metadata & Action button */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      {t.solicitante_nombre && (
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Solicitante: <strong className="text-slate-700 dark:text-slate-300">{t.solicitante_nombre}</strong></span>
                        </span>
                      )}
                      {t.tecnico_nombre && (
                        <span className="flex items-center space-x-1">
                          <Wrench className="w-3 h-3 text-emerald-500" />
                          <span>Técnico: <strong className="text-emerald-700 dark:text-emerald-400">{t.tecnico_nombre}</strong></span>
                        </span>
                      )}
                    </div>

                    {onSelectTicketDetail && (
                      <button
                        type="button"
                        onClick={() => handleTicketClick(t.id)}
                        className="inline-flex items-center space-x-1 font-bold text-unalm-700 hover:text-unalm-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer text-xs"
                      >
                        <span>Ver Detalle</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </Modal>
  );
};

