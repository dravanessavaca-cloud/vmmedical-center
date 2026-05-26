import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Save, ChevronRight, Calendar, Activity, Printer } from 'lucide-react'
import { Button, Input, Textarea, Modal, Avatar, Tabs, Badge } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui/Card'
import { VitalSignsForm } from '@/components/vital-signs/VitalSignsForm'
import { VitalSignsDisplay } from '@/components/vital-signs/VitalSignsDisplay'
import { useMedicalRecords } from '@/hooks/useMedicalRecords'
import { usePatients } from '@/hooks/usePatients'
import { useVitalSigns } from '@/hooks/useVitalSigns'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge, fullName, todayISO } from '@/utils'
import type { Profile, MedicalRecord, MedicalRecordInsert, Patient } from '@/types'

interface MedicalRecordPageProps { profile: Profile }

export function MedicalRecordPage({ profile }: MedicalRecordPageProps) {
  const [searchParams] = useSearchParams()
  const { records, loading: rLoading, fetchByPatient, createRecord, updateRecord } = useMedicalRecords(profile.id)
  const { patients, fetchPatients } = usePatients({ userId: profile.id })
  const { vitalSigns, fetchLatest, saveVitalSigns } = useVitalSigns(profile.id)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [printRecord, setPrintRecord] = useState<MedicalRecord | null>(null)
  const [clinicSettings, setClinicSettings] = useState({ name: 'VM Medical Center', address: 'Valparaíso N6-105 y Don Bosco', phone: '099 990 4079 / 02-295 6516' })
  const canWrite = ['medico','podologo','admin'].includes(profile.role)
  const isPodologo = profile.role === 'podologo'

  useEffect(() => {
    fetchPatients()
    loadClinic()
    if (searchParams.get('patient')) loadPatient(searchParams.get('patient')!)
  }, [])

  const loadClinic = async () => {
    const { data } = await supabase.from('clinic_settings').select('clinic_name,address,phone').single()
    if (data) setClinicSettings({ name: data.clinic_name, address: data.address ?? '', phone: data.phone ?? '' })
  }

  const loadPatient = async (id: string) => {
    const { data } = await supabase.from('patients').select('*').eq('id', id).single()
    if (data) { setSelectedPatient(data as unknown as Patient); fetchByPatient(id); fetchLatest(id) }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient); fetchByPatient(patient.id); fetchLatest(patient.id)
    setShowNewForm(false); setEditingRecord(null)
  }

  const filteredPatients = patients.filter(p =>
    patientSearch === '' ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.id_number.includes(patientSearch) || p.medical_record_number.toLowerCase().includes(patientSearch.toLowerCase())
  )

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
              <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
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
                    <p className="text-sm text-gray-500">{selectedPatient.medical_record_number} · {calculateAge(selectedPatient.date_of_birth)} años · CI: {selectedPatient.id_number} · Tel: {selectedPatient.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<Activity size={14} />} onClick={() => setShowVitalsModal(true)}>Signos Vitales</Button>
                  {canWrite && <Button size="sm" icon={<Plus size={14} />} onClick={() => { setShowNewForm(true); setEditingRecord(null) }}>Nueva Historia</Button>}
                </div>
              </div>
              {vitalSigns && <VitalSignsDisplay vitals={vitalSigns} compact className="mt-3 pt-3 border-t border-gray-100" />}
            </Card>

            {showNewForm && canWrite && (
              isPodologo
                ? <PodologyForm onSave={async (data) => { setSaving(true); const r = editingRecord ? await updateRecord(editingRecord.id, data) : await createRecord({ ...data, patient_id: selectedPatient.id, physician_id: profile.id, is_complete: false }); setSaving(false); if (r) { setShowNewForm(false); setEditingRecord(null) } }} onCancel={() => { setShowNewForm(false); setEditingRecord(null) }} saving={saving} initial={editingRecord ?? undefined} />
                : <MedicalForm onSave={async (data) => { setSaving(true); const r = editingRecord ? await updateRecord(editingRecord.id, data) : await createRecord({ ...data, patient_id: selectedPatient.id, physician_id: profile.id, is_complete: false }); setSaving(false); if (r) { setShowNewForm(false); setEditingRecord(null) } }} onCancel={() => { setShowNewForm(false); setEditingRecord(null) }} saving={saving} initial={editingRecord ?? undefined} />
            )}

            <Card>
              <CardHeader title="Historial de consultas" subtitle={`${records.length} consultas`} />
              {rLoading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-xl" />)}</div>
              : records.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No hay historias clínicas registradas</p>
                  {canWrite && <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowNewForm(true)}>Crear primera historia</Button>}
                </div>
              ) : records.map(record => (
                <RecordCard key={record.id} record={record} onEdit={r => { setEditingRecord(r); setShowNewForm(true) }} canEdit={canWrite} onPrint={r => setPrintRecord(r)} />
              ))}
            </Card>
          </>
        )}
      </div>

      <Modal open={showVitalsModal} onClose={() => setShowVitalsModal(false)} title="Registrar Signos Vitales" size="md">
        {selectedPatient && <VitalSignsForm patientId={selectedPatient.id} userId={profile.id} onSave={async (data) => { await saveVitalSigns(data); setShowVitalsModal(false) }} onCancel={() => setShowVitalsModal(false)} />}
      </Modal>

      {printRecord && selectedPatient && (
        <PrintRecord record={printRecord} patient={selectedPatient} clinicSettings={clinicSettings} isPodology={isPodologo} onClose={() => setPrintRecord(null)} />
      )}
    </div>
  )
}

// ── Formulario Médico ────────────────────────────────────────
function MedicalForm({ onSave, onCancel, saving, initial }: { onSave: (data: Partial<MedicalRecordInsert>) => void; onCancel: () => void; saving: boolean; initial?: MedicalRecord }) {
  const { register, handleSubmit } = useForm<MedicalRecordInsert>({ defaultValues: initial ?? {} })
  const TABS = [
    { id: 'anamnesis', label: 'Anamnesis' },
    { id: 'antecedentes', label: 'Antecedentes' },
    { id: 'examen', label: 'Ex. Físico' },
    { id: 'diagnostico', label: 'Diagnóstico' },
    { id: 'plan', label: 'Tratamiento' },
  ]
  return (
    <Card>
      <CardHeader title={initial ? 'Editar Historia Clínica' : 'Nueva Historia Clínica — Medicina General'} />
      <form onSubmit={handleSubmit(onSave)}>
        <Tabs tabs={TABS}>
          {(activeTab) => (
            <div className="space-y-4 min-h-[300px]">
              {activeTab === 'anamnesis' && <>
                <Textarea label="MC — Motivo de Consulta *" rows={2} {...register('chief_complaint', { required: true })} />
                <Textarea label="EA — Enfermedad Actual" rows={5} {...register('current_illness')} />
                <Textarea label="Medicación habitual" rows={2} {...register('current_medications')} />
                <Textarea label="Alergias" rows={1} {...register('allergies')} />
              </>}
              {activeTab === 'antecedentes' && <div className="grid grid-cols-2 gap-4">
                <Textarea label="APP — Antecedentes Personales Patológicos" rows={4} {...register('personal_history')} />
                <Textarea label="APQX — Antecedentes Quirúrgicos" rows={4} {...register('surgical_history')} />
                <Textarea label="APF — Antecedentes Familiares" rows={4} {...register('family_history')} />
                <Textarea label="Revisión por sistemas" rows={4} {...register('systems_review')} />
              </div>}
              {activeTab === 'examen' && <>
                <Textarea label="Examen físico general" rows={4} {...register('physical_exam_general')} />
                <Textarea label="Examen físico por sistemas" rows={4} {...register('physical_exam_systems')} />
              </>}
              {activeTab === 'diagnostico' && <>
                <Textarea label="DIAG — Diagnóstico presuntivo" rows={2} {...register('presumptive_diagnosis')} />
                <Textarea label="Diagnóstico definitivo" rows={2} {...register('definitive_diagnosis')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Código CIE-10" placeholder="ej: J00" {...register('cie10_code')} />
                  <Input label="Descripción CIE-10" {...register('cie10_description')} />
                </div>
              </>}
              {activeTab === 'plan' && <>
                <Textarea label="TTO — Tratamiento / Plan terapéutico" rows={4} {...register('therapeutic_plan')} />
                <Textarea label="Indicaciones al paciente" rows={3} {...register('indications')} />
                <Textarea label="OBSERVACIONES" rows={3} {...register('observations')} />
                <Input label="Fecha de control" type="date" {...register('follow_up_date')} />
              </>}
            </div>
          )}
        </Tabs>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" loading={saving} icon={<Save size={15} />}>{initial ? 'Actualizar' : 'Guardar Historia'}</Button>
        </div>
      </form>
    </Card>
  )
}

// ── Formulario Podología ──────────────────────────────────────
function PodologyForm({ onSave, onCancel, saving, initial }: { onSave: (data: Partial<MedicalRecordInsert>) => void; onCancel: () => void; saving: boolean; initial?: MedicalRecord }) {
  const { register, handleSubmit } = useForm<MedicalRecordInsert & { podology_conditions: string[]; podology_mobility: string[] }>({ defaultValues: initial ?? {} })
  const CONDITIONS = ['Bromhidrosis','Xerosis','Dermatitis','Paroniquia']
  const MOBILITY = ['Silla de Ruedas','Andador','Muletas','Bastón']
  const DEVICES = ['Plantillas D','Plantillas I','Separador Int D','Separador Int I','Taloneras D','Taloneras I']

  return (
    <Card>
      <CardHeader title={initial ? 'Editar Historia Podológica' : 'Nueva Historia Clínica — Podología'} />
      <form onSubmit={handleSubmit(onSave)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="ALERGIAS" rows={1} {...register('allergies')} />
            <Textarea label="APP — Antecedentes Personales" rows={2} {...register('personal_history')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="APF — Antecedentes Familiares" rows={2} {...register('family_history')} />
            <Textarea label="MC — Motivo de Consulta *" rows={2} {...register('chief_complaint', { required: true })} />
          </div>
          <Textarea label="EA — Enfermedad Actual" rows={4} {...register('current_illness')} />

          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Examen Físico</p>
            <Textarea label="Hallazgos del examen físico" rows={3} {...register('physical_exam_general')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Textarea label="DX — Diagnóstico" rows={3} {...register('definitive_diagnosis')} />
            <Textarea label="TTO — Tratamiento" rows={3} {...register('therapeutic_plan')} />
          </div>
          <Textarea label="OBSERVACIONES" rows={3} {...register('observations')} />

          {/* Ubicación de patologías */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ubicación de Patologías</p>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {CONDITIONS.map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                  <span className="text-sm text-gray-700">{c}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {MOBILITY.map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                  <span className="text-sm text-gray-700">{m}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {DEVICES.map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                  <span className="text-sm text-gray-700">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <Textarea label="Indicaciones / Plan de seguimiento" rows={2} {...register('indications')} />
          <Input label="Fecha de control" type="date" {...register('follow_up_date')} />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" loading={saving} icon={<Save size={15} />}>{initial ? 'Actualizar' : 'Guardar Historia'}</Button>
        </div>
      </form>
    </Card>
  )
}

// ── Tarjeta de historial ──────────────────────────────────────
function RecordCard({ record, onEdit, canEdit, onPrint }: { record: MedicalRecord; onEdit: (r: MedicalRecord) => void; canEdit: boolean; onPrint: (r: MedicalRecord) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{formatDate(record.created_at)}</span>
            <Badge variant={record.is_complete ? 'success' : 'warning'}>{record.is_complete ? 'Completa' : 'En proceso'}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{record.chief_complaint}</p>
          {record.definitive_diagnosis && <p className="text-xs text-teal-700 mt-0.5">{record.cie10_code} {record.definitive_diagnosis}</p>}
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {record.chief_complaint && <Field label="MC" value={record.chief_complaint} />}
          {record.current_illness && <Field label="EA" value={record.current_illness} />}
          {record.personal_history && <Field label="APP" value={record.personal_history} />}
          {record.definitive_diagnosis && <Field label="DX" value={`${record.cie10_code ?? ''} ${record.definitive_diagnosis}`} />}
          {record.therapeutic_plan && <Field label="TTO" value={record.therapeutic_plan} />}
          {record.observations && <Field label="Observaciones" value={record.observations} />}
          {record.follow_up_date && <Field label="Control" value={formatDate(record.follow_up_date)} />}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => onPrint(record)}>Imprimir</Button>
            {canEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(record)}>Editar</Button>}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

// ── Impresión Historia Clínica ────────────────────────────────
function PrintRecord({ record, patient, clinicSettings, isPodology, onClose }: {
  record: MedicalRecord; patient: Patient
  clinicSettings: { name: string; address: string; phone: string }
  isPodology: boolean; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="no-print flex items-center gap-3 px-6 py-3 bg-gray-100 border-b">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">← Volver</button>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700">🖨️ Imprimir</button>
      </div>

      <div className="print-page max-w-[210mm] mx-auto p-8 my-4 border border-gray-200 text-xs">
        {/* Encabezado */}
        <div className="flex items-center justify-center gap-4 mb-4 pb-3 border-b-2 border-gray-300">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#00b4d8] rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-white font-bold text-lg">VM</span>
            </div>
            {isPodology && <p className="text-[10px] text-gray-500">PODOLOGÍA CLÍNICA</p>}
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-gray-800">HISTORIA CLÍNICA</h1>
        </div>

        {/* Datos del paciente */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-xs">
          <div className="flex gap-2"><span className="font-bold">FECHA:</span><span>{formatDate(record.created_at)}</span><span className="font-bold ml-4">TELEFONO:</span><span>{patient.phone}</span></div>
          <div></div>
          <div className="flex gap-2"><span className="font-bold">NOMBRE:</span><span>{fullName(patient.first_name, patient.last_name)}</span></div>
          <div className="flex gap-2"><span className="font-bold">EDAD:</span><span>{calculateAge(patient.date_of_birth)} años</span></div>
          <div className="flex gap-2"><span className="font-bold">C.I:</span><span>{patient.id_number}</span></div>
          <div className="flex gap-2"><span className="font-bold">DIRECCIÓN:</span><span>{patient.address ?? ''}</span></div>
        </div>

        <div className="border-t border-gray-300 pt-3 space-y-2">
          {record.allergies && <div><span className="font-bold">ALERGIAS: </span><span>{record.allergies}</span></div>}
          {record.personal_history && <div><span className="font-bold">APP: </span><span>{record.personal_history}</span></div>}
          {!isPodology && record.surgical_history && <div><span className="font-bold">APQX: </span><span>{record.surgical_history}</span></div>}
          {record.family_history && <div><span className="font-bold">APF: </span><span>{record.family_history}</span></div>}
          {record.chief_complaint && <div><span className="font-bold">MC: </span><span>{record.chief_complaint}</span></div>}
          {record.current_illness && <div><span className="font-bold">EA: </span><span className="whitespace-pre-wrap">{record.current_illness}</span></div>}
        </div>

        {/* Examen físico */}
        <div className="mt-3">
          <p className="font-bold mb-1">EX FISICO:</p>
          <table className="w-full border border-gray-400 text-xs">
            <tbody>
              <tr>
                {['FC:','FR:','SATO2:','T:','PESO:','TALLA:', isPodology ? 'PR.AR.' : 'TA:'].map(h => (
                  <td key={h} className="border border-gray-400 px-2 py-1 font-bold">{h}</td>
                ))}
              </tr>
              <tr>
                {[...Array(7)].map((_, i) => <td key={i} className="border border-gray-400 px-2 py-3"></td>)}
              </tr>
            </tbody>
          </table>
          {record.physical_exam_general && <p className="mt-2 whitespace-pre-wrap">{record.physical_exam_general}</p>}
        </div>

        {/* Diagnóstico */}
        <div className="mt-3">
          <p><span className="font-bold">DIAG. </span><span>{record.presumptive_diagnosis ?? ''} {record.definitive_diagnosis ?? ''}</span></p>
          {record.cie10_code && <p className="text-gray-500 text-[10px]">CIE-10: {record.cie10_code} {record.cie10_description}</p>}
        </div>

        {/* Tratamiento */}
        <div className="mt-3">
          <p className="font-bold mb-1">TTO.</p>
          <table className="w-full border border-gray-400 text-xs">
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="border border-gray-400 px-2 py-2 w-1/2">{i === 0 ? record.therapeutic_plan : ''}</td>
                  <td className="border border-gray-400 px-2 py-2 w-1/2">{i === 0 ? record.indications : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observaciones */}
        <div className="mt-3">
          <p className="font-bold">OBSERVACIONES:</p>
          <p className="whitespace-pre-wrap mt-1">{record.observations ?? ''}</p>
        </div>

        {/* Sección podología */}
        {isPodology && (
          <div className="mt-4 border-t border-gray-300 pt-3">
            <p className="font-bold mb-2">UBICACIÓN DE PATOLOGÍAS:</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['BROMHIDROSIS','XEROSIS','SILLA DE RUEDAS','ANDADOR','DERMATITIS','PARONIQUIA','MULETAS','BASTÓN'].map(c => (
                <div key={c} className="flex items-center gap-1 border border-gray-300 px-2 py-1">
                  <div className="w-3 h-3 border border-gray-400 flex-shrink-0"></div>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="font-bold mb-2">Diagrama de pies:</p>
              <div className="flex justify-center gap-8">
                {/* Pies SVG simplificados */}
                <div className="text-center">
                  <svg width="60" height="80" viewBox="0 0 60 80" className="mx-auto">
                    <ellipse cx="30" cy="65" rx="20" ry="15" fill="none" stroke="#333" strokeWidth="1.5"/>
                    <ellipse cx="12" cy="20" rx="6" ry="12" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="20" cy="12" rx="6" ry="10" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="30" cy="10" rx="6" ry="10" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="40" cy="13" rx="5" ry="8" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="48" cy="18" rx="4" ry="7" fill="none" stroke="#333" strokeWidth="1"/>
                  </svg>
                  <p className="text-[9px] text-gray-500">D</p>
                </div>
                <div className="text-center">
                  <svg width="60" height="80" viewBox="0 0 60 80" className="mx-auto">
                    <ellipse cx="30" cy="65" rx="20" ry="15" fill="none" stroke="#333" strokeWidth="1.5"/>
                    <ellipse cx="48" cy="20" rx="6" ry="12" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="40" cy="12" rx="6" ry="10" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="30" cy="10" rx="6" ry="10" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="20" cy="13" rx="5" ry="8" fill="none" stroke="#333" strokeWidth="1"/>
                    <ellipse cx="12" cy="18" rx="4" ry="7" fill="none" stroke="#333" strokeWidth="1"/>
                  </svg>
                  <p className="text-[9px] text-gray-500">I</p>
                </div>
              </div>
              <div className="mt-2 text-xs border border-gray-300 inline-block">
                <table>
                  <thead><tr><th className="border border-gray-300 px-2 py-1">USO DE</th><th className="border border-gray-300 px-2 py-1">D</th><th className="border border-gray-300 px-2 py-1">I</th></tr></thead>
                  <tbody>
                    {['PLANTILLAS','SEPARADOR INT','TALONERAS'].map(r => (
                      <tr key={r}><td className="border border-gray-300 px-2 py-1">{r}</td><td className="border border-gray-300 px-2 py-1 w-6"></td><td className="border border-gray-300 px-2 py-1 w-6"></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Firma */}
        <div className="mt-8 flex justify-end">
          <div className="text-center border-t-2 border-gray-400 pt-2 w-48">
            <p className="font-bold text-xs">{record.physician?.full_name ?? ''}</p>
            {record.physician?.specialty && <p className="text-[10px] text-gray-500">{record.physician.specialty}</p>}
            {record.physician?.license_number && <p className="text-[10px] text-gray-500">Reg. MSP: {record.physician.license_number}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}