export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string; role: string; specialty: string | null; license_number: string | null; phone: string | null; avatar_url: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      patients: {
        Row: { id: string; medical_record_number: string; first_name: string; last_name: string; id_number: string; date_of_birth: string; gender: string; blood_type: string | null; phone: string; email: string | null; address: string | null; city: string | null; occupation: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_relation: string | null; insurance_company: string | null; insurance_number: string | null; notes: string | null; is_active: boolean; created_by: string; updated_by: string | null; created_at: string; updated_at: string; deleted_at: string | null }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'medical_record_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      appointments: {
        Row: { id: string; patient_id: string; professional_id: string; appointment_date: string; appointment_time: string; duration_minutes: number; type: string; reason: string; status: string; notes: string | null; google_event_id: string | null; google_calendar_id: string | null; sync_status: string | null; last_synced_at: string | null; cancelled_reason: string | null; created_by: string; updated_by: string | null; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      medical_records: {
        Row: { id: string; patient_id: string; appointment_id: string | null; physician_id: string; chief_complaint: string; current_illness: string; personal_history: string | null; surgical_history: string | null; family_history: string | null; allergies: string | null; current_medications: string | null; systems_review: string | null; physical_exam_general: string | null; physical_exam_systems: string | null; presumptive_diagnosis: string | null; definitive_diagnosis: string | null; cie10_code: string | null; cie10_description: string | null; therapeutic_plan: string | null; indications: string | null; observations: string | null; follow_up_date: string | null; is_complete: boolean; created_by: string; updated_by: string | null; created_at: string; updated_at: string; deleted_at: string | null }
        Insert: Omit<Database['public']['Tables']['medical_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_records']['Insert']>
      }
      vital_signs: {
        Row: { id: string; patient_id: string; appointment_id: string | null; medical_record_id: string | null; weight_kg: number | null; height_cm: number | null; bmi: number | null; temperature_c: number | null; heart_rate_bpm: number | null; respiratory_rate_rpm: number | null; oxygen_saturation_pct: number | null; systolic_bp: number | null; diastolic_bp: number | null; blood_glucose_mgdl: number | null; observations: string | null; recorded_by: string; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['vital_signs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vital_signs']['Insert']>
      }
      audit_log: {
        Row: { id: string; user_id: string; action: string; table_name: string; record_id: string; old_data: Json | null; new_data: Json | null; ip_address: string | null; user_agent: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'created_at'>
        Update: never
      }
      clinic_settings: {
        Row: { id: string; clinic_name: string; ruc: string | null; address: string | null; city: string | null; phone: string | null; whatsapp: string | null; email: string | null; website: string | null; logo_url: string | null; document_footer: string | null; updated_by: string | null; updated_at: string }
        Insert: Omit<Database['public']['Tables']['clinic_settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clinic_settings']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}