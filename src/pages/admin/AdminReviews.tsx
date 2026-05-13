import { useMemo } from 'react'
import { Check, MessageSquareQuote, ShieldOff, Star, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SEO from '@/components/SEO'
import Button from '@/components/ui/Button'
import { useAdminReviews } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Product, Review } from '@/lib/database.types'
import toast from 'react-hot-toast'
import styles from './AdminReviews.module.css'

type AdminReview = Review & { product?: Pick<Product, 'id' | 'name' | 'slug' | 'image_url'> }

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={`review-star-${index}`} size={15} className={`${styles.star} ${index < rating ? styles.starActive : ''}`} />
  ))
}

export default function AdminReviews() {
  const qc = useQueryClient()
  const { data: reviews, isLoading } = useAdminReviews()

  const stats = useMemo(() => {
    const rows = (reviews || []) as AdminReview[]
    return {
      total: rows.length,
      approved: rows.filter(review => review.is_approved).length,
      pending: rows.filter(review => !review.is_approved).length,
    }
  }, [reviews])

  const toggleApproval = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase.from('reviews').update({ is_approved } as never).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: () => toast.error('Could not update review status'),
  })

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      qc.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Review deleted')
    },
    onError: () => toast.error('Could not delete review'),
  })

  return (
    <>
      <SEO title="Admin - Reviews" noIndex />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Social Proof</span>
            <h1 className={styles.title}>Moderate customer reviews before they shape the storefront.</h1>
            <p className={styles.subtitle}>Approve, unapprove, or remove feedback here so the public catalog only shows reviews that strengthen buyer confidence.</p>
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span>Total reviews</span>
            <strong>{stats.total}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Approved</span>
            <strong>{stats.approved}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Hidden</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Review queue</h2>
              <p>Every review here can be published, hidden, or removed without touching the storefront code.</p>
            </div>
          </div>

          {isLoading ? (
            <p className={styles.loading}>Loading...</p>
          ) : !reviews?.length ? (
            <p className={styles.loading}>No reviews yet.</p>
          ) : (
            <div className={styles.reviewList}>
              {(reviews as AdminReview[]).map(review => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerBlock}>
                      <div className={styles.avatar}>
                        <MessageSquareQuote size={18} />
                      </div>
                      <div>
                        <div className={styles.reviewMetaTop}>
                          <strong>{review.profile?.full_name || 'Wingxtra customer'}</strong>
                          <span className={`${styles.statusBadge} ${review.is_approved ? styles.statusApproved : styles.statusHidden}`}>
                            {review.is_approved ? 'Approved' : 'Hidden'}
                          </span>
                        </div>
                        <p className={styles.metaLine}>
                          {review.product?.name || 'Unknown product'} • {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={styles.starsRow}>{renderStars(review.rating)}</div>
                  </div>

                  <div className={styles.reviewBodyWrap}>
                    <h3>{review.title || 'Customer review'}</h3>
                    <p>{review.body || 'No review body provided.'}</p>
                  </div>

                  <div className={styles.reviewActions}>
                    <Button
                      variant={review.is_approved ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleApproval.mutate({ id: review.id, is_approved: !review.is_approved })}
                      loading={toggleApproval.isPending}
                    >
                      {review.is_approved ? <ShieldOff size={14} /> : <Check size={14} />}
                      {review.is_approved ? 'Hide Review' : 'Approve Review'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteReview.mutate(review.id)}
                      loading={deleteReview.isPending}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}