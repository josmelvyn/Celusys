import type { RepairStatus } from '@/app/generated/prisma/client'

export const REPAIR_STATUSES: RepairStatus[] = [
  'RECIBIDO',
  'DIAGNOSTICO',
  'ESPERANDO_REPUESTO',
  'EN_REPARACION',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
]

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  RECIBIDO: 'Recibido',
  DIAGNOSTICO: 'En diagnóstico',
  ESPERANDO_REPUESTO: 'Esperando repuesto',
  EN_REPARACION: 'En reparación',
  LISTO: 'Listo para entrega',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export const REPAIR_STATUS_STYLES: Record<RepairStatus, string> = {
  RECIBIDO: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  DIAGNOSTICO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ESPERANDO_REPUESTO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  EN_REPARACION: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  LISTO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ENTREGADO: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  CANCELADO: 'bg-red-500/10 text-red-400 border-red-500/20',
}

/** Órdenes cerradas: ya no admiten cambios de estado ni de repuestos. */
export const CLOSED_STATUSES: RepairStatus[] = ['ENTREGADO', 'CANCELADO']

export function isClosed(status: RepairStatus) {
  return CLOSED_STATUSES.includes(status)
}
