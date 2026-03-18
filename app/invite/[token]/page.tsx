import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from '@/lib/actions/friends'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  const result = await acceptInvite(token)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-sm space-y-4">
        <div className="text-4xl">{result.success ? '🎉' : '😅'}</div>
        <h1 className="text-xl font-bold text-zinc-900">
          {result.success ? 'Freundschaft akzeptiert!' : 'Hoppla!'}
        </h1>
        <p className="text-sm text-zinc-500">{result.message}</p>
        <Link href="/dashboard">
          <Button className="w-full">Zum Feed</Button>
        </Link>
      </div>
    </div>
  )
}
