import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/supabase/types'

export async function getLeaderboard(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false })

  return (data as unknown as Profile[]) ?? []
}
