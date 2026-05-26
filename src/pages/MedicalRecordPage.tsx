import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Save, ChevronRight, Calendar, Activity } from 'lucide-react'
import { Button, Input, Textarea, Modal, Avatar, Tabs, Badge } from '@/components/ui'
import { Card, CardHeader } from '@/components/ui/Card'
import { VitalSignsForm } from '@/components/vital-signs/VitalSignsForm'
import { VitalSignsDisplay } from '@/components/vital-signs/VitalSignsDisplay'
import { useMedicalRecords } from '@/hooks/useMedicalRecords'
import { usePatients } from '@/hooks/usePatients'
import { useVitalSigns } from '@/hooks/useVitalSigns'
import { supabase } from '@/lib/supabase'
import { formatDate, calculateAge, fullName } from '@/utils'
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
  const canWrite = ['medico','podologo','admin'].includes(profile.role)

  useEffect(() => {
    fetchPatients()
    if (searchParams.get('patient')) loadPatient(searchParams.get('patient')!)
  }, [])

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
                    <p className="text-sm text-gray-500">{selectedPatient.medical_record_number} · {calculateAge(selectedPatient.date_of_birth)} años · CI: {selectedPatient.id_number}</p>
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
              <RecordForm
                onSave={async (data) => {
                  setSaving(true)
                  const result = editingRecord
                    ? await updateRecord(editingRecord.id, data)
                    : await createRecord({ ...data, patient_id: selectedPatient.id, physician_id: profile.id, is_complete: false })
                  setSaving(false)
                  if (result) { setShowNewForm(false); setEditingRecord(null) }
                }}
                onCancel={() => { setShowNewForm(false); setEditingRecord(null) }}
                saving={saving}
                initial={editingRecord ?? undefined}
              />
            )}

            <Card>
              <CardHeader title="Historial de consultas" subtitle={`${records.length} consultas registradas`} />
              {rLoading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-xl" />)}</div>
              : records.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No hay historias clínicas registradas</p>
                  {canWrite && <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowNewForm(true)}>Crear primera historia</Button>}
                </div>
              ) : records.map(record => <RecordCard key={record.id} record={record} onEdit={r => { setEditingRecord(r); setShowNewForm(true) }} canEdit={canWrite} />)}
            </Card>
          </>
        )}
      </div>

      <Modal open={showVitalsModal} onClose={() => setShowVitalsModal(false)} title="Registrar Signos Vitales" size="md">
        {selectedPatient && <VitalSignsForm patientId={selectedPatient.id} userId={profile.id} onSave={async (data) => { await saveVitalSigns(data); setShowVitalsModal(false) }} onCancel={() => setShowVitalsModal(false)} />}
      </Modal>
    </div>
  )
}

function RecordForm({ onSave, onCancel, saving, initial }: { onSave: (data: Partial<MedicalRecordInsert>) => void; onCancel: () => void; saving: boolean; initial?: MedicalRecord }) {
  const { register, handleSubmit } = useForm<MedicalRecordInsert>({ defaultValues: initial ?? {} })
  const TABS = [{ id: 'anamnesis', label: 'Anamnesis' }, { id: 'antecedentes', label: 'Antecedentes' }, { id: 'examen', label: 'Examen Físico' }, { id: 'diagnostico', label: 'Diagnóstico' }, { id: 'plan', label: 'Plan Terapéutico' }]
  return (
    <Card>
      <CardHeader title={initial ? 'Editar Historia' : 'Nueva Historia Clínica'} />
      <form onSubmit={handleSubmit(onSave)}>
        <Tabs tabs={TABS}>
          {(activeTab) => (
            <div className="space-y-4 min-h-[320px]">
              {activeTab === 'anamnesis' && <><Textarea label="Motivo de consulta *" rows={3} {...register('chief_complaint', { required: true })} /><Textarea label="Enfermedad actual *" rows={4} {...register('current_illness', { required: true })} /><Textarea label="Medicación habitual" rows={2} {...register('current_medications')} /></>}
              {activeTab === 'antecedentes' && <div className="grid grid-cols-2 gap-4"><Textarea label="Antecedentes personales" rows={3} {...register('personal_history')} /><Textarea label="Antecedentes quirúrgicos" rows={3} {...register('surgical_history')} /><Textarea label="Antecedentes familiares" rows={3} {...register('family_history')} /><Textarea label="Alergias" rows={3} {...register('allergies')} /></div>}
              {activeTab === 'examen' && <><Textarea label="Revisión por sistemas" rows={3} {...register('systems_review')} /><Textarea label="Examen físico general" rows={3} {...register('physical_exam_general')} /><Textarea label="Examen físico por sistemas" rows={4} {...register('physical_exam_systems')} /></>}
              {activeTab === 'diagnostico' && <><Textarea label="Diagnóstico presuntivo" rows={2} {...register('presumptive_diagnosis')} /><Textarea label="Diagnóstico definitivo" rows={2} {...register('definitive_diagnosis')} /><div className="grid grid-cols-2 gap-4"><Input label="Código CIE-10" {...register('cie10_code')} /><Input label="Descripción CIE-10" {...register('cie10_description')} /></div></>}
              {activeTab === 'plan' && <><Textarea label="Plan terapéutico" rows={3} {...register('therapeutic_plan')} /><Textarea label="Indicaciones" rows={3} {...register('indications')} /><Textarea label="Observaciones" rows={2} {...register('observations')} /><Input label="Fecha de control" type="date" {...register('follow_up_date')} /></>}
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

function RecordCard({ record, onEdit, canEdit }: { record: MedicalRecord; onEdit: (r: MedicalRecord) => void; canEdit: boolean }) {
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
          {record.definitive_diagnosis && <p className="text-xs text-teal-700 mt-0.5">{record.cie10_code} — {record.definitive_diagnosis}</p>}
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {record.chief_complaint && <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Motivo</p><p className="text-sm text-gray-700 mt-0.5">{record.chief_complaint}</p></div>}
          {record.definitive_diagnosis && <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Diagnóstico</p><p className="text-sm text-gray-700 mt-0.5">{record.cie10_code} {record.definitive_diagnosis}</p></div>}
          {record.therapeutic_plan && <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</p><p className="text-sm text-gray-700 mt-0.5">{record.therapeutic_plan}</p></div>}
          {record.follow_up_date && <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Control</p><p className="text-sm text-gray-700 mt-0.5">{formatDate(record.follow_up_date)}</p></div>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>Imprimir</Button>
            {canEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(record)}>Editar</Button>}
          </div>
        </div>
      )}
    </div>
  )
}