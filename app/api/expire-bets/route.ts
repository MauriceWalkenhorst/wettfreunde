import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Wird stündlich per Vercel Cron aufgerufen (siehe vercel.json)
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bets')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expired: data?.length ?? 0 })
}
