import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  fullPage?: boolean
  size?: number
}

export default function LoadingSpinner({ fullPage, size = 32 }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )

  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        {spinner}
      </div>
    )
  }

  return spinner
}
