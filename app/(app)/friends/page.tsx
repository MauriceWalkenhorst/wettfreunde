import { getAllUsers, getFriendshipStatuses } from '@/lib/queries/friends'
import { Avatar } from '@/components/ui/avatar'
import { ShareInvite } from '@/components/share-invite'
import { AddFriendButton } from '@/components/add-friend-button'

export default async function FriendsPage() {
  const [users, statuses] = await Promise.all([
    getAllUsers(),
    getFriendshipStatuses(),
  ])

  const friends = users.filter((u) => statuses[u.id] === 'accepted')
  const others = users.filter((u) => statuses[u.id] !== 'accepted')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Freunde</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {friends.length === 0 ? 'Noch keine Freunde' : `${friends.length} ${friends.length === 1 ? 'Freund' : 'Freunde'}`}
        </p>
      </div>

      <ShareInvite />

      {friends.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Deine Freunde</p>
          {friends.map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3.5">
              <Avatar src={user.avatar_url} name={user.display_name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{user.display_name}</p>
                <p className="text-sm text-zinc-500">{user.points} Punkte</p>
              </div>
              <span className="text-xs text-zinc-400 font-medium">Befreundet</span>
            </div>
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Alle auf der Plattform</p>
          {others.map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3.5">
              <Avatar src={user.avatar_url} name={user.display_name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{user.display_name}</p>
                <p className="text-sm text-zinc-500">{user.points} Punkte</p>
              </div>
              <AddFriendButton userId={user.id} status={statuses[user.id]} />
            </div>
          ))}
        </section>
      )}

      {users.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">👥</div>
          <p className="text-zinc-900 font-medium">Noch keine anderen Nutzer</p>
          <p className="text-sm text-zinc-500">Teile den Einladungslink mit deinen Freunden.</p>
        </div>
      )}
    </div>
  )
}
