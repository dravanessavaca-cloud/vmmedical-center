import { Construction } from 'lucide-react'

interface ComingSoonPageProps { title?: string; phase?: number; features?: string[] }

export function ComingSoonPage({ title = 'Módulo en desarrollo', phase = 2, features = [] }: ComingSoonPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">Este módulo está programado para la Fase {phase} del proyecto.</p>
        {features.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Incluirá:</p>
            <ul className="space-y-1.5">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Preparado con Supabase + RLS + Cloudflare Pages
        </div>
      </div>
    </div>
  )
}