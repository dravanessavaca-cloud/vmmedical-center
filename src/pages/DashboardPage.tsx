import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CalendarDays, FileText, Activity, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { StatCard, Card, CardHeader } from '@/components/ui/Card'
import { AppointmentStatusBadge, Avatar, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge, fullName, buildWhatsAppUrl } from '@/utils'
import type { Profile, Appointment } from '@/types'

interface DashboardPageProps { profile: Profile }

export function DashboardPage({ profile }: DashboardPageProps) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, pendingAppointments: 0, completedToday: 0 })
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { count: pCount } = await supabase.from('patients').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    let apptQuery = supabase.from('appointments').select(`*, patient:patients(first_name,last_name,id_number,phone), professional:profiles(full_name,specialty)`).eq('appointment_date', today).order('appointment_time')
    if (profile.role === 'medico' || profile.role === 'podologo') apptQuery = apptQuery.eq('professional_id', profile.id)
    const { data: appts } = await apptQuery
    setTodayAppts((appts ?? []) as unknown as Appointment[])
    setStats({ totalPatients: pCount ?? 0, todayAppointments: appts?.length ?? 0, pendingAppointments: appts?.filter(a => a.status === 'pendiente').length ?? 0, completedToday: appts?.filter(a => a.status === 'atendida').length ?? 0 })
    setLoading(false)
  }

  const roleGreeting: Record<string, string> = { admin: 'Panel de Administración', recepcionista: 'Panel de Recepción', medico: 'Panel Médico', podologo: 'Panel Podológico' }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900">{roleGreeting[profile.role]}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Bienvenido/a, {profile.full_name} · {formatDate(today)}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pacientes registrados" value={loading ? '—' : stats.totalPatients.toLocaleString()} icon={<Users size={18} className="text-blue-600" />} iconBg="bg-blue-50" change="Total activos" />
        <StatCard label="Citas de hoy" value={loading ? '—' : stats.todayAppointments} icon={<CalendarDays size={18} className="text-teal-600" />} iconBg="bg-teal-50" change={`${stats.pendingAppointments} pendientes`} />
        <StatCard label="Atendidas hoy" value={loading ? '—' : stats.completedToday} icon={<CheckCircle2 size={18} className="text-green-600" />} iconBg="bg-green-50" change="Completadas" changeType="up" />
        <StatCard label="Pendientes" value={loading ? '—' : stats.pendingAppointments} icon={<Clock size={18} className="text-amber-600" />} iconBg="bg-amber-50" change="Por atender" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Citas de hoy" subtitle={formatDate(today, "EEEE d 'de' MMMM")} actions={<Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>Ver agenda →</Button>} />
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}</div>
          : todayAppts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay citas programadas para hoy</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/agenda')}>Agendar cita</Button>
            </div>
          ) : (
            <div className="space-y-1">
              {todayAppts.slice(0, 8).map(appt => (
                <div key={appt.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/agenda')}>
                  <span className="text-xs font-medium text-teal-700 w-12 flex-shrink-0">{appt.appointment_time.slice(0,5)}</span>
                  <div className={`w-0.5 h-8 rounded-full flex-shrink-0 ${appt.status === 'atendida' ? 'bg-green-500' : appt.status === 'confirmada' ? 'bg-blue-500' : appt.status === 'cancelada' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  {appt.patient && <Avatar name={fullName(appt.patient.first_name, appt.patient.last_name)} size="sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{appt.patient ? fullName(appt.patient.first_name, appt.patient.last_name) : '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{appt.reason}</p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                  {appt.patient?.phone && (
                    <a href={buildWhatsAppUrl({ phone: appt.patient.phone, patientName: appt.patient.first_name, date: formatDate(appt.appointment_date), time: appt.appointment_time.slice(0,5), professional: appt.professional?.full_name ?? 'el médico', clinicName: 'VM Medical Center', clinicAddress: 'Quito' })} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-bold flex-shrink-0">WA</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Accesos rápidos" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Users size={20} />, label: 'Nuevo paciente', color: 'bg-blue-50 text-blue-700', path: '/pacientes' },
              { icon: <CalendarDays size={20} />, label: 'Agendar cita', color: 'bg-teal-50 text-teal-700', path: '/agenda' },
              { icon: <Activity size={20} />, label: 'Signos vitales', color: 'bg-green-50 text-green-700', path: profile.role === 'recepcionista' ? '/signos-vitales' : '/historias' },
              { icon: <FileText size={20} />, label: 'Nueva historia', color: 'bg-amber-50 text-amber-700', path: '/historias' },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>{item.icon}</div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}