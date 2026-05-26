// ============================================================
// VM Medical Center — Hook de historias clínicas
// ============================================================
import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'
import type { MedicalRecord, MedicalRecordInsert, MedicalRecordUpdate } from '@/types'

export function useMedicalRecords(userId: string) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByPatient = useCallback(async (patientId: string) => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('medical_records')
      .select(`*, physician:profiles(id, full_name, specialty), vital_signs(*)`)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    setLoading(false)
    if (err) { setError('Error al cargar historias clínicas.'); return }
    setRecords((data ?? []) as unknown as MedicalRecord[])
  }, [])

  const getRecord = useCallback(async (id: string) => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('medical_records')
      .select(`*, physician:profiles(id, full_name, specialty), vital_signs(*), patient:patients(*)`)
      .eq('id', id)
      .single()

    setLoading(false)
    if (err || !data) return null
    const record = data as unknown as MedicalRecord
    setCurrentRecord(record)
    return record
  }, [])

  const createRecord = useCallback(async (input: MedicalRecordInsert): Promise<MedicalRecord | null> => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('medical_records')
      .insert({ ...input, created_by: userId })
      .select(`*, physician:profiles(*), vital_signs(*)`)
      .single()

    setLoading(false)
    if (err || !data) { setError('Error al crear historia clínica.'); return null }
    const record = data as unknown as MedicalRecord
    await logAuditEvent({ action: 'INSERT', tableName: 'medical_records', recordId: record.id, newData: input as unknown as Record<string, unknown> })
    setRecords(prev => [record, ...prev])
    setCurrentRecord(record)
    return record
  }, [userId])

  const updateRecord = useCallback(async (id: string, updates: MedicalRecordUpdate): Promise<boolean> => {
    const old = records.find(r => r.id === id) ?? currentRecord
    const { data, error: err } = await supabase
      .from('medical_records')
      .update({ ...updates, updated_by: userId })
      .eq('id', id)
      .select(`*, physician:profiles(*), vital_signs(*)`)
      .single()

    if (err || !data) { setError('Error al guardar historia clínica.'); return false }
    const record = data as unknown as MedicalRecord
    await logAuditEvent({
      action: 'UPDATE', tableName: 'medical_records', recordId: id,
      oldData: old as unknown as Record<string, unknown>,
      newData: updates as unknown as Record<string, unknown>,
    })
    setCurrentRecord(record)
    setRecords(prev => prev.map(r => r.id === id ? record : r))
    return true
  }, [records, currentRecord, userId])

  return { records, currentRecord, loading, error, fetchByPatient, getRecord, createRecord, updateRecord }
}
