export function formatShortDate(iso?: string | null): string {
  if (!iso) return ''
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}
