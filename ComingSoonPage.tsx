// ============================================================
// VM Medical Center — Formulario de signos vitales
// ============================================================
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Input, Textarea } from '@/components/ui'
import { calculateBMI, bmiCategory } from '@/utils'
import type { VitalSignsInsert } from '@/types'

interface VitalSignsFormProps {
  patientId: string
  appointmentId?: string
  userId: string
  onSave: (data: VitalSignsInsert) => Promise<void>
  onCancel?: () => void
}

export function VitalSignsForm({ patientId, appointmentId, userId, onSave, onCancel }: VitalSignsFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<VitalSignsInsert>()
  const [saving, setSaving] = useState(false)

  const weight = watch('weight_kg')
  const height = watch('height_cm')

  // Calcular IMC automáticamente
  useEffect(() => {
    if (weight && height) {
      const bmi = calculateBMI(Number(weight), Number(height))
      setValue('bmi', bmi)
    }
  }, [weight, height, setValue])

  const bmi = watch('bmi')
  const bmiInfo = bmi ? bmiCategory(bmi) : null

  const onSubmit = async (data: VitalSignsInsert) => {
    setSaving(true)
    await onSave({ ...data, patient_id: patientId, appointment_id: appointmentId, recorded_by: userId })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Antropometría */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Antropometría</h4>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Peso (kg)" type="number" step="0.1" placeholder="ej: 72.5" {...register('weight_kg', { valueAsNumber: true })} />
          <Input label="Talla (cm)" type="number" placeholder="ej: 168" {...register('height_cm', { valueAsNumber: true })} />
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">IMC (calculado)</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={bmi ? String(bmi) : ''}
                placeholder="Auto"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-700"
              />
            </div>
            {bmiInfo && <p className={`text-xs mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>}
          </div>
        </div>
      </div>

      {/* Signos vitales */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Signos Vitales</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Temperatura (°C)" type="number" step="0.1" placeholder="ej: 36.5" {...register('temperature_c', { valueAsNumber: true })} />
          <Input label="Frec. Cardíaca (bpm)" type="number" placeholder="ej: 78" {...register('heart_rate_bpm', { valueAsNumber: true })} />
          <Input label="Frec. Respiratoria (rpm)" type="number" placeholder="ej: 16" {...register('respiratory_rate_rpm', { valueAsNumber: true })} />
          <Input label="Saturación O₂ (%)" type="number" placeholder="ej: 98" {...register('oxygen_saturation_pct', { valueAsNumber: true })} />
        </div>
      </div>

      {/* Presión arterial */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Presión Arterial</h4>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Sistólica (mmHg)" type="number" placeholder="ej: 120" {...register('systolic_bp', { valueAsNumber: true })} />
          <Input label="Diastólica (mmHg)" type="number" placeholder="ej: 80" {...register('diastolic_bp', { valueAsNumber: true })} />
          <Input label="Glucosa (mg/dL)" type="number" placeholder="ej: 95" {...register('blood_glucose_mgdl', { valueAsNumber: true })} />
        </div>
      </div>

      <Textarea label="Observaciones" placeholder="Observaciones adicionales..." {...register('observations')} />

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        {onCancel && <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" loading={saving}>Guardar Signos Vitales</Button>
      </div>
    </form>
  )
}
