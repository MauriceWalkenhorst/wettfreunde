'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/supabase/types'
import { createBet } from '@/lib/actions/bets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FriendPicker } from '@/components/friend-picker'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface BetFormProps {
  allUsers: Profile[]
  currentUser: Profile
}

type Step = 'details' | 'subject' | 'participants' | 'side'

export function BetForm({ allUsers, currentUser }: BetFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [question, setQuestion] = useState('')
  const [stake, setStake] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [participantIds, setParticipantIds] = useState<string[]>([currentUser.id])
  const [creatorSide, setCreatorSide] = useState<boolean | null>(null)

  const steps: Step[] = ['details', 'subject', 'participants', 'side']
  const stepIndex = steps.indexOf(step)

  function toggleParticipant(id: string) {
    if (id === currentUser.id) return
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function selectSubject(id: string) {
    setSubjectId((prev) => (prev === id ? null : id))
    // Reset participants when subject changes
    setParticipantIds([currentUser.id])
  }

  async function handleSubmit() {
    if (!subjectId || creatorSide === null) return
    setLoading(true)
    setError(null)
    try {
      const { betId } = await createBet({
        question,
        stake,
        subjectId,
        participantIds,
        creatorSide,
      })
      router.push(`/bets/${betId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen der Wette')
      setLoading(false)
    }
  }

  const canNext =
    step === 'details'
      ? question.trim().length > 3 && stake.trim().length > 0
      : step === 'subject'
      ? subjectId !== null
      : step === 'participants'
      ? participantIds.length >= 2
      : creatorSide !== null

  // All users except current user
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id)
  // For participants: exclude the subject (subject can't bet on themselves)
  const participantCandidates = otherUsers.filter((u) => u.id !== subjectId)
  const selectedSubject = allUsers.find((u) => u.id === subjectId)

  const stepLabels: Record<Step, string> = {
    details: 'Die Wette',
    subject: 'Befragte Person',
    participants: 'Teilnehmer',
    side: 'Deine Seite',
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-500 font-medium">
          Schritt {stepIndex + 1} von {steps.length} — {stepLabels[step]}
        </p>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= stepIndex ? 'bg-zinc-900' : 'bg-zinc-200'
              )}
            />
          ))}
        </div>
      </div>

      {step === 'details' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Die Wette</h2>
            <p className="text-sm text-zinc-500 mt-1">Was wird gewettet?</p>
          </div>
          <Input
            label="Frage (Ja/Nein)"
            placeholder="Hat Manu gestern ein Bier getrunken?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            autoFocus
          />
          <Input
            label="Einsatz"
            placeholder="Ein Weizen, ein Kaffee..."
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </div>
      )}

      {step === 'subject' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Befragte Person</h2>
            <p className="text-sm text-zinc-500 mt-1">Wer muss die Frage beantworten?</p>
          </div>
          {otherUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">
              Noch keine anderen Nutzer auf der Plattform.
            </div>
          ) : (
            <FriendPicker
              friends={otherUsers}
              selected={subjectId ? [subjectId] : []}
              onToggle={selectSubject}
              singleSelect
            />
          )}
        </div>
      )}

      {step === 'participants' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Teilnehmer auswählen</h2>
            <p className="text-sm text-zinc-500 mt-1">Wer wettet mit? (mind. 1 weiterer)</p>
          </div>

          {/* Creator (always selected) */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-900 bg-zinc-50">
            <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size="sm" />
            <span className="flex-1 text-sm font-medium text-zinc-900">{currentUser.display_name} (Du)</span>
            <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          </div>

          {participantCandidates.length === 0 ? (
            <div className="text-center py-6 text-sm text-zinc-500">
              Keine weiteren Nutzer verfügbar.
            </div>
          ) : (
            <FriendPicker
              friends={participantCandidates}
              selected={participantIds}
              onToggle={toggleParticipant}
            />
          )}
        </div>
      )}

      {step === 'side' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Deine Seite</h2>
            <p className="text-sm text-zinc-500 mt-1">Was glaubst du?</p>
          </div>

          <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
            <p className="text-sm text-zinc-500 mb-1">Frage an {selectedSubject?.display_name}</p>
            <p className="font-medium text-zinc-900">{question}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCreatorSide(true)}
              className={cn(
                'rounded-2xl border-2 p-6 text-center transition-all',
                creatorSide === true ? 'border-green-500 bg-green-50' : 'border-zinc-200 hover:border-zinc-400'
              )}
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold text-zinc-900">Ja</div>
            </button>
            <button
              type="button"
              onClick={() => setCreatorSide(false)}
              className={cn(
                'rounded-2xl border-2 p-6 text-center transition-all',
                creatorSide === false ? 'border-red-500 bg-red-50' : 'border-zinc-200 hover:border-zinc-400'
              )}
            >
              <div className="text-3xl mb-2">❌</div>
              <div className="font-semibold text-zinc-900">Nein</div>
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        {stepIndex > 0 && (
          <Button variant="secondary" onClick={() => setStep(steps[stepIndex - 1])} className="flex-1">
            Zurück
          </Button>
        )}
        {step !== 'side' ? (
          <Button onClick={() => setStep(steps[stepIndex + 1])} disabled={!canNext} className="flex-1">
            Weiter
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canNext} loading={loading} className="flex-1">
            Wette erstellen
          </Button>
        )}
      </div>
    </div>
  )
}
