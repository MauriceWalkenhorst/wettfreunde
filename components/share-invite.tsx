'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createInviteLink } from '@/lib/actions/friends'
import { Button } from '@/components/ui/button'

export function ShareInvite() {
  const t = useTranslations('shareInvite')
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const { token } = await createInviteLink()
      const url = `${window.location.origin}/invite/${token}`
      setLink(url)
    } catch {
      setError(t('error'))
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

  async function handleShare() {
    if (!link) return
    if (navigator.share) {
      await navigator.share({ title: 'Wettfreunde', text: t('shareText'), url: link })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-3">
      <div>
        <h3 className="font-semibold text-zinc-900">{t('title')}</h3>
        <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
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
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={handleShare} className="flex-1">
              {t('share')}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCreate} loading={loading}>
              {t('regenerate')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Button onClick={handleCreate} loading={loading} className="w-full">
            {t('createLink')}
          </Button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </>
      )}
    </div>
  )
}
