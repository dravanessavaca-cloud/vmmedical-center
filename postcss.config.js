# 🏥 VM Medical Center — Instrucciones de instalación

## Pasos (en orden)

---

## PASO 1 — Aplicar el schema en Supabase (1 vez, 30 segundos)

1. Abre este link:
   https://supabase.com/dashboard/project/pjwefetpngpmeaymzdew/sql/new

2. Copia TODO el contenido del archivo:
   `supabase/migrations/001_initial_schema.sql`

3. Pégalo en el editor SQL y presiona **"Run"** (botón verde)

4. Debe aparecer "Success. No rows returned" ✓

---

## PASO 2 — Crear usuarios (desde tu computadora)

Abre una terminal en esta carpeta y ejecuta:

```bash
node setup-usuarios.mjs
```

Esto crea automáticamente los 4 usuarios con sus roles y 5 pacientes de prueba.

---

## PASO 3 — Correr el sistema localmente

```bash
npm install
npm run dev
```

Abre → http://localhost:5173

---

## PASO 4 — Subir a Cloudflare Pages

```bash
npm run build
```

Luego en Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno:
  - `VITE_SUPABASE_URL` = `https://pjwefetpngpmeaymzdew.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (el anon key)

---

## Credenciales de acceso al sistema

| Rol           | Email                   | Contraseña   |
|---------------|-------------------------|--------------|
| Admin         | admin@vmmedical.ec      | Admin2024!   |
| Recepcionista | recepcion@vmmedical.ec  | Recep2024!   |
| Médico        | medico@vmmedical.ec     | Medico2024!  |
| Podólogo      | podologo@vmmedical.ec   | Podol2024!   |

