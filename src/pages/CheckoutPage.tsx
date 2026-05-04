import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, CreditCard, MapPin } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency, isDigital, isPhysical } from '@/lib/utils'
import toast from 'react-hot-toast'
import styles from './CheckoutPage.module.css'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void }
    }
  }
}

export default function CheckoutPage() {
  const { user, profile } = useAuth()
  const { items, subtotal, hasPhysical, clearCart } = useCart()
  const navigate = useNavigate()

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
    country: 'Nigeria',
    postal_code: '',
  })

  const [loading, setLoading] = useState(false)

  const shippingAddress = selectedAddressId === 'new'
    ? newAddress
    : savedAddresses.find(a => a.id === selectedAddressId) || newAddress

  async function handlePayment() {
    if (!user) return
    if (hasPhysical && !shippingAddress.address_line1) {
      toast.error('Please provide a shipping address')
      return
    }

    setLoading(true)
    try {
      // Create the order in Supabase first (pending)
      const hasDigital = items.some(i => isDigital(i.product.fulfillment_type))
      const hasPhysicalItems = items.some(i => isPhysical(i.product.fulfillment_type))

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: subtotal,
          currency: 'NGN',
          has_digital: hasDigital,
          has_physical: hasPhysicalItems,
          shipping_address: hasPhysicalItems ? shippingAddress : null,
          shipping_status: hasPhysicalItems ? 'pending' : 'not_required',
        })
        .select()
        .single()

      if (orderError) throw orderError
      const order = orderData as { id: string }

      // Insert order items
      const orderItems = items.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        fulfillment_type: product.fulfillment_type,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Load Paystack inline
      const paystackPublicKey = (import.meta as { env: Record<string, string> }).env.VITE_PAYSTACK_PUBLIC_KEY
      if (!paystackPublicKey) {
        toast.error('Payment configuration missing')
        setLoading(false)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.onload = () => {
        const handler = window.PaystackPop.setup({
          key: paystackPublicKey,
          email: user.email,
          amount: subtotal * 100, // kobo
          currency: 'NGN',
          ref: order.id,
          metadata: { order_id: order.id },
          callback: async (response: { reference: string }) => {
            await supabase
              .from('orders')
              .update({ payment_reference: response.reference, status: 'paid' })
              .eq('id', order.id)

            clearCart()
            navigate(`/orders/${order.id}`)
            toast.success('Payment successful! Your order is confirmed.')
          },
          onClose: async () => {
            await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('id', order.id)
            setLoading(false)
            toast('Payment cancelled')
          },
        })
        handler.openIframe()
      }
      document.head.appendChild(script)
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
            {/* Left */}
            <div>
              {/* Shipping Address */}
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

              {/* Order items */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ShoppingBag size={18} />
                  <h2>Order Items</h2>
                </div>
                <div className={styles.itemsList}>
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className={styles.orderItem}>
                      <img
                        src={product.image_url || 'https://images.pexels.com/photos/1261799/pexels-photo-1261799.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={product.name}
                        className={styles.itemImg}
                      />
                      <div className={styles.itemName}>
                        <span>{product.name}</span>
                        <span className={styles.itemQty}>×{quantity}</span>
                      </div>
                      <span className={styles.itemTotal}>
                        {formatCurrency(product.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: Summary */}
            <div className={styles.summary}>
              <h2>Payment Summary</h2>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {hasPhysical && (
                  <div className={styles.summaryRow}>
                    <span>Shipping</span>
                    <span className={styles.tbd}>TBD</span>
                  </div>
                )}
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Button
                size="lg"
                fullWidth
                onClick={handlePayment}
                loading={loading}
              >
                <CreditCard size={18} />
                Pay with Paystack
              </Button>
              <p className={styles.secureNote}>
                Secured by Paystack. Your payment info is never stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
