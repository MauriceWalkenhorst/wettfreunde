import { createClient } from '@/lib/supabase/server'
import { BetWithDetails } from '@/lib/supabase/types'

const BET_SELECT = `
  *,
  subject:profiles!bets_subject_id_fkey(*),
  creator:profiles!bets_created_by_fkey(*),
  participants:bet_participants(*, user:profiles(*))
`

export async function getBetsForUser(): Promise<{
  open: BetWithDetails[]
  active: BetWithDetails[]
  finished: BetWithDetails[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { open: [], active: [], finished: [] }

  // Get bet IDs where user is a participant (bettor)
  const { data: participations } = await supabase
    .from('bet_participants')
    .select('bet_id')
    .eq('user_id', user.id)

  const participantBetIds = [...new Set((participations ?? []).map((p) => p.bet_id))]

  // Fetch only bets where user is subject OR participant
  const query = supabase
    .from('bets')
    .select(BET_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data } = participantBetIds.length > 0
    ? await query.or(`subject_id.eq.${user.id},id.in.(${participantBetIds.join(',')})`)
    : await query.eq('subject_id', user.id)

  if (!data) return { open: [], active: [], finished: [] }

  const bets = data as unknown as BetWithDetails[]

  const open = bets.filter(
    (b) => b.status === 'pending' && b.subject_id === user.id
  )
  const active = bets.filter(
    (b) =>
      b.status === 'pending' &&
      b.subject_id !== user.id &&
      b.participants.some((p) => p.user_id === user.id)
  )
  const finished = bets.filter(
    (b) => b.status === 'answered' || b.status === 'expired'
  )

  return { open, active, finished }
}

export async function getBetById(id: string): Promise<BetWithDetails | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bets')
    .select(BET_SELECT)
    .eq('id', id)
    .single()

  if (!data) return null
  return data as unknown as BetWithDetails
}
