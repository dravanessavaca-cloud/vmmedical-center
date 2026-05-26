import { cn, initials } from '@/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const COLORS = [
  'bg-blue-500', 'bg-teal-600', 'bg-amber-600',
  'bg-orange-600', 'bg-purple-600', 'bg-pink-600',
]

export function Avatar({ name, size = 'md', color, className }: AvatarProps) {
  const colorClass = color ?? COLORS[name.charCodeAt(0) % COLORS.length]
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0', colorClass, sizes[size], className)}>
      {initials(name)}
    </div>
  )
}
