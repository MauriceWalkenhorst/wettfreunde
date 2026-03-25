import { createClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/queries/friends'
import { BetForm } from '@/components/bet-form'
import Link from 'next/link'
import { Profile } from '@/lib/supabase/types'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function NewBetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [allUsers, profileResult, t] = await Promise.all([
    getAllUsers(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getTranslations('betNew'),
  ])

  const profileData = profileResult.data as Profile | null
  if (!profileData) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          {t('backToFeed')}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">{t('title')}</h1>
      </div>
      <BetForm allUsers={allUsers} currentUser={profileData} />
    </div>
  )
}
