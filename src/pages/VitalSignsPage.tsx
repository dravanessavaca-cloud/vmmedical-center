import { useState, useEffect } from 'react'
import { VitalSignsForm } from '@/components/vital-signs/VitalSignsForm'
import { VitalSignsDisplay } from '@/components/vital-signs/VitalSignsDisplay'
import { useVitalSigns } from '@/hooks/useVitalSigns'
import { usePatients } from '@/hooks/usePatients'
import { Card, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui'
import { fullName, calculateAge, formatDate } from '@/utils'
import type { Profile, Patient } from '@/types'

interface VitalSignsPageProps { profile: Profile }

export function VitalSignsPage({ profile }: VitalSignsPageProps) {
  const { patients, fetchPatients } = usePatients({ userId: profile.id })
  const { vitalSigns, history, fetchLatest, fetchHistory, saveVitalSigns } = useVitalSigns(profile.id)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetchPatients() }, [])

  const handleSelect = (p: Patient) => {
    setSelectedPatient(p)
    fetchLatest(p.id)
    fetchHistory(p.id)
    setSaved(false)
  }

  const filtered = patients.filter(p =>
    search === '' ||
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.id_number.includes(search)
  )

  return (
    <div className="flex gap-5">
      <div className="w-72 flex-shrink-0 space-y-2">
        <input placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filtered.slice(0, 30).map(p => (
            <button key={p.id} onClick={() => handleSelect(p)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${selectedPatient?.id === p.id ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'}`}>
              <Avatar name={fullName(p.first_name, p.last_name)} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{fullName(p.first_name, p.last_name)}</p>
                <p className="text-xs text-gray-400">{p.medical_record_number} · {calculateAge(p.date_of_birth)}a</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {!selectedPatient ? (
          <Card><p className="text-sm text-gray-400 text-center py-8">Selecciona un paciente para registrar signos vitales</p></Card>
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={fullName(selectedPatient.first_name, selectedPatient.last_name)} size="md" />
                <div>
                  <h3 className="font-medium text-gray-900">{fullName(selectedPatient.first_name, selectedPatient.last_name)}</h3>
                  <p className="text-sm text-gray-500">{selectedPatient.medical_record_number} · {calculateAge(selectedPatient.date_of_birth)} años</p>
                </div>
              </div>
              {saved && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-green-700">✓ Signos vitales guardados correctamente</div>}
              <VitalSignsForm patientId={selectedPatient.id} userId={profile.id} onSave={async (data) => { await saveVitalSigns(data); setSaved(true) }} />
            </Card>
            {vitalSigns && <Card><CardHeader title="Último registro" /><VitalSignsDisplay vitals={vitalSigns} /></Card>}
            {history.length > 1 && (
              <Card>
                <CardHeader title="Historial" />
                <div className="space-y-3">
                  {history.slice(1).map(vs => (
                    <div key={vs.id} className="border-b border-gray-50 pb-3">
                      <p className="text-xs text-gray-400 mb-2">{formatDate(vs.created_at, "d 'de' MMMM yyyy · HH:mm")}</p>
                      <VitalSignsDisplay vitals={vs} compact />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}