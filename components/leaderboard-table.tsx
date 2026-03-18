import { Profile } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/avatar'

interface LeaderboardTableProps {
  profiles: Profile[]
  currentUserId: string
}

const medals = ['🥇', '🥈', '🥉']

export function LeaderboardTable({ profiles, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="space-y-2">
      {profiles.map((profile, index) => {
        const isMe = profile.id === currentUserId
        return (
          <div
            key={profile.id}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
              isMe ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="w-8 text-center text-lg font-bold">
              {medals[index] ?? `#${index + 1}`}
            </div>
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="md"
              className={isMe ? 'ring-2 ring-white/30' : ''}
            />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isMe ? 'text-white' : 'text-zinc-900'}`}>
                {profile.display_name}
                {isMe && ' (Du)'}
              </p>
            </div>
            <div className={`font-bold text-lg tabular-nums ${isMe ? 'text-white' : 'text-zinc-900'}`}>
              {profile.points}
              <span className={`text-xs font-normal ml-1 ${isMe ? 'text-white/60' : 'text-zinc-500'}`}>Pkt.</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
