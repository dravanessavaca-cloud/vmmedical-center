import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'
import type { Patient, PatientInsert, PatientUpdate } from '@/types'

export function usePatients({ userId }: { userId: string }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = useCallback(async (search = '') => {
    setLoading(true); setError(null)
    let query = supabase.from('patients').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
    if (search.trim()) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,id_number.ilike.%${search}%,phone.ilike.%${search}%,medical_record_number.ilike.%${search}%`)
    const { data, error: err } = await query
    setLoading(false)
    if (err) { setError('Error al cargar pacientes.'); return }
    setPatients((data ?? []) as Patient[])
  }, [])

  const getPatient = useCallback(async (id: string): Promise<Patient | null> => {
    const { data, error: err } = await supabase.from('patients').select('*').eq('id', id).single()
    if (err || !data) return null
    return data as Patient
  }, [])

  const createPatient = useCallback(async (input: PatientInsert): Promise<Patient | null> => {
    setLoading(true)
    const { data, error: err } = await supabase.from('patients').insert({ ...input, created_by: userId }).select().single()
    setLoading(false)
    if (err || !data) { setError('Error al crear paciente: ' + (err?.message ?? '')); return null }
    const patient = data as Patient
    await logAuditEvent({ action: 'INSERT', tableName: 'patients', recordId: patient.id, newData: patient as unknown as Record<string, unknown> })
    setPatients(prev => [patient, ...prev])
    return patient
  }, [userId])

  const updatePatient = useCallback(async (id: string, updates: PatientUpdate): Promise<boolean> => {
    const { data, error: err } = await supabase.from('patients').update({ ...updates, updated_by: userId }).eq('id', id).select().single()
    if (err || !data) { setError('Error al actualizar paciente.'); return false }
    setPatients(prev => prev.map(p => p.id === id ? data as Patient : p))
    return true
  }, [userId])

  const deletePatient = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('patients').update({ deleted_at: new Date().toISOString(), updated_by: userId }).eq('id', id)
    if (err) { setError('Error al eliminar paciente.'); return false }
    setPatients(prev => prev.filter(p => p.id !== id))
    return true
  }, [userId])

  return { patients, loading, error, fetchPatients, getPatient, createPatient, updatePatient, deletePatient }
}