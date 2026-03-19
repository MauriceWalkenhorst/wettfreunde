'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteBet } from '@/lib/actions/bets'
import { Button } from '@/components/ui/button'

export function DeleteBetButton({ betId }: { betId: string }) {
  const t = useTranslations('betDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(t('deleteConfirm'))) return
    startTransition(async () => {
      await deleteBet(betId)
      router.push('/dashboard')
    })
  }

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} loading={isPending}>
      {t('deleteBet')}
    </Button>
  )
}
