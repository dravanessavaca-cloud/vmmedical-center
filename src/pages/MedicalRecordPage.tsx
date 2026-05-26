import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Save, ChevronRight, Calendar, Activity, Printer, Upload, X } from 'lucide-react'
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
                ? <PodologyForm key={editingRecord?.id ?? 'new'} onSave={async (data) => { setSaving(true); const r = editingRecord ? await updateRecord(editingRecord.id, data) : await createRecord({ ...data, patient_id: selectedPatient.id, physician_id: profile.id, is_complete: false }); setSaving(false); if (r) { setShowNewForm(false); setEditingRecord(null) } }} onCancel={() => { setShowNewForm(false); setEditingRecord(null) }} saving={saving} initial={editingRecord ?? undefined} />
                : <MedicalForm key={editingRecord?.id ?? 'new'} onSave={async (data) => { setSaving(true); const r = editingRecord ? await updateRecord(editingRecord.id, data) : await createRecord({ ...data, patient_id: selectedPatient.id, physician_id: profile.id, is_complete: false }); setSaving(false); if (r) { setShowNewForm(false); setEditingRecord(null) } }} onCancel={() => { setShowNewForm(false); setEditingRecord(null) }} saving={saving} initial={editingRecord ?? undefined} />
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
  const [imageUrl, setImageUrl] = useState<string | null>((initial as any)?.podology_image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const CONDITIONS = ['Bromhidrosis','Xerosis','Dermatitis','Paroniquia']
  const MOBILITY = ['Silla de Ruedas','Andador','Muletas','Bastón']
  const DEVICES = ['Plantillas D','Plantillas I','Separador Int D','Separador Int I','Taloneras D','Taloneras I']

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const { data, error } = await supabase.storage.from('podology-images').upload(fileName, file)
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('podology-images').getPublicUrl(data.path)
      setImageUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  const handleRemoveImage = async () => {
    setImageUrl(null)
  }

  const handleSave = (data: any) => {
    onSave({ ...data, podology_image_url: imageUrl })
  }

  return (
    <Card>
      <CardHeader title={initial ? 'Editar Historia Podológica' : 'Nueva Historia Clínica — Podología'} />
      <form onSubmit={handleSubmit(handleSave)}>
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

          {/* Diagrama de pies */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Diagrama de pies</p>
            <div className="w-full overflow-x-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%" height="auto">
                <style>{`.contorno { fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }`}</style>
                <text x="190" y="115" textAnchor="middle" fontSize="18" fill="currentColor" opacity="0.4">Planta D</text>
                <text x="405" y="115" textAnchor="middle" fontSize="18" fill="currentColor" opacity="0.4">Planta I</text>
                <text x="655" y="95" textAnchor="middle" fontSize="18" fill="currentColor" opacity="0.4">Dorso D</text>
                <text x="800" y="95" textAnchor="middle" fontSize="18" fill="currentColor" opacity="0.4">Dorso I</text>
                <g id="vista-plantas">
                  <path className="contorno" d="M 190,470 C 155,470 135,430 135,360 C 135,280 110,230 105,185 C 102,160 110,145 122,145 C 133,145 135,160 136,172 C 138,155 144,135 155,135 C 165,135 167,152 168,168 C 170,150 178,130 188,130 C 198,130 200,150 202,168 C 205,150 213,135 224,135 C 235,135 237,155 238,175 C 242,158 258,128 272,128 C 288,128 295,155 292,190 C 288,235 270,260 272,300 C 275,345 240,410 240,445 C 240,470 220,470 190,470 Z" />
                  <path className="contorno" d="M 405,470 C 375,470 355,470 355,445 C 355,410 320,345 323,300 C 325,260 307,235 303,190 C 300,155 307,128 323,128 C 337,128 353,158 357,175 C 358,155 360,135 371,135 C 382,135 390,150 393,168 C 395,150 397,130 407,130 C 417,130 425,150 427,168 C 428,152 430,135 440,135 C 451,135 457,155 459,172 C 460,160 462,145 473,145 C 485,145 493,160 490,185 C 485,230 460,280 460,360 C 460,430 440,470 405,470 Z" />
                </g>
                <g id="vista-empeines">
                  <path className="contorno" d="M 610,470 L 613,380 C 613,340 605,300 605,240 C 605,185 588,180 585,155 C 582,135 592,125 602,125 C 610,125 613,140 614,152 C 617,135 624,120 632,120 C 640,120 642,135 644,148 C 647,130 655,115 665,115 C 675,115 677,130 679,145 C 682,125 690,110 702,110 C 714,110 717,125 719,145 C 722,128 732,120 742,120 C 755,120 762,140 760,170 C 755,245 725,320 725,370" />
                  <path className="contorno" d="M 714,410 L 700,470" />
                  <path className="contorno" d="M 590,152 C 590,143 598,143 598,152 Z" />
                  <path className="contorno" d="M 619,142 C 619,134 627,134 627,142 Z" />
                  <path className="contorno" d="M 648,135 C 648,127 658,127 658,135 Z" />
                  <path className="contorno" d="M 683,132 C 683,123 695,123 695,132 Z" />
                  <path className="contorno" d="M 723,145 C 723,132 738,132 738,145 Z" />
                  <path className="contorno" d="M 845,470 L 842,380 C 842,340 850,300 850,240 C 850,185 867,180 870,155 C 873,135 863,125 853,125 C 845,125 842,140 841,152 C 838,135 831,120 823,120 C 815,120 813,135 811,148 C 808,130 800,115 790,115 C 780,115 778,130 776,145 C 773,125 765,110 753,110 C 741,110 738,125 736,145 C 733,128 723,120 713,120 C 700,120 693,140 695,170 C 700,245 730,320 730,370" />
                  <path className="contorno" d="M 741,410 L 755,470" />
                  <path className="contorno" d="M 865,152 C 865,143 857,143 857,152 Z" />
                  <path className="contorno" d="M 836,142 C 836,134 828,134 828,142 Z" />
                  <path className="contorno" d="M 807,135 C 807,127 797,127 797,135 Z" />
                  <path className="contorno" d="M 772,132 C 772,123 760,123 760,132 Z" />
                  <path className="contorno" d="M 732,145 C 732,132 717,132 717,145 Z" />
                </g>
              </svg>
            </div>
          </div>

          {/* Imagen de lesión */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Imagen de lesión</p>
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="Lesión podológica" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
                <button type="button" onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{uploading ? 'Subiendo...' : 'Subir imagen de lesión'}</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP · máx 5MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
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
          {(record as any).podology_image_url && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Imagen de lesión</p>
              <img src={(record as any).podology_image_url} alt="Lesión" className="max-h-40 rounded-lg border border-gray-200" />
            </div>
          )}
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
        <div className="flex items-center justify-center gap-4 mb-4 pb-3 border-b-2 border-gray-300">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#00b4d8] rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-white font-bold text-lg">VM</span>
            </div>
            {isPodology && <p className="text-[10px] text-gray-500">PODOLOGÍA CLÍNICA</p>}
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-gray-800">HISTORIA CLÍNICA</h1>
        </div>
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
        <div className="mt-3">
          <p className="font-bold mb-1">EX FISICO:</p>
          <table className="w-full border border-gray-400 text-xs">
            <tbody>
              <tr>{['FC:','FR:','SATO2:','T:','PESO:','TALLA:', isPodology ? 'PR.AR.' : 'TA:'].map(h => (<td key={h} className="border border-gray-400 px-2 py-1 font-bold">{h}</td>))}</tr>
              <tr>{[...Array(7)].map((_, i) => <td key={i} className="border border-gray-400 px-2 py-3"></td>)}</tr>
            </tbody>
          </table>
          {record.physical_exam_general && <p className="mt-2 whitespace-pre-wrap">{record.physical_exam_general}</p>}
        </div>
        <div className="mt-3">
          <p><span className="font-bold">DIAG. </span><span>{record.presumptive_diagnosis ?? ''} {record.definitive_diagnosis ?? ''}</span></p>
          {record.cie10_code && <p className="text-gray-500 text-[10px]">CIE-10: {record.cie10_code} {record.cie10_description}</p>}
        </div>
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
        <div className="mt-3">
          <p className="font-bold">OBSERVACIONES:</p>
          <p className="whitespace-pre-wrap mt-1">{record.observations ?? ''}</p>
        </div>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%" height="auto">
                <style>{`.cp { fill: none; stroke: #333; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }`}</style>
                <text x="190" y="115" textAnchor="middle" fontSize="18" fill="#666">Planta D</text>
                <text x="405" y="115" textAnchor="middle" fontSize="18" fill="#666">Planta I</text>
                <text x="655" y="95" textAnchor="middle" fontSize="18" fill="#666">Dorso D</text>
                <text x="800" y="95" textAnchor="middle" fontSize="18" fill="#666">Dorso I</text>
                <path className="cp" d="M 190,470 C 155,470 135,430 135,360 C 135,280 110,230 105,185 C 102,160 110,145 122,145 C 133,145 135,160 136,172 C 138,155 144,135 155,135 C 165,135 167,152 168,168 C 170,150 178,130 188,130 C 198,130 200,150 202,168 C 205,150 213,135 224,135 C 235,135 237,155 238,175 C 242,158 258,128 272,128 C 288,128 295,155 292,190 C 288,235 270,260 272,300 C 275,345 240,410 240,445 C 240,470 220,470 190,470 Z" />
                <path className="cp" d="M 405,470 C 375,470 355,470 355,445 C 355,410 320,345 323,300 C 325,260 307,235 303,190 C 300,155 307,128 323,128 C 337,128 353,158 357,175 C 358,155 360,135 371,135 C 382,135 390,150 393,168 C 395,150 397,130 407,130 C 417,130 425,150 427,168 C 428,152 430,135 440,135 C 451,135 457,155 459,172 C 460,160 462,145 473,145 C 485,145 493,160 490,185 C 485,230 460,280 460,360 C 460,430 440,470 405,470 Z" />
                <path className="cp" d="M 610,470 L 613,380 C 613,340 605,300 605,240 C 605,185 588,180 585,155 C 582,135 592,125 602,125 C 610,125 613,140 614,152 C 617,135 624,120 632,120 C 640,120 642,135 644,148 C 647,130 655,115 665,115 C 675,115 677,130 679,145 C 682,125 690,110 702,110 C 714,110 717,125 719,145 C 722,128 732,120 742,120 C 755,120 762,140 760,170 C 755,245 725,320 725,370" />
                <path className="cp" d="M 714,410 L 700,470" />
                <path className="cp" d="M 590,152 C 590,143 598,143 598,152 Z" />
                <path className="cp" d="M 619,142 C 619,134 627,134 627,142 Z" />
                <path className="cp" d="M 648,135 C 648,127 658,127 658,135 Z" />
                <path className="cp" d="M 683,132 C 683,123 695,123 695,132 Z" />
                <path className="cp" d="M 723,145 C 723,132 738,132 738,145 Z" />
                <path className="cp" d="M 845,470 L 842,380 C 842,340 850,300 850,240 C 850,185 867,180 870,155 C 873,135 863,125 853,125 C 845,125 842,140 841,152 C 838,135 831,120 823,120 C 815,120 813,135 811,148 C 808,130 800,115 790,115 C 780,115 778,130 776,145 C 773,125 765,110 753,110 C 741,110 738,125 736,145 C 733,128 723,120 713,120 C 700,120 693,140 695,170 C 700,245 730,320 730,370" />
                <path className="cp" d="M 741,410 L 755,470" />
                <path className="cp" d="M 865,152 C 865,143 857,143 857,152 Z" />
                <path className="cp" d="M 836,142 C 836,134 828,134 828,142 Z" />
                <path className="cp" d="M 807,135 C 807,127 797,127 797,135 Z" />
                <path className="cp" d="M 772,132 C 772,123 760,123 760,132 Z" />
                <path className="cp" d="M 732,145 C 732,132 717,132 717,145 Z" />
              </svg>
              {(record as any).podology_image_url && (
                <div className="mt-3">
                  <p className="font-bold mb-1">Imagen de lesión:</p>
                  <img src={(record as any).podology_image_url} alt="Lesión" className="max-h-48 rounded border border-gray-300" />
                </div>
              )}
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