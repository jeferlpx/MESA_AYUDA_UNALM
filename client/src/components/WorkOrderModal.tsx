import React, { useEffect } from 'react';
import { Ticket } from '../types';
import { Printer, X, Wrench, ShieldAlert } from 'lucide-react';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('has-work-order-open');
    } else {
      document.body.classList.remove('has-work-order-open');
    }
    return () => {
      document.body.classList.remove('has-work-order-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Formato de fecha DD/MM/AAAA
  const formatDateSlash = (dateString?: string) => {
    if (!dateString) {
      const now = new Date();
      return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Formato de hora HH:MM
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  // Extraer número correlativo limpio para "ORDEN DE TRABAJO Nº" (ej. 075-2026)
  const getNumeroOrden = () => {
    if (!ticket.codigo_correlativo) return '001-2026';
    // Si viene como SG-2026-00075 o 2026-00075
    const parts = ticket.codigo_correlativo.split('-');
    if (parts.length >= 3) {
      // Formato SG-YYYY-NNNNN -> NNN-YYYY
      const year = parts[1];
      const num = parseInt(parts[2], 10);
      return `${String(num).padStart(3, '0')}-${year}`;
    }
    return ticket.codigo_correlativo;
  };

  const isSIGI = ticket.canal_origen === 'INSPECCION_SIGI';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        
        {/* Modal Actions Header (Hidden in Print) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-white">Orden de Trabajo Oficial (Servicios Generales)</h3>
              <p className="text-[11px] text-slate-400">Documento oficial para sustento de labores, ejecución y firma de conformidad física</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 cursor-pointer"
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

        {/* Printable Document Body (Faithful replication of Image 2) */}
        <div className="work-order-print-document p-8 sm:p-12 overflow-y-auto print:overflow-visible print:p-0 text-slate-900 space-y-5 text-xs sm:text-[13px] leading-snug print:text-[11px] print:leading-tight bg-white">
          
          {/* Header Institucional UNALM con Escudo a la derecha */}
          <div className="relative pt-2 pb-2">
            <div className="text-center">
              <h2 className="font-bold text-sm sm:text-base uppercase tracking-tight text-slate-950 font-sans">
                UNIVERSIDAD NACIONAL AGRARIA LA MOLINA
              </h2>
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-800 mt-0.5">
                UNIDAD DE SERVICIOS GENERALES
              </h3>
            </div>

            <div className="absolute right-0 top-0">
              <img
                src="./escudo-color.png"
                alt="Escudo UNALM"
                className="w-12 h-14 sm:w-14 sm:h-16 object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/escudo-color.png';
                }}
              />
            </div>
          </div>

          {/* Banner de Inspección SIGI si aplica */}
          {isSIGI && (
            <div className="p-2 bg-amber-50 border border-amber-400 rounded-lg flex items-center justify-between text-amber-950 text-[11px] print:hidden">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold">ORIGEN: INSPECCIÓN PREVENTIVA DE INFRAESTRUCTURA (SIGI UNALM)</span>
              </div>
              <span className="font-bold uppercase text-[10px] bg-amber-200 px-2 py-0.5 rounded">Hallazgo de Campo</span>
            </div>
          )}

          {/* Bloque Superior: FECHA y ORDEN DE TRABAJO Nº */}
          <div className="grid grid-cols-12 border border-slate-900 text-xs sm:text-[13px] font-sans">
            <div className="col-span-3 sm:col-span-2 font-bold p-1.5 bg-slate-100/50 border-r border-slate-900 flex items-center uppercase">
              FECHA:
            </div>
            <div className="col-span-3 sm:col-span-4 p-1.5 border-r border-slate-900 font-bold text-center flex items-center justify-center font-mono">
              {formatDateSlash(ticket.fecha_apertura)}
            </div>
            <div className="col-span-4 sm:col-span-4 font-bold p-1.5 bg-slate-100/50 border-r border-slate-900 flex items-center uppercase text-[11px] sm:text-xs">
              ORDEN DE TRABAJO Nº:
            </div>
            <div className="col-span-2 sm:col-span-2 p-1.5 font-bold text-center flex items-center justify-center font-mono">
              {getNumeroOrden()}
            </div>
          </div>

          {/* 1. DATOS DE LA SOLICITUD */}
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-[13px] uppercase text-slate-950">
              1. DATOS DE LA SOLICITUD
            </h4>
            <div className="border border-slate-900 text-xs sm:text-[13px]">
              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Facultad / Programa / Ofic. Adm.
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-medium">
                  {ticket.solicitante_dependencia || 'CAMPUS UNIVERSITARIO UNALM'}
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Departamento / Área
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-medium">
                  {ticket.ubicacion_oficina || ticket.solicitante_dependencia || 'CAMPUS UNIVERSITARIO UNALM'}
                </div>
              </div>

              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Solicitante
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-bold text-slate-950">
                  {ticket.solicitante_nombre || 'USUARIO SOLICITANTE'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. DETALLES DE LA ATENCIÓN */}
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-[13px] uppercase text-slate-950">
              2. DETALLES DE LA ATENCIÓN
            </h4>
            <div className="border border-slate-900 text-xs sm:text-[13px]">
              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Jefe de Sección :
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-bold text-slate-950">
                  RUBINO BASTIDAS
                </div>
              </div>

              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Sección:
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-bold text-slate-950">
                  {ticket.categoria_nombre || 'SERVICIOS GENERALES'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. DESCRIPCIÓN DEL TRABAJO SOLICITADO */}
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-[13px] uppercase text-slate-950">
              3. DESCRIPCIÓN DEL TRABAJO SOLICITADO
            </h4>
            <div className="border border-slate-900 p-3 min-h-[70px] sm:min-h-[85px] text-xs sm:text-[13px] leading-relaxed space-y-1.5">
              <div className="flex items-start space-x-1.5">
                <span className="font-black text-slate-950">•</span>
                <span className="uppercase font-medium text-slate-950">
                  {ticket.titulo ? `${ticket.titulo}. ` : ''}
                  {ticket.descripcion}
                </span>
              </div>

              {ticket.datos_vehiculares && (
                <div className="flex items-start space-x-1.5 text-[11px] sm:text-xs">
                  <span className="font-bold text-slate-950">• DATOS VEHICULARES:</span>
                  <span className="font-mono uppercase font-bold text-slate-900">{ticket.datos_vehiculares}</span>
                </div>
              )}

              {ticket.contacto_local && (
                <div className="flex items-start space-x-1.5 text-[11px] sm:text-xs">
                  <span className="font-bold text-slate-950">• CONTACTO LOCAL:</span>
                  <span className="uppercase font-semibold text-slate-900">{ticket.contacto_local}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. INFORME TÉCNICO */}
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-[13px] uppercase text-slate-950">
              4. INFORME TÉCNICO
            </h4>
            <div className="border border-slate-900 text-xs sm:text-[13px]">
              
              {/* Fechas y Horas */}
              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-4 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Fecha de inicio de trabajo:
                </div>
                <div className="col-span-3 sm:col-span-3 p-1.5 border-r border-slate-900 text-center font-mono">
                  {ticket.fecha_primera_respuesta ? formatDateSlash(ticket.fecha_primera_respuesta) : ''}
                </div>
                <div className="col-span-3 sm:col-span-3 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  hora inicio:
                </div>
                <div className="col-span-2 sm:col-span-2 p-1.5 text-center font-mono">
                  {ticket.fecha_primera_respuesta ? formatTime(ticket.fecha_primera_respuesta) : ''}
                </div>
              </div>

              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-4 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Fecha de fin de trabajo:
                </div>
                <div className="col-span-3 sm:col-span-3 p-1.5 border-r border-slate-900 text-center font-mono">
                  {ticket.fecha_resolucion ? formatDateSlash(ticket.fecha_resolucion) : ''}
                </div>
                <div className="col-span-3 sm:col-span-3 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  hora fin:
                </div>
                <div className="col-span-2 sm:col-span-2 p-1.5 text-center font-mono">
                  {ticket.fecha_resolucion ? formatTime(ticket.fecha_resolucion) : ''}
                </div>
              </div>

              {/* Personal responsable */}
              <div className="grid grid-cols-12 border-b border-slate-900">
                <div className="col-span-5 sm:col-span-4 p-1.5 font-bold border-r border-slate-900 bg-slate-50/50 text-[11px] sm:text-xs">
                  Personal responsable de la ejecución del trabajo:
                </div>
                <div className="col-span-7 sm:col-span-8 p-1.5 uppercase font-bold text-slate-950 flex items-center">
                  {ticket.tecnico_nombre || ''}
                </div>
              </div>

              {/* Informe sobre la ejecución */}
              <div className="p-2 border-b border-slate-900 min-h-[90px] sm:min-h-[110px] space-y-1">
                <span className="font-bold block text-[11px] sm:text-xs text-slate-900">
                  Informe sobre la ejecución de la orden de trabajo:
                </span>
                {ticket.solucion_detalle ? (
                  <p className="text-slate-900 whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed pt-1 uppercase">
                    {ticket.solucion_detalle}
                  </p>
                ) : (
                  <div className="h-16"></div>
                )}
              </div>

              {/* Materiales y aditivos adicionales */}
              <div className="p-2 border-b border-slate-900 min-h-[45px] sm:min-h-[55px] space-y-1">
                <span className="font-bold block text-[11px] sm:text-xs text-slate-900">
                  Materiales y aditivos adicionales utilizados:
                </span>
                {ticket.materiales_usados ? (
                  <p className="text-slate-900 uppercase font-semibold text-xs sm:text-[13px]">
                    {ticket.materiales_usados}
                  </p>
                ) : (
                  <div className="h-5"></div>
                )}
              </div>

              {/* Devolución de materiales sobrantes */}
              <div className="p-2 min-h-[45px] sm:min-h-[55px] space-y-1">
                <span className="font-bold block text-[11px] sm:text-xs text-slate-900">
                  Devolución de materiales sobrantes:
                </span>
                {ticket.materiales_sobrantes ? (
                  <p className="text-slate-900 uppercase font-semibold text-xs sm:text-[13px]">
                    {ticket.materiales_sobrantes}
                  </p>
                ) : (
                  <div className="h-5"></div>
                )}
              </div>

            </div>
          </div>

          {/* Firmas Oficiales al Pie */}
          <div className="pt-12 sm:pt-16 avoid-page-break">
            <div className="grid grid-cols-2 gap-10 sm:gap-20 text-center">
              <div className="border-t border-slate-900 pt-2 space-y-0.5">
                <span className="font-bold text-xs sm:text-[13px] text-slate-950 block">
                  Recibido / Trabajo Concluido
                </span>
              </div>

              <div className="border-t border-slate-900 pt-2 space-y-0.5">
                <span className="font-bold text-xs sm:text-[13px] text-slate-950 block">
                  Jefe de Sección
                </span>
              </div>
            </div>
          </div>

          {/* Footer institucional discreto */}
          <div className="pt-4 text-center text-[9px] text-slate-400 flex items-center justify-between">
            <span>Universidad Nacional Agraria La Molina • Unidad de Servicios Generales</span>
            <span>Sistema Mesa de Ayuda SG</span>
          </div>

        </div>

      </div>
    </div>
  );
};
