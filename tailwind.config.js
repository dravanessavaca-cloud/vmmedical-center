# VM Medical Center — Sistema Clínico Integral

Sistema de gestión clínica para centros médicos en Ecuador.
Stack: React + Vite + TypeScript + Tailwind CSS + Supabase + Cloudflare Pages.

---

## 🚀 Inicio rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/vmmedical-center.git
cd vmmedical-center
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Configurar base de datos Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql` (opcional, datos de prueba)

### 4. Crear usuarios de prueba

En Supabase Dashboard → **Authentication → Users → Add User**:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@vmmedical.ec` | `Admin2024!` | admin |
| `recepcion@vmmedical.ec` | `Recep2024!` | recepcionista |
| `medico@vmmedical.ec` | `Medic2024!` | medico |
| `podologo@vmmedical.ec` | `Podol2024!` | podologo |

Después actualiza sus roles en la tabla `profiles` con el SQL del archivo `002_seed_data.sql`.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## ☁️ Despliegue en Cloudflare Pages

### Opción A — Dashboard de Cloudflare (recomendada)

1. Sube tu código a GitHub
2. Ve a [Cloudflare Pages](https://pages.cloudflare.com) → Create a project
3. Conecta tu repositorio GitHub
4. Configura el build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Agrega las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy!

### Opción B — Wrangler CLI

```bash
npm install -g wrangler
wrangler pages deploy dist --project-name vmmedical-center
```

---

## 📁 Estructura del proyecto

```
vmmedical-center/
├── src/
│   ├── components/
│   │   ├── auth/          # LoginPage
│   │   ├── layout/        # Sidebar, Topbar, AppLayout
│   │   ├── ui/            # Button, Input, Select, Modal, etc.
│   │   └── vital-signs/   # VitalSignsForm, VitalSignsDisplay
│   ├── hooks/
│   │   ├── useAuth.ts         # Autenticación Supabase
│   │   ├── usePatients.ts     # CRUD pacientes
│   │   ├── useAppointments.ts # CRUD citas
│   │   ├── useMedicalRecords.ts # Historias clínicas
│   │   └── useVitalSigns.ts   # Signos vitales
│   ├── lib/
│   │   ├── supabase.ts        # Cliente Supabase singleton
│   │   └── database.types.ts  # Tipos de BD generados
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── AgendaPage.tsx
│   │   ├── MedicalRecordPage.tsx
│   │   ├── VitalSignsPage.tsx
│   │   └── ComingSoonPage.tsx
│   ├── types/
│   │   └── index.ts      # Todos los tipos TypeScript
│   ├── utils/
│   │   └── index.ts      # Utilidades (fechas, IMC, WhatsApp, etc.)
│   ├── App.tsx            # Router y rutas protegidas
│   └── main.tsx
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Esquema completo + RLS
│       └── 002_seed_data.sql       # Datos de prueba
├── public/
│   └── _redirects        # SPA routing para Cloudflare Pages
├── .env.example
└── README.md
```

---

## 🔒 Roles y permisos

| Acción | Admin | Recepcionista | Médico | Podólogo |
|--------|-------|--------------|--------|---------|
| Ver todos los pacientes | ✅ | ✅ | ✅ | ✅ |
| Crear pacientes | ✅ | ✅ | ❌ | ❌ |
| Ver todas las citas | ✅ | ✅ | Solo propias | Solo propias |
| Crear citas | ✅ | ✅ | ❌ | ❌ |
| Cambiar estado de cita | ✅ | ✅ | ✅ (propias) | ✅ (propias) |
| Registrar signos vitales | ✅ | ✅ | ✅ | ✅ |
| Crear historia clínica | ✅ | ❌ | ✅ | ✅ |
| Ver audit_log | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Borrar pacientes | ✅ | ❌ | ❌ | ❌ |

---

## 📋 Fases del proyecto

### ✅ Fase 1 (actual)
- Login y autenticación por roles
- Dashboard personalizado por perfil
- Gestión de pacientes (CRUD + búsqueda)
- Agenda médica con estados
- Recordatorio WhatsApp integrado
- Historia clínica médica con pestañas
- Signos vitales con IMC automático
- Auditoría (audit_log)

### 🔲 Fase 2
- Recetas médicas (multi-ítem, soft delete)
- Certificado de reposo (días en letras)
- Certificado de asistencia
- Generación de PDF (A4, con logo del centro)
- Firma manual en canvas
- Arquitectura para firma .p12

### 🔲 Fase 3
- Google Calendar OAuth
- Módulo de vacunas configurable
- Pedidos de laboratorio
- Pedidos de imagen
- Interconsultas
- Epicrisis automática

### 🔲 Fase 4
- Historia clínica podológica completa
- Facturación con dashboard de ingresos
- Firma digital .p12 (Cloudflare Worker)
- Auditoría avanzada
- Reportes y exportación CSV/PDF

---

## 🔑 Variables de entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anónima de Supabase | ✅ |
| `VITE_CLINIC_NAME` | Nombre del centro médico | Opcional |
| `VITE_CLINIC_ADDRESS` | Dirección del centro | Opcional |
| `VITE_CLINIC_PHONE` | Teléfono del centro | Opcional |
| `VITE_CLINIC_WHATSAPP` | Número WhatsApp (con código país) | Opcional |

---

## 🛡️ Seguridad

- **RLS activado** en todas las tablas de Supabase
- **Solo el anon_key** se usa en el frontend (nunca el service_role_key)
- **Soft delete** para historias clínicas (nunca se borran permanentemente)
- **audit_log** registra todas las acciones importantes
- **Validación de cédula ecuatoriana** en el frontend
- Contraseñas manejadas completamente por Supabase Auth

---

## 🩺 Tecnologías

| Tecnología | Uso |
|-----------|-----|
| React 18 + Vite | Frontend SPA |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| React Router v6 | Navegación |
| React Hook Form | Formularios |
| Supabase JS | Backend + Auth + DB |
| PostgreSQL + RLS | Base de datos segura |
| Cloudflare Pages | Hosting CDN global |
| date-fns | Manipulación de fechas |
| lucide-react | Íconos |

---

Desarrollado para VM Medical Center · Ecuador · 2024
