import { getFriends } from '@/lib/queries/friends'
import { Avatar } from '@/components/ui/avatar'
import { ShareInvite } from '@/components/share-invite'

export default async function FriendsPage() {
  const friends = await getFriends()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Freunde</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{friends.length} Freunde</p>
      </div>

      <ShareInvite />

      {friends.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">👥</div>
          <p className="text-zinc-900 font-medium">Noch keine Freunde</p>
          <p className="text-sm text-zinc-500">Erstelle einen Einladungslink und teile ihn mit deinen Freunden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-3.5">
              <Avatar src={friend.avatar_url} name={friend.display_name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{friend.display_name}</p>
                <p className="text-sm text-zinc-500">{friend.points} Punkte</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
