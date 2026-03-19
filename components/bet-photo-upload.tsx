'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { uploadBetPhoto } from '@/lib/actions/bets'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface BetPhotoUploadProps {
  betId: string
}

export function BetPhotoUpload({ betId }: BetPhotoUploadProps) {
  const router = useRouter()
  const t = useTranslations('betPhotoUpload')
  const fileRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!photo) return
    setLoading(true)
    setError(null)
    try {
      await uploadBetPhoto(betId, photo, caption || undefined)
      setDone(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4 text-sm text-green-600 font-medium">
        {t('done')}
      </div>
    )
  }

  return (
    <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
      <p className="text-sm font-medium text-zinc-900">{t('title')}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={t('preview')} className="w-full rounded-xl object-cover max-h-48" />
          <input
            type="text"
            placeholder={t('caption')}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setPhoto(null); setPreview(null) }} className="flex-1">
              {t('changePhoto')}
            </Button>
            <Button size="sm" onClick={handleUpload} loading={loading} className="flex-1">
              {t('upload')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-6 text-sm text-zinc-500 hover:border-zinc-400 transition-colors text-center"
        >
          {t('photoButton')}
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
