import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/queries/leaderboard'
import { LeaderboardRealtime } from '@/components/leaderboard-realtime'
import { getTranslations } from 'next-intl/server'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profiles, t] = await Promise.all([
    getLeaderboard(),
    getTranslations('leaderboard'),
  ])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-500">{t('live')}</span>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-zinc-900 font-medium">{t('emptyTitle')}</p>
          <p className="text-sm text-zinc-500">{t('emptySubtitle')}</p>
        </div>
      ) : (
        <LeaderboardRealtime profiles={profiles} currentUserId={user.id} />
      )}
    </div>
  )
}
