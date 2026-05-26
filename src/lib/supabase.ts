import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pjwefetpngpmeaymzdew.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd2VmZXRwbmdwbWVheW16ZGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTU0ODYsImV4cCI6MjA5NTI5MTQ4Nn0.3y_E7nGbvSrFkVZhh1FE2aBpb4kgNNWW6E3gfQZo1zQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function logAuditEvent(params: {
  action: string; tableName: string; recordId: string
  oldData?: Record<string, unknown>; newData?: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  if (!user) return
  await supabase.from('audit_log').insert({
    user_id: user.id, action: params.action, table_name: params.tableName,
    record_id: params.recordId, old_data: params.oldData ?? null, new_data: params.newData ?? null,
  })
}