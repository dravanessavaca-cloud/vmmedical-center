import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils'
import type { SelectOption } from '@/types'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'w-full px-3 py-2 rounded-lg border text-sm font-sans transition-colors bg-white',
          'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'
