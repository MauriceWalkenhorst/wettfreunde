'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { leaveGroup, deleteGroup } from '@/lib/actions/groups'

export function LeaveGroupButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('groups')

  function handleLeave() {
    if (!window.confirm(t('leaveConfirm'))) return
    startTransition(async () => {
      await leaveGroup(groupId)
      router.push('/groups')
    })
  }

  return (
    <button
      onClick={handleLeave}
      disabled={isPending}
      className="text-sm text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : t('leaveGroup')}
    </button>
  )
}

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('groups')

  function handleDelete() {
    if (!window.confirm(t('deleteConfirm'))) return
    startTransition(async () => {
      await deleteGroup(groupId)
      router.push('/groups')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : t('deleteGroup')}
    </button>
  )
}
