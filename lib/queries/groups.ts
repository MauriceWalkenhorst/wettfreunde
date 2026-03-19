import { createClient } from '@/lib/supabase/server'

export async function getMyGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get all groups where user is a member
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (data ?? []).map((d) => d.group_id)
  if (groupIds.length === 0) return []

  const { data: groups } = await supabase
    .from('groups')
    .select('*, creator:profiles!created_by(*), members:group_members(*, user:profiles(*))')
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  return (groups ?? []) as unknown as import('@/lib/supabase/types').GroupWithMembers[]
}

export async function getGroupById(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('groups')
    .select('*, creator:profiles!created_by(*), members:group_members(*, user:profiles(*))')
    .eq('id', id)
    .single()

  return data as unknown as import('@/lib/supabase/types').GroupWithMembers | null
}

export async function getGroupBets(memberIds: string[]) {
  if (memberIds.length === 0) return []
  const supabase = await createClient()

  // Get all answered bets where at least one participant is a group member
  const { data: participations } = await supabase
    .from('bet_participants')
    .select('bet_id')
    .in('user_id', memberIds)

  const betIds = [...new Set((participations ?? []).map((p) => p.bet_id))]
  if (betIds.length === 0) return []

  const { data: bets } = await supabase
    .from('bets')
    .select('*, subject:profiles!subject_id(*), creator:profiles!created_by(*), participants:bet_participants(*, user:profiles(*))')
    .in('id', betIds)
    .eq('status', 'answered')
    .order('answered_at', { ascending: false })
    .limit(50)

  return (bets ?? []) as unknown as import('@/lib/supabase/types').BetWithDetails[]
}
