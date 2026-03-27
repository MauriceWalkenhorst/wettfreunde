'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('betForm')
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [question, setQuestion] = useState('')
  const [stake, setStake] = useState('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [participantIds, setParticipantIds] = useState<string[]>([currentUser.id])
  const [creatorSide, setCreatorSide] = useState<boolean | null>(null)

  const steps: Step[] = ['details', 'subject', 'participants', 'side']
  const stepIndex = steps.indexOf(step)

  const tomorrowStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  function toggleParticipant(id: string) {
    if (id === currentUser.id) return
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function selectSubject(id: string) {
    setSubjectId((prev) => (prev === id ? null : id))
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
        expiresAt: expiresAt || undefined,
      })
      router.push(`/bets/${betId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorCreating'))
      setLoading(false)
    }
  }

  const canNext =
    step === 'details'
      ? question.trim().length > 3 && stake.trim().length > 0
      : step === 'subject'
      ? subjectId !== null
      : step === 'participants'
      ? participantIds.length >= 1
      : creatorSide !== null

  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id)
  const participantCandidates = otherUsers.filter((u) => u.id !== subjectId)
  const selectedSubject = allUsers.find((u) => u.id === subjectId)

  const stepLabels: Record<Step, string> = {
    details: t('stepDetails'),
    subject: t('stepSubject'),
    participants: t('stepParticipants'),
    side: t('stepSide'),
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          {t('stepIndicator', { current: stepIndex + 1, total: steps.length, label: stepLabels[step] })}
        </p>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= stepIndex ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {step === 'details' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('detailsTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('detailsSubtitle')}</p>
          </div>
          <Input
            label={t('questionLabel')}
            placeholder={t('questionPlaceholder')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            autoFocus
          />
          <Input
            label={t('stakeLabel')}
            placeholder={t('stakePlaceholder')}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">{t('expiryLabel')}</label>
            <input
              type="date"
              min={tomorrowStr}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {expiresAt && (
              <button
                type="button"
                onClick={() => setExpiresAt('')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('noExpiry')}
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'subject' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('subjectTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('subjectSubtitle')}</p>
          </div>
          {otherUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t('noOtherUsers')}
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
            <h2 className="text-xl font-bold text-foreground">{t('participantsTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('participantsSubtitle')}</p>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary bg-muted">
            <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size="sm" />
            <span className="flex-1 text-sm font-medium text-foreground">{currentUser.display_name} {t('you')}</span>
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          </div>

          {participantCandidates.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {t('noParticipants')}
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
            <h2 className="text-xl font-bold text-foreground">{t('sideTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('sideSubtitle')}</p>
          </div>

          <div className="bg-muted rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-1">{t('questionFor', { name: selectedSubject?.display_name ?? '' })}</p>
            <p className="font-medium text-foreground">{question}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCreatorSide(true)}
              className={cn(
                'rounded-2xl border-2 p-6 text-center transition-all',
                creatorSide === true ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border hover:border-muted-foreground'
              )}
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold text-foreground">{t('yes')}</div>
            </button>
            <button
              type="button"
              onClick={() => setCreatorSide(false)}
              className={cn(
                'rounded-2xl border-2 p-6 text-center transition-all',
                creatorSide === false ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border hover:border-muted-foreground'
              )}
            >
              <div className="text-3xl mb-2">❌</div>
              <div className="font-semibold text-foreground">{t('no')}</div>
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        {stepIndex > 0 && (
          <Button variant="secondary" onClick={() => setStep(steps[stepIndex - 1])} className="flex-1">
            {t('back')}
          </Button>
        )}
        {step !== 'side' ? (
          <Button onClick={() => setStep(steps[stepIndex + 1])} disabled={!canNext} className="flex-1">
            {t('next')}
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canNext} loading={loading} className="flex-1">
            {t('createBet')}
          </Button>
        )}
      </div>
    </div>
  )
}
