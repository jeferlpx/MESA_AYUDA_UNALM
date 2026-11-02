import React from 'react';
import { TicketStatus, TicketPriority, TicketUrgency, TicketComplejidad } from '../types';

interface StatusBadgeProps {
  status: TicketStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<
    string,
    { bg: string; text: string; label: string; dot: string; border: string; glow?: string }
  > = {
    REPORTADO: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/40',
      border: 'border-amber-300/80 dark:border-amber-700/60',
      text: 'text-amber-800 dark:text-amber-300',
      label: 'REPORTADO',
      dot: 'bg-amber-500 shadow-xs shadow-amber-500/50',
    },
    OBSERVADO: {
      bg: 'bg-amber-100/90 dark:bg-amber-900/40',
      border: 'border-amber-400 dark:border-amber-600',
      text: 'text-amber-900 dark:text-amber-200 font-bold',
      label: 'OBSERVADO',
      dot: 'bg-amber-500 animate-pulse shadow-sm shadow-amber-500',
    },
    OBSERVADOS: {
      bg: 'bg-amber-100/90 dark:bg-amber-900/40',
      border: 'border-amber-400 dark:border-amber-600',
      text: 'text-amber-900 dark:text-amber-200 font-bold',
      label: 'OBSERVADO',
      dot: 'bg-amber-500 animate-pulse shadow-sm shadow-amber-500',
    },
    EVALUACION_INSPECCION: {
      bg: 'bg-purple-50/90 dark:bg-purple-950/40',
      border: 'border-purple-300/80 dark:border-purple-700/60',
      text: 'text-purple-800 dark:text-purple-300',
      label: 'INSPECCIÓN / EVAL.',
      dot: 'bg-purple-500 shadow-xs shadow-purple-500/50',
    },
    ESPERA_MATERIALES: {
      bg: 'bg-orange-50/90 dark:bg-orange-950/40',
      border: 'border-orange-300/80 dark:border-orange-700/60',
      text: 'text-orange-900 dark:text-orange-300',
      label: 'ESPERA MATERIALES',
      dot: 'bg-orange-500 shadow-xs shadow-orange-500/50',
    },
    ESPERA_MATERIALES_SOLICITANTE: {
      bg: 'bg-amber-100/90 dark:bg-amber-950/60',
      border: 'border-amber-400 dark:border-amber-600',
      text: 'text-amber-950 dark:text-amber-100 font-black',
      label: 'ESPERA MAT. (SOLICITANTE)',
      dot: 'bg-amber-600 animate-pulse shadow-sm shadow-amber-600',
    },
    ASIGNADO: {
      bg: 'bg-blue-50/90 dark:bg-blue-950/40',
      border: 'border-blue-300/80 dark:border-blue-700/60',
      text: 'text-blue-800 dark:text-blue-300',
      label: 'ASIGNADO',
      dot: 'bg-blue-500 shadow-xs shadow-blue-500/50',
    },
    EN_EJECUCION: {
      bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
      border: 'border-indigo-300/80 dark:border-indigo-700/60',
      text: 'text-indigo-900 dark:text-indigo-300 font-bold',
      label: 'EN EJECUCIÓN',
      dot: 'bg-indigo-500 animate-pulse shadow-sm shadow-indigo-500/50',
    },
    RESUELTO: {
      bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
      border: 'border-emerald-300/80 dark:border-emerald-700/60',
      text: 'text-emerald-800 dark:text-emerald-300 font-bold',
      label: 'RESUELTO',
      dot: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
    },
    NUEVO: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/40',
      border: 'border-amber-300/80 dark:border-amber-700/60',
      text: 'text-amber-800 dark:text-amber-300',
      label: 'REPORTADO',
      dot: 'bg-amber-500',
    },
    EN_PROCESO: {
      bg: 'bg-blue-50/90 dark:bg-blue-950/40',
      border: 'border-blue-300/80 dark:border-blue-700/60',
      text: 'text-blue-800 dark:text-blue-300',
      label: 'ASIGNADO',
      dot: 'bg-blue-500',
    },
    CERRADO: {
      bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
      border: 'border-emerald-300/80 dark:border-emerald-700/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      label: 'RESUELTO',
      dot: 'bg-emerald-500',
    },
  };

  const current = styles[status] || styles.REPORTADO;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1 text-xs'
      : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-bold border tracking-wide uppercase shadow-2xs backdrop-blur-xs transition-colors duration-200 ${current.bg} ${current.border} ${current.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} mr-1.5 shrink-0`} />
      <span className="truncate">{current.label}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const styles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    BAJA: {
      bg: 'bg-slate-100/80 dark:bg-slate-800/80',
      border: 'border-slate-300/80 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      label: 'Baja',
    },
    MEDIA: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40',
      border: 'border-blue-200/80 dark:border-blue-800/60',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Media',
    },
    ALTA: {
      bg: 'bg-orange-50/90 dark:bg-orange-950/50',
      border: 'border-orange-300/80 dark:border-orange-700/60',
      text: 'text-orange-800 dark:text-orange-300 font-bold',
      label: 'Alta',
    },
    CRITICA: {
      bg: 'bg-rose-600 dark:bg-rose-700',
      border: 'border-rose-700 dark:border-rose-800',
      text: 'text-white font-extrabold shadow-xs shadow-rose-600/40',
      label: '¡CRÍTICA!',
    },
  };

  const current = styles[priority] || styles.MEDIA;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors duration-150 ${current.bg} ${current.border} ${current.text}`}
    >
      {current.label}
    </span>
  );
};

interface UrgencyBadgeProps {
  urgency: TicketUrgency | string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const styles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    BAJA: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      border: 'border-emerald-200/80 dark:border-emerald-800/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      label: 'Baja',
    },
    MEDIA: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40',
      border: 'border-blue-200/80 dark:border-blue-800/60',
      text: 'text-blue-700 dark:text-blue-300',
      label: 'Media',
    },
    ALTA: {
      bg: 'bg-amber-50/90 dark:bg-amber-950/50',
      border: 'border-amber-300/80 dark:border-amber-700/60',
      text: 'text-amber-800 dark:text-amber-300 font-semibold',
      label: 'Alta',
    },
    CRITICA: {
      bg: 'bg-rose-100/90 dark:bg-rose-950/60',
      border: 'border-rose-400 dark:border-rose-700',
      text: 'text-rose-900 dark:text-rose-200 font-extrabold shadow-2xs',
      label: '¡Crítica!',
    },
  };

  const current = styles[urgency] || styles.MEDIA;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors duration-150 ${current.bg} ${current.border} ${current.text}`}
    >
      {current.label}
    </span>
  );
};

interface ComplexityBadgeProps {
  complexity?: TicketComplejidad | string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity = 'BAJA' }) => {
  const styles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    BAJA: {
      bg: 'bg-slate-100/80 dark:bg-slate-800/80',
      border: 'border-slate-300/80 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      label: 'Complejidad: Baja',
    },
    MEDIA: {
      bg: 'bg-sky-50/90 dark:bg-sky-950/40',
      border: 'border-sky-300/80 dark:border-sky-700/60',
      text: 'text-sky-800 dark:text-sky-300',
      label: 'Complejidad: Media',
    },
    ALTA: {
      bg: 'bg-purple-50/90 dark:bg-purple-950/40',
      border: 'border-purple-300/80 dark:border-purple-700/60',
      text: 'text-purple-800 dark:text-purple-300 font-semibold',
      label: 'Complejidad: Alta',
    },
    COMPLEJA: {
      bg: 'bg-rose-50/90 dark:bg-rose-950/50',
      border: 'border-rose-300/90 dark:border-rose-700',
      text: 'text-rose-800 dark:text-rose-300 font-bold',
      label: 'Complejidad: Crítica',
    },
  };

  const current = styles[complexity] || styles.BAJA;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors duration-150 ${current.bg} ${current.border} ${current.text}`}
    >
      {current.label}
    </span>
  );
};
