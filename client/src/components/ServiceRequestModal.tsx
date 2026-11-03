import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, Attachment } from '../types';
import { Printer, X, FileText, MapPin, Calendar, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { getAssetUrl } from '../services/api';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  attachments?: Attachment[];
  previewImageUrl?: string | null;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  ticket,
  attachments = [],
  previewImageUrl,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-service-request-open');
    } else {
      document.body.classList.remove('has-service-request-open');
    }
    return () => {
      document.body.classList.remove('has-service-request-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Formato de fecha largo en español: ej. "21 de Agosto del 2026"
  const formatDateLong = (dateString?: string) => {
    if (!dateString) {
      const now = new Date();
      return `${now.getDate()} de ${now.toLocaleDateString('es-PE', { month: 'long' })} del ${now.getFullYear()}`;
    }
    const d = new Date(dateString);
    return `${d.getDate()} de ${d.toLocaleDateString('es-PE', { month: 'long' })} del ${d.getFullYear()}`;
  };

  // Buscar imagen adjunta (de attachments o de previewImageUrl)
  const imageAttachment = attachments.find(
    (att) =>
      att.mime_type?.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(att.nombre_original || '')
  );

  const displayImageSrc = previewImageUrl
    ? previewImageUrl
    : imageAttachment
    ? getAssetUrl(imageAttachment.ruta_servidor)
    : null;

  const isUrgente = ticket.urgencia === 'ALTA' || ticket.urgencia === 'CRITICA';
  const calidadTexto = isUrgente ? 'EN CALIDAD DE URGENTE' : 'EN CALIDAD DE ATENCIÓN NORMAL';

  const areaNombre = ticket.categoria_nombre
    ? `ÁREA DE ${ticket.categoria_nombre.toUpperCase()}`
    : 'ÁREA DE SERVICIOS GENERALES';

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        
        {/* Modal Actions Header (Hidden in Print) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-white">Solicitud del Área Usuaria (Memorándum Formal)</h3>
              <p className="text-[11px] text-slate-400">Formato formal de requerimiento remitido a la Unidad de Servicios Generales</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (Faithful replication of Image 1) */}
        <div className="service-request-print-document p-8 sm:p-14 overflow-y-auto print:overflow-visible print:p-0 text-slate-900 space-y-7 text-xs sm:text-sm leading-relaxed print:text-[12px] print:leading-relaxed bg-white">
          
          {/* Header Institucional UNALM con Escudo a la izquierda */}
          <div className="flex items-center justify-start space-x-6 border-b-2 border-slate-900 pb-5">
            <img
              src="./escudo-color.png"
              alt="Escudo UNALM"
              className="w-16 h-20 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/escudo-color.png';
              }}
            />
            <div className="text-center flex-1 pr-14">
              <h2 className="font-black text-base sm:text-lg tracking-tight uppercase text-slate-950">
                UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
              </h2>
              <h3 className="font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-800 mt-1">
                UNIDAD DE SERVICIOS GENERALES
              </h3>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                CÓDIGO DE REQUERIMIENTO: {ticket.codigo_correlativo}
              </span>
            </div>
          </div>

          {/* Encabezado Formal tipo Memorándum */}
          <div className="space-y-3 font-sans text-slate-900 border-b border-slate-200 pb-5 text-xs sm:text-sm">
            <div className="flex items-start">
              <span className="w-20 font-black tracking-wider text-slate-950 uppercase shrink-0">DEL:</span>
              <div className="flex-1">
                <span className="font-bold text-slate-950 block">
                  {ticket.solicitante_dependencia || 'Jefatura de Área Solicitante'}
                </span>
                <span className="text-slate-700 block text-xs">
                  {ticket.solicitante_nombre ? `Responsable: ${ticket.solicitante_nombre}` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <span className="w-20 font-black tracking-wider text-slate-950 uppercase shrink-0">AL:</span>
              <div className="flex-1">
                <span className="font-bold text-slate-950 block">
                  Jefe de la Unidad de Servicios Generales
                </span>
                <span className="text-slate-700 block text-xs font-semibold">
                  Mg. Necker Rutilio Linares Melgarejo
                </span>
              </div>
            </div>

            <div className="flex items-start">
              <span className="w-20 font-black tracking-wider text-slate-950 uppercase shrink-0">FECHA:</span>
              <div className="flex-1">
                <span className="font-bold text-slate-950">
                  {formatDateLong(ticket.fecha_apertura)}
                </span>
              </div>
            </div>
          </div>

          {/* Párrafo Formal de Solicitud */}
          <div className="text-justify leading-relaxed text-slate-800 text-xs sm:text-sm">
            <p>
              Le agradeceré se sirva usted ordenar a quien corresponda el siguiente trabajo{' '}
              <strong className="font-black uppercase text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 inline-block print:border-none print:bg-transparent print:p-0">
                {calidadTexto}
              </strong>{' '}
              en la Ciudad Universitaria de la{' '}
              <strong className="font-bold text-slate-950">
                {ticket.solicitante_dependencia || 'Dependencia Solicitante'}
              </strong>
              {ticket.ubicacion_oficina ? ` (Ambiente / Ubicación: ${ticket.ubicacion_oficina})` : ''}:
            </p>
          </div>

          {/* Bloque de Requerimiento por Área / Especialidad */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-xs sm:text-sm uppercase tracking-wide text-slate-950 border-b border-slate-300 pb-1">
              {areaNombre}
            </h4>

            <div className="pl-4 space-y-2">
              <div className="flex items-start space-x-2.5">
                <span className="text-slate-950 font-black text-base leading-tight">•</span>
                <div className="flex-1 space-y-1.5">
                  <span className="font-bold text-slate-950 block text-xs sm:text-sm">
                    {ticket.titulo}
                  </span>
                  <p className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {ticket.descripcion}
                  </p>

                  {/* Metadatos adicionales de Servicios Generales */}
                  {(ticket.contacto_local || ticket.horario_acceso || ticket.datos_vehiculares || ticket.materiales_usados) && (
                    <div className="pt-2 mt-2 border-t border-slate-200 text-xs text-slate-700 space-y-1">
                      {ticket.contacto_local && (
                        <div>
                          <strong>Persona de Contacto en el Lugar:</strong> {ticket.contacto_local}
                        </div>
                      )}
                      {ticket.horario_acceso && (
                        <div>
                          <strong>Horario de Acceso:</strong> {ticket.horario_acceso}
                        </div>
                      )}
                      {ticket.datos_vehiculares && (
                        <div>
                          <strong>Datos Vehiculares / Maquinaria:</strong> <span className="font-mono uppercase font-bold">{ticket.datos_vehiculares}</span>
                        </div>
                      )}
                      {ticket.materiales_usados && (
                        <div>
                          <strong>Insumos / Materiales Sugeridos:</strong> {ticket.materiales_usados}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registro Fotográfico / Evidencia de Campo */}
          {displayImageSrc && (
            <div className="space-y-2 pt-3 avoid-page-break">
              <h5 className="font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Registro Fotográfico / Evidencia Adjunta:</span>
              </h5>
              <div className="border border-slate-300 rounded-xl p-2 bg-slate-50 flex justify-center max-w-sm">
                <img
                  src={displayImageSrc}
                  alt="Evidencia fotográfica del requerimiento"
                  className="max-h-56 max-w-full object-contain rounded-lg border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* Espacio para Firmas y Conformidad del Área Usuaria */}
          <div className="pt-16 sm:pt-20 avoid-page-break">
            <div className="flex justify-end">
              <div className="w-72 sm:w-80 text-center space-y-1.5 border-t-2 border-slate-900 pt-3">
                <span className="font-black text-xs sm:text-sm text-slate-950 block uppercase">
                  {ticket.solicitante_nombre || 'Jefatura / Responsable del Área'}
                </span>
                <span className="text-[11px] text-slate-600 block uppercase font-semibold">
                  Firma y Sello del Solicitante / Jefatura
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {ticket.solicitante_dependencia || 'Universidad Nacional Agraria La Molina'}
                </span>
              </div>
            </div>
          </div>

          {/* Pie de página institucional */}
          <div className="pt-8 text-center text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-200">
            <span>Universidad Nacional Agraria La Molina • Sistema Mesa de Ayuda SG</span>
            <span>Documento de Gestión Interna • ROF UNALM</span>
          </div>

        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
