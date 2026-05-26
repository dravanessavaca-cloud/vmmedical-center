import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'

export interface PrescriptionItem {
  id?: string
  prescription_id?: string
  medication: string
  concentration?: string
  form?: string
  quantity?: string
  dosage: string
  frequency: string
  duration: string
  route?: string
  instructions?: string
  sort_order?: number
  deleted_at?: string
}

export interface Prescription {
  id: string
  patient_id: string
  physician_id: string
  appointment_id?: string
  diagnosis?: string
  notes?: string
  is_signed: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
  items?: PrescriptionItem[]
  patient?: { first_name: string; last_name: string; id_number: string; date_of_birth: string }
  physician?: { full_name: string; specialty?: string; license_number?: string }
}

export function usePrescriptions(userId: string) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByPatient = useCallback(async (patientId: string) => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('prescriptions')
      .select(`*, items:prescription_items(*), patient:patients(first_name,last_name,id_number,date_of_birth), physician:profiles(full_name,specialty,license_number)`)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (err) { setError('Error al cargar recetas.'); return }
    setPrescriptions((data ?? []) as unknown as Prescription[])
  }, [])

  const fetchByPhysician = useCallback(async (physicianId?: string) => {
    setLoading(true)
    let query = supabase
      .from('prescriptions')
      .select(`*, items:prescription_items(*), patient:patients(first_name,last_name,id_number,date_of_birth), physician:profiles(full_name,specialty,license_number)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (physicianId) query = query.eq('physician_id', physicianId)
    const { data, error: err } = await query.limit(50)
    setLoading(false)
    if (err) { setError('Error al cargar recetas.'); return }
    setPrescriptions((data ?? []) as unknown as Prescription[])
  }, [])

  const createPrescription = useCallback(async (
    input: { patient_id: string; appointment_id?: string; diagnosis?: string; notes?: string },
    items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
  ): Promise<Prescription | null> => {
    setLoading(true)
    const { data: rx, error: err } = await supabase
      .from('prescriptions')
      .insert({ ...input, physician_id: userId, created_by: userId })
      .select()
      .single()
    if (err || !rx) { setError('Error al crear receta.'); setLoading(false); return null }

    const itemsToInsert = items.map((item, i) => ({ ...item, prescription_id: rx.id, sort_order: i }))
    await supabase.from('prescription_items').insert(itemsToInsert)

    await logAuditEvent({ action: 'INSERT', tableName: 'prescriptions', recordId: rx.id, newData: input as Record<string, unknown> })
    setLoading(false)
    return rx as unknown as Prescription
  }, [userId])

  const deletePrescription = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('prescriptions').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (err) { setError('Error al eliminar receta.'); return false }
    setPrescriptions(prev => prev.filter(p => p.id !== id))
    return true
  }, [])

  return { prescriptions, loading, error, fetchByPatient, fetchByPhysician, createPrescription, deletePrescription }
}