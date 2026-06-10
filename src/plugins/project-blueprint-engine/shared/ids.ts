export function createPbeId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `${prefix}_${random}`
}

export function nowIso() {
  return new Date().toISOString()
}
