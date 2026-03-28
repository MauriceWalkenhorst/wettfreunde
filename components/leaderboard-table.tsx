'use client'

import { useTranslations } from 'next-intl'
import { Profile } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/avatar'
import Link from 'next/link'

interface LeaderboardTableProps {
  profiles: Profile[]
  currentUserId: string
}

const medals = ['🥇', '🥈', '🥉']

export function LeaderboardTable({ profiles, currentUserId }: LeaderboardTableProps) {
  const t = useTranslations('leaderboardTable')

  return (
    <div className="space-y-2">
      {profiles.map((profile, index) => {
        const isMe = profile.id === currentUserId
        return (
          <Link
            key={profile.id}
            href={isMe ? '/profile' : `/profile/${profile.id}`}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:opacity-90 ${
              isMe ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border hover:bg-accent'
            }`}
          >
            <div className="w-8 text-center text-lg font-bold">
              {medals[index] ?? `#${index + 1}`}
            </div>
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="md"
              className={isMe ? 'ring-2 ring-primary-foreground/30' : ''}
            />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isMe ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                {profile.display_name}
                {isMe && ` ${t('you')}`}
              </p>
            </div>
            <div className={`font-bold text-lg tabular-nums ${isMe ? 'text-primary-foreground' : 'text-card-foreground'}`}>
              {profile.points}
              <span className={`text-xs font-normal ml-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{t('pts')}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
