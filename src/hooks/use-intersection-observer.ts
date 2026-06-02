import { useEffect, useRef } from "react"

interface UseIntersectionObserverProps {
  callback: () => void
  enabled: boolean
  threshold?: number
  rootMargin?: string
}

export function useIntersectionObserver({
  callback,
  enabled,
  threshold = 0.1,
  rootMargin = "100px",
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
          }
        })
      },
      { threshold, rootMargin }
    )

    const currentTarget = targetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [callback, enabled, threshold, rootMargin])

  return targetRef
}
