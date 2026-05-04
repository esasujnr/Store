import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function getFulfillmentLabel(type: string): string {
  switch (type) {
    case 'fdm': return 'Digital Download'
    case 'mjf': return 'MJF 3D Printed'
    case 'composite': return 'Carbon Fiber'
    default: return type
  }
}

export function getFulfillmentBadgeColor(type: string): string {
  switch (type) {
    case 'fdm': return 'badge-fdm'
    case 'mjf': return 'badge-mjf'
    case 'composite': return 'badge-composite'
    default: return 'badge-default'
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function isPhysical(fulfillmentType: string): boolean {
  return fulfillmentType === 'mjf' || fulfillmentType === 'composite'
}

export function isDigital(fulfillmentType: string): boolean {
  return fulfillmentType === 'fdm'
}
