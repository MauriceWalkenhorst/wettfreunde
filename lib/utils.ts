import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string, locale = 'de'): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (minutes < 1) return rtf.format(0, 'minutes')
  if (minutes < 60) return rtf.format(-minutes, 'minutes')
  if (hours < 24) return rtf.format(-hours, 'hours')
  if (days < 7) return rtf.format(-days, 'days')
  return then.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatDate(date: string, locale = 'de'): string {
  return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
