'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteBet } from '@/lib/actions/bets'
import { Button } from '@/components/ui/button'

export function DeleteBetButton({ betId }: { betId: string }) {
  const t = useTranslations('betDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!window.confirm(t('deleteConfirm'))) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteBet(betId)
        router.push('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : t('deleteError'))
      }
    })
  }

  return (
    <div>
      <Button variant="danger" size="sm" onClick={handleDelete} loading={isPending}>
        {t('deleteBet')}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
