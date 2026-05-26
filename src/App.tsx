import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/components/auth/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PatientsPage } from '@/pages/PatientsPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { MedicalRecordPage } from '@/pages/MedicalRecordPage'
import { VitalSignsPage } from '@/pages/VitalSignsPage'
import { PrescriptionsPage } from '@/pages/PrescriptionsPage'
import { CertificatesPage } from '@/pages/CertificatesPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'

const Labs      = () => <ComingSoonPage title="Laboratorio" phase={3} features={['Pedidos de lab','Adjuntar resultados']} />
const Imaging   = () => <ComingSoonPage title="Imágenes" phase={3} features={['Pedidos de imagen','Adjuntar imágenes']} />
const Referrals = () => <ComingSoonPage title="Interconsultas" phase={3} features={['Especialidad','Seguimiento']} />
const Epicrisis = () => <ComingSoonPage title="Epicrisis" phase={3} features={['Resumen clínico','Firma del médico']} />
const Billing   = () => <ComingSoonPage title="Facturación" phase={4} features={['Dashboard ingresos','Estado de pago']} />
const Users     = () => <ComingSoonPage title="Usuarios" phase={1} features={['Crear usuarios','Asignar roles']} />
const Audit     = () => <ComingSoonPage title="Auditoría" phase={4} features={['Registro de acciones','Filtros']} />
const Settings  = () => <ComingSoonPage title="Configuración" phase={1} features={['Nombre','Logo','RUC']} />
const Vaccines  = () => <ComingSoonPage title="Vacunas" phase={3} features={['Esquema de vacunas','Registro por paciente']} />
const Evolutions= () => <ComingSoonPage title="Evoluciones" phase={4} features={['Notas de seguimiento','Fotografías']} />

export default function App() {
  const { user, profile, loading, signIn, signOut, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <LoginPage onLogin={signIn} loading={loading} error={error} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout profile={profile} onLogout={signOut} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage profile={profile} />} />
          <Route path="/pacientes" element={<PatientsPage profile={profile} />} />
          <Route path="/agenda" element={<AgendaPage profile={profile} />} />
          <Route path="/historias" element={<MedicalRecordPage profile={profile} />} />
          <Route path="/recetas" element={<PrescriptionsPage profile={profile} />} />
          <Route path="/certificados" element={<CertificatesPage profile={profile} />} />
          <Route path="/laboratorio" element={<Labs />} />
          <Route path="/imagenes" element={<Imaging />} />
          <Route path="/interconsultas" element={<Referrals />} />
          <Route path="/epicrisis" element={<Epicrisis />} />
          <Route path="/facturacion" element={<Billing />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/auditoria" element={<Audit />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/signos-vitales" element={<VitalSignsPage profile={profile} />} />
          <Route path="/vacunas" element={<Vaccines />} />
          <Route path="/evoluciones" element={<Evolutions />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}