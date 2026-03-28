import { createClient } from '@/lib/supabase/server'
import { getBetsForUser } from '@/lib/queries/bets'
import { BetCard } from '@/components/bet-card'
import { getNotifications } from '@/lib/queries/notifications'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ open, active, finished }, notifications, t] = await Promise.all([
    getBetsForUser(),
    getNotifications(),
    getTranslations('dashboard'),
  ])

  const allBets = [...open, ...active, ...finished]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell notifications={notifications} currentUserId={user.id} />
          <Link href="/bets/new">
            <Button size="sm">{t('newBet')}</Button>
          </Link>
        </div>
      </div>

      {open.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            {t('awaitingAnswer', { count: open.length })}
          </h2>
          {open.map((bet) => (
            <BetCard key={bet.id} bet={bet} currentUserId={user.id} />
          ))}
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            {t('activeBets', { count: active.length })}
          </h2>
          {active.map((bet) => (
            <BetCard key={bet.id} bet={bet} currentUserId={user.id} />
          ))}
        </section>
      )}

      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            {t('finished', { count: finished.length })}
          </h2>
          {finished.map((bet) => (
            <BetCard key={bet.id} bet={bet} currentUserId={user.id} />
          ))}
        </section>
      )}

      {allBets.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">🎲</div>
          <p className="text-zinc-900 font-medium">{t('emptyTitle')}</p>
          <p className="text-sm text-zinc-500">{t('emptySubtitle')}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link href="/bets/new">
              <Button>{t('createBet')}</Button>
            </Link>
            <Link href="/friends">
              <Button variant="secondary">{t('inviteFriends')}</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
