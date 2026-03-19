'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateBetInput {
  question: string
  stake: string
  subjectId: string
  participantIds: string[]
  creatorSide: boolean
}

export async function createBet(input: CreateBetInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      question: input.question,
      stake: input.stake,
      subject_id: input.subjectId,
      created_by: user.id,
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

  await supabase.from('notifications').insert({
    user_id: input.subjectId,
    type: 'bet_request',
    title: 'Neue Wette!',
    body: `${name} hat eine Wette über dich gestellt: "${input.question}"`,
    ref_id: bet.id,
  })

  const others = allParticipants.filter((id) => id !== user.id && id !== input.subjectId)
  if (others.length > 0) {
    await supabase.from('notifications').insert(
      others.map((uid) => ({
        user_id: uid,
        type: 'bet_request' as const,
        title: 'Du wurdest zu einer Wette eingeladen!',
        body: `${name} wettet: "${input.question}"`,
        ref_id: bet.id,
      }))
    )
  }

  revalidatePath('/dashboard')
  return { betId: bet.id }
}

export async function pickSide(betId: string, side: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
  if (!user) throw new Error('Not authenticated')

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
    const ext = photoFile.name.split('.').pop()
    const path = `${betId}/subject-${Date.now()}.${ext}`
    const arrayBuffer = await photoFile.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proof-photos')
      .upload(path, arrayBuffer, { contentType: photoFile.type })
    if (uploadError) throw new Error('Foto-Upload fehlgeschlagen: ' + uploadError.message)
    proofPhotoPath = uploadData.path
  }

  await supabase
    .from('bets')
    .update({
      subject_answer: answer,
      status: 'answered',
      answered_at: new Date().toISOString(),
      proof_photo_path: proofPhotoPath,
    })
    .eq('id', betId)

  type ParticipantRow = { id: string; user_id: string; side: boolean | null }
  const participants = (bet as { bet_participants: ParticipantRow[] }).bet_participants

  for (const p of participants) {
    const won = p.side !== null ? p.side === answer : null
    const points = won ? 10 : 0

    await supabase
      .from('bet_participants')
      .update({ won, points_awarded: points })
      .eq('id', p.id)

    if (won) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('increment_points', {
        target_user_id: p.user_id,
        amount: 10,
      })
    }
  }

  const { data: subjectProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const subjectName = (subjectProfile as { display_name: string } | null)?.display_name ?? 'Die befragte Person'
  const allUserIds = participants.map((p) => p.user_id)

  await supabase.from('notifications').insert(
    allUserIds.map((uid) => ({
      user_id: uid,
      type: 'bet_result' as const,
      title: 'Wette aufgelöst!',
      body: `${subjectName} hat mit "${answer ? 'Ja' : 'Nein'}" geantwortet.`,
      ref_id: betId,
    }))
  )

  revalidatePath(`/bets/${betId}`)
  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
}

export async function uploadBetPhoto(betId: string, photoFile: File, caption?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = photoFile.name.split('.').pop()
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

  if (dbError) throw new Error(dbError.message)

  revalidatePath(`/bets/${betId}`)
}
