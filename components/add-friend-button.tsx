'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { sendFriendRequest } from '@/lib/actions/friends'
import { Button } from '@/components/ui/button'

interface AddFriendButtonProps {
  userId: string
  status?: 'accepted' | 'pending'
}

export function AddFriendButton({ userId, status }: AddFriendButtonProps) {
  const t = useTranslations('addFriend')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'accepted' || done) {
    return <span className="text-xs text-muted-foreground font-medium">{t('friendStatus')}</span>
  }

  if (status === 'pending') {
    return <span className="text-xs text-muted-foreground font-medium italic">{t('pending')}</span>
  }

  async function handleAdd() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await sendFriendRequest(userId)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button size="sm" variant="secondary" onClick={handleAdd} loading={loading}>
        {t('add')}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
