import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ShoppingBag, CreditCard, MapPin, Tag } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabase'
import type { Discount, Product } from '@/lib/database.types'
import {
  calculateDiscountAmount,
  canPurchaseQuantity,
  convertBaseAmountForGateway,
  formatCurrency,
  getCheckoutPaymentRoute,
  getGatewayChargeCurrency,
  getInventoryStatus,
  getProductPrice,
  isDigital,
  isPhysical,
  PAYMENT_PROVIDER_LABELS,
  STORE_REGION_CONFIG,
} from '@/lib/utils'
import toast from 'react-hot-toast'
import styles from './CheckoutPage.module.css'

export default function CheckoutPage() {
  const { user, profile } = useAuth()
  const { items, subtotal, hasPhysical, hasDigital, clearCart } = useCart()
  const { currency, storeRegion, convertFromBase, formatFromBase } = useCurrency()
  const navigate = useNavigate()
  const siteUrl = ((import.meta as { env: Record<string, string | undefined> }).env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

  const savedAddresses = (profile?.shipping_addresses || []) as Array<{
    id: string; label: string; full_name: string; phone: string
    address_line1: string; city: string; state: string; country: string; postal_code: string
  }>

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.find(a => (a as { is_default?: boolean }).is_default)?.id || savedAddresses[0]?.id || 'new'
  )

  const [newAddress, setNewAddress] = useState({
    full_name: profile?.full_name || '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    country: 'Ghana',
    postal_code: '',
  })

  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [loading, setLoading] = useState(false)

  const shippingAddress = selectedAddressId === 'new'
    ? newAddress
    : savedAddresses.find(a => a.id === selectedAddressId) || newAddress

  const subtotalInCurrency = convertFromBase(subtotal)
  const baseDiscountAmount = useMemo(() => calculateDiscountAmount(subtotal, appliedDiscount), [appliedDiscount, subtotal])
  const checkoutRoute = getCheckoutPaymentRoute(storeRegion, hasDigital, hasPhysical)
  const paymentProvider = checkoutRoute.provider
  const chargeCurrency = getGatewayChargeCurrency(paymentProvider, currency)
  const selectedStore = STORE_REGION_CONFIG[storeRegion]
  const checkoutUnavailable = !checkoutRoute.canCheckout

  const displayDiscountAmount = useMemo(() => {
    if (!appliedDiscount) return 0

    const minimum = convertFromBase(appliedDiscount.minimum_order_amount || 0)
    if (subtotalInCurrency < minimum) return 0

    if (appliedDiscount.discount_type === 'percent') {
      return Math.min(subtotalInCurrency, Number((subtotalInCurrency * (appliedDiscount.value / 100)).toFixed(2)))
    }

    return Math.min(subtotalInCurrency, convertFromBase(appliedDiscount.value))
  }, [appliedDiscount, convertFromBase, subtotalInCurrency])

  const orderTotal = Math.max(0, Number((subtotalInCurrency - displayDiscountAmount).toFixed(2)))
  const subtotalForCharge = convertBaseAmountForGateway(subtotal, paymentProvider, currency)
  const discountAmountForCharge = convertBaseAmountForGateway(baseDiscountAmount, paymentProvider, currency)
  const orderTotalForCharge = Math.max(0, Number((subtotalForCharge - discountAmountForCharge).toFixed(2)))
  const chargeSummaryLabel = formatCurrency(orderTotalForCharge, chargeCurrency)
  const chargeCurrencyDiffers = chargeCurrency !== currency

  async function handleApplyDiscount() {
    if (!discountCode.trim()) {
      toast.error('Enter a discount code first')
      return
    }

    setApplyingDiscount(true)
    try {
      const code = discountCode.trim().toUpperCase()
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        toast.error('Discount code not found')
        setAppliedDiscount(null)
        return
      }

      const discount = data as Discount
      const now = Date.now()
      const usageLimit = discount.usage_limit ?? discount.max_uses ?? null
      if (usageLimit !== null && Number(discount.used_count || 0) >= Number(usageLimit)) {
        toast.error('This discount code has reached its usage limit')
        setAppliedDiscount(null)
        return
      }

      if ((discount.starts_at && new Date(discount.starts_at).getTime() > now) || (discount.ends_at && new Date(discount.ends_at).getTime() < now)) {
        toast.error('This discount is not active right now')
        setAppliedDiscount(null)
        return
      }

      const minimum = convertFromBase(discount.minimum_order_amount || 0)
      if (subtotalInCurrency < minimum) {
        toast.error(`This code requires at least ${formatFromBase(discount.minimum_order_amount || 0)}`)
        setAppliedDiscount(null)
        return
      }

      setAppliedDiscount(discount)
      setDiscountCode(code)
      toast.success('Discount applied')
    } catch (err) {
      console.error(err)
      toast.error('Could not apply discount')
    } finally {
      setApplyingDiscount(false)
    }
  }

  function clearDiscount() {
    setAppliedDiscount(null)
    setDiscountCode('')
  }

  async function handlePayment() {
    if (!user) return
    if (hasPhysical && !shippingAddress.address_line1) {
      toast.error('Please provide a shipping address')
      return
    }
    if (checkoutUnavailable) {
      toast.error(checkoutRoute.unavailableReason || 'This checkout route is not available for the current cart.')
      return
    }

    setLoading(true)
    try {
      const productIds = items.map(item => item.product.id)
      const { data: freshProducts, error: stockError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      if (stockError) throw stockError
      const freshById = new Map((freshProducts as Product[] | null || []).map(product => [product.id, product]))

      for (const item of items) {
        const freshProduct = freshById.get(item.product.id)
        if (!freshProduct || !freshProduct.is_active) {
          toast.error(`${item.product.name} is no longer available`)
          setLoading(false)
          return
        }
        if (!canPurchaseQuantity(freshProduct, item.quantity)) {
          toast.error(`${freshProduct.name}: ${getInventoryStatus(freshProduct, item.quantity).label}`)
          setLoading(false)
          return
        }
      }

      const hasDigitalItems = items.some(i => isDigital(i.product.fulfillment_type))
      const hasPhysicalItems = items.some(i => isPhysical(i.product.fulfillment_type))

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: orderTotalForCharge,
          currency: chargeCurrency,
          payment_provider: paymentProvider,
          discount_code: appliedDiscount?.code || '',
          discount_amount: discountAmountForCharge,
          has_digital: hasDigitalItems,
          has_physical: hasPhysicalItems,
          shipping_address: hasPhysicalItems ? shippingAddress : null,
          shipping_status: hasPhysicalItems ? 'pending' : 'not_required',
          notes: chargeCurrencyDiffers
            ? `Storefront viewed in ${currency}. Checkout processed in ${chargeCurrency} via ${PAYMENT_PROVIDER_LABELS[paymentProvider]}.`
            : `Checkout processed via ${PAYMENT_PROVIDER_LABELS[paymentProvider]}.`,
        })
        .select()
        .single()

      if (orderError) throw orderError
      const order = orderData as { id: string }

      const orderItems = items.map(({ product, quantity }) => {
        const freshProduct = freshById.get(product.id) || product
        return ({
        order_id: order.id,
        product_id: freshProduct.id,
        quantity,
        unit_price: convertBaseAmountForGateway(getProductPrice(freshProduct), paymentProvider, currency),
        fulfillment_type: freshProduct.fulfillment_type,
      })
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      const initializerByProvider: Partial<Record<typeof paymentProvider, string>> = {
        paystack: 'initialize-paystack-checkout',
        lemon_squeezy: 'initialize-lemon-checkout',
        kora: 'initialize-kora-checkout',
      }
      const initializer = initializerByProvider[paymentProvider]
      if (!initializer) throw new Error('This checkout route is not available yet')

      const { data, error } = await supabase.functions.invoke(initializer, {
        body: {
          order_id: order.id,
          callback_url: `${siteUrl}/orders/${order.id}?provider=${paymentProvider}&verify=1&reference=${order.id}`,
          cancel_url: `${siteUrl}/checkout?payment=cancelled&provider=${paymentProvider}`,
        },
      })

      if (error || !data?.authorization_url) {
        throw error || new Error(data?.error || `${PAYMENT_PROVIDER_LABELS[paymentProvider]} checkout could not be initialized`)
      }

      window.location.href = data.authorization_url as string
      return
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <>
      <SEO title="Checkout" url="/checkout" noIndex />
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Checkout</h1>

          <div className={styles.layout}>
            <div>
              {hasPhysical && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <MapPin size={18} />
                    <h2>Shipping Address</h2>
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className={styles.addressList}>
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.addressCardSelected : ''}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                        >
                          <strong>{addr.label}</strong>
                          <span>{addr.full_name}</span>
                          <span>{addr.address_line1}, {addr.city}</span>
                          <span>{addr.state}, {addr.country}</span>
                        </button>
                      ))}
                      <button
                        className={`${styles.addressCard} ${selectedAddressId === 'new' ? styles.addressCardSelected : ''}`}
                        onClick={() => setSelectedAddressId('new')}
                      >
                        <strong>+ New Address</strong>
                      </button>
                    </div>
                  )}

                  {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                    <div className={styles.addressForm}>
                      <div className={styles.formRow}>
                        <Input
                          label="Full Name"
                          value={newAddress.full_name}
                          onChange={e => setNewAddress(p => ({ ...p, full_name: e.target.value }))}
                          required
                        />
                        <Input
                          label="Phone"
                          value={newAddress.phone}
                          onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))}
                          required
                        />
                      </div>
                      <Input
                        label="Address"
                        value={newAddress.address_line1}
                        onChange={e => setNewAddress(p => ({ ...p, address_line1: e.target.value }))}
                        required
                      />
                      <div className={styles.formRow}>
                        <Input
                          label="City"
                          value={newAddress.city}
                          onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                          required
                        />
                        <Input
                          label="State"
                          value={newAddress.state}
                          onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))}
                          required
                        />
                      </div>
                      <div className={styles.formRow}>
                        <Input
                          label="Country"
                          value={newAddress.country}
                          onChange={e => setNewAddress(p => ({ ...p, country: e.target.value }))}
                          required
                        />
                        <Input
                          label="Postal Code"
                          value={newAddress.postal_code}
                          onChange={e => setNewAddress(p => ({ ...p, postal_code: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ShoppingBag size={18} />
                  <h2>Order Items</h2>
                </div>
                <div className={styles.itemsList}>
                  {items.map(({ product, quantity }) => {
                    const linePrice = getProductPrice(product) * quantity
                    return (
                      <div key={product.id} className={styles.orderItem}>
                        <img
                          src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=100'}
                          alt={product.name}
                          className={styles.itemImg}
                        />
                        <div className={styles.itemName}>
                          <span>{product.name}</span>
                          <span className={styles.itemQty}>x{quantity}</span>
                        </div>
                        <span className={styles.itemTotal}>
                          {formatFromBase(linePrice)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className={styles.summary}>
              <h2>Payment Summary</h2>

              <div className={styles.discountCard}>
                <div className={styles.discountHeader}>
                  <Tag size={16} />
                  <span>Discount code</span>
                </div>
                <div className={styles.discountRowInline}>
                  <Input
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="secondary" onClick={handleApplyDiscount} loading={applyingDiscount}>
                    Apply
                  </Button>
                </div>
                {appliedDiscount && (
                  <div className={styles.appliedDiscount}>
                    <div>
                      <strong>{appliedDiscount.code}</strong>
                      <p>{appliedDiscount.description || 'Discount applied to this order.'}</p>
                    </div>
                    <button type="button" className={styles.clearDiscountBtn} onClick={clearDiscount}>Remove</button>
                  </div>
                )}
              </div>

              <div className={styles.paymentMethodCard}>
                <div className={styles.paymentMethodHeader}>
                  <CreditCard size={16} />
                  <span>Store checkout route</span>
                </div>
                <div className={styles.paymentMethodList}>
                  <div className={`${styles.paymentMethodButton} ${styles.paymentMethodButtonActive}`}>
                    <div>
                      <strong>{checkoutRoute.label}</strong>
                      <p>{checkoutRoute.description}</p>
                    </div>
                    <span className={styles.methodTag}>{PAYMENT_PROVIDER_LABELS[paymentProvider]}</span>
                  </div>
                </div>
              </div>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatFromBase(subtotal)}</span>
                </div>
                {displayDiscountAmount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Discount</span>
                    <span>-{formatCurrency(displayDiscountAmount, currency)}</span>
                  </div>
                )}
                {hasPhysical && (
                  <div className={styles.summaryRow}>
                    <span>Shipping</span>
                    <span className={styles.tbd}>TBD</span>
                  </div>
                )}
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatCurrency(orderTotal, currency)}</span>
              </div>
              <Button
                size="lg"
                fullWidth
                onClick={handlePayment}
                loading={loading}
                disabled={checkoutUnavailable}
              >
                <CreditCard size={18} />
                {checkoutRoute.canCheckout ? `Pay with ${PAYMENT_PROVIDER_LABELS[paymentProvider]} (${chargeCurrency})` : checkoutRoute.label}
              </Button>
              <div className={styles.currencyNote}>
                <AlertCircle size={14} />
                <p>
                  {checkoutRoute.canCheckout
                    ? chargeCurrencyDiffers
                      ? `You are browsing in ${currency}, but this ${selectedStore.label} checkout will be charged in ${chargeCurrency} through ${PAYMENT_PROVIDER_LABELS[paymentProvider]}. Charge total: ${chargeSummaryLabel}.`
                      : `This ${selectedStore.label} checkout will be charged in ${chargeCurrency} through ${PAYMENT_PROVIDER_LABELS[paymentProvider]}. Charge total: ${chargeSummaryLabel}.`
                    : checkoutRoute.unavailableReason}
                </p>
              </div>
              <p className={styles.secureNote}>
                {checkoutRoute.canCheckout
                  ? `Secured by ${PAYMENT_PROVIDER_LABELS[paymentProvider]}. Your payment info is never stored by the storefront.`
                  : checkoutRoute.unavailableReason || 'This checkout route is temporarily unavailable.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
