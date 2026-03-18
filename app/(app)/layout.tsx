import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { getUnreadCount } from '@/lib/queries/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const unreadCount = await getUnreadCount()

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar unreadCount={unreadCount} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  )
}
