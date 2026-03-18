import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/supabase/types'

export async function getFriends(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq('status', 'accepted')

  if (!friendships || friendships.length === 0) return []

  const friendIds = friendships.map((f: { user_a: string; user_b: string }) =>
    f.user_a === user.id ? f.user_b : f.user_a
  )

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds)

  return (data as unknown as Profile[]) ?? []
}
