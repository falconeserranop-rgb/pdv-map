export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function googleMapsUrl(lat: number, lon: number, name: string): string {
  const destination = `${lat},${lon}`
  const label = encodeURIComponent(name)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`
}

export function whatsappShareUrl(pdvName: string, lat: number, lon: number): string {
  const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`
  const blue  = '\u{1F535}'
  const red   = '\u{1F534}'
  const check = '\u{2705}'
  const text = encodeURIComponent(
    `Punto de Venta Autorizado Mobil ${blue}${red}\n*${pdvName}*\n\nVer en el mapa: ${mapsUrl}\n\nVerificado por Mad4Performance ${check}`
  )
  return `https://wa.me/?text=${text}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function fixMalformedCoordinate(value: string, isLat: boolean): number | null {
  if (!value || value === 'No se encuentra' || value.trim() === '') return null

  const num = parseFloat(value)
  if (isNaN(num)) return null

  // Check if already valid
  if (isLat && num >= 8 && num <= 12) return num
  if (!isLat && num >= -70 && num <= -60) return num

  // Fix missing decimal: insert after 2 digits for lat, 3 digits for lon
  if (isLat && value.replace('-', '').length > 10) {
    const fixed = parseFloat(value.substring(0, 2) + '.' + value.substring(2))
    if (fixed >= 8 && fixed <= 12) return fixed
  }
  if (!isLat && value.replace('-', '').length > 10) {
    const neg = value.startsWith('-')
    const abs = value.replace('-', '')
    const fixed = parseFloat((neg ? '-' : '') + abs.substring(0, 2) + '.' + abs.substring(2))
    if (fixed >= -70 && fixed <= -60) return fixed
  }

  return null
}
