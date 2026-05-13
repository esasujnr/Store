import type { Product } from './database.types'

export type CatalogOption = {
  value: string
  label: string
  description: string
  href?: string
  image?: string
}

export const PRODUCT_FAMILY_OPTIONS: CatalogOption[] = [
  { value: 'wingxtra_aircraft', label: 'Wingxtra Aircraft', description: 'Wingxtra-designed UAV platforms and aircraft systems.', href: '/drones', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80' },
  { value: 'fixed_wing_uavs', label: 'Fixed-Wing UAVs', description: 'Fixed-wing aircraft, trainers, mapping platforms, and FPV airframes.', href: '/collection/fixed_wing_uavs', image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=900&q=80' },
  { value: 'vtol_uavs', label: 'VTOL UAVs', description: 'Hybrid takeoff aircraft, VTOL frames, and transition platforms.', href: '/collection/vtol_uavs', image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80' },
  { value: 'multirotor_uavs', label: 'Multirotor UAVs', description: 'Quadcopters, hexacopters, frames, and multirotor accessories.', href: '/collection/multirotor_uavs', image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=900&q=80' },
  { value: 'airframes_kits', label: 'Airframes & Kits', description: 'EPO, composite, MJF, and kit-format airframes.', href: '/collection/airframes_kits', image: 'https://images.unsplash.com/photo-1533069027836-fa937181a8ce?auto=format&fit=crop&w=900&q=80' },
  { value: 'additive_manufacturing', label: 'Additive Manufacturing', description: 'STL files, FDM printable packs, MJF parts, and printed accessories.', href: '/collection/additive_manufacturing', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80' },
  { value: 'avionics_flight_control', label: 'Avionics & Flight Control', description: 'Flight controllers, receivers, autopilot stacks, ESCs, and servos.', href: '/collection/avionics_flight_control', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80' },
  { value: 'propulsion_systems', label: 'Propulsion Systems', description: 'Brushless motors, propellers, ESCs, and propulsion hardware.', href: '/collection/propulsion_systems', image: 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?auto=format&fit=crop&w=900&q=80' },
  { value: 'payload_imaging_telemetry', label: 'Payload, Imaging & Telemetry', description: 'Cameras, mapping payloads, telemetry radios, and survey electronics.', href: '/collection/payload_imaging_telemetry', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80' },
  { value: 'recovery_safety', label: 'Recovery & Safety', description: 'Parachutes, recovery systems, launch aids, and safety equipment.', href: '/collection/recovery_safety', image: 'https://images.unsplash.com/photo-1533309907656-7b1c2ee56ddf?auto=format&fit=crop&w=900&q=80' },
  { value: 'winches_mission_systems', label: 'Winches & Mission Systems', description: 'Winches, release systems, payload drop modules, and mission accessories.', href: '/collection/winches_mission_systems', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80' },
]

export const PRODUCT_ORIGIN_OPTIONS: CatalogOption[] = [
  { value: 'wingxtra', label: 'Wingxtra', description: 'Designed, supplied, or controlled directly by Wingxtra.' },
  { value: 'curated_brand', label: 'Curated Brand', description: 'Third-party product selected and supplied through Wingxtra.' },
  { value: 'partner_brand', label: 'Partner Brand', description: 'Partner product listed under a managed brand relationship.' },
]

export const DELIVERY_TYPE_OPTIONS: CatalogOption[] = [
  { value: 'digital_download', label: 'Digital Download', description: 'Delivered as secure digital files after payment.' },
  { value: 'physical_shipment', label: 'Physical Shipment', description: 'Finished goods shipped to the customer.' },
  { value: 'made_to_order', label: 'Made To Order', description: 'Produced after order with a lead-time expectation.' },
]

export const ADDITIVE_MANUFACTURING_OPTIONS: CatalogOption[] = [
  { value: 'stl_digital_files', label: 'STL / Digital Files', description: 'Downloadable STL or build-file products.' },
  { value: 'fdm_printable_files', label: 'FDM Printable Files', description: 'Files optimized for FDM printing workflows.' },
  { value: 'mjf_printed_parts', label: 'MJF Printed Parts', description: 'Production nylon parts manufactured by MJF.' },
  { value: 'printed_accessories', label: '3D Printed Accessories', description: 'Printed brackets, fixtures, accessories, and replacement parts.' },
]

const familyLabels = Object.fromEntries(PRODUCT_FAMILY_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>
const originLabels = Object.fromEntries(PRODUCT_ORIGIN_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>
const deliveryLabels = Object.fromEntries(DELIVERY_TYPE_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>
const additiveLabels = Object.fromEntries(ADDITIVE_MANUFACTURING_OPTIONS.map(o => [o.value, o.label])) as Record<string, string>

export function getProductFamily(product: Product): string {
  if (product.product_family) return product.product_family
  if (product.is_drone_product) return 'wingxtra_aircraft'
  if (product.fulfillment_type === 'fdm' || product.fulfillment_type === 'mjf') return 'additive_manufacturing'
  if (product.fulfillment_type === 'composite') return 'airframes_kits'
  return 'airframes_kits'
}

export function getProductOrigin(product: Product): string {
  return product.product_origin || (product.brand && product.brand !== 'Wingxtra' ? 'curated_brand' : 'wingxtra')
}

export function getProductDeliveryType(product: Product): string {
  if (product.delivery_type) return product.delivery_type
  if (product.fulfillment_type === 'fdm') return 'digital_download'
  if (product.fulfillment_type === 'mjf') return 'made_to_order'
  return 'physical_shipment'
}

export function getProductAdditiveType(product: Product): string {
  if (product.additive_manufacturing_type) return product.additive_manufacturing_type
  if (product.fulfillment_type === 'fdm') return 'fdm_printable_files'
  if (product.fulfillment_type === 'mjf') return 'mjf_printed_parts'
  return ''
}

export function getProductBrand(product: Product): string {
  return product.marketplace_brand?.name || product.brand || 'Wingxtra'
}

export function getFamilyLabel(value?: string | null): string {
  return value ? familyLabels[value] || value.replace(/_/g, ' ') : 'UAV Product'
}

export function getOriginLabel(value?: string | null): string {
  return value ? originLabels[value] || value.replace(/_/g, ' ') : 'Wingxtra'
}

export function getDeliveryLabel(value?: string | null, _fulfillmentType?: string): string {
  return value ? deliveryLabels[value] || value.replace(/_/g, ' ') : 'Physical Shipment'
}

export function getAdditiveLabel(value?: string | null): string {
  return value ? additiveLabels[value] || value.replace(/_/g, ' ') : 'Additive Manufacturing'
}

export function isNewArrival(product: Product): boolean {
  if (product.is_new_arrival) return true
  const created = product.created_at ? new Date(product.created_at).getTime() : 0
  return created > Date.now() - 1000 * 60 * 60 * 24 * 30
}

export const NAV_PRODUCT_CARDS: CatalogOption[] = [
  { value: 'all_products', label: 'All Products', description: 'Open the complete UAV marketplace catalog.', href: '/shop', image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80' },
  { value: 'new_arrivals', label: 'New Arrivals', description: 'Newest UAV products, parts, and file releases.', href: '/collection/new-arrivals', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80' },
  ...PRODUCT_FAMILY_OPTIONS.map(option => ({ ...option, image: option.image || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80' })),
  { value: 'brands', label: 'Brands', description: 'Browse Wingxtra and curated UAV partner brands.', href: '/collection/brands', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80' },
]
