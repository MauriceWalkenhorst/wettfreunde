'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { BetWithDetails } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface BetCardProps {
  bet: BetWithDetails
  currentUserId: string
}

export function BetCard({ bet, currentUserId }: BetCardProps) {
  const t = useTranslations('betCard')
  const locale = useLocale()
  const myParticipation = bet.participants.find((p) => p.user_id === currentUserId)
  const isSubject = bet.subject_id === currentUserId

  const statusLabel =
    bet.status === 'answered'
      ? t('resolved')
      : isSubject
      ? t('awaitingAnswer')
      : myParticipation?.side === null
      ? t('pickSide')
      : myParticipation?.side !== null
      ? t('waitingForAnswer')
      : t('open')

  const statusVariant =
    bet.status === 'answered'
      ? 'success'
      : isSubject || myParticipation?.side === null
      ? 'warning'
      : 'default'

  return (
    <Link
      href={`/bets/${bet.id}`}
      className="block bg-card rounded-2xl border border-border p-4 hover:border-ring transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-card-foreground leading-snug line-clamp-2">{bet.question}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('stake')} {bet.stake}</p>
        </div>
        <Badge variant={statusVariant as 'default' | 'success' | 'warning'}>{statusLabel}</Badge>
      </div>

      {isSubject && bet.status === 'pending' && bet.participants.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          🎲 {t('waitingCount', { count: bet.participants.length })}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {bet.participants.slice(0, 3).map((p) => (
              <Avatar key={p.id} src={p.user.avatar_url} name={p.user.display_name} size="sm" className="ring-2 ring-card" />
            ))}
            {bet.participants.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-xs text-muted-foreground font-medium">
                +{bet.participants.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{t('bettingOn')}</span>
          <Avatar src={bet.subject.avatar_url} name={bet.subject.display_name} size="sm" />
          <span className="text-xs text-muted-foreground font-medium">{bet.subject.display_name}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">{formatRelativeTime(bet.created_at, locale)}</span>
          {bet.expires_at && new Date(bet.expires_at) > new Date() && (
            <span className="text-xs text-muted-foreground">
              {t('expiresOn', {
                date: new Date(bet.expires_at).toLocaleDateString(
                  locale === 'de' ? 'de-DE' : 'en-US',
                  { day: 'numeric', month: 'short' }
                ),
              })}
            </span>
          )}
        </div>
      </div>

      {bet.status === 'answered' && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          <span className="text-sm">
            {t('answer')} <strong>{bet.subject_answer ? t('yes') : t('no')}</strong>
          </span>
          {myParticipation?.won != null && (
            <Badge variant={myParticipation.won ? 'success' : 'danger'}>
              {myParticipation.won ? t('points', { n: myParticipation.points_awarded }) : t('lost')}
            </Badge>
          )}
        </div>
      )}
    </Link>
  )
}
