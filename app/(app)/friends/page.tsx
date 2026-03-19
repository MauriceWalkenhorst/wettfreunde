import { getAllUsers, getFriendshipStatuses } from '@/lib/queries/friends'
import { Avatar } from '@/components/ui/avatar'
import { ShareInvite } from '@/components/share-invite'
import { AddFriendButton } from '@/components/add-friend-button'
import { getTranslations } from 'next-intl/server'

export default async function FriendsPage() {
  const [users, statuses, t] = await Promise.all([
    getAllUsers(),
    getFriendshipStatuses(),
    getTranslations('friends'),
  ])

  const friends = users.filter((u) => statuses[u.id] === 'accepted')
  const others = users.filter((u) => statuses[u.id] !== 'accepted')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {friends.length === 0
            ? t('noFriends')
            : t('friendCount', { count: friends.length })}
        </p>
      </div>

      <ShareInvite />

      {friends.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('yourFriends')}</p>
          {friends.map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3.5">
              <Avatar src={user.avatar_url} name={user.display_name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{user.display_name}</p>
                <p className="text-sm text-zinc-500">{user.points} {t('points')}</p>
              </div>
              <span className="text-xs text-zinc-400 font-medium">{t('friendStatus')}</span>
            </div>
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t('allUsers')}</p>
          {others.map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3.5">
              <Avatar src={user.avatar_url} name={user.display_name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{user.display_name}</p>
                <p className="text-sm text-zinc-500">{user.points} {t('points')}</p>
              </div>
              <AddFriendButton userId={user.id} status={statuses[user.id]} />
            </div>
          ))}
        </section>
      )}

      {users.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">👥</div>
          <p className="text-zinc-900 font-medium">{t('noOtherUsers')}</p>
          <p className="text-sm text-zinc-500">{t('shareSubtitle')}</p>
        </div>
      )}
    </div>
  )
}
