import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/queries/friends'
import { getTranslations } from 'next-intl/server'
import { Profile } from '@/lib/supabase/types'
import Link from 'next/link'
import { GroupForm } from '@/components/group-form'

export default async function NewGroupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [allUsers, t] = await Promise.all([getAllUsers(), getTranslations('groups')])
  const otherUsers = allUsers.filter((u: Profile) => u.id !== user.id)

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <Link href="/groups" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          {t('backToGroups')}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">{t('newGroupTitle')}</h1>
      </div>
      <GroupForm users={otherUsers} />
    </div>
  )
}
