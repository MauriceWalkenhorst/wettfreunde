'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const VALID_PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface CreateBetInput {
  question: string
  stake: string
  subjectId: string
  participantIds: string[]
  creatorSide: boolean
  expiresAt?: string
}

export async function createBet(input: CreateBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      question: input.question,
      stake: input.stake,
      subject_id: input.subjectId,
      created_by: user.id,
      expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
    })
    .select('id')
    .single()

  if (betError || !bet) throw new Error(betError?.message ?? 'Fehler beim Erstellen')

  const allParticipants = [...new Set([...input.participantIds, user.id])]

  const participantRows = allParticipants.map((uid) => ({
    bet_id: bet.id,
    user_id: uid,
    side: uid === user.id ? input.creatorSide : null,
  }))

  const { error: partError } = await supabase.from('bet_participants').insert(participantRows)
  if (partError) throw new Error(partError.message)

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const name = (creatorProfile as { display_name: string } | null)?.display_name ?? 'Jemand'

  const { error: notifSubjectError } = await supabase.from('notifications').insert({
    user_id: input.subjectId,
    type: 'bet_request',
    title: 'Neue Wette!',
    body: `${name} hat eine Wette über dich gestellt: "${input.question}"`,
    ref_id: bet.id,
  })
  if (notifSubjectError) throw new Error('Benachrichtigung konnte nicht gesendet werden: ' + notifSubjectError.message)

  const others = allParticipants.filter((id) => id !== user.id && id !== input.subjectId)
  if (others.length > 0) {
    const { error: notifOthersError } = await supabase.from('notifications').insert(
      others.map((uid) => ({
        user_id: uid,
        type: 'bet_request' as const,
        title: 'Du wurdest zu einer Wette eingeladen!',
        body: `${name} wettet: "${input.question}"`,
        ref_id: bet.id,
      }))
    )
    if (notifOthersError) throw new Error('Benachrichtigungen konnten nicht gesendet werden: ' + notifOthersError.message)
  }

  revalidatePath('/dashboard')
  return { betId: bet.id }
}

export async function pickSide(betId: string, side: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { error } = await supabase
    .from('bet_participants')
    .update({ side })
    .eq('bet_id', betId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/bets/${betId}`)
}

export async function answerBet(betId: string, answer: boolean, photoFile?: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: bet } = await supabase
    .from('bets')
    .select('*, bet_participants(*)')
    .eq('id', betId)
    .single()

  if (!bet) throw new Error('Wette nicht gefunden')
  if ((bet as { subject_id: string }).subject_id !== user.id) throw new Error('Nur die befragte Person kann antworten')
  if ((bet as { status: string }).status !== 'pending') throw new Error('Diese Wette wurde bereits beantwortet')

  let proofPhotoPath: string | null = null

  if (photoFile) {
    if (photoFile.size > MAX_PHOTO_SIZE_BYTES) throw new Error('Foto zu groß (max. 10 MB)')
    if (!photoFile.type.startsWith('image/')) throw new Error('Nur Bilder sind erlaubt')
    const ext = photoFile.name.split('.').pop()?.toLowerCase()
    if (!ext || !VALID_PHOTO_EXTS.includes(ext)) throw new Error('Ungültiger Dateityp')
    const path = `${betId}/subject-${Date.now()}.${ext}`
    const arrayBuffer = await photoFile.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proof-photos')
      .upload(path, arrayBuffer, { contentType: photoFile.type })
    if (uploadError) throw new Error('Foto-Upload fehlgeschlagen: ' + uploadError.message)
    proofPhotoPath = uploadData.path
  }

  const { error: updateError } = await supabase
    .from('bets')
    .update({
      subject_answer: answer,
      status: 'answered',
      answered_at: new Date().toISOString(),
      proof_photo_path: proofPhotoPath,
    })
    .eq('id', betId)
  if (updateError) {
    if (proofPhotoPath) {
      await supabase.storage.from('proof-photos').remove([proofPhotoPath])
    }
    throw new Error(updateError.message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: resolveError } = await (supabase as any).rpc('resolve_bet_participants', {
    p_bet_id: betId,
    p_answer: answer,
  })
  if (resolveError) throw new Error(resolveError.message)

  revalidatePath(`/bets/${betId}`)
  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
}

export async function declineBet(betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: bet } = await supabase
    .from('bets')
    .select('subject_id, status, bet_participants(user_id)')
    .eq('id', betId)
    .single()

  if (!bet) throw new Error('Wette nicht gefunden')
  if ((bet as { subject_id: string }).subject_id !== user.id) throw new Error('Nicht autorisiert')
  if ((bet as { status: string }).status !== 'pending') throw new Error('Wette wurde bereits beantwortet')

  await supabase.from('bets').update({ status: 'expired' }).eq('id', betId)

  type Row = { user_id: string }
  const participantUserIds = (bet as { bet_participants: Row[] }).bet_participants.map((p) => p.user_id)

  if (participantUserIds.length > 0) {
    await supabase.from('notifications').insert(
      participantUserIds.map((uid) => ({
        user_id: uid,
        type: 'bet_result' as const,
        title: 'Wette abgelehnt',
        body: 'Die befragte Person hat die Wette abgelehnt.',
        ref_id: betId,
      }))
    )
  }

  revalidatePath(`/bets/${betId}`)
  revalidatePath('/dashboard')
}

export async function deleteBet(betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  const { data: bet } = await supabase
    .from('bets')
    .select('created_by, status')
    .eq('id', betId)
    .single()

  if (!bet) throw new Error('Wette nicht gefunden')
  if ((bet as { created_by: string }).created_by !== user.id) throw new Error('Nur der Ersteller kann löschen')
  if ((bet as { status: string }).status !== 'pending') throw new Error('Nur offene Wetten können gelöscht werden')

  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function uploadBetPhoto(betId: string, photoFile: File, caption?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht angemeldet')

  if (photoFile.size > MAX_PHOTO_SIZE_BYTES) throw new Error('Foto zu groß (max. 10 MB)')
  if (!photoFile.type.startsWith('image/')) throw new Error('Nur Bilder sind erlaubt')
  const ext = photoFile.name.split('.').pop()?.toLowerCase()
  if (!ext || !VALID_PHOTO_EXTS.includes(ext)) throw new Error('Ungültiger Dateityp')
  const path = `${betId}/proof-${user.id}-${Date.now()}.${ext}`
  const arrayBuffer = await photoFile.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('proof-photos')
    .upload(path, arrayBuffer, { contentType: photoFile.type })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await supabase.from('bet_photos').insert({
    bet_id: betId,
    uploaded_by: user.id,
    photo_path: path,
    caption: caption ?? null,
  })

  if (dbError) {
    await supabase.storage.from('proof-photos').remove([path])
    throw new Error(dbError.message)
  }

  revalidatePath(`/bets/${betId}`)
}
