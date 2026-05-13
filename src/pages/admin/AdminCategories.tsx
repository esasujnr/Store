import { useState } from 'react'
import { Plus } from 'lucide-react'
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
      const { error } = await supabase.from('categories').insert({ name, slug: slugify(name), description } as never)
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
            <h2>Add category</h2>
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
            <Button onClick={() => addCategory.mutate()} loading={addCategory.isPending} disabled={!name}>
              <Plus size={16} /> Add Category
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
