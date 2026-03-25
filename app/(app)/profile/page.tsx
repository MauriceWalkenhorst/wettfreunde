import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/lib/supabase/types'
import { getTranslations, getLocale } from 'next-intl/server'
import { LanguageToggle } from '@/components/language-toggle'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Profile | null
  if (!profile) redirect('/login')

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

  type LostBet = { won: boolean | null; bet: { question: string; stake: string } | null }
  const { data: lostBetsRaw } = await supabase
    .from('bet_participants')
    .select('won, bet:bets(question, stake)')
    .eq('user_id', user.id)
    .eq('won', false)
  const lostBets = (lostBetsRaw ?? []) as unknown as LostBet[]

  const [t, locale] = await Promise.all([getTranslations('profile'), getLocale()])

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{profile.display_name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{profile.points}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{t('points')}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{wonBets}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{t('won')}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{winRate}%</div>
            <div className="text-xs text-zinc-500 mt-0.5">{t('winRate')}</div>
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-zinc-900">{profile.streak ?? 0}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{t('streak')}</div>
          </div>
        </div>
      </div>

      {lostBets.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">{t('openStakes')}</h2>
          <div className="space-y-2">
            {lostBets.map((lb, i) => (
              <div key={i} className="flex flex-col gap-0.5 py-2 border-b border-zinc-100 last:border-0">
                <span className="text-sm font-semibold text-zinc-900">{lb.bet?.stake ?? '—'}</span>
                <span className="text-xs text-zinc-500 truncate">{lb.bet?.question ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-zinc-700">{t('authProvider')}</span>
          <Badge variant="default">{user.app_metadata.provider ?? 'OAuth'}</Badge>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-zinc-700">{t('memberSince')}</span>
          <span className="text-sm text-zinc-500">
            {new Date(profile.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US')}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
        <span className="text-sm text-zinc-700">{t('language')}</span>
        <LanguageToggle />
      </div>

      <form action={signOut}>
        <Button type="submit" variant="danger" className="w-full">
          {t('signOut')}
        </Button>
      </form>
    </div>
  )
}
