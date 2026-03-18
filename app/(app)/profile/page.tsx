import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/lib/supabase/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Profile | null
  if (!profile) return null

  // Get bet stats
  const participationsResult = await supabase
    .from('bet_participants')
    .select('won, points_awarded')
    .eq('user_id', user.id)

  type ParticipationRow = { won: boolean | null; points_awarded: number }
  const participations = (participationsResult.data as ParticipationRow[] | null) ?? []
  const finished = participations.filter((p) => p.won !== null)
  const totalBets = finished.length
  const wonBets = finished.filter((p) => p.won).length
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900">Profil</h1>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{profile.display_name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{profile.points}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Punkte</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{wonBets}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Gewonnen</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{winRate}%</div>
            <div className="text-xs text-zinc-500 mt-0.5">Trefferquote</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-zinc-700">Auth-Anbieter</span>
          <Badge variant="default">{user.app_metadata.provider ?? 'OAuth'}</Badge>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-zinc-700">Mitglied seit</span>
          <span className="text-sm text-zinc-500">
            {new Date(profile.created_at).toLocaleDateString('de-DE')}
          </span>
        </div>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="danger" className="w-full">
          Abmelden
        </Button>
      </form>
    </div>
  )
}
