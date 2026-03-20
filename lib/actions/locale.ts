'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const VALID_LOCALES = ['de', 'en']

export async function setLocale(locale: string) {
  if (!VALID_LOCALES.includes(locale)) throw new Error('Invalid locale')
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  revalidatePath('/', 'layout')
}
