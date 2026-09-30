import React from 'react';
import { TicketStatus } from '../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TicketTimelineProps {
  status: TicketStatus;
  fechaApertura: string;
  fechaPrimeraRespuesta?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({
  status,
  fechaApertura,
  fechaPrimeraRespuesta,
  fechaResolucion,
  fechaCierre,
}) => {
  const steps = [
    { key: 'REPORTADO', title: '1. Reportado (Mesa de Ayuda)', date: fechaApertura },
    { key: 'ASIGNADO', title: '2. Asignado a Técnico', date: fechaPrimeraRespuesta },
    { key: 'RESUELTO', title: '3. Solución Técnica Aplicada', date: fechaResolucion || fechaCierre },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['REPORTADO', 'ASIGNADO', 'RESUELTO'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />

        {steps.map((step) => {
          const state = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 bg-white px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  state === 'completed'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : state === 'current'
                    ? 'bg-unalm-600 border-unalm-600 text-white ring-4 ring-unalm-100 shadow'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : state === 'current' ? (
                  <Clock className="w-4 h-4 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
              <span className="text-[11px] font-bold mt-1.5 text-center text-slate-700 max-w-[100px]">
                {step.title}
              </span>
              {step.date && (
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(step.date).toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
