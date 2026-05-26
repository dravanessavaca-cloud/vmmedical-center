import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Search, UserPlus, FileText, CalendarPlus, Edit2, Trash2, MessageCircle } from 'lucide-react'
import { Button, Input, Select, Modal, Avatar, Badge } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { usePatients } from '@/hooks/usePatients'
import { formatDate, calculateAge, fullName, validateEcuadorianId, buildWhatsAppUrl } from '@/utils'
import type { Profile, Patient, PatientInsert } from '@/types'

interface PatientsPageProps { profile: Profile }

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))
const GENDERS = [{ value: 'masculino', label: 'Masculino' }, { value: 'femenino', label: 'Femenino' }, { value: 'otro', label: 'Otro' }]
const CITIES = ['Quito','Guayaquil','Cuenca','Ambato','Riobamba','Loja','Manta','Ibarra','Santo Domingo'].map(v => ({ value: v, label: v }))

export function PatientsPage({ profile }: PatientsPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { patients, loading, error, fetchPatients, createPatient, deletePatient } = usePatients({ userId: profile.id })
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const canCreate = profile.role !== 'medico' && profile.role !== 'podologo'
  const canDelete = profile.role === 'admin'
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientInsert>()

  useEffect(() => { fetchPatients(params.get('search') ?? '') }, [])

  const onSubmit = async (data: PatientInsert) => {
    setSaving(true)
    const patient = await createPatient({ ...data, is_active: true })
    setSaving(false)
    if (patient) { setShowModal(false); reset() }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Pacientes</h2>
          <p className="text-sm text-gray-500">{patients.length} pacientes encontrados</p>
        </div>
        {canCreate && <Button icon={<UserPlus size={16} />} onClick={() => setShowModal(true)}>Nuevo Paciente</Button>}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPatients(search)} placeholder="Buscar por nombre, cédula, teléfono..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
        </div>
        <Button variant="outline" onClick={() => fetchPatients(search)}>Buscar</Button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Paciente','HC','Cédula','Edad','Teléfono','Ciudad','Estado','Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>)}</tr>
              )) : patients.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No se encontraron pacientes</p>
                  {canCreate && <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowModal(true)}>Registrar primer paciente</Button>}
                </td></tr>
              ) : patients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName(patient.first_name, patient.last_name)} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fullName(patient.first_name, patient.last_name)}</p>
                        {patient.email && <p className="text-xs text-gray-400">{patient.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{patient.medical_record_number}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{patient.id_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{calculateAge(patient.date_of_birth)} años</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{patient.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{patient.city ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={patient.is_active ? 'success' : 'gray'}>{patient.is_active ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/historias?patient=${patient.id}`)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" title="Historia clínica"><FileText size={14} /></button>
                      <button onClick={() => navigate(`/agenda?patient=${patient.id}`)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" title="Agendar cita"><CalendarPlus size={14} /></button>
                      <a href={buildWhatsAppUrl({ phone: patient.phone, patientName: patient.first_name, date: '—', time: '—', professional: '—', clinicName: 'VM Medical Center', clinicAddress: 'Quito' })} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50" title="WhatsApp"><MessageCircle size={14} /></a>
                      {canDelete && <button onClick={() => { if(confirm(`¿Eliminar a ${fullName(patient.first_name, patient.last_name)}?`)) deletePatient(patient.id) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50" title="Eliminar"><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="Registrar Nuevo Paciente" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombres *" error={errors.first_name?.message} {...register('first_name', { required: 'Requerido' })} />
              <Input label="Apellidos *" error={errors.last_name?.message} {...register('last_name', { required: 'Requerido' })} />
              <Input label="Cédula *" error={errors.id_number?.message} {...register('id_number', { required: 'Requerido', validate: v => validateEcuadorianId(v) || 'Cédula inválida' })} />
              <Input label="Fecha de nacimiento *" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth', { required: 'Requerido' })} />
              <Select label="Género *" options={GENDERS} placeholder="Seleccionar..." error={errors.gender?.message} {...register('gender', { required: 'Requerido' })} />
              <Select label="Tipo de sangre" options={BLOOD_TYPES} placeholder="Seleccionar..." {...register('blood_type')} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Contacto</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Teléfono *" type="tel" error={errors.phone?.message} {...register('phone', { required: 'Requerido' })} />
              <Input label="Email" type="email" {...register('email')} />
              <Input label="Dirección" {...register('address')} />
              <Select label="Ciudad" options={CITIES} placeholder="Seleccionar..." {...register('city')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar Paciente</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}