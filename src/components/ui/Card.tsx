import { cn } from '@/utils'

interface CardProps { children: React.ReactNode; className?: string; padding?: boolean }

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode }

export function CardHeader({ title, subtitle, actions }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface StatCardProps { label: string; value: string | number; change?: string; changeType?: 'up' | 'down' | 'neutral'; icon?: React.ReactNode; iconBg?: string }

export function StatCard({ label, value, change, changeType = 'neutral', icon, iconBg }: StatCardProps) {
  const changeColors = { up: 'text-green-600', down: 'text-red-600', neutral: 'text-gray-500' }
  return (
    <Card>
      {icon && <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', iconBg ?? 'bg-teal-50')}>{icon}</div>}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-medium text-gray-900 mt-1">{value}</p>
      {change && <p className={cn('text-xs mt-1', changeColors[changeType])}>{change}</p>}
    </Card>
  )
}