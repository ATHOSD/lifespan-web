export interface CurveSubject {
  id: string
  name: string
  sex: 'Male' | 'Female' | 'Unknown'
  postConceptionDays: number | null
  ageLabel: string
  volumes: { label: number; volume: number }[]
  color: string
}

const PALETTE = [
  '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981',
  '#ef4444', '#ec4899', '#f97316', '#06b6d4',
  '#84cc16', '#a855f7',
]

export function computePCD(
  ageType: 'GA' | 'Postnatal',
  ageValue: number | null,
  ageUnit: 'weeks' | 'months' | 'years',
): number | null {
  if (ageValue === null || ageValue === undefined) return null
  const daysPerUnit = { weeks: 7, months: 30.44, years: 365.25 }
  const days = ageValue * daysPerUnit[ageUnit]
  return ageType === 'GA' ? days : 280 + days
}

export function formatAgeLabel(
  ageType: 'GA' | 'Postnatal',
  ageValue: number | null,
  ageUnit: 'weeks' | 'months' | 'years',
): string {
  if (ageValue === null || ageValue === undefined) return '—'
  const unit = ageUnit[0].toUpperCase() + ageUnit.slice(1)
  return `${ageValue} ${unit} ${ageType === 'GA' ? 'GA' : 'postnatal'}`
}

export const useCurveStore = () => {
  const subjects = useState<CurveSubject[]>('curve-subjects', () => [])

  function nextColor(): string {
    const used = new Set(subjects.value.map(s => s.color))
    return PALETTE.find(c => !used.has(c)) ?? PALETTE[subjects.value.length % PALETTE.length]
  }

  function addSubject(sub: Omit<CurveSubject, 'color'>) {
    if (subjects.value.some(s => s.id === sub.id)) return
    subjects.value.push({ ...sub, color: nextColor() })
  }

  function removeSubject(id: string) {
    subjects.value = subjects.value.filter(s => s.id !== id)
  }

  function hasSubject(id: string) {
    return subjects.value.some(s => s.id === id)
  }

  return { subjects, addSubject, removeSubject, hasSubject }
}
