import Link from 'next/link'
import { BetWithDetails } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface BetCardProps {
  bet: BetWithDetails
  currentUserId: string
}

export function BetCard({ bet, currentUserId }: BetCardProps) {
  const myParticipation = bet.participants.find((p) => p.user_id === currentUserId)
  const isSubject = bet.subject_id === currentUserId

  const statusLabel =
    bet.status === 'answered'
      ? 'Aufgelöst'
      : isSubject
      ? 'Deine Antwort gefragt'
      : myParticipation?.side === null
      ? 'Seite wählen'
      : 'Offen'

  const statusVariant =
    bet.status === 'answered'
      ? 'success'
      : isSubject || myParticipation?.side === null
      ? 'warning'
      : 'default'

  return (
    <Link
      href={`/bets/${bet.id}`}
      className="block bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 leading-snug line-clamp-2">{bet.question}</p>
          <p className="text-sm text-zinc-500 mt-1">Einsatz: {bet.stake}</p>
        </div>
        <Badge variant={statusVariant as 'default' | 'success' | 'warning'}>{statusLabel}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {bet.participants.slice(0, 3).map((p) => (
              <Avatar key={p.id} src={p.user.avatar_url} name={p.user.display_name} size="sm" className="ring-2 ring-white" />
            ))}
            {bet.participants.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-zinc-100 ring-2 ring-white flex items-center justify-center text-xs text-zinc-600 font-medium">
                +{bet.participants.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-400">Wetten auf</span>
          <Avatar src={bet.subject.avatar_url} name={bet.subject.display_name} size="sm" />
          <span className="text-xs text-zinc-600 font-medium">{bet.subject.display_name}</span>
        </div>
        <span className="text-xs text-zinc-400">{formatRelativeTime(bet.created_at)}</span>
      </div>

      {bet.status === 'answered' && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
          <span className="text-sm">
            Antwort: <strong>{bet.subject_answer ? 'Ja' : 'Nein'}</strong>
          </span>
          {myParticipation?.won !== null && myParticipation?.won !== undefined && (
            <Badge variant={myParticipation.won ? 'success' : 'danger'}>
              {myParticipation.won ? `+${myParticipation.points_awarded} Punkte` : 'Verloren'}
            </Badge>
          )}
        </div>
      )}
    </Link>
  )
}
