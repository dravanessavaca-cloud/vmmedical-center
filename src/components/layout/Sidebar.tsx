import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, FileText, ClipboardList, Award, FlaskConical, Image, CreditCard, UserCog, ScrollText, Settings, Activity, Syringe, ArrowLeftRight, FileStack, Heart, TrendingUp, LogOut } from 'lucide-react'
import { cn } from '@/utils'
import type { Profile } from '@/types'

interface NavItem { to: string; icon: React.ReactNode; label: string }
interface NavSection { title: string; items: NavItem[] }

function getNavSections(role: string): NavSection[] {
  const common: NavItem[] = [{ to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' }]
  if (role === 'admin') return [
    { title: 'Principal', items: [...common, { to: '/pacientes', icon: <Users size={17} />, label: 'Pacientes' }, { to: '/agenda', icon: <CalendarDays size={17} />, label: 'Agenda' }] },
    { title: 'Clínica', items: [{ to: '/historias', icon: <FileText size={17} />, label: 'Historias Clínicas' }, { to: '/recetas', icon: <ClipboardList size={17} />, label: 'Recetas' }, { to: '/certificados', icon: <Award size={17} />, label: 'Certificados' }, { to: '/laboratorio', icon: <FlaskConical size={17} />, label: 'Laboratorio' }, { to: '/imagenes', icon: <Image size={17} />, label: 'Imágenes' }, { to: '/interconsultas', icon: <ArrowLeftRight size={17} />, label: 'Interconsultas' }, { to: '/epicrisis', icon: <FileStack size={17} />, label: 'Epicrisis' }] },
    { title: 'Administración', items: [{ to: '/facturacion', icon: <CreditCard size={17} />, label: 'Facturación' }, { to: '/usuarios', icon: <UserCog size={17} />, label: 'Usuarios' }, { to: '/auditoria', icon: <ScrollText size={17} />, label: 'Auditoría' }, { to: '/configuracion', icon: <Settings size={17} />, label: 'Configuración' }] },
  ]
  if (role === 'recepcionista') return [
    { title: 'Principal', items: [...common, { to: '/pacientes', icon: <Users size={17} />, label: 'Pacientes' }, { to: '/agenda', icon: <CalendarDays size={17} />, label: 'Agenda' }] },
    { title: 'Atención', items: [{ to: '/signos-vitales', icon: <Activity size={17} />, label: 'Signos Vitales' }, { to: '/vacunas', icon: <Syringe size={17} />, label: 'Vacunas' }, { to: '/certificados', icon: <Award size={17} />, label: 'Certificados' }] },
  ]
  if (role === 'medico') return [
    { title: 'Principal', items: [...common, { to: '/agenda', icon: <CalendarDays size={17} />, label: 'Mis Citas' }, { to: '/pacientes', icon: <Users size={17} />, label: 'Pacientes' }] },
    { title: 'Documentos', items: [{ to: '/historias', icon: <FileText size={17} />, label: 'Historia Clínica' }, { to: '/recetas', icon: <ClipboardList size={17} />, label: 'Recetas' }, { to: '/certificados', icon: <Award size={17} />, label: 'Certificados' }, { to: '/laboratorio', icon: <FlaskConical size={17} />, label: 'Pedidos Lab.' }, { to: '/imagenes', icon: <Image size={17} />, label: 'Pedidos Imagen' }, { to: '/interconsultas', icon: <ArrowLeftRight size={17} />, label: 'Interconsultas' }, { to: '/epicrisis', icon: <FileStack size={17} />, label: 'Epicrisis' }] },
  ]
  if (role === 'podologo') return [
    { title: 'Principal', items: [...common, { to: '/agenda', icon: <CalendarDays size={17} />, label: 'Mis Citas' }, { to: '/pacientes', icon: <Users size={17} />, label: 'Mis Pacientes' }] },
    { title: 'Podología', items: [{ to: '/historias', icon: <Heart size={17} />, label: 'Historia Podológica' }, { to: '/recetas', icon: <ClipboardList size={17} />, label: 'Recetas' }, { to: '/certificados', icon: <Award size={17} />, label: 'Certificados' }, { to: '/laboratorio', icon: <FlaskConical size={17} />, label: 'Lab. / Imagen' }, { to: '/evoluciones', icon: <TrendingUp size={17} />, label: 'Evoluciones' }] },
  ]
  return [{ title: 'Principal', items: common }]
}

interface SidebarProps { profile: Profile; onLogout: () => void }

export function Sidebar({ profile, onLogout }: SidebarProps) {
  const sections = getNavSections(profile.role)
  return (
    <aside className="w-[240px] bg-[#0a2e40] flex flex-col flex-shrink-0 h-screen">
      <div className="px-4 py-4 border-b border-white/8 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart size={16} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-white text-sm font-medium leading-tight">VM Medical</p>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Centro Médico</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map(section => (
          <div key={section.title}>
            <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-white/30 uppercase tracking-widest">{section.title}</p>
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-sm transition-all', isActive ? 'bg-teal-600/20 text-teal-300 font-medium' : 'text-white/55 hover:text-white/90 hover:bg-white/6')}>
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-white/8 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {profile.full_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{profile.full_name}</p>
          <p className="text-white/40 text-[10px] capitalize">{profile.role}</p>
        </div>
        <button onClick={onLogout} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}