'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGroup(name: string, memberIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error || !group) throw new Error(error?.message ?? 'Failed to create group')

  // Add creator + selected members
  const allMemberIds = [...new Set([user.id, ...memberIds])]
  await supabase.from('group_members').insert(
    allMemberIds.map((uid) => ({ group_id: group.id, user_id: uid }))
  )

  revalidatePath('/groups')
  return { groupId: group.id }
}

export async function addGroupMember(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single()
  if (!group || group.created_by !== user.id) throw new Error('Not authorized')

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })

  if (error) throw new Error(error.message)
  revalidatePath(`/groups/${groupId}`)
}

export async function removeGroupMember(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single()
  if (!group || group.created_by !== user.id) throw new Error('Not authorized')

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  revalidatePath(`/groups/${groupId}`)
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single()
  if (group?.created_by === user.id) throw new Error('Creator cannot leave group')

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  revalidatePath(`/groups/${groupId}`)
  revalidatePath('/groups')
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single()
  if (!group || group.created_by !== user.id) throw new Error('Not authorized')

  await supabase.from('groups').delete().eq('id', groupId)
  revalidatePath('/groups')
}
