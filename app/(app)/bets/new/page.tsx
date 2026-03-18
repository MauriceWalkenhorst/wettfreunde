import { createClient } from '@/lib/supabase/server'
import { getFriends } from '@/lib/queries/friends'
import { BetForm } from '@/components/bet-form'
import Link from 'next/link'

export default async function NewBetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [friends, { data: profileData }] = await Promise.all([
    getFriends(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!profileData) return null

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          Zurück zum Feed
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">Neue Wette</h1>
      </div>
      <BetForm friends={[profileData, ...friends]} currentUser={profileData} />
    </div>
  )
}
