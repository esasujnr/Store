import { useMemo, useState } from 'react'
import { CalendarRange, Pencil, Plus, RotateCcw, Tag as TagIcon, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useDiscounts } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import type { Discount } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminDiscounts.module.css'

type DiscountFormState = {
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  value: string
  minimum_order_amount: string
  starts_at: string
  ends_at: string
  usage_limit: string
  is_active: boolean
}

const EMPTY_FORM: DiscountFormState = {
  code: '',
  description: '',
  discount_type: 'percent',
  value: '',
  minimum_order_amount: '0',
  starts_at: '',
  ends_at: '',
  usage_limit: '',
  is_active: true,
}

function toDateTimeInput(value: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null
}

function toFormState(discount: Discount): DiscountFormState {
  return {
    code: discount.code,
    description: discount.description || '',
    discount_type: discount.discount_type,
    value: String(discount.value),
    minimum_order_amount: String(discount.minimum_order_amount || 0),
    starts_at: toDateTimeInput(discount.starts_at),
    ends_at: toDateTimeInput(discount.ends_at),
    usage_limit: discount.usage_limit ? String(discount.usage_limit) : '',
    is_active: discount.is_active,
  }
}

export default function AdminDiscounts() {
  const qc = useQueryClient()
  const { data: discounts, isLoading } = useDiscounts()
  const [form, setForm] = useState<DiscountFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const rows = discounts || []
    return {
      active: rows.filter(discount => discount.is_active).length,
      scheduled: rows.filter(discount => !!discount.starts_at || !!discount.ends_at).length,
      capped: rows.filter(discount => discount.usage_limit !== null).length,
    }
  }, [discounts])

  const saveDiscount = useMutation({
    mutationFn: async () => {
      const payload: Partial<Discount> = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discount_type,
        value: Number(form.value),
        minimum_order_amount: Number(form.minimum_order_amount || 0),
        starts_at: toIsoDateTime(form.starts_at),
        ends_at: toIsoDateTime(form.ends_at),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        is_active: form.is_active,
      }

      if (editingId) {
        const { error } = await supabase.from('discounts').update(payload as never).eq('id', editingId)
        if (error) throw error
        return
      }

      const { error } = await supabase.from('discounts').insert(payload as never)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discounts'] })
      setForm(EMPTY_FORM)
      setEditingId(null)
      toast.success(editingId ? 'Discount updated' : 'Discount created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleDiscount = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('discounts').update({ is_active } as never).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discounts'] }),
    onError: () => toast.error('Could not update discount status'),
  })

  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discounts'] })
      if (editingId) handleReset()
      toast.success('Discount deleted')
    },
    onError: () => toast.error('Could not delete discount'),
  })

  function handleEdit(discount: Discount) {
    setEditingId(discount.id)
    setForm(toFormState(discount))
  }

  function handleReset() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  return (
    <>
      <SEO title="Admin - Discounts" noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Promotions</span>
            <h1 className={styles.title}>Create discount codes and control active promotions.</h1>
            <p className={styles.subtitle}>Use this section for checkout discounts, while sale pricing on products can be set directly inside each product record. Fixed discounts and minimum order amounts are entered in the store base currency (GHS) and converted on the storefront.</p>
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Scheduled</span>
            <strong>{stats.scheduled}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Usage capped</span>
            <strong>{stats.capped}</strong>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{editingId ? 'Edit discount' : 'Create discount'}</h2>
                <p className={styles.helper}>Set codes, date windows, and usage caps from one place.</p>
              </div>
              {editingId && (
                <button type="button" className={styles.resetBtn} onClick={handleReset}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
            <Input label="Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="WELCOME10" />
            <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="First order welcome code" />
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <select className={styles.select} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as DiscountFormState['discount_type'] }))}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <Input label="Value" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className={styles.row2}>
              <Input label="Minimum order amount (GHS)" type="number" min="0" value={form.minimum_order_amount} onChange={e => setForm(f => ({ ...f, minimum_order_amount: e.target.value }))} />
              <Input label="Usage limit" type="number" min="0" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="Unlimited if blank" />
            </div>
            <div className={styles.row2}>
              <Input label="Starts at" type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              <Input label="Ends at" type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </div>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Set discount active immediately
            </label>
            <Button onClick={() => saveDiscount.mutate()} loading={saveDiscount.isPending} disabled={!form.code || !form.value}>
              <Plus size={16} /> {editingId ? 'Save Changes' : 'Create Discount'}
            </Button>
          </div>

          <div className={styles.listCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Active and saved discounts</h2>
                <p className={styles.helper}>Review code performance, date windows, and caps before you turn campaigns live.</p>
              </div>
            </div>
            {isLoading ? (
              <p className={styles.loading}>Loading...</p>
            ) : (
              <div className={styles.discountList}>
                {discounts?.map(discount => (
                  <div key={discount.id} className={styles.discountRow}>
                    <div className={styles.discountInfo}>
                      <div className={styles.codeRow}>
                        <TagIcon size={14} />
                        <strong>{discount.code}</strong>
                        {discount.starts_at || discount.ends_at ? <span className={styles.miniBadge}><CalendarRange size={12} /> Scheduled</span> : null}
                      </div>
                      <p className={styles.meta}>{discount.description || 'No description'}</p>
                      <p className={styles.meta}>
                        {discount.discount_type === 'percent' ? `${discount.value}% off` : `GHS ${discount.value} off`} • minimum order GHS {discount.minimum_order_amount}
                      </p>
                      <p className={styles.meta}>
                        {discount.starts_at ? `Starts ${new Date(discount.starts_at).toLocaleString()}` : 'Starts immediately'} • {discount.ends_at ? `Ends ${new Date(discount.ends_at).toLocaleString()}` : 'No end date'}
                      </p>
                      <p className={styles.meta}>
                        {discount.usage_limit ? `Used ${discount.used_count} / ${discount.usage_limit}` : `Used ${discount.used_count} times`}
                      </p>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        className={`${styles.statusToggle} ${discount.is_active ? styles.statusActive : styles.statusInactive}`}
                        onClick={() => toggleDiscount.mutate({ id: discount.id, is_active: !discount.is_active })}
                      >
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button type="button" className={styles.editBtn} onClick={() => handleEdit(discount)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className={styles.deleteBtn} onClick={() => deleteDiscount.mutate(discount.id)} disabled={deleteDiscount.isPending}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
