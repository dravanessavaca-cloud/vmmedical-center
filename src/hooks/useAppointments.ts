import { useState, useCallback } from 'react'
import { supabase, logAuditEvent } from '@/lib/supabase'
import type { Appointment, AppointmentInsert, AppointmentUpdate } from '@/types'

export function useAppointments({ userId, role }: { userId: string; role: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async (filters?: { date?: string; patientId?: string; professionalId?: string; status?: string }) => {
    setLoading(true); setError(null)
    let query = supabase.from('appointments').select(`*, patient:patients(id,first_name,last_name,id_number,phone,medical_record_number), professional:profiles(id,full_name,specialty,role)`).order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })
    if (role === 'medico' || role === 'podologo') query = query.eq('professional_id', userId)
    if (filters?.date) query = query.eq('appointment_date', filters.date)
    if (filters?.patientId) query = query.eq('patient_id', filters.patientId)
    if (filters?.status) query = query.eq('status', filters.status)
    const { data, error: err } = await query.limit(200)
    setLoading(false)
    if (err) { setError('Error al cargar citas.'); return }
    setAppointments((data ?? []) as unknown as Appointment[])
  }, [userId, role])

  const createAppointment = useCallback(async (input: AppointmentInsert): Promise<Appointment | null> => {
    const { data, error: err } = await supabase.from('appointments').insert({ ...input, created_by: userId, status: 'pendiente' }).select(`*, patient:patients(*), professional:profiles(*)`).single()
    if (err || !data) { setError('Error al crear cita.'); return null }
    const appt = data as unknown as Appointment
    await logAuditEvent({ action: 'INSERT', tableName: 'appointments', recordId: appt.id, newData: input as unknown as Record<string, unknown> })
    setAppointments(prev => [...prev, appt])
    return appt
  }, [userId])

  const updateAppointment = useCallback(async (id: string, updates: AppointmentUpdate): Promise<boolean> => {
    const { data, error: err } = await supabase.from('appointments').update({ ...updates, updated_by: userId }).eq('id', id).select(`*, patient:patients(*), professional:profiles(*)`).single()
    if (err || !data) { setError('Error al actualizar cita.'); return false }
    setAppointments(prev => prev.map(a => a.id === id ? data as unknown as Appointment : a))
    return true
  }, [userId])

  const updateStatus = useCallback(async (id: string, status: Appointment['status'], reason?: string): Promise<boolean> => {
    return updateAppointment(id, { status, ...(reason ? { cancelled_reason: reason } : {}) })
  }, [updateAppointment])

  return { appointments, loading, error, fetchAppointments, createAppointment, updateAppointment, updateStatus }
}