import { cn } from '@/utils'
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from '@/utils'

interface BadgeProps { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'; className?: string }

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700', success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800', danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800', gray: 'bg-gray-100 text-gray-500',
  }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>{children}</span>
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', APPOINTMENT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600')}>{APPOINTMENT_STATUS_LABELS[status] ?? status}</span>
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = { admin: 'bg-blue-100 text-blue-800', recepcionista: 'bg-teal-50 text-teal-700', medico: 'bg-amber-100 text-amber-800', podologo: 'bg-orange-100 text-orange-800' }
  const labels: Record<string, string> = { admin: 'Admin', recepcionista: 'Recepcionista', medico: 'Médico', podologo: 'Podólogo' }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colors[role] ?? 'bg-gray-100 text-gray-600')}>{labels[role] ?? role}</span>
}