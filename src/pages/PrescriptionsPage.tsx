import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Trash2, Printer, FileText, ChevronRight, PlusCircle, Search } from 'lucide-react'
import { Button, Input, Select, Textarea, Modal, Avatar } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui/Card'
import { usePrescriptions, type PrescriptionItem, type Prescription } from '@/hooks/usePrescriptions'
import { usePatients } from '@/hooks/usePatients'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge, fullName } from '@/utils'
import { searchMedications, type Medication } from '@/data/medications'
import type { Profile, Patient } from '@/types'

interface PrescriptionsPageProps { profile: Profile }

const FORMS = ['Tableta','Cápsula','Jarabe','Suspensión','Ampolla','Crema','Gotas','Spray','Inhalador','Supositorio'].map(v => ({ value: v, label: v }))
const ROUTES = ['Oral','Tópico','Intramuscular','Intravenoso','Sublingual','Inhalado','Oftálmico','Ótico'].map(v => ({ value: v, label: v }))

interface RxForm {
  patient_id: string
  diagnosis: string
  notes: string
  items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
}

// Autocompletado de medicamentos
function MedicationAutocomplete({ index, register, setValue }: { index: number; register: any; setValue: any }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Medication[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const results = searchMedications(query)
    setSuggestions(results)
    setShowSuggestions(results.length > 0 && query.length >= 2)
  }, [query])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectMedication = (med: Medication) => {
    setValue(`items.${index}.medication`, med.name)
    if (med.concentrations[0]) setValue(`items.${index}.concentration`, med.concentrations[0])
    if (med.forms[0]) setValue(`items.${index}.form`, med.forms[0])
    if (med.defaultDosage) setValue(`items.${index}.dosage`, med.defaultDosage)
    if (med.defaultFrequency) setValue(`items.${index}.frequency`, med.defaultFrequency)
    if (med.defaultDuration) setValue(`items.${index}.duration`, med.defaultDuration)
    if (med.route) setValue(`items.${index}.route`, med.route)
    setQuery(med.name)
    setShowSuggestions(false)
  }

  return (
    <div className="relative col-span-2" ref={ref}>
      <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">Medicamento *</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setValue(`items.${index}.medication`, e.target.value) }}
          placeholder="Buscar medicamento..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <input type="hidden" {...register(`items.${index}.medication`, { required: true })} />
      </div>
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(med => (
            <button key={med.name} type="button" onClick={() => selectMedication(med)}
              className="w-full text-left px-4 py-2.5 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0">
              <p className="text-sm font-medium text-gray-900">{med.name}</p>
              <p className="text-xs text-gray-500">{med.concentrations.join(' · ')} · {med.forms.join(', ')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PrescriptionsPage({ profile }: PrescriptionsPageProps) {
  const { prescriptions, loading, fetchByPatient, fetchByPhysician, createPrescription, deletePrescription } = usePrescriptions(profile.id)
  const { patients, fetchPatients } = usePatients({ userId: profile.id })
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [printRx, setPrintRx] = useState<Prescription | null>(null)
  const [clinicSettings, setClinicSettings] = useState({ name: 'VM Medical Center', address: 'Valparaíso N6-105 y Don Bosco', phone: '099 990 4079 / 02-295 6516', city: 'Quito, Ecuador' })
  const canWrite = ['medico','podologo','admin'].includes(profile.role)

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<RxForm>({
    defaultValues: { diagnosis: '', notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    fetchPatients()
    loadClinicSettings()
    if (profile.role === 'medico' || profile.role === 'podologo') fetchByPhysician(profile.id)
  }, [])

  const loadClinicSettings = async () => {
    const { data } = await supabase.from('clinic_settings').select('clinic_name,address,phone,city').single()
    if (data) setClinicSettings({ name: data.clinic_name, address: data.address ?? 'Valparaíso N6-105 y Don Bosco', phone: data.phone ?? '099 990 4079 / 02-295 6516', city: data.city ?? 'Quito, Ecuador' })
  }

  const handlePatientSelect = (patient: Patient) => { setSelectedPatient(patient); fetchByPatient(patient.id) }

  const onSubmit = async (data: RxForm) => {
    if (!selectedPatient) return
    setSaving(true)
    const rx = await createPrescription(
      { patient_id: selectedPatient.id, diagnosis: data.diagnosis, notes: data.notes },
      data.items.filter(i => i.medication)
    )
    setSaving(false)
    if (rx) { setShowModal(false); reset({ diagnosis: '', notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }); fetchByPatient(selectedPatient.id) }
  }

  const filteredPatients = patients.filter(p => patientSearch === '' || `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) || p.id_number.includes(patientSearch))

  return (
    <div className="flex gap-5 h-full">
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
                      <p className="text-xs text-gray-500 mt-1">{rx.items?.filter(i => !i.deleted_at).length ?? 0} medicamento(s) · {rx.physician?.full_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => setPrintRx(rx)}>Imprimir</Button>
                      {canWrite && <button onClick={() => { if(confirm('¿Eliminar receta?')) deletePrescription(rx.id) }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                  {rx.items && rx.items.filter(i => !i.deleted_at).length > 0 && (
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

      <Modal open={showModal} onClose={() => { setShowModal(false); reset({ diagnosis: '', notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }) }} title="Nueva Receta Médica" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Diagnóstico" {...register('diagnosis')} />
            <Input label="Alergias conocidas" {...register('notes')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicamentos</p>
              <Button type="button" variant="outline" size="sm" icon={<PlusCircle size={14} />} onClick={() => append({ medication: '', dosage: '', frequency: '', duration: '' })}>Agregar</Button>
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Medicamento {index + 1}</span>
                    {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <MedicationAutocomplete index={index} register={register} setValue={setValue} />
                    <Input label="Concentración" placeholder="ej: 500mg" {...register(`items.${index}.concentration`)} />
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <Select label="Forma" options={FORMS} placeholder="Seleccionar..." {...register(`items.${index}.form`)} />
                    <Select label="Vía" options={ROUTES} placeholder="Seleccionar..." {...register(`items.${index}.route`)} />
                    <Input label="Cantidad" placeholder="ej: 1 caja" {...register(`items.${index}.quantity`)} />
                    <Input label="Dosis *" placeholder="ej: 1 tableta" {...register(`items.${index}.dosage`, { required: true })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Frecuencia *" placeholder="ej: cada 8 horas" {...register(`items.${index}.frequency`, { required: true })} />
                    <Input label="Duración *" placeholder="ej: 7 días" {...register(`items.${index}.duration`, { required: true })} />
                    <Input label="Instrucciones" placeholder="ej: tomar con alimentos" {...register(`items.${index}.instructions`)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); reset({ diagnosis: '', notes: '', items: [{ medication: '', dosage: '', frequency: '', duration: '' }] }) }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar Receta</Button>
          </div>
        </form>
      </Modal>

      {printRx && selectedPatient && (
        <PrintPrescription rx={printRx} patient={selectedPatient} clinicSettings={clinicSettings} onClose={() => setPrintRx(null)} />
      )}
    </div>
  )
}

function PrintPrescription({ rx, patient, clinicSettings, onClose }: {
  rx: Prescription; patient: Patient
  clinicSettings: { name: string; address: string; phone: string; city: string }
  onClose: () => void
}) {
  const items = rx.items?.filter(i => !i.deleted_at) ?? []
  const half = Math.ceil(items.length / 2)
  const prescItems = items.slice(0, half > 0 ? half : items.length)
  const indicItems = items.slice(half)

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="no-print flex items-center gap-3 px-6 py-3 bg-gray-100 border-b">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">← Volver</button>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">🖨️ Imprimir</button>
      </div>

      {/* Hoja A4 apaisada dividida en 2 */}
      <div className="print-page max-w-[297mm] mx-auto my-4 border border-gray-200 text-xs" style={{ minHeight: '210mm' }}>
        {/* Barra superior teal */}
        <div className="bg-[#00b4d8] h-3" />

        <div className="flex" style={{ minHeight: '180mm' }}>
          {/* COLUMNA IZQUIERDA — Prescripción */}
          <div className="flex-1 border-r-2 border-gray-300 p-6 flex flex-col">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="w-12 h-12 bg-[#00b4d8] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">VM</span>
              </div>
              <div>
                <p className="font-bold text-[#00b4d8] text-base leading-tight">VM MEDICAL CENTER</p>
                <p className="font-semibold text-gray-700 text-xs">CENTRO MÉDICO DE ESPECIALIDADES</p>
              </div>
            </div>

            {/* Datos del paciente */}
            <div className="space-y-1 mb-4 text-xs">
              <div className="flex gap-2"><span className="font-bold w-20">FECHA:</span><span>{formatDate(rx.created_at)}</span></div>
              <div className="flex gap-2"><span className="font-bold w-20">NOMBRE:</span><span className="font-medium">{fullName(patient.first_name, patient.last_name)}</span></div>
              <div className="flex gap-2"><span className="font-bold w-20">CÉDULA:</span><span>{patient.id_number}</span><span className="font-bold ml-4">EDAD:</span><span>{calculateAge(patient.date_of_birth)} años</span></div>
              {rx.notes && <div className="flex gap-2"><span className="font-bold w-20">ALERGIAS:</span><span className="text-red-600">{rx.notes}</span></div>}
              {rx.diagnosis && <div className="flex gap-2"><span className="font-bold w-20">DIAGNÓSTICO:</span><span>{rx.diagnosis}</span><span className="font-bold ml-4">CIE 10:</span></div>}
            </div>

            <div className="text-center font-bold text-sm mb-3 border-y border-gray-300 py-1">PRESCRIPCIÓN</div>

            {/* Medicamentos izquierda */}
            <div className="flex-1 space-y-3">
              {prescItems.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-bold">{idx + 1}. {item.medication} {item.concentration} {item.form}</p>
                  <p className="ml-3">Dosis: {item.dosage}</p>
                  <p className="ml-3">Frecuencia: {item.frequency}</p>
                  <p className="ml-3">Duración: {item.duration}</p>
                  {item.instructions && <p className="ml-3 italic text-gray-600">{item.instructions}</p>}
                </div>
              ))}
            </div>

            {/* Firma */}
            <div className="mt-6 pt-4">
              <div className="border-t-2 border-gray-400 pt-2 text-center">
                <p className="font-bold text-sm">{rx.physician?.full_name}</p>
                {rx.physician?.specialty && <p className="text-gray-600">{rx.physician.specialty}</p>}
                {rx.physician?.license_number && <p className="text-gray-500">Reg. MSP: {rx.physician.license_number}</p>}
                <p className="text-gray-500 mt-1">FIRMA Y SELLO</p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA — Indicaciones */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="w-12 h-12 bg-[#00b4d8] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">VM</span>
              </div>
              <div>
                <p className="font-bold text-[#00b4d8] text-base leading-tight">VM MEDICAL CENTER</p>
                <p className="font-semibold text-gray-700 text-xs">CENTRO MÉDICO DE ESPECIALIDADES</p>
                <p className="text-[#00b4d8] text-[10px] italic">" TU SALUD ES NUESTRA PRIORIDAD "</p>
              </div>
            </div>

            {/* Especialidades */}
            <div className="grid grid-cols-3 gap-1 mb-3 text-[10px] text-gray-600">
              {['Medicina General','Odontología','Podología Clínica','Laboratorio Clínico','Nutrición','Cirugía Vascular','Geriatría','Fisioterapia','Cirugía General y Laparoscópica'].map(s => (
                <div key={s} className="flex items-center gap-1"><span className="text-[#00b4d8]">•</span>{s}</div>
              ))}
            </div>

            {/* Redes sociales */}
            <div className="flex gap-4 mb-4 text-[10px] border-y border-gray-200 py-2">
              <span>📘 VM Medical Center</span>
              <span>📷 @vmmedicalcenter</span>
              <span>🎵 vmmedicalcenter</span>
            </div>

            <div className="text-center font-bold text-sm mb-3 border-b border-gray-300 pb-1">INDICACIONES</div>

            {/* Medicamentos derecha (indicaciones detalladas) */}
            <div className="flex-1 space-y-3">
              {indicItems.length > 0 ? indicItems.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-bold">{prescItems.length + idx + 1}. {item.medication} {item.concentration} {item.form}</p>
                  <p className="ml-3">Dosis: {item.dosage}</p>
                  <p className="ml-3">Frecuencia: {item.frequency}</p>
                  <p className="ml-3">Duración: {item.duration}</p>
                  {item.instructions && <p className="ml-3 italic text-gray-600">{item.instructions}</p>}
                </div>
              )) : (
                <p className="text-gray-400 text-xs italic">Indicaciones generales del médico...</p>
              )}
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="bg-[#00b4d8] text-white text-center py-2 text-xs font-medium">
          <p>Dirección: {clinicSettings.address} (Sector Centro Histórico)</p>
          <p>Teléfono: {clinicSettings.phone}</p>
        </div>
      </div>
    </div>
  )
}