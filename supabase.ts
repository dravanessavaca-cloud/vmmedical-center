import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { Profile } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/pacientes':     'Gestión de Pacientes',
  '/agenda':        'Agenda Médica',
  '/historias':     'Historias Clínicas',
  '/recetas':       'Recetas Médicas',
  '/certificados':  'Certificados Médicos',
  '/laboratorio':   'Pedidos de Laboratorio',
  '/imagenes':      'Pedidos de Imagen',
  '/interconsultas':'Interconsultas',
  '/epicrisis':     'Epicrisis',
  '/facturacion':   'Facturación',
  '/usuarios':      'Gestión de Usuarios',
  '/auditoria':     'Auditoría del Sistema',
  '/configuracion': 'Configuración',
  '/signos-vitales':'Signos Vitales',
  '/vacunas':       'Registro de Vacunas',
  '/evoluciones':   'Evoluciones Podológicas',
}

interface AppLayoutProps {
  profile: Profile
  onLogout: () => void
}

export function AppLayout({ profile, onLogout }: AppLayoutProps) {
  const location = useLocation()
  const basePath = '/' + location.pathname.split('/')[1]
  const title = PAGE_TITLES[basePath] ?? 'VM Medical Center'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar profile={profile} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
