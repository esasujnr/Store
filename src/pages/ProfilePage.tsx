import { useState } from 'react'
import { Plus, Trash2, Check, User, MapPin } from 'lucide-react'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { ShippingAddress } from '@/lib/database.types'
import { generateId } from '@/lib/utils'
import toast from 'react-hot-toast'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { profile, refreshProfile, user } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddr, setNewAddr] = useState<Omit<ShippingAddress, 'id'>>({
    label: '',
    full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    is_default: false,
  })

  const addresses: ShippingAddress[] = (profile?.shipping_addresses as ShippingAddress[]) || []

  async function saveProfile() {
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user!.id)
    setSavingProfile(false)
    if (error) {
      toast.error('Failed to save profile')
    } else {
      await refreshProfile()
      toast.success('Profile saved')
    }
  }

  async function addAddress() {
    if (!newAddr.label || !newAddr.address_line1 || !newAddr.city) {
      toast.error('Please fill in required address fields')
      return
    }
    const addr: ShippingAddress = { ...newAddr, id: generateId() }
    const updated = [...addresses, addr]
    const { error } = await supabase
      .from('profiles')
      .update({ shipping_addresses: updated })
      .eq('id', user!.id)
    if (error) {
      toast.error('Failed to save address')
    } else {
      await refreshProfile()
      setShowAddForm(false)
      setNewAddr({ label: '', full_name: '', phone: '', address_line1: '', city: '', state: '', country: 'Nigeria', postal_code: '', is_default: false })
      toast.success('Address saved')
    }
  }

  async function removeAddress(id: string) {
    const updated = addresses.filter(a => a.id !== id)
    const { error } = await supabase
      .from('profiles')
      .update({ shipping_addresses: updated })
      .eq('id', user!.id)
    if (!error) {
      await refreshProfile()
      toast.success('Address removed')
    }
  }

  async function setDefault(id: string) {
    const updated = addresses.map(a => ({ ...a, is_default: a.id === id }))
    await supabase.from('profiles').update({ shipping_addresses: updated }).eq('id', user!.id)
    await refreshProfile()
  }

  return (
    <>
      <SEO title="Profile" url="/profile" noIndex />
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>My Profile</h1>

          <div className={styles.grid}>
            {/* Profile info */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <User size={18} />
                <h2>Account Information</h2>
              </div>
              <div className={styles.form}>
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
                <Input
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  hint="Email cannot be changed"
                />
                <Button onClick={saveProfile} loading={savingProfile}>
                  Save Changes
                </Button>
              </div>
            </section>

            {/* Shipping addresses */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <MapPin size={18} />
                <h2>Shipping Addresses</h2>
              </div>

              <div className={styles.addressList}>
                {addresses.length === 0 && !showAddForm && (
                  <p className={styles.empty}>No saved addresses.</p>
                )}
                {addresses.map(addr => (
                  <div key={addr.id} className={`${styles.addrCard} ${addr.is_default ? styles.addrCardDefault : ''}`}>
                    <div className={styles.addrInfo}>
                      <div className={styles.addrLabel}>
                        {addr.label}
                        {addr.is_default && <span className={styles.defaultBadge}>Default</span>}
                      </div>
                      <p>{addr.full_name}</p>
                      <p>{addr.address_line1}</p>
                      <p>{addr.city}, {addr.state}, {addr.country}</p>
                    </div>
                    <div className={styles.addrActions}>
                      {!addr.is_default && (
                        <button className={styles.addrBtn} onClick={() => setDefault(addr.id)}>
                          <Check size={14} /> Set Default
                        </button>
                      )}
                      <button className={`${styles.addrBtn} ${styles.addrBtnDanger}`} onClick={() => removeAddress(addr.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {showAddForm ? (
                  <div className={styles.addForm}>
                    <div className={styles.formRow}>
                      <Input
                        label="Label (e.g. Home)"
                        value={newAddr.label}
                        onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))}
                      />
                      <Input
                        label="Full Name"
                        value={newAddr.full_name}
                        onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))}
                      />
                    </div>
                    <div className={styles.formRow}>
                      <Input
                        label="Phone"
                        value={newAddr.phone}
                        onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))}
                      />
                      <Input
                        label="Address"
                        value={newAddr.address_line1}
                        onChange={e => setNewAddr(p => ({ ...p, address_line1: e.target.value }))}
                      />
                    </div>
                    <div className={styles.formRow}>
                      <Input
                        label="City"
                        value={newAddr.city}
                        onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))}
                      />
                      <Input
                        label="State"
                        value={newAddr.state}
                        onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))}
                      />
                    </div>
                    <div className={styles.formActions}>
                      <Button onClick={addAddress}>Save Address</Button>
                      <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={16} /> Add Address
                  </Button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
