import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Product } from '@/lib/database.types'
import { getProductPrice } from '@/lib/utils'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; product: Product; quantity?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const qty = action.quantity ?? 1
      const existing = state.items.find(i => i.product.id === action.product.id)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        }
      }
      return { items: [...state.items, { product: action.product, quantity: qty }] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => i.product.id !== action.productId) }
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { items: state.items.filter(i => i.product.id !== action.productId) }
      }
      return {
        items: state.items.map(i =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    case 'HYDRATE':
      return { items: action.items }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  subtotal: number
  hasPhysical: boolean
  hasDigital: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'wingxtra_store_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as CartItem[]
        dispatch({ type: 'HYDRATE', items })
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => sum + getProductPrice(i.product) * i.quantity, 0)
  const hasPhysical = state.items.some(i => i.product.fulfillment_type !== 'fdm')
  const hasDigital = state.items.some(i => i.product.fulfillment_type === 'fdm')

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        hasPhysical,
        hasDigital,
        addItem: (product, quantity) => dispatch({ type: 'ADD', product, quantity }),
        removeItem: (productId) => dispatch({ type: 'REMOVE', productId }),
        updateQuantity: (productId, quantity) => dispatch({ type: 'UPDATE_QTY', productId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
        isInCart: (productId) => state.items.some(i => i.product.id === productId),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
