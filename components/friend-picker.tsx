'use client'

import { useTranslations } from 'next-intl'
import { Profile } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface FriendPickerProps {
  friends: Profile[]
  selected: string[]
  onToggle: (id: string) => void
  label?: string
  singleSelect?: boolean
}

export function FriendPicker({ friends, selected, onToggle, label, singleSelect }: FriendPickerProps) {
  const t = useTranslations('friendPicker')

  if (friends.length === 0) {
    return (
      <div className="text-sm text-zinc-500 py-4 text-center">
        {t('noFriends')}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-zinc-700">{label}</p>}
      <div className="space-y-1">
        {friends.map((friend) => {
          const isSelected = selected.includes(friend.id)
          return (
            <button
              key={friend.id}
              type="button"
              onClick={() => {
                if (singleSelect && !isSelected) {
                  onToggle(friend.id)
                } else {
                  onToggle(friend.id)
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                isSelected
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              )}
            >
              <Avatar src={friend.avatar_url} name={friend.display_name} size="sm" />
              <span className="flex-1 text-sm font-medium text-zinc-900">{friend.display_name}</span>
              <div className={cn(
                'w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center',
                isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
              )}>
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
