// Base de datos de medicamentos más comunes en Ecuador
export interface Medication {
    name: string
    concentrations: string[]
    forms: string[]
    defaultDosage?: string
    defaultFrequency?: string
    defaultDuration?: string
    route?: string
  }
  
  export const MEDICATIONS: Medication[] = [
    { name: 'Amoxicilina', concentrations: ['250mg', '500mg', '875mg'], forms: ['Cápsula', 'Tableta', 'Suspensión'], defaultDosage: '1 cápsula', defaultFrequency: 'cada 8 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Amoxicilina + Ácido Clavulánico', concentrations: ['500mg/125mg', '875mg/125mg'], forms: ['Tableta', 'Suspensión'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Azitromicina', concentrations: ['250mg', '500mg'], forms: ['Tableta', 'Cápsula', 'Suspensión'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '3 días', route: 'Oral' },
    { name: 'Ciprofloxacino', concentrations: ['250mg', '500mg', '750mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Metronidazol', concentrations: ['250mg', '500mg'], forms: ['Tableta', 'Suspensión'], defaultDosage: '1 tableta', defaultFrequency: 'cada 8 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Ibuprofeno', concentrations: ['200mg', '400mg', '600mg', '800mg'], forms: ['Tableta', 'Suspensión', 'Gotas'], defaultDosage: '1 tableta', defaultFrequency: 'cada 8 horas', defaultDuration: '5 días', route: 'Oral' },
    { name: 'Paracetamol', concentrations: ['500mg', '1g'], forms: ['Tableta', 'Jarabe', 'Gotas'], defaultDosage: '1 tableta', defaultFrequency: 'cada 6-8 horas', defaultDuration: 'según necesidad', route: 'Oral' },
    { name: 'Diclofenaco', concentrations: ['50mg', '75mg', '100mg'], forms: ['Tableta', 'Cápsula', 'Ampolla'], defaultDosage: '1 tableta', defaultFrequency: 'cada 8-12 horas', defaultDuration: '5 días', route: 'Oral' },
    { name: 'Omeprazol', concentrations: ['20mg', '40mg'], forms: ['Cápsula', 'Tableta'], defaultDosage: '1 cápsula', defaultFrequency: 'cada 24 horas', defaultDuration: '14 días', route: 'Oral' },
    { name: 'Pantoprazol', concentrations: ['20mg', '40mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '14 días', route: 'Oral' },
    { name: 'Ranitidina', concentrations: ['150mg', '300mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '14 días', route: 'Oral' },
    { name: 'Loratadina', concentrations: ['10mg'], forms: ['Tableta', 'Jarabe'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Cetirizina', concentrations: ['10mg'], forms: ['Tableta', 'Jarabe'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '7 días', route: 'Oral' },
    { name: 'Salbutamol', concentrations: ['2mg', '4mg', '100mcg'], forms: ['Tableta', 'Jarabe', 'Inhalador'], defaultDosage: '2 puff', defaultFrequency: 'cada 4-6 horas', defaultDuration: 'según necesidad', route: 'Inhalado' },
    { name: 'Prednisona', concentrations: ['5mg', '20mg', '50mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '5 días', route: 'Oral' },
    { name: 'Dexametasona', concentrations: ['0.5mg', '4mg', '8mg'], forms: ['Tableta', 'Ampolla'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '5 días', route: 'Oral' },
    { name: 'Metformina', concentrations: ['500mg', '850mg', '1000mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Glibenclamida', concentrations: ['5mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Enalapril', concentrations: ['5mg', '10mg', '20mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12-24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Losartán', concentrations: ['25mg', '50mg', '100mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Amlodipino', concentrations: ['5mg', '10mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Atorvastatina', concentrations: ['10mg', '20mg', '40mg', '80mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas (noche)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Simvastatina', concentrations: ['10mg', '20mg', '40mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas (noche)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Levotiroxina', concentrations: ['25mcg', '50mcg', '75mcg', '100mcg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas (ayunas)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Furosemida', concentrations: ['20mg', '40mg'], forms: ['Tableta', 'Ampolla'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas (mañana)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Espironolactona', concentrations: ['25mg', '50mg', '100mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Tramadol', concentrations: ['50mg', '100mg'], forms: ['Cápsula', 'Ampolla'], defaultDosage: '1 cápsula', defaultFrequency: 'cada 8 horas', defaultDuration: '3 días', route: 'Oral' },
    { name: 'Ketorolaco', concentrations: ['10mg', '30mg'], forms: ['Tableta', 'Ampolla'], defaultDosage: '1 tableta', defaultFrequency: 'cada 6-8 horas', defaultDuration: '3 días', route: 'Oral' },
    { name: 'Clonazepam', concentrations: ['0.5mg', '1mg', '2mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12-24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Alprazolam', concentrations: ['0.25mg', '0.5mg', '1mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 8-12 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Fluoxetina', concentrations: ['10mg', '20mg'], forms: ['Cápsula', 'Tableta'], defaultDosage: '1 cápsula', defaultFrequency: 'cada 24 horas (mañana)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Sertralina', concentrations: ['25mg', '50mg', '100mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Vitamina C', concentrations: ['500mg', '1000mg'], forms: ['Tableta', 'Cápsula'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Vitamina D3', concentrations: ['400UI', '1000UI', '2000UI'], forms: ['Cápsula', 'Gotas'], defaultDosage: '1 cápsula', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Hierro Ferroso', concentrations: ['200mg', '325mg'], forms: ['Tableta', 'Jarabe'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas (ayunas)', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Ácido Fólico', concentrations: ['1mg', '5mg'], forms: ['Tableta'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Calcio + Vitamina D', concentrations: ['500mg/200UI', '600mg/400UI'], forms: ['Tableta', 'Cápsula'], defaultDosage: '1 tableta', defaultFrequency: 'cada 12 horas', defaultDuration: '30 días', route: 'Oral' },
    { name: 'Complejo B', concentrations: [''], forms: ['Tableta', 'Ampolla'], defaultDosage: '1 tableta', defaultFrequency: 'cada 24 horas', defaultDuration: '30 días', route: 'Oral' },
  ]
  
  export function searchMedications(query: string): Medication[] {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return MEDICATIONS.filter(m => m.name.toLowerCase().includes(q)).slice(0, 8)
  }