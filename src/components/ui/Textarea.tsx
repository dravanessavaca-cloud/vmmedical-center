import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className, id, ...props
}, ref) => {
  const areaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={areaId} className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>}
      <textarea ref={ref} id={areaId} className={cn('w-full px-3 py-2 rounded-lg border text-sm font-sans transition-colors resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent', error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400', className)} {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'