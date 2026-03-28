import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/supabase/types'

export async function getPublicProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  return (data as unknown as Profile) ?? null
}

export async function getProfileStats(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bet_participants')
    .select('won, points_awarded')
    .eq('user_id', id)

  type Row = { won: boolean | null; points_awarded: number }
  const participations = (data ?? []) as Row[]
  const finished = participations.filter((p) => p.won !== null)
  const totalBets = finished.length
  const wonBets = finished.filter((p) => p.won).length
  const winRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0

  return { totalBets, wonBets, winRate }
}

export async function getHeadToHead(profileId: string, currentUserId: string) {
  const supabase = await createClient()

  const { data: profileBets } = await supabase
    .from('bet_participants')
    .select('bet_id, won')
    .eq('user_id', profileId)
    .not('won', 'is', null)

  if (!profileBets || profileBets.length === 0) return { myWins: 0, theirWins: 0, total: 0 }

  const betIds = (profileBets as { bet_id: string; won: boolean }[]).map((b) => b.bet_id)

  const { data: myBets } = await supabase
    .from('bet_participants')
    .select('bet_id, won')
    .eq('user_id', currentUserId)
    .in('bet_id', betIds)
    .not('won', 'is', null)

  if (!myBets || myBets.length === 0) return { myWins: 0, theirWins: 0, total: 0 }

  type Row = { bet_id: string; won: boolean }
  const myBetsTyped = myBets as Row[]
  const sharedBetIdSet = new Set(myBetsTyped.map((b) => b.bet_id))

  const myWins = myBetsTyped.filter((b) => b.won).length
  const theirWins = (profileBets as Row[]).filter(
    (b) => sharedBetIdSet.has(b.bet_id) && b.won
  ).length

  return { myWins, theirWins, total: myBetsTyped.length }
}
