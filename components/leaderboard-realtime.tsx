'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'
import { LeaderboardTable } from '@/components/leaderboard-table'

interface LeaderboardRealtimeProps {
  profiles: Profile[]
  currentUserId: string
}

export function LeaderboardRealtime({ profiles: initialProfiles, currentUserId }: LeaderboardRealtimeProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as Profile
          setProfiles((prev) => {
            const next = prev.map((p) => p.id === updated.id ? updated : p)
            return [...next].sort((a, b) => b.points - a.points)
          })
        }
      )
      .subscribe()

    return () => { channel.unsubscribe(); supabase.removeChannel(channel) }
  }, [])

  return <LeaderboardTable profiles={profiles} currentUserId={currentUserId} />
}
