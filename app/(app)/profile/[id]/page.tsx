import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/avatar'
import { getPublicProfile, getProfileStats, getHeadToHead } from '@/lib/queries/profiles'
import { getTranslations, getLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (id === user.id) redirect('/profile')

  const [profile, stats, h2h, t, locale] = await Promise.all([
    getPublicProfile(id),
    getProfileStats(id),
    getHeadToHead(id, user.id),
    getTranslations('publicProfile'),
    getLocale(),
  ])

  if (!profile) notFound()

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Link href="javascript:history.back()" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← {t('backButton')}
      </Link>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-card-foreground">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">
              {t('memberSince')} {new Date(profile.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{profile.points}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('points')}</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{stats.wonBets}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('won')}</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{stats.winRate}%</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('winRate')}</div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{profile.streak ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('streak')}</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-card-foreground">{t('headToHead')}</h2>
          <span className="text-xs text-muted-foreground">{t('headToHeadVs', { name: profile.display_name })}</span>
        </div>

        {h2h.total === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noSharedBets')}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {t('sharedBets', { total: h2h.total })}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{h2h.myWins}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('myWins')}</div>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-card-foreground">{h2h.theirWins}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('theirWins', { name: profile.display_name })}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
