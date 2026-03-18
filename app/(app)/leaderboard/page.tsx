import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/queries/leaderboard'
import { LeaderboardTable } from '@/components/leaderboard-table'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profiles = await getLeaderboard()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Rangliste</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Deine Freunde und du</p>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">🏆</div>
          <p className="text-zinc-900 font-medium">Noch keine Daten</p>
          <p className="text-sm text-zinc-500">Fuehre Wetten durch, um Punkte zu sammeln.</p>
        </div>
      ) : (
        <LeaderboardTable profiles={profiles} currentUserId={user.id} />
      )}
    </div>
  )
}
