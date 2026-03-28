'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInviteLink(): Promise<{ token: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data, error } = await supabase
    .from('invite_links')
    .insert({ created_by: user.id })
    .select('token')
    .single()

  if (error) throw error
  return { token: data.token }
}

export async function sendFriendRequest(targetUserId: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')
  if (user.id === targetUserId) return { success: false, message: 'Du kannst dir nicht selbst eine Anfrage schicken.' }

  const [userA, userB] = [user.id, targetUserId].sort()

  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .single()

  if (existing?.status === 'accepted') return { success: false, message: 'Ihr seid bereits befreundet.' }
  if (existing?.status === 'pending') return { success: false, message: 'Anfrage bereits gesendet.' }

  const { error } = await supabase
    .from('friendships')
    .insert({ user_a: userA, user_b: userB, status: 'pending' })

  if (error) throw error

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: targetUserId,
    type: 'friend_request',
    title: 'Neue Freundschaftsanfrage!',
    body: `${(currentProfile as { display_name: string } | null)?.display_name ?? 'Jemand'} möchte dich als Freund hinzufügen.`,
    ref_id: user.id,
  })

  revalidatePath('/friends')
  return { success: true, message: 'Freundschaftsanfrage gesendet!' }
}

export async function acceptInvite(token: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: invite, error: inviteError } = await supabase
    .from('invite_links')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) return { success: false, message: 'Einladungslink nicht gefunden.' }
  if (invite.used_by) return { success: false, message: 'Dieser Link wurde bereits verwendet.' }
  if (new Date(invite.expires_at) < new Date()) return { success: false, message: 'Dieser Link ist abgelaufen.' }
  if (invite.created_by === user.id) return { success: false, message: 'Du kannst dir nicht selbst eine Freundschaft schicken.' }

  const [userA, userB] = [invite.created_by, user.id].sort()
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .single()

  if (existing?.status === 'accepted') return { success: false, message: 'Ihr seid bereits befreundet.' }

  const { data: claimed, error: claimError } = await supabase
    .from('invite_links')
    .update({ used_by: user.id })
    .eq('id', invite.id)
    .is('used_by', null)
    .select('id')
    .single()

  if (claimError || !claimed) {
    return { success: false, message: 'Dieser Einladungslink wurde bereits verwendet.' }
  }

  if (existing) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', existing.id)
  } else {
    await supabase.from('friendships').insert({ user_a: userA, user_b: userB, status: 'accepted' })
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: invite.created_by,
    type: 'friend_accepted',
    title: 'Neuer Freund!',
    body: `${(currentProfile as { display_name: string } | null)?.display_name ?? 'Jemand'} hat deine Einladung angenommen.`,
    ref_id: user.id,
  })

  revalidatePath('/friends')
  return { success: true, message: 'Freundschaft angenommen!' }
}
