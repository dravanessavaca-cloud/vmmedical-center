import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy'): string {
  try { return format(parseISO(dateStr), pattern, { locale: es }) } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "dd/MM/yyyy 'a las' HH:mm")
}

export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, "d 'de' MMMM 'de' yyyy")
}

export function calculateAge(dateOfBirth: string): number {
  try { return differenceInYears(new Date(), parseISO(dateOfBirth)) } catch { return 0 }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0
  return parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1))
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-blue-600' }
  if (bmi < 25)   return { label: 'Normal', color: 'text-green-600' }
  if (bmi < 30)   return { label: 'Sobrepeso', color: 'text-yellow-600' }
  return { label: 'Obesidad', color: 'text-red-600' }
}

export function numberToWords(n: number): string {
  const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
  const decenas = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
  if (n === 0) return 'cero'
  if (n < 20) return unidades[n]
  if (n < 100) { const d = Math.floor(n/10); const u = n%10; return u === 0 ? decenas[d] : decenas[d]+' y '+unidades[u] }
  if (n === 100) return 'cien'
  if (n < 200) return 'ciento '+numberToWords(n-100)
  return String(n)
}

export function buildWhatsAppUrl(params: { phone: string; patientName: string; date: string; time: string; professional: string; clinicName: string; clinicAddress: string }): string {
  const phone = params.phone.replace(/\D/g, '')
  const message = encodeURIComponent(`Hola ${params.patientName}, le recordamos su cita en ${params.clinicName} el día ${params.date} a las ${params.time} con ${params.professional}. Por favor llegar 10 minutos antes. ¡Le esperamos! 🏥`)
  return `https://wa.me/${phone}?text=${message}`
}

export function validateEcuadorianId(id: string): boolean {
  if (!/^\d{10}$/.test(id)) return false
  const province = parseInt(id.slice(0, 2))
  if (province < 1 || province > 24) return false
  const digits = id.split('').map(Number)
  const checkDigit = digits[9]
  let sum = 0
  for (let i = 0; i < 9; i++) { let val = digits[i] * (i % 2 === 0 ? 2 : 1); if (val > 9) val -= 9; sum += val }
  const expected = sum % 10 === 0 ? 0 : 10 - (sum % 10)
  return expected === checkDigit
}

export function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim()
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', atendida: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No asistió',
}

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800', confirmada: 'bg-blue-100 text-blue-800',
  atendida: 'bg-green-100 text-green-800', cancelada: 'bg-red-100 text-red-800', no_asistio: 'bg-gray-100 text-gray-600',
}

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  consulta_medica: 'Consulta Médica', consulta_podologica: 'Consulta Podológica',
  control: 'Control', procedimiento: 'Procedimiento', certificado: 'Certificado', otro: 'Otro',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', recepcionista: 'Recepcionista', medico: 'Médico', podologo: 'Podólogo',
}