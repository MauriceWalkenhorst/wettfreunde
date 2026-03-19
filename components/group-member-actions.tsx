'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { removeGroupMember, addGroupMember } from '@/lib/actions/groups'

export function RemoveMemberButton({ groupId, userId }: { groupId: string; userId: string }) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('groups')

  function handleRemove() {
    if (!window.confirm(t('removeConfirm'))) return
    startTransition(() => removeGroupMember(groupId, userId))
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="w-6 h-6 rounded-full bg-zinc-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-zinc-500 transition-colors text-xs disabled:opacity-50"
      title={t('removeMember')}
    >
      ×
    </button>
  )
}

export function AddMemberButton({ groupId, userId }: { groupId: string; userId: string }) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('groups')

  return (
    <button
      onClick={() => startTransition(() => addGroupMember(groupId, userId))}
      disabled={isPending}
      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : t('add')}
    </button>
  )
}
