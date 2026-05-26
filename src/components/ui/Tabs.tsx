import { useState } from 'react'
import { cn } from '@/utils'

interface Tab { id: string; label: string; icon?: React.ReactNode }
interface TabsProps { tabs: Tab[]; defaultTab?: string; onChange?: (tabId: string) => void; children: (activeTab: string) => React.ReactNode }

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)
  const handleChange = (id: string) => { setActive(id); onChange?.(id) }
  return (
    <div>
      <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button type="button" key={tab.id} onClick={() => handleChange(tab.id)} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors', active === tab.id ? 'border-teal-600 text-teal-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  )
}