import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_CURRENCY,
  DEFAULT_STORE_REGION,
  STORE_REGION_CONFIG,
  STORE_REGIONS,
  convertFromBaseCurrency,
  formatCurrency,
  normalizeCurrency,
  normalizeStoreRegion,
  getStoreRegionCurrency,
  type StoreRegion,
  type SupportedCurrency,
} from '@/lib/utils'

const STORAGE_KEY = 'wingxtra_store_currency_v2'
const STORE_STORAGE_KEY = 'wingxtra_store_region_v1'

interface CurrencyContextValue {
  currency: SupportedCurrency
  setCurrency: (currency: SupportedCurrency) => void
  storeRegion: StoreRegion
  setStoreRegion: (region: StoreRegion) => void
  options: readonly SupportedCurrency[]
  storeOptions: readonly StoreRegion[]
  convertFromBase: (amount: number) => number
  formatFromBase: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function getInitialCurrency(): SupportedCurrency {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY
  return normalizeCurrency(localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY)
}

function getInitialStoreRegion(): StoreRegion {
  if (typeof window === 'undefined') return DEFAULT_STORE_REGION
  const storedRegion = localStorage.getItem(STORE_STORAGE_KEY)
  if (storedRegion) return normalizeStoreRegion(storedRegion)

  const storedCurrency = normalizeCurrency(localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY)
  const derived = Object.entries(STORE_REGION_CONFIG).find(([, config]) => config.currency === storedCurrency)?.[0]
  return normalizeStoreRegion(derived)
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [storeRegion, setStoreRegionState] = useState<StoreRegion>(getInitialStoreRegion)
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    const initialRegion = getInitialStoreRegion()
    const storedCurrency = getInitialCurrency()
    return storedCurrency === getStoreRegionCurrency(initialRegion)
      ? storedCurrency
      : getStoreRegionCurrency(initialRegion)
  })

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency: next => {
      const normalized = normalizeCurrency(next)
      setCurrencyState(normalized)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, normalized)
      }
    },
    storeRegion,
    setStoreRegion: next => {
      const normalizedRegion = normalizeStoreRegion(next)
      const regionCurrency = getStoreRegionCurrency(normalizedRegion)
      setStoreRegionState(normalizedRegion)
      setCurrencyState(regionCurrency)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORE_STORAGE_KEY, normalizedRegion)
        localStorage.setItem(STORAGE_KEY, regionCurrency)
      }
    },
    options: Object.values(STORE_REGION_CONFIG).map(config => config.currency) as readonly SupportedCurrency[],
    storeOptions: STORE_REGIONS,
    convertFromBase: amount => convertFromBaseCurrency(amount, currency),
    formatFromBase: amount => formatCurrency(convertFromBaseCurrency(amount, currency), currency),
  }), [currency, storeRegion])

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
