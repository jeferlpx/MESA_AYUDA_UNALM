import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Ticket, Clock, FileText, Wrench } from 'lucide-react';
import { UrgencyBadge } from './Badge';

export interface CreatedTicketPayload {
  id: number;
  codigoCorrelativo: string;
  titulo: string;
  descripcion?: string;
  categoriaNombre?: string;
  urgencia?: string;
  modulo?: string;
  solicitanteNombre?: string;
  solicitanteDependencia?: string;
  ubicacionOficina?: string;
  contactoLocal?: string;
  horarioAcceso?: string;
  subtipoIntervencion?: string;
  datosVehiculares?: string;
  materialesUsados?: string;
  fechaApertura?: string;
  fechaLimiteResolucion?: string;
  previewImageUrl?: string | null;
}

interface TicketCreatedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: CreatedTicketPayload | null;
  onViewTicket?: (ticketId: number) => void;
  onPrintServiceRequest?: (ticketData: CreatedTicketPayload) => void;
  onPrintWorkOrder?: (ticketData: CreatedTicketPayload) => void;
}

export const TicketCreatedSuccessModal: React.FC<TicketCreatedSuccessModalProps> = ({
  isOpen,
  onClose,
  ticketData,
  onViewTicket,
  onPrintServiceRequest,
  onPrintWorkOrder,
}) => {
  if (!isOpen || !ticketData) return null;

  const isSG = ticketData.modulo === 'SERVICIOS_GENERALES';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div
          className={`p-6 text-white relative ${
            isSG
              ? 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900'
              : 'bg-gradient-to-r from-unalm-700 via-unalm-600 to-emerald-600'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-200 font-bold">
                {isSG
                  ? 'Unidad de Servicios Generales y Mantenimiento • UNALM'
                  : 'Mesa de Ayuda OTIC • UNALM'}
              </span>
              <h2 className="text-xl font-extrabold text-white">
                ¡Requerimiento Registrado con Éxito!
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body with Ticket Details */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-semibold text-slate-500">Código de Seguimiento:</span>
              <span className="font-mono font-extrabold text-base text-slate-900 bg-amber-50 px-3 py-0.5 rounded-lg border border-amber-200">
                {ticketData.codigoCorrelativo}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Asunto / Título</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">
                {ticketData.titulo}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">
                  {isSG ? 'Especialidad SG:' : 'Servicio OTIC:'}
                </span>
                <span className="font-semibold text-slate-800">{ticketData.categoriaNombre || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Nivel de Urgencia:</span>
                <div className="mt-0.5">
                  <UrgencyBadge urgency={ticketData.urgencia || 'MEDIA'} />
                </div>
              </div>
            </div>
          </div>

          {/* Banner explicativo */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
              isSG
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-blue-50/70 border-blue-200 text-blue-900'
            }`}
          >
            <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${isSG ? 'text-amber-700' : 'text-blue-600'}`} />
            <p className="leading-relaxed text-[11px]">
              {isSG ? (
                <>
                  Su solicitud ha sido registrada en el sistema de <strong className="font-bold">Servicios Generales</strong>.
                  Puede imprimir de inmediato la <strong>Solicitud del Área Usuaria</strong> para el trámite formal de su dependencia o la <strong>Orden de Trabajo</strong>.
                </>
              ) : (
                <>
                  Su requerimiento ha ingresado a la cola de atención <strong className="font-bold">REPORTADO</strong> de la OTIC.
                  El personal técnico evaluará su solicitud para proceder con la atención oportuna.
                </>
              )}
            </p>
          </div>

          {/* Formatos Oficiales para Servicios Generales */}
          {isSG && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                📄 Documentos Oficiales de Servicios Generales
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onPrintServiceRequest && (
                  <button
                    type="button"
                    onClick={() => onPrintServiceRequest(ticketData)}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-xl text-left transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Solicitud Área Usuaria</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Memorándum formal de requerimiento con firma
                    </p>
                  </button>
                )}

                {onPrintWorkOrder && (
                  <button
                    type="button"
                    onClick={() => onPrintWorkOrder(ticketData)}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-slate-300 hover:border-amber-500 rounded-xl text-left transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span>Orden de Trabajo SG</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Formato oficial de ejecución y firmas técnicas
                    </p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {onViewTicket && (
              <button
                onClick={() => {
                  onClose();
                  onViewTicket(ticketData.id);
                }}
                className={`px-5 py-2.5 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSG
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-unalm-600 hover:bg-unalm-700'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Ver Mi Ticket</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
