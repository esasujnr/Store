export type ProductSpecRecord = Record<string, unknown>

export function getProductSpecs(specs: unknown): ProductSpecRecord {
  return (specs || {}) as ProductSpecRecord
}

export function splitSpecList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  return String(value)
    .split(/\r?\n|\||;/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function getSpecValue(specs: ProductSpecRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in specs && specs[key] != null && specs[key] !== '') {
      return specs[key]
    }
  }
  return undefined
}

export function getSpecText(specs: ProductSpecRecord, keys: string[], fallback = ''): string {
  const value = getSpecValue(specs, keys)
  if (value == null || value === '') return fallback
  return String(value)
}

export function getSpecList(specs: ProductSpecRecord, keys: string[]): string[] {
  return splitSpecList(getSpecValue(specs, keys))
}

export function getGalleryImages(imageUrl: string, specs: ProductSpecRecord): string[] {
  const images = [imageUrl, ...getSpecList(specs, ['gallery'])].filter(Boolean)
  return [...new Set(images)]
}

export function getProductSummarySpecs(specs: ProductSpecRecord, max = 3) {
  const keys = ['wingspan', 'payload', 'skill_level', 'build_time', 'printer', 'material', 'production_method', 'shipping_window']
  const summary = keys
    .map(key => {
      const value = specs[key]
      if (value == null || value === '' || Array.isArray(value) || typeof value === 'object') return null
      return { key, label: key.replace(/_/g, ' '), value: String(value) }
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>

  if (summary.length >= max) return summary.slice(0, max)

  const extra = Object.entries(specs)
    .filter(([, value]) => value != null && value !== '' && !Array.isArray(value) && typeof value !== 'object')
    .filter(([key]) => !keys.includes(key))
    .map(([key, value]) => ({ key, label: key.replace(/_/g, ' '), value: String(value) }))

  return [...summary, ...extra].slice(0, max)
}
