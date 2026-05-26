import { useState } from 'react'
import { Search, Bell, Calendar, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TopbarProps { title: string }

export function Topbar({ title }: TopbarProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/pacientes?search=${encodeURIComponent(search)}`)
      setSearch('')
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-sm font-medium text-gray-900 flex-1">{title}</h1>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-56 hover:border-gray-300 transition-colors">
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch} placeholder="Buscar pacientes..." className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full" />
      </div>
      <div className="flex items-center gap-1">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button onClick={() => navigate('/agenda')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"><Calendar size={16} /></button>
        <button onClick={() => navigate('/configuracion')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"><Settings size={16} /></button>
      </div>
    </header>
  )
}