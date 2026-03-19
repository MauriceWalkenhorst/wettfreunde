'use client'

import { useLocale } from 'next-intl'
import { setLocale } from '@/lib/actions/locale'
import { useTransition } from 'react'

export function LanguageToggle() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = locale === 'de' ? 'en' : 'de'
    startTransition(() => {
      setLocale(next)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50"
    >
      {locale === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
    </button>
  )
}
