import React from 'react';
import { TicketStatus, TicketPriority, TicketUrgency, TicketComplejidad } from '../types';

interface StatusBadgeProps {
  status: TicketStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    REPORTADO: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', label: 'REPORTADO', dot: 'bg-amber-500' },
    OBSERVADO: { bg: 'bg-amber-100 border-amber-400', text: 'text-amber-900 font-bold', label: 'OBSERVADO', dot: 'bg-amber-600 animate-pulse' },
    OBSERVADOS: { bg: 'bg-amber-100 border-amber-400', text: 'text-amber-900 font-bold', label: 'OBSERVADO', dot: 'bg-amber-600 animate-pulse' },
    EVALUACION_INSPECCION: { bg: 'bg-purple-50 border-purple-300', text: 'text-purple-800', label: 'INSPECCIÓN / EVAL.', dot: 'bg-purple-500' },
    ESPERA_MATERIALES: { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-900', label: 'ESPERA MATERIALES (ALMACÉN)', dot: 'bg-orange-500' },
    ESPERA_MATERIALES_SOLICITANTE: { bg: 'bg-amber-100 border-amber-400', text: 'text-amber-950 font-black', label: 'ESPERA MAT. (SOLICITANTE - 15D)', dot: 'bg-amber-600 animate-pulse' },
    ASIGNADO: { bg: 'bg-blue-50 border-blue-300', text: 'text-blue-800', label: 'ASIGNADO', dot: 'bg-blue-500' },
    EN_EJECUCION: { bg: 'bg-indigo-50 border-indigo-300', text: 'text-indigo-900', label: 'EN EJECUCIÓN (CAMPO)', dot: 'bg-indigo-500' },
    RESUELTO: { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800', label: 'RESUELTO', dot: 'bg-emerald-500' },
    // Compatibilidad
    NUEVO: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', label: 'REPORTADO', dot: 'bg-amber-500' },
    EN_PROCESO: { bg: 'bg-blue-50 border-blue-300', text: 'text-blue-800', label: 'ASIGNADO', dot: 'bg-blue-500' },
    CERRADO: { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800', label: 'RESUELTO', dot: 'bg-emerald-500' },
  };

  const current = styles[status] || styles.REPORTADO;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.bg} ${current.text} shadow-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} mr-1.5`}></span>
      {current.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const styles: Record<string, { bg: string; label: string }> = {
    BAJA: { bg: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Baja' },
    MEDIA: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Media' },
    ALTA: { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Alta' },
    CRITICA: { bg: 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs', label: '¡CRÍTICA!' },
  };

  const current = styles[priority] || styles.MEDIA;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${current.bg}`}>
      {current.label}
    </span>
  );
};

interface UrgencyBadgeProps {
  urgency: TicketUrgency | string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    BAJA: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Baja' },
    MEDIA: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Media' },
    ALTA: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', label: 'Alta' },
    CRITICA: { bg: 'bg-rose-100 border-rose-400', text: 'text-rose-900 font-bold', label: '¡Crítica!' },
  };

  const current = styles[urgency] || styles.MEDIA;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  );
};

interface ComplexityBadgeProps {
  complexity?: TicketComplejidad | string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity = 'BAJA' }) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    BAJA: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', label: 'Complejidad: Baja' },
    MEDIA: { bg: 'bg-sky-100 border-sky-300', text: 'text-sky-800', label: 'Complejidad: Media' },
    ALTA: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-800', label: 'Complejidad: Alta' },
    COMPLEJA: { bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800 font-bold', label: 'Complejidad: Crítica' },
  };

  const current = styles[complexity] || styles.BAJA;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium border ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  );
};

