'use client'

import {
  useEffect,
} from 'react'

export default function PwaServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !==
        'production' ||
      !(
        'serviceWorker' in
        navigator
      )
    ) {
      return
    }

    let cancelled =
      false

    const registerServiceWorker =
      async () => {
        try {
          const registration =
            await navigator.serviceWorker.register(
              '/sw.js',
              {
                scope:
                  '/',

                updateViaCache:
                  'none',
              },
            )

          if (
            !cancelled
          ) {
            await registration.update()
          }
        } catch (
          error
        ) {
          console.error(
            'Não foi possível registrar o service worker da Agenda EDI.',
            error,
          )
        }
      }

    const handleLoad =
      () => {
        void registerServiceWorker()
      }

    if (
      document.readyState ===
      'complete'
    ) {
      void registerServiceWorker()
    } else {
      window.addEventListener(
        'load',
        handleLoad,
      )
    }

    return () => {
      cancelled =
        true

      window.removeEventListener(
        'load',
        handleLoad,
      )
    }
  }, [])

  return null
}