import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'
import { Button, Input, Select, Modal, AppointmentStatusBadge, Avatar } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { useAppointments } from '@/hooks/useAppointments'
import { supabase } from '@/lib/supabase'
import { formatDate, fullName, buildWhatsAppUrl, APPOINTMENT_TYPE_LABELS, todayISO } from '@/utils'
import type { Profile, Appointment, AppointmentInsert, Patient } from '@/types'

interface AgendaPageProps { profile: Profile }

const TYPE_OPTIONS = Object.entries(APPOINTMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))
const DURATION_OPTIONS = [{ value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '45', label: '45 min' }, { value: '60', label: '1 hora' }]

export function AgendaPage({ profile }: AgendaPageProps) {
  const [searchParams] = useSearchParams()
  const { appointments, loading, fetchAppointments, createAppointment, updateStatus } = useAppointments({ userId: profile.id, role: profile.role })
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [showModal, setShowModal] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const canCreate = ['admin', 'recepcionista'].includes(profile.role)
  const { register, handleSubmit, reset, setValue } = useForm<AppointmentInsert>()

  useEffect(() => {
    fetchAppointments({ date: selectedDate })
    loadData()
    if (searchParams.get('patient')) { setShowModal(true); setValue('patient_id', searchParams.get('patient')!) }
  }, [selectedDate])

  const loadData = async () => {
    const [{ data: p }, { data: pr }] = await Promise.all([
      supabase.from('patients').select('id,first_name,last_name,id_number,phone').is('deleted_at', null).limit(200),
      supabase.from('profiles').select('id,full_name,specialty,role').eq('is_active', true).in('role', ['medico','podologo']),
    ])
    setPatients((p ?? []) as unknown as Patient[])
    setProfessionals((pr ?? []) as unknown as Profile[])
  }

  const changeDate = (days: number) => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const onSubmit = async (data: AppointmentInsert) => {
    setSaving(true)
    await createAppointment({ ...data, duration_minutes: Number(data.duration_minutes), professional_id: data.professional_id || profile.id })
    setSaving(false); setShowModal(false); reset()
    fetchAppointments({ date: selectedDate })
  }

  const filteredPatients = patients.filter(p => patientSearch === '' || `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) || p.id_number.includes(patientSearch))
  const patientOptions = filteredPatients.slice(0, 50).map(p => ({ value: p.id, label: `${fullName(p.first_name, p.last_name)} — ${p.id_number}` }))
  const professionalOptions = professionals.map(p => ({ value: p.id, label: `${p.full_name}${p.specialty ? ` (${p.specialty})` : ''}` }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <div>
            <h2 className="text-lg font-medium text-gray-900">{formatDate(selectedDate, "EEEE d 'de' MMMM, yyyy")}</h2>
            <p className="text-sm text-gray-500">{appointments.length} citas</p>
          </div>
          <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
          <button onClick={() => setSelectedDate(todayISO())} className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">Hoy</button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        {canCreate && <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Nueva Cita</Button>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', count: appointments.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Pendientes', count: appointments.filter(a => a.status === 'pendiente').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Confirmadas', count: appointments.filter(a => a.status === 'confirmada').length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Atendidas', count: appointments.filter(a => a.status === 'atendida').length, color: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl px-4 py-3`}>
            <p className="text-2xl font-medium">{s.count}</p>
            <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <Card padding={false}>
        {loading ? <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        : appointments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay citas para esta fecha</p>
            {canCreate && <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowModal(true)}>Agendar cita</Button>}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map(appt => (
              <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                <div className="flex-shrink-0 w-14">
                  <p className="text-sm font-medium text-teal-700">{appt.appointment_time.slice(0,5)}</p>
                  <p className="text-xs text-gray-400">{appt.duration_minutes}min</p>
                </div>
                <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${appt.status === 'atendida' ? 'bg-green-500' : appt.status === 'confirmada' ? 'bg-blue-500' : appt.status === 'cancelada' ? 'bg-red-400' : 'bg-amber-400'}`} />
                {appt.patient && <Avatar name={fullName(appt.patient.first_name, appt.patient.last_name)} size="sm" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{appt.patient ? fullName(appt.patient.first_name, appt.patient.last_name) : '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{APPOINTMENT_TYPE_LABELS[appt.type] ?? appt.type} · {appt.reason}</p>
                </div>
                <AppointmentStatusBadge status={appt.status} />
                <div className="flex items-center gap-1.5">
                  {appt.patient?.phone && (
                    <a href={buildWhatsAppUrl({ phone: appt.patient.phone, patientName: appt.patient.first_name, date: formatDate(appt.appointment_date), time: appt.appointment_time.slice(0,5), professional: appt.professional?.full_name ?? 'el médico', clinicName: 'VM Medical Center', clinicAddress: 'Quito' })} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><MessageCircle size={15} /></a>
                  )}
                  {canCreate && appt.status !== 'atendida' && appt.status !== 'cancelada' && (
                    <select value={appt.status} onChange={e => updateStatus(appt.id, e.target.value as Appointment['status'])} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                      <option value="atendida">Atendida</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="no_asistio">No asistió</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="Agendar Nueva Cita" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">Buscar paciente</label>
            <input placeholder="Nombre o cédula..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <Select label="Paciente *" options={patientOptions} placeholder="Seleccionar..." {...register('patient_id', { required: true })} />
          </div>
          {professionalOptions.length > 0 && <Select label="Profesional *" options={professionalOptions} placeholder="Seleccionar..." {...register('professional_id', { required: true })} />}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha *" type="date" defaultValue={selectedDate} {...register('appointment_date', { required: true })} />
            <Input label="Hora *" type="time" {...register('appointment_time', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo *" options={TYPE_OPTIONS} placeholder="Seleccionar..." {...register('type', { required: true })} />
            <Select label="Duración" options={DURATION_OPTIONS} {...register('duration_minutes')} />
          </div>
          <Input label="Motivo *" {...register('reason', { required: true })} />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Agendar Cita</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}