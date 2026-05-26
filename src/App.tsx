// ============================================================
// VM Medical Center — Página de Login
// ============================================================
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Mail, Heart } from 'lucide-react'
import { Button } from '@/components/ui'

interface LoginForm {
  email: string
  password: string
}

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function LoginPage({ onLogin, loading, error }: LoginPageProps) {
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    await onLogin(data.email, data.password)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#0a2e40] via-[#0d4a35] to-teal-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full border-[40px] border-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full border-[30px] border-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-8 w-2 h-32 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 left-14 w-2 h-20 bg-white/8 rounded-full mt-6" />

        {/* Logo */}
        <div className="z-10 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
            <Heart size={36} className="text-teal-200" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">VM Medical</h1>
          <p className="text-teal-200 text-sm mt-1 tracking-widest uppercase">Center · Ecuador</p>
        </div>

        <div className="z-10 mt-12 space-y-4 w-full max-w-xs">
          {['Historia clínica digital', 'Agenda médica integrada', 'Gestión de pacientes', 'Podología clínica'].map(feat => (
            <div key={feat} className="flex items-center gap-3 text-white/80">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-300 flex-shrink-0" />
              <span className="text-sm">{feat}</span>
            </div>
          ))}
        </div>

        <p className="z-10 absolute bottom-8 text-white/30 text-xs">
          Sistema Clínico Integral v1.0 · Fase 1
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Heart size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">VM Medical Center</h1>
          </div>

          <h2 className="text-2xl font-medium text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-sm text-gray-500 mb-8">Ingrese sus credenciales para acceder al sistema clínico</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="usuario@vmmedical.ec"
                  autoComplete="email"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                  {...register('email', {
                    required: 'El correo es obligatorio',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                  })}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full py-2.5 mt-2">
              Ingresar al sistema
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            VM Medical Center · Sistema Clínico Integral
          </p>
        </div>
      </div>
    </div>
  )
}
