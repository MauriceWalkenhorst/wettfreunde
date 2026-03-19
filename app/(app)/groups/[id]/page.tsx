import { createClient } from '@/lib/supabase/server'
import { getGroupById, getGroupBets } from '@/lib/queries/groups'
import { getAllUsers } from '@/lib/queries/friends'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { RemoveMemberButton, AddMemberButton } from '@/components/group-member-actions'

const medals = ['🥇', '🥈', '🥉']

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [group, t] = await Promise.all([
    getGroupById(id),
    getTranslations('groups'),
  ])
  if (!group) notFound()

  const isCreator = group.created_by === user.id
  const memberIds = group.members.map((m) => m.user_id)

  const [bets, allUsers] = await Promise.all([
    getGroupBets(memberIds),
    isCreator ? getAllUsers() : Promise.resolve([]),
  ])

  // Sort members by points for leaderboard
  const sortedMembers = [...group.members].sort((a, b) => b.user.points - a.user.points)

  // Users not already in the group (for add member section)
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u.id))

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <Link href="/groups" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          {t('backToGroups')}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-zinc-900">{group.name}</h1>
          <span className="text-sm text-zinc-500">{t('memberCount', { count: group.members.length })}</span>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{t('leaderboard')}</h2>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => {
            const isMe = member.user_id === user.id
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 ${isMe ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-200'}`}
              >
                <div className="w-8 text-center text-lg font-bold">
                  {medals[index] ?? `#${index + 1}`}
                </div>
                <Avatar
                  src={member.user.avatar_url}
                  name={member.user.display_name}
                  size="md"
                  className={isMe ? 'ring-2 ring-white/30' : ''}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isMe ? 'text-white' : 'text-zinc-900'}`}>
                    {member.user.display_name}
                    {isMe && ` ${t('you')}`}
                  </p>
                </div>
                <div className={`font-bold text-lg tabular-nums ${isMe ? 'text-white' : 'text-zinc-900'}`}>
                  {member.user.points}
                  <span className={`text-xs font-normal ml-1 ${isMe ? 'text-white/60' : 'text-zinc-500'}`}>{t('pts')}</span>
                </div>
                {isCreator && member.user_id !== user.id && (
                  <RemoveMemberButton groupId={group.id} userId={member.user_id} />
                )}
              </div>
            )
          })}
        </div>

        {/* Add member section — only shown to creator */}
        {isCreator && nonMembers.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{t('nonMembers')}</p>
            <div className="space-y-2">
              {nonMembers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-zinc-200 px-3 py-2.5"
                >
                  <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                  <span className="flex-1 text-sm font-medium text-zinc-900">{u.display_name}</span>
                  <AddMemberButton groupId={group.id} userId={u.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bet History */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{t('betHistory')}</h2>
        {bets.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">{t('noBets')}</div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <Link
                key={bet.id}
                href={`/bets/${bet.id}`}
                className="block bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors"
              >
                <p className="font-medium text-zinc-900 leading-snug">{bet.question}</p>
                <p className="text-sm text-zinc-500 mt-1">
                  {bet.subject_answer ? '✅ Ja' : '❌ Nein'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bet.participants
                    .filter((p) => memberIds.includes(p.user_id))
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <Avatar src={p.user.avatar_url} name={p.user.display_name} size="sm" />
                        <span className="text-xs text-zinc-700">{p.user.display_name}</span>
                        {p.won !== null && (
                          <Badge variant={p.won ? 'success' : 'danger'}>
                            {p.won ? `+${p.points_awarded} Pkt.` : t('lost')}
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
                <p className="text-xs text-zinc-400 mt-2">{formatRelativeTime(bet.created_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
