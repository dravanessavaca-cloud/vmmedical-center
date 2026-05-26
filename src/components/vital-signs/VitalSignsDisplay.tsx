import { cn, bmiCategory } from '@/utils'
import type { VitalSigns } from '@/types'

interface VitalSignsDisplayProps { vitals: VitalSigns; compact?: boolean; className?: string }

export function VitalSignsDisplay({ vitals, compact = false, className }: VitalSignsDisplayProps) {
  const metrics = [
    { label: 'Peso', value: vitals.weight_kg ? `${vitals.weight_kg} kg` : null },
    { label: 'Talla', value: vitals.height_cm ? `${vitals.height_cm} cm` : null },
    { label: 'IMC', value: vitals.bmi ? String(vitals.bmi) : null, extra: vitals.bmi ? bmiCategory(vitals.bmi).label : undefined, extraColor: vitals.bmi ? bmiCategory(vitals.bmi).color : undefined },
    { label: 'T°', value: vitals.temperature_c ? `${vitals.temperature_c}°C` : null },
    { label: 'FC', value: vitals.heart_rate_bpm ? `${vitals.heart_rate_bpm} bpm` : null },
    { label: 'FR', value: vitals.respiratory_rate_rpm ? `${vitals.respiratory_rate_rpm} rpm` : null },
    { label: 'SpO₂', value: vitals.oxygen_saturation_pct ? `${vitals.oxygen_saturation_pct}%` : null },
    { label: 'PA', value: vitals.systolic_bp && vitals.diastolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : null },
    { label: 'Glucosa', value: vitals.blood_glucose_mgdl ? `${vitals.blood_glucose_mgdl} mg/dL` : null },
  ].filter(m => m.value !== null)

  if (metrics.length === 0) return null

  return (
    <div className={cn('', className)}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        Signos Vitales {compact ? '' : '— Último registro'}
      </p>
      <div className="flex flex-wrap gap-2">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
            <p className="text-sm font-medium text-gray-800">{m.value}</p>
            {m.extra && <p className={cn('text-[10px]', m.extraColor)}>{m.extra}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}