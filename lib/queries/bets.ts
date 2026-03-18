import { createClient } from '@/lib/supabase/server'
import { BetWithDetails } from '@/lib/supabase/types'

export async function getBetsForUser(): Promise<{
  open: BetWithDetails[]
  active: BetWithDetails[]
  finished: BetWithDetails[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { open: [], active: [], finished: [] }

  const { data } = await supabase
    .from('bets')
    .select(`
      *,
      subject:profiles!bets_subject_id_fkey(*),
      creator:profiles!bets_created_by_fkey(*),
      participants:bet_participants(*, user:profiles(*))
    `)
    .order('created_at', { ascending: false })

  if (!data) return { open: [], active: [], finished: [] }

  const bets = data as unknown as BetWithDetails[]

  // Bets where I am the subject and need to answer
  const open = bets.filter(
    (b) => b.status === 'pending' && b.subject_id === user.id
  )

  // Bets where I participate (not subject) and either need to pick a side or waiting for subject
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
    .select(`
      *,
      subject:profiles!bets_subject_id_fkey(*),
      creator:profiles!bets_created_by_fkey(*),
      participants:bet_participants(*, user:profiles(*))
    `)
    .eq('id', id)
    .single()

  if (!data) return null
  return data as unknown as BetWithDetails
}
