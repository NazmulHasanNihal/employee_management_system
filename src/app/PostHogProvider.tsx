'use client'

import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Load posthog-js lazily and only when a key is configured, so the ~30 kB
  // library stays out of the shared client bundle when analytics are disabled
  // (no NEXT_PUBLIC_POSTHOG_KEY). The provider is render-pass-through; nothing
  // else in the app consumes the PostHog React context.
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    let cancelled = false
    import('posthog-js').then((mod) => {
      if (cancelled) return
      mod.default.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return <>{children}</>
}
