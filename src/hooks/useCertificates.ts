import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'

export interface Certificate {
  id: string
  patient_id: string
  physician_id: string
  appointment_id?: string
  type: 'reposo' | 'asistencia' | 'aptitud' | 'otro'
  rest_days?: number
  rest_from?: string
  rest_until?: string
  diagnosis?: string
  attended_date?: string
  attended_time?: string
  purpose?: string
  notes?: string
  is_signed: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
  patient?: { first_name: string; last_name: string; id_number: string; date_of_birth: string }
  physician?: { full_name: string; specialty?: string; license_number?: string }
}

export type CertificateInsert = Omit<Certificate, 'id' | 'created_at' | 'updated_at' | 'patient' | 'physician'>

export function useCertificates(userId: string) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByPatient = useCallback(async (patientId: string) => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('certificates')
      .select(`*, patient:patients(first_name,last_name,id_number,date_of_birth), physician:profiles(full_name,specialty,license_number)`)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (err) { setError('Error al cargar certificados.'); return }
    setCertificates((data ?? []) as unknown as Certificate[])
  }, [])

  const fetchByPhysician = useCallback(async (physicianId?: string) => {
    setLoading(true)
    let query = supabase
      .from('certificates')
      .select(`*, patient:patients(first_name,last_name,id_number,date_of_birth), physician:profiles(full_name,specialty,license_number)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (physicianId) query = query.eq('physician_id', physicianId)
    const { data, error: err } = await query.limit(50)
    setLoading(false)
    if (err) { setError('Error al cargar certificados.'); return }
    setCertificates((data ?? []) as unknown as Certificate[])
  }, [])

  const createCertificate = useCallback(async (input: Omit<CertificateInsert, 'physician_id' | 'created_by' | 'is_signed'>): Promise<Certificate | null> => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('certificates')
      .insert({ ...input, physician_id: userId, created_by: userId, is_signed: false })
      .select(`*, patient:patients(first_name,last_name,id_number,date_of_birth), physician:profiles(full_name,specialty,license_number)`)
      .single()
    setLoading(false)
    if (err || !data) { setError('Error al crear certificado.'); return null }
    const cert = data as unknown as Certificate
    await logAuditEvent({ action: 'INSERT', tableName: 'certificates', recordId: cert.id, newData: input as Record<string, unknown> })
    setCertificates(prev => [cert, ...prev])
    return cert
  }, [userId])

  const deleteCertificate = useCallback(async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from('certificates').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (err) { setError('Error al eliminar certificado.'); return false }
    setCertificates(prev => prev.filter(c => c.id !== id))
    return true
  }, [])

  return { certificates, loading, error, fetchByPatient, fetchByPhysician, createCertificate, deleteCertificate }
}