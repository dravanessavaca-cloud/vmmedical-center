import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

interface AuthState { user: User | null; profile: Profile | null; loading: boolean; error: string | null }

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true, error: null })

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error || !data) return null
    return data as Profile
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id)
        setState({ user: session.user, profile, loading: false, error: null })
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id)
        setState({ user: session.user, profile, loading: false, error: null })
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, loading: false, error: null })
      }
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setState(s => ({ ...s, loading: false, error: 'Credenciales incorrectas.' })); return false }
    return true
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return {
    user: state.user, profile: state.profile, loading: state.loading, error: state.error,
    signIn, signOut,
    isAdmin: state.profile?.role === 'admin',
    isRecepcionista: state.profile?.role === 'recepcionista',
    isMedico: state.profile?.role === 'medico',
    isPodologo: state.profile?.role === 'podologo',
  }
}