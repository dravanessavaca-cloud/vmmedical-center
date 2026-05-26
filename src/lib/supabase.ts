import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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