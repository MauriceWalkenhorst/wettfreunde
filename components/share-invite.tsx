'use client'

import { useState } from 'react'
import { createInviteLink } from '@/lib/actions/friends'
import { Button } from '@/components/ui/button'

export function ShareInvite() {
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const { token } = await createInviteLink()
      const url = `${window.location.origin}/invite/${token}`
      setLink(url)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-zinc-900">Freunde einladen</h3>
        <p className="text-sm text-zinc-500 mt-0.5">Teile einen persoenlichen Einladungslink.</p>
      </div>

      {link ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 text-xs bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-700 focus:outline-none"
            />
            <Button size="sm" onClick={handleCopy} variant="secondary">
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleCreate} loading={loading}>
            Neuen Link generieren
          </Button>
        </div>
      ) : (
        <Button onClick={handleCreate} loading={loading}>
          Einladungslink erstellen
        </Button>
      )}
    </div>
  )
}
