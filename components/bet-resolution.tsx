'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { answerBet, pickSide, declineBet } from '@/lib/actions/bets'
import { cn } from '@/lib/utils'

interface BetResolutionProps {
  betId: string
  isSubject: boolean
  myParticipation: { side: boolean | null; won: boolean | null } | null
}

export function BetResolution({ betId, isSubject, myParticipation }: BetResolutionProps) {
  const router = useRouter()
  const t = useTranslations('betResolution')
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [selectedSide, setSelectedSide] = useState<boolean | null>(myParticipation?.side ?? null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }
  }, [photoPreview])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleAnswer() {
    if (selectedAnswer === null || loading) return
    setLoading(true)
    setError(null)
    try {
      await answerBet(betId, selectedAnswer, photo ?? undefined)
      setCelebrating(true)
      timerRef.current = setTimeout(() => router.refresh(), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setLoading(false)
    }
  }

  async function handleDecline() {
    if (!window.confirm(t('declineConfirm'))) return
    setLoading(true)
    setError(null)
    try {
      await declineBet(betId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setLoading(false)
    }
  }

  async function handlePickSide() {
    if (selectedSide === null) return
    setLoading(true)
    setError(null)
    try {
      await pickSide(betId, selectedSide)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setLoading(false)
    }
  }

  if (celebrating) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-3">
        <div className="text-5xl">🎉</div>
        <h2 className="text-lg font-bold text-zinc-900">{t('celebrationTitle')}</h2>
        <p className="text-sm text-zinc-500">{t('celebrationBody')}</p>
        <div className="flex justify-center pt-2">
          <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (isSubject) {
    return (
      <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="font-medium text-zinc-900">{t('subjectPrompt')}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedAnswer(true)}
            className={cn(
              'rounded-2xl border-2 p-5 text-center transition-all',
              selectedAnswer === true ? 'border-green-500 bg-green-50' : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-zinc-900">{t('yes')}</div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedAnswer(false)}
            className={cn(
              'rounded-2xl border-2 p-5 text-center transition-all',
              selectedAnswer === false ? 'border-red-500 bg-red-50' : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <div className="text-3xl mb-2">❌</div>
            <div className="font-semibold text-zinc-900">{t('no')}</div>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-zinc-600">{t('photoLabel')}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt={t('photoLabel')} className="w-full rounded-xl object-cover max-h-48" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full text-sm flex items-center justify-center"
              >
                x
              </button>
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
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleAnswer} disabled={selectedAnswer === null} loading={loading} className="w-full">
          {t('confirmAnswer')}
        </Button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={loading}
          className="w-full text-center text-xs text-zinc-400 hover:text-red-500 transition-colors py-1"
        >
          {t('declineButton')}
        </button>
      </div>
    )
  }

  if (myParticipation && myParticipation.side === null) {
    return (
      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="font-medium text-zinc-900">{t('pickSidePrompt')}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedSide(true)}
            className={cn(
              'rounded-2xl border-2 p-5 text-center transition-all',
              selectedSide === true ? 'border-green-500 bg-green-50' : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-zinc-900">{t('yes')}</div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSide(false)}
            className={cn(
              'rounded-2xl border-2 p-5 text-center transition-all',
              selectedSide === false ? 'border-red-500 bg-red-50' : 'border-zinc-200 bg-white hover:border-zinc-400'
            )}
          >
            <div className="text-3xl mb-2">❌</div>
            <div className="font-semibold text-zinc-900">{t('no')}</div>
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handlePickSide} disabled={selectedSide === null} loading={loading} className="w-full">
          {t('confirmSide')}
        </Button>
      </div>
    )
  }

  return null
}
