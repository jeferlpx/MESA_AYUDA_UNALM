import { TicketPriority, TicketImpact, TicketUrgency, TicketComplejidad } from '../types';

export function calculatePriority(impact: TicketImpact, urgency: TicketUrgency): TicketPriority {
  if (urgency === 'CRITICA' || (impact === 'ALTO' && urgency === 'ALTA')) return 'CRITICA';
  if (impact === 'ALTO' || urgency === 'ALTA') return 'ALTA';
  if (impact === 'MEDIO' || urgency === 'MEDIA') return 'MEDIA';
  return 'BAJA';
}

export function calculateSLADeadlines(
  baseHoursResponse: number,
  baseHoursResolution: number,
  priority: TicketPriority,
  complexity: TicketComplejidad = 'BAJA'
): { fechaLimiteRespuesta: Date; fechaLimiteResolucion: Date } {
  const now = new Date();
  
  // Factor de aceleración SLA según Matriz de Urgencia/Prioridad ITIL v4
  let priorityMultiplier = 1.0;
  switch (priority) {
    case 'CRITICA':
      priorityMultiplier = 0.25; // 75% menos tiempo
      break;
    case 'ALTA':
      priorityMultiplier = 0.5;  // 50% menos tiempo
      break;
    case 'MEDIA':
      priorityMultiplier = 1.0;
      break;
    case 'BAJA':
      priorityMultiplier = 1.5;
      break;
  }

  // Factor de complejidad establecido por Mesa de Ayuda
  let complexityMultiplier = 1.0;
  switch (complexity) {
    case 'MEDIA':
      complexityMultiplier = 1.5; // +50% tiempo
      break;
    case 'ALTA':
      complexityMultiplier = 2.0; // +100% tiempo (duplica)
      break;
    case 'COMPLEJA':
      complexityMultiplier = 3.0; // +200% tiempo (triplica)
      break;
    case 'BAJA':
    default:
      complexityMultiplier = 1.0;
      break;
  }

  const effectiveHoursResponse = Math.max(1, Math.round(baseHoursResponse * priorityMultiplier));
  const effectiveHoursResolution = Math.max(2, Math.round(baseHoursResolution * priorityMultiplier * complexityMultiplier));

  const fechaLimiteRespuesta = new Date(now.getTime() + effectiveHoursResponse * 60 * 60 * 1000);
  const fechaLimiteResolucion = new Date(now.getTime() + effectiveHoursResolution * 60 * 60 * 1000);

  return {
    fechaLimiteRespuesta,
    fechaLimiteResolucion,
  };
}

