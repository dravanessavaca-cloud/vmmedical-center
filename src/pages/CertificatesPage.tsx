import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Printer, Award, ChevronRight } from 'lucide-react'
import { Button, Input, Select, Textarea, Modal, Avatar } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui/Card'
import { useCertificates, type Certificate } from '@/hooks/useCertificates'
import { usePatients } from '@/hooks/usePatients'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateLong, calculateAge, fullName, numberToWords, todayISO } from '@/utils'
import type { Profile, Patient } from '@/types'

interface CertificatesPageProps { profile: Profile }

const CERT_TYPES = [
  { value: 'reposo', label: 'Certificado de Reposo' },
  { value: 'asistencia', label: 'Certificado de Asistencia' },
  { value: 'aptitud', label: 'Certificado de Aptitud' },
  { value: 'otro', label: 'Otro Certificado' },
]

export function CertificatesPage({ profile }: CertificatesPageProps) {
  const { certificates, loading, fetchByPatient, createCertificate, deleteCertificate } = useCertificates(profile.id)
  const { patients, fetchPatients } = usePatients({ userId: profile.id })
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [printCert, setPrintCert] = useState<Certificate | null>(null)
  const [certType, setCertType] = useState<string>('reposo')
  const [clinicName, setClinicName] = useState('VM Medical Center')
  const [clinicAddress, setClinicAddress] = useState('Quito, Ecuador')
  const [clinicPhone, setClinicPhone] = useState('')

  const canWrite = ['medico','podologo','admin'].includes(profile.role)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Omit<Certificate, 'id'|'created_at'|'updated_at'|'patient'|'physician'|'physician_id'|'created_by'|'is_signed'>>()
  const watchType = watch('type')

  useEffect(() => {
    fetchPatients()
    loadClinicSettings()
  }, [])

  useEffect(() => {
    if (watchType) setCertType(watchType)
  }, [watchType])

  const loadClinicSettings = async () => {
    const { data } = await supabase.from('clinic_settings').select('clinic_name,address,phone').single()
    if (data) { setClinicName(data.clinic_name); setClinicAddress(data.address ?? 'Quito, Ecuador'); setClinicPhone(data.phone ?? '') }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    fetchByPatient(patient.id)
  }

  const onSubmit = async (data: any) => {
    if (!selectedPatient) return
    setSaving(true)
    const cert = await createCertificate({ ...data, patient_id: selectedPatient.id })
    setSaving(false)
    if (cert) { setShowModal(false); reset(); fetchByPatient(selectedPatient.id) }
  }

  const filteredPatients = patients.filter(p =>
    patientSearch === '' ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id_number.includes(patientSearch)
  )

  return (
    <div className="flex gap-5 h-full">
      {/* Panel izquierdo */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <input placeholder="Buscar paciente..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
          {filteredPatients.slice(0, 30).map(patient => (
            <button key={patient.id} onClick={() => handlePatientSelect(patient)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${selectedPatient?.id === patient.id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'}`}>
              <Avatar name={fullName(patient.first_name, patient.last_name)} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fullName(patient.first_name, patient.last_name)}</p>
                <p className="text-xs text-gray-400">{patient.medical_record_number} · {calculateAge(patient.date_of_birth)}a</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedPatient ? (
          <Card><div className="text-center py-16 text-gray-400"><Award size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium text-gray-600">Selecciona un paciente</p></div></Card>
        ) : (
          <>
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(selectedPatient.first_name, selectedPatient.last_name)} size="lg" />
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{fullName(selectedPatient.first_name, selectedPatient.last_name)}</h3>
                    <p className="text-sm text-gray-500">{selectedPatient.medical_record_number} · {calculateAge(selectedPatient.date_of_birth)} años · CI: {selectedPatient.id_number}</p>
                  </div>
                </div>
                {canWrite && <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>Nuevo Certificado</Button>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Certificados emitidos" subtitle={`${certificates.length} certificados`} />
              {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}</div>
              : certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No hay certificados para este paciente</p>
                  {canWrite && <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowModal(true)}>Crear primer certificado</Button>}
                </div>
              ) : certificates.map(cert => (
                <div key={cert.id} className="border border-gray-100 rounded-xl p-4 mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{CERT_TYPES.find(t => t.value === cert.type)?.label ?? cert.type}</span>
                      <span className="text-xs text-gray-400">{formatDate(cert.created_at)}</span>
                    </div>
                    {cert.type === 'reposo' && cert.rest_days && <p className="text-xs text-teal-700 mt-0.5">{cert.rest_days} día(s) de reposo</p>}
                    {cert.type === 'asistencia' && cert.attended_date && <p className="text-xs text-teal-700 mt-0.5">Asistencia: {formatDate(cert.attended_date)}</p>}
                    {cert.diagnosis && <p className="text-xs text-gray-500 mt-0.5">{cert.diagnosis}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{cert.physician?.full_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => setPrintCert(cert)}>Imprimir</Button>
                    {canWrite && <button onClick={() => deleteCertificate(cert.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>

      {/* Modal nuevo certificado */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="Nuevo Certificado Médico" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Tipo de certificado *" options={CERT_TYPES} error={errors.type?.message} {...register('type', { required: 'Requerido' })} />

          {certType === 'reposo' && (
            <>
              <Input label="Diagnóstico" {...register('diagnosis')} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Días de reposo *" type="number" min="1" error={errors.rest_days?.message} {...register('rest_days', { required: certType === 'reposo', valueAsNumber: true })} />
                <Input label="Desde" type="date" defaultValue={todayISO()} {...register('rest_from')} />
                <Input label="Hasta" type="date" {...register('rest_until')} />
              </div>
            </>
          )}

          {certType === 'asistencia' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Fecha de atención *" type="date" defaultValue={todayISO()} error={errors.attended_date?.message} {...register('attended_date', { required: certType === 'asistencia' })} />
              <Input label="Hora de atención" type="time" {...register('attended_time')} />
            </div>
          )}

          {(certType === 'aptitud' || certType === 'otro') && (
            <Input label="Diagnóstico / Motivo" {...register('diagnosis')} />
          )}

          <Input label="Propósito del certificado" placeholder="ej: para presentar al trabajo, a la institución educativa..." {...register('purpose')} />
          <Textarea label="Observaciones adicionales" rows={2} {...register('notes')} />

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); reset() }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Emitir Certificado</Button>
          </div>
        </form>
      </Modal>

      {/* Vista impresión */}
      {printCert && selectedPatient && (
        <PrintCertificate cert={printCert} patient={selectedPatient} clinicName={clinicName} clinicAddress={clinicAddress} clinicPhone={clinicPhone} onClose={() => setPrintCert(null)} />
      )}
    </div>
  )
}

function PrintCertificate({ cert, patient, clinicName, clinicAddress, clinicPhone, onClose }: {
  cert: Certificate; patient: Patient
  clinicName: string; clinicAddress: string; clinicPhone: string
  onClose: () => void
}) {
  const today = new Date()
  const cityDate = `Quito, ${formatDateLong(today.toISOString())}`

  const certTitle: Record<string, string> = {
    reposo: 'CERTIFICADO MÉDICO DE REPOSO',
    asistencia: 'CERTIFICADO DE ASISTENCIA MÉDICA',
    aptitud: 'CERTIFICADO DE APTITUD MÉDICA',
    otro: 'CERTIFICADO MÉDICO',
  }

  const patientName = fullName(patient.first_name, patient.last_name)
  const patientAge = calculateAge(patient.date_of_birth)

  let bodyText = ''
  if (cert.type === 'reposo') {
    const days = cert.rest_days ?? 0
    const daysWords = numberToWords(days)
    bodyText = `El/La paciente ${patientName}, de ${patientAge} años de edad, portador/a de la cédula de identidad N° ${patient.id_number}, fue atendido/a en esta institución${cert.diagnosis ? `, con diagnóstico de: ${cert.diagnosis}` : ''}. Por tal motivo, se recomienda REPOSO ABSOLUTO por ${daysWords} (${days}) día(s)${cert.rest_from ? `, a partir del ${formatDateLong(cert.rest_from)}` : ''}${cert.rest_until ? ` hasta el ${formatDateLong(cert.rest_until)}` : ''}.`
  } else if (cert.type === 'asistencia') {
    bodyText = `Certifico que el/la paciente ${patientName}, de ${patientAge} años de edad, portador/a de la cédula de identidad N° ${patient.id_number}, asistió a consulta médica en esta institución el día ${cert.attended_date ? formatDateLong(cert.attended_date) : formatDateLong(today.toISOString())}${cert.attended_time ? ` a las ${cert.attended_time}` : ''}.`
  } else if (cert.type === 'aptitud') {
    bodyText = `Certifico que el/la paciente ${patientName}, de ${patientAge} años de edad, portador/a de la cédula de identidad N° ${patient.id_number}, fue evaluado/a médicamente${cert.diagnosis ? `, presentando: ${cert.diagnosis}` : ''}, encontrándose en condiciones de salud adecuadas para sus actividades habituales.`
  } else {
    bodyText = `Certifico que el/la paciente ${patientName}, de ${patientAge} años de edad, portador/a de la cédula de identidad N° ${patient.id_number}, fue atendido/a en esta institución médica.${cert.diagnosis ? ` Diagnóstico: ${cert.diagnosis}.` : ''}`
  }

  if (cert.purpose) bodyText += ` El presente certificado se extiende para fines de: ${cert.purpose}.`

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="no-print flex items-center gap-3 px-6 py-3 bg-gray-100 border-b">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">← Volver</button>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">🖨️ Imprimir</button>
      </div>

      <div className="print-page max-w-[210mm] mx-auto p-12 my-4 border border-gray-200">
        {/* Encabezado */}
        <div className="text-center border-b-2 border-teal-600 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-teal-700 mb-1">{clinicName}</h1>
          <p className="text-sm text-gray-500">{clinicAddress}{clinicPhone ? ` · Tel: ${clinicPhone}` : ''}</p>
          {cert.physician?.specialty && <p className="text-sm text-gray-600 mt-1">{cert.physician.specialty}</p>}
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-center text-gray-800 mb-8 tracking-wide">{certTitle[cert.type] ?? 'CERTIFICADO MÉDICO'}</h2>

        {/* Ciudad y fecha */}
        <p className="text-sm text-gray-600 mb-6">{cityDate}</p>

        {/* Cuerpo */}
        <div className="mb-8">
          <p className="text-sm leading-relaxed text-gray-800 text-justify indent-8">
            El/La suscrito/a, <strong>{cert.physician?.full_name}</strong>{cert.physician?.specialty ? `, ${cert.physician.specialty}` : ''}{cert.physician?.license_number ? `, Reg. MSP N° ${cert.physician.license_number}` : ''}, certifica que:
          </p>
          <p className="text-sm leading-relaxed text-gray-800 text-justify mt-4 indent-8">{bodyText}</p>
          {cert.notes && <p className="text-sm leading-relaxed text-gray-700 mt-4 indent-8 italic">{cert.notes}</p>}
        </div>

        <p className="text-sm text-gray-700 mt-6">Es todo cuanto puedo certificar en honor a la verdad.</p>

        {/* Firma */}
        <div className="mt-16 flex justify-center">
          <div className="text-center border-t-2 border-gray-400 pt-3 w-64">
            <p className="text-sm font-bold text-gray-800">{cert.physician?.full_name}</p>
            {cert.physician?.specialty && <p className="text-xs text-gray-600">{cert.physician.specialty}</p>}
            {cert.physician?.license_number && <p className="text-xs text-gray-500">Reg. MSP: {cert.physician.license_number}</p>}
            <p className="text-xs text-gray-500">{clinicName}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">{clinicName} · {clinicAddress} · Documento generado el {formatDate(today.toISOString())}</p>
        </div>
      </div>
    </div>
  )
}