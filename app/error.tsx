'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-zinc-900">Etwas ist schiefgelaufen</h1>
        <p className="text-zinc-500 text-sm">Ein unerwarteter Fehler ist aufgetreten.</p>
        <button
          onClick={reset}
          className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Nochmal versuchen
        </button>
      </div>
    </div>
  )
}
