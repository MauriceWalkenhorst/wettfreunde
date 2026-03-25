'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteBet } from '@/lib/actions/bets'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

export function DeleteBetButton({ betId }: { betId: string }) {
  const t = useTranslations('betDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    setError(null)
    setOpen(false)
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
      <Button variant="danger" size="sm" onClick={() => setOpen(true)} loading={isPending}>
        {t('deleteBet')}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <p className="text-sm text-zinc-700">{t('deleteConfirm')}</p>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} loading={isPending}>
            {t('deleteBet')}
          </Button>
        </div>
      </Dialog>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
