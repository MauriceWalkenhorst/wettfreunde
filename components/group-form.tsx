'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Profile } from '@/lib/supabase/types'
import { createGroup } from '@/lib/actions/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface GroupFormProps {
  users: Profile[]
}

export function GroupForm({ users }: GroupFormProps) {
  const router = useRouter()
  const t = useTranslations('groups')
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleUser(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { groupId } = await createGroup(name.trim(), selectedIds)
      router.push(`/groups/${groupId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorCreating'))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Input
        label={t('groupName')}
        placeholder={t('groupNamePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">{t('addMembers')}</p>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noUsersAvailable')}</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const selected = selectedIds.includes(user.id)
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left',
                    selected ? 'border-primary bg-muted' : 'border-border bg-card hover:border-muted-foreground'
                  )}
                >
                  <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                  <span className="flex-1 text-sm font-medium text-foreground">{user.display_name}</span>
                  {selected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSubmit} disabled={!name.trim()} loading={loading} className="w-full">
        {t('createGroup')}
      </Button>
    </div>
  )
}
