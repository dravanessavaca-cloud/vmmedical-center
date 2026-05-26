// ============================================================
// VM Medical Center — Tipos TypeScript globales
// ============================================================

export type UserRole = 'admin' | 'recepcionista' | 'medico' | 'podologo'

// ── Perfil de usuario ────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  specialty?: string
  license_number?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Paciente ─────────────────────────────────────────────────
export interface Patient {
  id: string
  medical_record_number: string   // HC-YYYY-NNNN
  first_name: string
  last_name: string
  id_number: string               // Cédula ecuatoriana
  date_of_birth: string           // ISO date
  gender: 'masculino' | 'femenino' | 'otro'
  blood_type?: string
  phone: string
  email?: string
  address?: string
  city?: string
  occupation?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  insurance_company?: string
  insurance_number?: string
  notes?: string
  is_active: boolean
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type PatientInsert = Omit<Patient, 'id' | 'medical_record_number' | 'created_at' | 'updated_at'>
export type PatientUpdate = Partial<PatientInsert>

// ── Cita médica ───────────────────────────────────────────────
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'atendida'
  | 'cancelada'
  | 'no_asistio'

export type AppointmentType =
  | 'consulta_medica'
  | 'consulta_podologica'
  | 'control'
  | 'procedimiento'
  | 'certificado'
  | 'otro'

export interface Appointment {
  id: string
  patient_id: string
  professional_id: string
  appointment_date: string        // ISO date
  appointment_time: string        // HH:MM
  duration_minutes: number
  type: AppointmentType
  reason: string
  status: AppointmentStatus
  notes?: string
  google_event_id?: string
  google_calendar_id?: string
  sync_status?: 'synced' | 'pending' | 'error' | 'not_configured'
  last_synced_at?: string
  cancelled_reason?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  // Relations (joined)
  patient?: Patient
  professional?: Profile
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient' | 'professional'>
export type AppointmentUpdate = Partial<AppointmentInsert>

// ── Historia clínica ──────────────────────────────────────────
export interface MedicalRecord {
  id: string
  patient_id: string
  appointment_id?: string
  physician_id: string
  // Anamnesis
  chief_complaint: string
  current_illness: string
  personal_history?: string
  surgical_history?: string
  family_history?: string
  allergies?: string
  current_medications?: string
  // Revisión por sistemas
  systems_review?: string
  // Examen físico
  physical_exam_general?: string
  physical_exam_systems?: string
  // Diagnóstico
  presumptive_diagnosis?: string
  definitive_diagnosis?: string
  cie10_code?: string
  cie10_description?: string
  // Plan
  therapeutic_plan?: string
  indications?: string
  observations?: string
  follow_up_date?: string
  is_complete: boolean
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Relations
  patient?: Patient
  physician?: Profile
  vital_signs?: VitalSigns
}

export type MedicalRecordInsert = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at' | 'patient' | 'physician' | 'vital_signs'>
export type MedicalRecordUpdate = Partial<MedicalRecordInsert>

// ── Signos vitales ────────────────────────────────────────────
export interface VitalSigns {
  id: string
  patient_id: string
  appointment_id?: string
  medical_record_id?: string
  weight_kg?: number
  height_cm?: number
  bmi?: number
  temperature_c?: number
  heart_rate_bpm?: number
  respiratory_rate_rpm?: number
  oxygen_saturation_pct?: number
  systolic_bp?: number
  diastolic_bp?: number
  blood_glucose_mgdl?: number
  observations?: string
  recorded_by: string
  created_at: string
  updated_at: string
  // Relations
  recorder?: Profile
}

export type VitalSignsInsert = Omit<VitalSigns, 'id' | 'created_at' | 'updated_at' | 'recorder' | 'bmi'>
export type VitalSignsUpdate = Partial<VitalSignsInsert>

// ── Audit log ─────────────────────────────────────────────────
export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: Profile
}

// ── Configuración del centro ──────────────────────────────────
export interface ClinicSettings {
  id: string
  clinic_name: string
  ruc?: string
  address?: string
  city?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  logo_url?: string
  document_footer?: string
  updated_by?: string
  updated_at: string
}

// ── Utilidades UI ─────────────────────────────────────────────
export interface SelectOption {
  value: string
  label: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  search: string
  dateFrom?: string
  dateTo?: string
  status?: string
  professional?: string
}
