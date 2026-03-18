'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { answerBet, pickSide } from '@/lib/actions/bets'
import { cn } from '@/lib/utils'

interface BetResolutionProps {
  betId: string
  isSubject: boolean
  myParticipation: { side: boolean | null; won: boolean | null } | null
}

export function BetResolution({ betId, isSubject, myParticipation }: BetResolutionProps) {
  const router = useRouter()
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [selectedSide, setSelectedSide] = useState<boolean | null>(myParticipation?.side ?? null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleAnswer() {
    if (selectedAnswer === null) return
    setLoading(true)
    setError(null)
    try {
      await answerBet(betId, selectedAnswer, photo ?? undefined)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
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
      setError(e instanceof Error ? e.message : 'Fehler')
      setLoading(false)
    }
  }

  if (isSubject) {
    return (
      <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="font-medium text-zinc-900">Das bist du! Wie lautet deine Antwort?</p>

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
            <div className="font-semibold text-zinc-900">Ja</div>
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
            <div className="font-semibold text-zinc-900">Nein</div>
          </button>
        </div>

        {/* Photo upload */}
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">Foto-Beweis (optional)</p>
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
              <img src={photoPreview} alt="Beweis" className="w-full rounded-xl object-cover max-h-48" />
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
              Foto aufnehmen oder auswaehlen
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleAnswer} disabled={selectedAnswer === null} loading={loading} className="w-full">
          Antwort bestaetigen
        </Button>
      </div>
    )
  }

  if (myParticipation && myParticipation.side === null) {
    return (
      <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="font-medium text-zinc-900">Waehle deine Seite!</p>

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
            <div className="font-semibold text-zinc-900">Ja</div>
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
            <div className="font-semibold text-zinc-900">Nein</div>
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handlePickSide} disabled={selectedSide === null} loading={loading} className="w-full">
          Seite bestaetigen
        </Button>
      </div>
    )
  }

  return null
}
