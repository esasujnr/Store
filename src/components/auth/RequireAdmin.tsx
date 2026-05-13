import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function RequireAdmin() {
  const { user, isAdmin, isLoading, refreshProfile } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasRetried, setHasRetried] = useState(false)

  useEffect(() => {
    if (isLoading || !user || isAdmin || hasRetried) return

    setIsRefreshing(true)
    refreshProfile()
      .finally(() => {
        setHasRetried(true)
        setIsRefreshing(false)
      })
  }, [hasRetried, isAdmin, isLoading, refreshProfile, user])

  if (isLoading || isRefreshing) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
