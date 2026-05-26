import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, Printer, FileText, ChevronRight, PlusCircle } from 'lucide-react'
import { Button, Input, Select, Textarea, Modal, Avatar, Badge } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui/Card'
import { usePrescriptions, type PrescriptionItem } from '@/hooks/usePrescriptions'
import { usePatients } from '@/hooks/usePatients'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge, fullName, numberToWords } from '@/utils'
import type { Profile, Patient } from '@/types'

interface PrescriptionsPageProps { profile: Profile }

const FORMS = ['Tableta','Cápsula','Jarabe','Suspensión','Ampolla','Crema','Gotas','Spray','Parche','Supositorio'].map(v => ({ value: v, label: v }))
const ROUTES = ['Oral','Tópico','Intramuscular','Intravenoso','Sublingual','Inhalado','Oftálmico','Ótico'].map(v => ({ value: v, label: v }))

interface RxForm {
  patient_id: string
  diagnosis: string
  notes: string
  items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
}

export function PrescriptionsPage({ profile }: PrescriptionsPageProps) {
  const { prescriptions, loading, fetchByPatient, fetchByPhysician, createPrescription, deletePrescription } = usePrescriptions(profile.id)
  const { patients, fetchPatients } = usePatients({ userId: profile.id })
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [printRx, setPrintRx] = useState<typeof prescriptions[0] | null>(null)
  const [clinicName, setClinicName] = useState('VM Medical Center')
  const [clinicAddress, setClinicAddress] = useState('Quito, Ecuador')

  const canWrite = ['medico','podologo','admin'].includes(profile.role)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RxForm>({
    defaultValues: { items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    fetchPatients()
    loadClinicSettings()
    if (profile.role === 'medico' || profile.role === 'podologo') {
      fetchByPhysician(profile.id)
    }
  }, [])

  const loadClinicSettings = async () => {
    const { data } = await supabase.from('clinic_settings').select('clinic_name,address').single()
    if (data) { setClinicName(data.clinic_name); setClinicAddress(data.address ?? 'Quito, Ecuador') }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    fetchByPatient(patient.id)
  }

  const onSubmit = async (data: RxForm) => {
    if (!selectedPatient) return
    setSaving(true)
    const rx = await createPrescription(
      { patient_id: selectedPatient.id, diagnosis: data.diagnosis, notes: data.notes },
      data.items
    )
    setSaving(false)
    if (rx) { setShowModal(false); reset({ items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }); fetchByPatient(selectedPatient.id) }
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
          <Card><div className="text-center py-16 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm font-medium text-gray-600">Selecciona un paciente</p></div></Card>
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
                {canWrite && <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>Nueva Receta</Button>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Recetas emitidas" subtitle={`${prescriptions.length} recetas`} />
              {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-xl" />)}</div>
              : prescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No hay recetas para este paciente</p>
                  {canWrite && <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowModal(true)}>Crear primera receta</Button>}
                </div>
              ) : prescriptions.map(rx => (
                <div key={rx.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(rx.created_at)}</p>
                      {rx.diagnosis && <p className="text-xs text-teal-700 mt-0.5">{rx.diagnosis}</p>}
                      <p className="text-xs text-gray-500 mt-1">{rx.items?.length ?? 0} medicamento(s) · {rx.physician?.full_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => setPrintRx(rx)}>Imprimir</Button>
                      {canWrite && <button onClick={() => deletePrescription(rx.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                  {rx.items && rx.items.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {rx.items.filter(i => !i.deleted_at).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="font-medium text-gray-900 min-w-0">{item.medication} {item.concentration}</span>
                          <span className="text-gray-400">·</span>
                          <span>{item.dosage} — {item.frequency} — {item.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </>
        )}
      </div>

      {/* Modal nueva receta */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset({ items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }) }} title="Nueva Receta Médica" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Diagnóstico" {...register('diagnosis')} />
            <Input label="Observaciones" {...register('notes')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicamentos</p>
              <Button type="button" variant="outline" size="sm" icon={<PlusCircle size={14} />}
                onClick={() => append({ medication: '', dosage: '', frequency: '', duration: '' })}>
                Agregar
              </Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-100 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Medicamento {index + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-2">
                      <Input label="Medicamento *" error={errors.items?.[index]?.medication?.message} {...register(`items.${index}.medication`, { required: 'Requerido' })} />
                    </div>
                    <Input label="Concentración" placeholder="ej: 500mg" {...register(`items.${index}.concentration`)} />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <Select label="Forma" options={FORMS} placeholder="Seleccionar..." {...register(`items.${index}.form`)} />
                    <Input label="Cantidad" placeholder="ej: 1 caja" {...register(`items.${index}.quantity`)} />
                    <Select label="Vía" options={ROUTES} placeholder="Seleccionar..." {...register(`items.${index}.route`)} />
                    <Input label="Dosis *" placeholder="ej: 1 tableta" error={errors.items?.[index]?.dosage?.message} {...register(`items.${index}.dosage`, { required: 'Requerido' })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Frecuencia *" placeholder="ej: cada 8 horas" error={errors.items?.[index]?.frequency?.message} {...register(`items.${index}.frequency`, { required: 'Requerido' })} />
                    <Input label="Duración *" placeholder="ej: 7 días" error={errors.items?.[index]?.duration?.message} {...register(`items.${index}.duration`, { required: 'Requerido' })} />
                    <Input label="Instrucciones" placeholder="ej: tomar con alimentos" {...register(`items.${index}.instructions`)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); reset({ items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }) }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Receta</Button>
          </div>
        </form>
      </Modal>

      {/* Vista de impresión */}
      {printRx && (
        <PrintPrescription rx={printRx} clinicName={clinicName} clinicAddress={clinicAddress} onClose={() => setPrintRx(null)} />
      )}
    </div>
  )
}

function PrintPrescription({ rx, clinicName, clinicAddress, onClose }: {
  rx: NonNullable<ReturnType<typeof usePrescriptions>['prescriptions'][0]>
  clinicName: string
  clinicAddress: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="no-print flex items-center gap-3 px-6 py-3 bg-gray-100 border-b">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">← Volver</button>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">🖨️ Imprimir</button>
      </div>

      <div className="print-page max-w-[210mm] mx-auto p-8 my-4 border border-gray-200">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b-2 border-teal-600 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-teal-700">{clinicName}</h1>
            <p className="text-xs text-gray-500">{clinicAddress}</p>
            {rx.physician?.specialty && <p className="text-xs text-gray-500">{rx.physician.specialty}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Fecha: {formatDate(rx.created_at)}</p>
            {rx.physician?.license_number && <p className="text-xs text-gray-500">Reg. MSP: {rx.physician.license_number}</p>}
          </div>
        </div>

        {/* Paciente */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Datos del Paciente</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{rx.patient ? fullName(rx.patient.first_name, rx.patient.last_name) : '—'}</span></div>
            <div><span className="text-gray-500">CI:</span> <span className="font-medium">{rx.patient?.id_number}</span></div>
            {rx.patient?.date_of_birth && <div><span className="text-gray-500">Edad:</span> <span className="font-medium">{calculateAge(rx.patient.date_of_birth)} años</span></div>}
            {rx.diagnosis && <div className="col-span-2"><span className="text-gray-500">Diagnóstico:</span> <span className="font-medium">{rx.diagnosis}</span></div>}
          </div>
        </div>

        {/* Medicamentos */}
        <div className="mb-8">
          <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">℞</span> Prescripción Médica
          </p>
          <div className="space-y-4">
            {rx.items?.filter(i => !i.deleted_at).map((item, idx) => (
              <div key={idx} className="border-l-4 border-teal-500 pl-4">
                <p className="font-semibold text-gray-900">{idx + 1}. {item.medication} {item.concentration} {item.form}</p>
                <p className="text-sm text-gray-700">Dosis: {item.dosage} — {item.frequency} — {item.duration}</p>
                {item.route && <p className="text-xs text-gray-500">Vía: {item.route}</p>}
                {item.instructions && <p className="text-xs text-gray-500 italic">{item.instructions}</p>}
                {item.quantity && <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        {rx.notes && (
          <div className="mb-8 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Indicaciones adicionales</p>
            <p className="text-sm text-gray-700">{rx.notes}</p>
          </div>
        )}

        {/* Firma */}
        <div className="mt-12 flex justify-end">
          <div className="text-center border-t-2 border-gray-400 pt-2 w-56">
            <p className="text-sm font-semibold text-gray-800">{rx.physician?.full_name}</p>
            {rx.physician?.specialty && <p className="text-xs text-gray-500">{rx.physician.specialty}</p>}
            {rx.physician?.license_number && <p className="text-xs text-gray-500">Reg. MSP: {rx.physician.license_number}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">{clinicName} · {clinicAddress} · Documento generado el {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  )
}