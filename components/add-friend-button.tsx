'use client'

import { useState } from 'react'
import { sendFriendRequest } from '@/lib/actions/friends'
import { Button } from '@/components/ui/button'

interface AddFriendButtonProps {
  userId: string
  status?: 'accepted' | 'pending'
}

export function AddFriendButton({ userId, status }: AddFriendButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (status === 'accepted' || done) {
    return <span className="text-xs text-zinc-400 font-medium">Befreundet</span>
  }

  async function handleAdd() {
    setLoading(true)
    await sendFriendRequest(userId)
    setDone(true)
    setLoading(false)
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleAdd} loading={loading}>
      + Hinzufügen
    </Button>
  )
}
