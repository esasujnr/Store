import { useState } from 'react'
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useCategories } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import styles from './AdminCategories.module.css'

export default function AdminCategories() {
  const { data: categories, isLoading } = useCategories()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), slug: slugify(name), description: description.trim() }
      if (editingId) {
        const { error } = await supabase.from('categories').update(payload as never).eq('id', editingId)
        if (error) throw error
        return
      }

      const { error } = await supabase.from('categories').insert(payload as never)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setName('')
      setDescription('')
      setEditingId(null)
      toast.success(editingId ? 'Category updated' : 'Category created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
    onError: (err: Error) => toast.error(err.message || 'Could not delete category. Check if products still use it.'),
  })

  function startEdit(category: NonNullable<typeof categories>[number]) {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description || '')
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
  }

  return (
    <>
      <SEO title="Admin - Categories" noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Catalog Structure</span>
            <h1 className={styles.title}>Keep the store taxonomy clean and easy to browse.</h1>
            <p className={styles.subtitle}>
              Categories shape how the storefront feels. Use this space to keep buyers moving naturally from drone platforms into the right component families.
            </p>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.form}>
            <div className={styles.formHeader}>
              <h2>{editingId ? 'Edit category' : 'Add category'}</h2>
              {editingId && (
                <button type="button" className={styles.ghostBtn} onClick={resetForm}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
            <Input
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Wings"
            />
            <Input
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description"
            />
            <Button onClick={() => saveCategory.mutate()} loading={saveCategory.isPending} disabled={!name}>
              <Plus size={16} /> {editingId ? 'Save Category' : 'Add Category'}
            </Button>
          </div>

          <div className={styles.list}>
            <h2>Existing categories ({categories?.length ?? 0})</h2>
            {isLoading ? (
              <p className={styles.loading}>Loading...</p>
            ) : (
              categories?.map(cat => (
                <div key={cat.id} className={styles.categoryRow}>
                  <div>
                    <p className={styles.catName}>{cat.name}</p>
                    <p className={styles.catSlug}>{cat.slug}</p>
                  </div>
                  <p className={styles.catDesc}>{cat.description || 'No description yet'}</p>
                  <div className={styles.rowActions}>
                    <button type="button" className={styles.actionBtn} onClick={() => startEdit(cat)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className={styles.dangerBtn} onClick={() => deleteCategory.mutate(cat.id)} disabled={deleteCategory.isPending}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
