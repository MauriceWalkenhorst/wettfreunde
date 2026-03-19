import { createClient } from '@/lib/supabase/server'
import { getMyGroups } from '@/lib/queries/groups'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [groups, t] = await Promise.all([getMyGroups(), getTranslations('groups')])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <Link href="/groups/new">
          <Button size="sm">+ {t('newGroup')}</Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">👥</div>
          <p className="text-zinc-900 font-medium">{t('emptyTitle')}</p>
          <p className="text-sm text-zinc-500">{t('emptySubtitle')}</p>
          <Link href="/groups/new">
            <Button className="mt-2">{t('createGroup')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{group.name}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {t('memberCount', { count: group.members.length })}
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {group.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} src={m.user.avatar_url} name={m.user.display_name} size="sm" className="ring-2 ring-white" />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
