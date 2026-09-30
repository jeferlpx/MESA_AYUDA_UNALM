import React from 'react';
import { TicketStatus } from '../types';
import {
  FileText,
  Search,
  Package,
  Wrench,
  Hammer,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface SGFieldTimelineTrackerProps {
  status: TicketStatus | string;
  fechaApertura?: string;
  fechaPrimeraRespuesta?: string;
  fechaResolucion?: string;
  tecnicoNombre?: string;
  contactoLocal?: string;
  ubicacionOficina?: string;
  materialesUsados?: string;
}

export const SGFieldTimelineTracker: React.FC<SGFieldTimelineTrackerProps> = ({
  status,
  fechaApertura,
  fechaPrimeraRespuesta,
  fechaResolucion,
  tecnicoNombre,
  contactoLocal,
  ubicacionOficina,
  materialesUsados,
}) => {
  // Orden lógico de las fases en campo para Servicios Generales
  const stages = [
    {
      key: 'SOLICITUD',
      title: '1. Solicitud Usuaria',
      subtitle: 'Requerimiento Formal',
      icon: FileText,
      date: fechaApertura,
      activeStates: ['REPORTADO', 'EVALUACION_INSPECCION', 'ESPERA_MATERIALES', 'ESPERA_MATERIALES_SOLICITANTE', 'ASIGNADO', 'EN_EJECUCION', 'RESUELTO'],
    },
    {
      key: 'EVALUACION_MATERIALES',
      title: '2. Inspección / Materiales',
      subtitle: status === 'ESPERA_MATERIALES_SOLICITANTE' ? 'En Espera del Solicitante (15 Días)' : 'Cubicación & Almacén',
      icon: Package,
      date: status === 'EVALUACION_INSPECCION' || status === 'ESPERA_MATERIALES' || status === 'ESPERA_MATERIALES_SOLICITANTE' ? fechaPrimeraRespuesta : undefined,
      activeStates: ['EVALUACION_INSPECCION', 'ESPERA_MATERIALES', 'ESPERA_MATERIALES_SOLICITANTE', 'ASIGNADO', 'EN_EJECUCION', 'RESUELTO'],
    },
    {
      key: 'OT_ASIGNADO',
      title: '3. OT & Despacho',
      subtitle: 'Orden Asignada a Campo',
      icon: Wrench,
      date: fechaPrimeraRespuesta,
      activeStates: ['ASIGNADO', 'EN_EJECUCION', 'RESUELTO'],
    },
    {
      key: 'EJECUCION',
      title: '4. Trabajo en Campo',
      subtitle: 'Labores en Taller / Aula',
      icon: Hammer,
      date: status === 'EN_EJECUCION' ? fechaPrimeraRespuesta : undefined,
      activeStates: ['EN_EJECUCION', 'RESUELTO'],
    },
    {
      key: 'CONFORMIDAD',
      title: '5. Concluido & Conforme',
      subtitle: 'Informe y Cierre OCI',
      icon: ShieldCheck,
      date: fechaResolucion,
      activeStates: ['RESUELTO'],
    },
  ];

  const getStageState = (stageKey: string) => {
    if (status === 'RESUELTO') return 'completed';

    if (stageKey === 'SOLICITUD') {
      return status === 'REPORTADO' ? 'current' : 'completed';
    }

    if (stageKey === 'EVALUACION_MATERIALES') {
      if (status === 'EVALUACION_INSPECCION' || status === 'ESPERA_MATERIALES' || status === 'ESPERA_MATERIALES_SOLICITANTE') return 'current';
      if (['ASIGNADO', 'EN_EJECUCION', 'RESUELTO'].includes(status)) return 'completed';
      return 'pending';
    }

    if (stageKey === 'OT_ASIGNADO') {
      if (status === 'ASIGNADO') return 'current';
      if (['EN_EJECUCION', 'RESUELTO'].includes(status)) return 'completed';
      return 'pending';
    }

    if (stageKey === 'EJECUCION') {
      if (status === 'EN_EJECUCION') return 'current';
      if (status === 'RESUELTO') return 'completed';
      return 'pending';
    }

    if (stageKey === 'CONFORMIDAD') {
      return status === 'RESUELTO' ? 'completed' : 'pending';
    }

    return 'pending';
  };

  return (
    <div className="w-full bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            Trazabilidad Operativa en Campo • Servicios Generales UNALM
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
          Estado: <strong className="text-white">{status}</strong>
        </span>
      </div>

      {/* Stepper bar */}
      <div className="relative py-2">
        <div className="absolute top-7 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block" />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
          {stages.map((stg) => {
            const state = getStageState(stg.key);
            const Icon = stg.icon;

            return (
              <div
                key={stg.key}
                className={`flex sm:flex-col items-center sm:text-center p-3 sm:p-2 rounded-2xl transition-all ${
                  state === 'current'
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : state === 'completed'
                    ? 'bg-emerald-950/20 border border-emerald-500/20'
                    : 'bg-slate-950/40 border border-slate-800/40 opacity-60'
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    state === 'completed'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                      : state === 'current'
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-md font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="ml-3 sm:ml-0 sm:mt-2 space-y-0.5">
                  <p
                    className={`text-xs font-black tracking-tight ${
                      state === 'current'
                        ? 'text-amber-300'
                        : state === 'completed'
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {stg.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {stg.subtitle}
                  </p>
                  {stg.date && (
                    <span className="text-[9px] font-mono text-slate-300 block pt-0.5">
                      {new Date(stg.date).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini resumen de datos de campo */}
      {(tecnicoNombre || contactoLocal || ubicacionOficina || materialesUsados) && (
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
          {ubicacionOficina && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Lugar / Ambiente:</span>
              <span className="font-semibold text-white truncate block">{ubicacionOficina}</span>
            </div>
          )}

          {contactoLocal && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Contacto en el Lugar:</span>
              <span className="font-semibold text-amber-300 truncate block">{contactoLocal}</span>
            </div>
          )}

          {tecnicoNombre && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Especialista en Campo:</span>
              <span className="font-semibold text-emerald-300 truncate block">{tecnicoNombre}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
