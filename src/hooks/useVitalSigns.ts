import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'
import type { VitalSigns, VitalSignsInsert } from '@/types'
import { calculateBMI } from '@/utils'

export function useVitalSigns(userId: string) {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null)
  const [history, setHistory] = useState<VitalSigns[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatest = useCallback(async (patientId: string) => {
    setLoading(true)
    const { data, error: err } = await supabase.from('vital_signs').select('*, recorder:profiles(full_name)').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).single()
    setLoading(false)
    if (err || !data) return
    setVitalSigns(data as unknown as VitalSigns)
  }, [])

  const fetchHistory = useCallback(async (patientId: string) => {
    const { data } = await supabase.from('vital_signs').select('*, recorder:profiles(full_name)').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(20)
    setHistory((data ?? []) as unknown as VitalSigns[])
  }, [])

  const saveVitalSigns = useCallback(async (input: VitalSignsInsert): Promise<VitalSigns | null> => {
    setLoading(true); setError(null)
    const bmi = input.weight_kg && input.height_cm ? calculateBMI(input.weight_kg, input.height_cm) : undefined
    const { data, error: err } = await supabase.from('vital_signs').insert({ ...input, bmi, recorded_by: userId }).select('*, recorder:profiles(full_name)').single()
    setLoading(false)
    if (err || !data) { setError('Error al guardar signos vitales.'); return null }
    const vs = data as unknown as VitalSigns
    await logAuditEvent({ action: 'INSERT', tableName: 'vital_signs', recordId: vs.id, newData: input as unknown as Record<string, unknown> })
    setVitalSigns(vs)
    return vs
  }, [userId])

  return { vitalSigns, history, loading, error, fetchLatest, fetchHistory, saveVitalSigns }
}