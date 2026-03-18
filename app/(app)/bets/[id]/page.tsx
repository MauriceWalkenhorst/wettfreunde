import { createClient } from '@/lib/supabase/server'
import { getBetById } from '@/lib/queries/bets'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BetResolution } from '@/components/bet-resolution'
import { BetPhotoUpload } from '@/components/bet-photo-upload'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Profile } from '@/lib/supabase/types'

type BetPhoto = {
  id: string
  photo_path: string
  caption: string | null
  created_at: string
  uploaded_by: string
  uploader: Profile
}

export default async function BetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const bet = await getBetById(id)
  if (!bet) notFound()

  const isSubject = bet.subject_id === user.id
  const myParticipation = bet.participants.find((p) => p.user_id === user.id) ?? null
  const isInvolved = isSubject || myParticipation !== null

  // Get proof photo URL if exists
  let proofPhotoUrl: string | null = null
  if (bet.proof_photo_path) {
    const { data } = await supabase.storage
      .from('proof-photos')
      .createSignedUrl(bet.proof_photo_path, 3600)
    proofPhotoUrl = data?.signedUrl ?? null
  }

  // Get bet photos uploaded by participants
  const { data: betPhotosRaw } = await supabase
    .from('bet_photos')
    .select('*, uploader:profiles(*)')
    .eq('bet_id', id)
    .order('created_at', { ascending: false })

  const betPhotos = (betPhotosRaw ?? []) as unknown as BetPhoto[]

  // Get signed URLs for all bet photos
  const betPhotoUrls = await Promise.all(
    betPhotos.map(async (p) => {
      const { data } = await supabase.storage
        .from('proof-photos')
        .createSignedUrl(p.photo_path, 3600)
      return { ...p, url: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          Zurück zum Feed
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Die Frage</p>
            <h1 className="text-xl font-bold text-zinc-900 leading-snug">{bet.question}</h1>
            <p className="text-sm text-zinc-500">Einsatz: <strong>{bet.stake}</strong></p>
          </div>
          <Badge variant={bet.status === 'answered' ? 'success' : bet.status === 'expired' ? 'danger' : 'warning'}>
            {bet.status === 'answered' ? 'Aufgelöst' : bet.status === 'expired' ? 'Abgelaufen' : 'Offen'}
          </Badge>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
          <Avatar src={bet.subject.avatar_url} name={bet.subject.display_name} size="md" />
          <div>
            <p className="text-xs text-zinc-500">Befragt wird</p>
            <p className="text-sm font-semibold text-zinc-900">{bet.subject.display_name}</p>
          </div>
          {bet.status === 'answered' && (
            <div className="ml-auto text-right">
              <p className="text-xs text-zinc-500">Antwort</p>
              <p className="text-lg font-bold">{bet.subject_answer ? '✅ Ja' : '❌ Nein'}</p>
            </div>
          )}
        </div>

        {/* Subject proof photo */}
        {proofPhotoUrl && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Beweis vom Befragten</p>
            <Image
              src={proofPhotoUrl}
              alt="Beweis"
              width={600}
              height={400}
              className="w-full rounded-xl object-cover max-h-64"
            />
          </div>
        )}

        {/* Participants */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Wetter</p>
          <div className="space-y-2">
            {bet.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar src={p.user.avatar_url} name={p.user.display_name} size="sm" />
                <span className="flex-1 text-sm font-medium text-zinc-900">
                  {p.user.display_name}
                  {p.user_id === user.id && ' (Du)'}
                </span>
                {p.side !== null && (
                  <span className="text-sm">{p.side ? '✅ Ja' : '❌ Nein'}</span>
                )}
                {p.won !== null && (
                  <Badge variant={p.won ? 'success' : 'danger'}>
                    {p.won ? `+${p.points_awarded} Pkt.` : 'Verloren'}
                  </Badge>
                )}
                {p.side === null && bet.status === 'pending' && (
                  <Badge variant="default">Noch nicht gewählt</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Erstellt von {bet.creator.display_name} · {formatRelativeTime(bet.created_at)}
        </p>
      </div>

      {/* Resolution / Side picking */}
      {bet.status === 'pending' && (
        <BetResolution
          betId={bet.id}
          isSubject={isSubject}
          myParticipation={myParticipation}
        />
      )}

      {/* Participant proof photos */}
      {betPhotoUrls.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-zinc-700">Beweis-Fotos</p>
          {betPhotoUrls.map((p) => p.url && (
            <div key={p.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
              <Image
                src={p.url}
                alt="Beweis"
                width={600}
                height={400}
                className="w-full object-cover max-h-64"
              />
              <div className="px-4 py-3 flex items-center gap-2">
                <Avatar src={p.uploader.avatar_url} name={p.uploader.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900">{p.uploader.display_name}</p>
                  {p.caption && <p className="text-xs text-zinc-500 truncate">{p.caption}</p>}
                </div>
                <span className="text-xs text-zinc-400">{formatRelativeTime(p.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo upload for participants after bet is answered */}
      {bet.status === 'answered' && isInvolved && (
        <BetPhotoUpload betId={bet.id} />
      )}
    </div>
  )
}
