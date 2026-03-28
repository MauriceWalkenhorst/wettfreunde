'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(betId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data, error } = await supabase
    .from('bet_comments')
    .insert({
      bet_id: betId,
      user_id: user.id,
      body: body.trim(),
    })
    .select('*, commenter:profiles(*)')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/bets/${betId}`)
  return data
}

export async function deleteComment(commentId: string, betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { error } = await supabase
    .from('bet_comments')
    .delete()
    .eq('id', commentId)
    .eq('bet_id', betId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/bets/${betId}`)
}
