import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎲</div>
        <h1 className="text-2xl font-bold text-zinc-900">Seite nicht gefunden</h1>
        <p className="text-zinc-500 text-sm">Diese Seite existiert nicht oder wurde verschoben.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
