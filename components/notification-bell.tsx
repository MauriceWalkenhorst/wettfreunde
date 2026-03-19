'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Notification } from '@/lib/supabase/types'
import { formatRelativeTime } from '@/lib/utils'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications'
import { useRouter } from 'next/navigation'

interface NotificationBellProps {
  notifications: Notification[]
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('notifications')
  const locale = useLocale()
  const unread = notifications.filter((n) => !n.read)

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id)
    }
    setOpen(false)
    if (n.ref_id && (n.type === 'bet_request' || n.type === 'bet_result')) {
      router.push(`/bets/${n.ref_id}`)
    } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      router.push('/friends')
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        aria-label={t('title')}
      >
        <svg className="w-4 h-4 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-h-[480px] overflow-y-auto bg-white rounded-2xl border border-zinc-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <span className="text-sm font-semibold text-zinc-900">{t('title')}</span>
              {unread.length > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">{t('empty')}</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                      <div className={`flex-1 min-w-0 ${n.read ? 'pl-5' : ''}`}>
                        <p className="text-sm font-medium text-zinc-900 leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[11px] text-zinc-400 mt-1">{formatRelativeTime(n.created_at, locale)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
