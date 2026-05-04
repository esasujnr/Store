import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

  const addCategory = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('categories').insert({ name, slug: slugify(name), description } as any)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setName('')
      setDescription('')
      toast.success('Category created')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      <SEO title="Admin — Categories" noIndex />
      <div>
        <h1 className={styles.title}>Categories</h1>

        <div className={styles.grid}>
          {/* Add form */}
          <div className={styles.form}>
            <h2>Add Category</h2>
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
            <Button
              onClick={() => addCategory.mutate()}
              loading={addCategory.isPending}
              disabled={!name}
            >
              <Plus size={16} /> Add Category
            </Button>
          </div>

          {/* List */}
          <div className={styles.list}>
            <h2>Existing ({categories?.length ?? 0})</h2>
            {isLoading ? (
              <p className={styles.loading}>Loading…</p>
            ) : (
              categories?.map(cat => (
                <div key={cat.id} className={styles.categoryRow}>
                  <div>
                    <p className={styles.catName}>{cat.name}</p>
                    <p className={styles.catSlug}>{cat.slug}</p>
                  </div>
                  <p className={styles.catDesc}>{cat.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
