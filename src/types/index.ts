export type UserRole = 'admin' | 'recepcionista' | 'medico' | 'podologo'

export interface Profile {
  id: string; email: string; full_name: string; role: UserRole
  specialty?: string; license_number?: string; phone?: string
  avatar_url?: string; is_active: boolean; created_at: string; updated_at: string
}

export interface Patient {
  id: string; medical_record_number: string; first_name: string; last_name: string
  id_number: string; date_of_birth: string; gender: 'masculino' | 'femenino' | 'otro'
  blood_type?: string; phone: string; email?: string; address?: string; city?: string
  occupation?: string; emergency_contact_name?: string; emergency_contact_phone?: string
  emergency_contact_relation?: string; insurance_company?: string; insurance_number?: string
  notes?: string; is_active: boolean; created_by: string; updated_by?: string
  created_at: string; updated_at: string; deleted_at?: string
}

export type PatientInsert = Omit<Patient, 'id' | 'medical_record_number' | 'created_at' | 'updated_at'>
export type PatientUpdate = Partial<PatientInsert>

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio'
export type AppointmentType = 'consulta_medica' | 'consulta_podologica' | 'control' | 'procedimiento' | 'certificado' | 'otro'

export interface Appointment {
  id: string; patient_id: string; professional_id: string
  appointment_date: string; appointment_time: string; duration_minutes: number
  type: AppointmentType; reason: string; status: AppointmentStatus
  notes?: string; google_event_id?: string; google_calendar_id?: string
  sync_status?: string; last_synced_at?: string; cancelled_reason?: string
  created_by: string; updated_by?: string; created_at: string; updated_at: string
  patient?: Patient; professional?: Profile
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient' | 'professional'>
export type AppointmentUpdate = Partial<AppointmentInsert>

export interface MedicalRecord {
  id: string; patient_id: string; appointment_id?: string; physician_id: string
  chief_complaint: string; current_illness: string; personal_history?: string
  surgical_history?: string; family_history?: string; allergies?: string
  current_medications?: string; systems_review?: string; physical_exam_general?: string
  physical_exam_systems?: string; presumptive_diagnosis?: string; definitive_diagnosis?: string
  cie10_code?: string; cie10_description?: string; therapeutic_plan?: string
  indications?: string; observations?: string; follow_up_date?: string
  is_complete: boolean; created_by: string; updated_by?: string
  created_at: string; updated_at: string; deleted_at?: string
  patient?: Patient; physician?: Profile; vital_signs?: VitalSigns
}

export type MedicalRecordInsert = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at' | 'patient' | 'physician' | 'vital_signs'>
export type MedicalRecordUpdate = Partial<MedicalRecordInsert>

export interface VitalSigns {
  id: string; patient_id: string; appointment_id?: string; medical_record_id?: string
  weight_kg?: number; height_cm?: number; bmi?: number; temperature_c?: number
  heart_rate_bpm?: number; respiratory_rate_rpm?: number; oxygen_saturation_pct?: number
  systolic_bp?: number; diastolic_bp?: number; blood_glucose_mgdl?: number
  observations?: string; recorded_by: string; created_at: string; updated_at: string
  recorder?: Profile
}

export type VitalSignsInsert = Omit<VitalSigns, 'id' | 'created_at' | 'updated_at' | 'recorder' | 'bmi'>
export type VitalSignsUpdate = Partial<VitalSignsInsert>

export interface SelectOption { value: string; label: string }
export interface PaginationState { page: number; pageSize: number; total: number }
export interface FilterState { search: string; dateFrom?: string; dateTo?: string; status?: string; professional?: string }