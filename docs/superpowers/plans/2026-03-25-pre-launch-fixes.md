# Pre-Launch Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical security, data integrity, and UX issues before soft launch of Wettfreunde.

**Architecture:** Two batches — Batch A (security + logic bugs, no UI) and Batch B (UX: 404, error boundary, redirects, OG tags, loading states). Each task is independently committable.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS + Storage), TypeScript, Tailwind CSS, next-intl

---

## Batch A — Security & Logic Bugs

### Task 1: Fix uploadBetPhoto file extension validation

**Files:**
- Modify: `lib/actions/bets.ts:249-250`

- [ ] **Step 1: Add VALID_EXTS check to uploadBetPhoto**

```typescript
// lib/actions/bets.ts — replace lines 249-250
const VALID_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const ext = photoFile.name.split('.').pop()?.toLowerCase()
if (!ext || !VALID_EXTS.includes(ext)) throw new Error('Invalid file type')
const path = `${betId}/proof-${user.id}-${Date.now()}.${ext}`
```

- [ ] **Step 2: Verify the change looks correct**

Run: `cat lib/actions/bets.ts | grep -A5 "uploadBetPhoto" | head -20`

- [ ] **Step 3: Commit**

```bash
git add lib/actions/bets.ts
git commit -m "fix: add file extension validation to uploadBetPhoto"
```

---

### Task 2: Fix deleteBet — authorization + row confirmation

**Files:**
- Modify: `lib/actions/bets.ts:234-242`

Currently `deleteBet` does no pre-check and ignores whether RLS silently blocked the delete.

- [ ] **Step 1: Replace deleteBet body**

```typescript
export async function deleteBet(betId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: bet } = await supabase
    .from('bets')
    .select('created_by, status')
    .eq('id', betId)
    .single()

  if (!bet) throw new Error('Wette nicht gefunden')
  if ((bet as { created_by: string }).created_by !== user.id) throw new Error('Nur der Ersteller kann löschen')
  if ((bet as { status: string }).status !== 'pending') throw new Error('Nur offene Wetten können gelöscht werden')

  const { error } = await supabase.from('bets').delete().eq('id', betId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/bets.ts
git commit -m "fix: deleteBet checks authorization and propagates RLS errors"
```

---

### Task 3: Fix open redirect in auth/callback

**Files:**
- Modify: `app/auth/callback/route.ts:7,13`

`?next=https://evil.com` currently redirects off-site.

- [ ] **Step 1: Add next parameter validation**

```typescript
// app/auth/callback/route.ts — replace the full file
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Only allow relative paths to prevent open redirect
  const next = rawNext.startsWith('/') && !rawNext.includes('//') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "fix: validate next param in auth callback to prevent open redirect"
```

---

### Task 4: Fix answerBet — error handling in participant update loop

**Files:**
- Modify: `lib/actions/bets.ts:141-144`

The bet_participants update has no error check — if it silently fails, points are still awarded.

- [ ] **Step 1: Add error check to participant update**

```typescript
// lib/actions/bets.ts — replace lines 141-144 (the update inside the for loop)
const { error: partUpdateError } = await supabase
  .from('bet_participants')
  .update({ won, points_awarded: points })
  .eq('id', p.id)
if (partUpdateError) throw new Error(`Participant update failed: ${partUpdateError.message}`)
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/bets.ts
git commit -m "fix: throw on bet_participants update error in answerBet"
```

---

### Task 5: Fix bet_participants UPDATE RLS policy

**Files:**
- Create: `supabase/migrations/010_fix_participants_update_rls.sql`

Currently `using (true)` allows any authenticated user to update any participant row (change `won`, `points_awarded`, `side` for others). The fix restricts direct UPDATE to own row only. The `answerBet` server action (which needs to update all participants) goes through a SECURITY DEFINER function.

> **Note:** Tasks 5 and 6 modify the same migration file. Complete BOTH tasks before applying the migration to Supabase — do not run `supabase db push` until Task 6 is done.
> **Note:** Task 4's error handling is transitional — it gets replaced in Task 5. That's fine; both commits are still valid.

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/010_fix_participants_update_rls.sql

-- Drop the overly-permissive UPDATE policy
drop policy if exists "Authenticated users can update participants" on bet_participants;

-- Users can only update their own participation row (for pickSide)
create policy "Users can update own participation"
  on bet_participants for update to authenticated
  using (user_id = auth.uid());

-- Create SECURITY DEFINER function for resolving bets
-- This runs as superuser so it can update all participants at once
create or replace function resolve_bet_participants(
  p_bet_id uuid,
  p_answer boolean
)
returns void
language plpgsql
security definer
as $$
declare
  p record;
  v_won boolean;
  v_points integer;
  v_new_streak integer;
begin
  -- Verify caller is the subject of this bet
  if not exists (
    select 1 from bets where id = p_bet_id and subject_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  for p in
    select id, user_id, side from bet_participants where bet_id = p_bet_id
  loop
    v_won := case when p.side is not null then (p.side = p_answer) else null end;
    v_points := case when v_won then 10 else 0 end;

    update bet_participants
    set won = v_won, points_awarded = v_points
    where id = p.id;

    if v_won then
      select increment_points(p.user_id, 10) into v_new_streak;
      if v_new_streak > 0 and v_new_streak % 3 = 0 then
        perform add_bonus_points(p.user_id, 5);
        insert into notifications (user_id, type, title, body, ref_id)
        values (p.user_id, 'bet_result', '🔥 Streak-Bonus!',
          v_new_streak || 'er-Streak! +5 Bonus-Punkte', p_bet_id);
      end if;
    elsif v_won = false then
      perform reset_streak(p.user_id);
    end if;
  end loop;
end;
$$;
```

- [ ] **Step 2: Update answerBet in bets.ts to use resolve_bet_participants**

Replace the for-loop (lines 137-172) with a single RPC call:

```typescript
// Replace the entire for-loop block with:
const { error: resolveError } = await (supabase as any).rpc('resolve_bet_participants', {
  p_bet_id: betId,
  p_answer: answer,
})
if (resolveError) throw new Error(resolveError.message)
```

- [ ] **Step 3: Apply migration to Supabase**

Run in Supabase SQL Editor or via CLI:
```bash
supabase db push
```
Or paste the SQL directly in the Supabase Dashboard → SQL Editor.

- [ ] **Step 4: Test that bet resolution still works**
  - Create a test bet as user A, with user B as subject and user C as participant
  - User B answers → confirm points awarded to correct participants
  - Confirm streak increments correctly

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/010_fix_participants_update_rls.sql lib/actions/bets.ts
git commit -m "fix: restrict bet_participants UPDATE RLS, move resolution to SECURITY DEFINER fn"
```

---

### Task 6: Personalized win/loss notifications

**Files:**
- Modify: `lib/actions/bets.ts` (notifications insert at end of answerBet, now inside resolve_bet_participants)

Currently all participants get the same notification ("X hat mit Ja geantwortet"). Users don't know if they won or lost without opening the bet.

Since resolution is now in the DB function (Task 5), add personalized notifications inside `resolve_bet_participants`:

- [ ] **Step 1: Add personalized notification inside the DB function loop**

After the streak logic inside the for-loop in `resolve_bet_participants`, add:

```sql
-- Personalized win/loss notification
insert into notifications (user_id, type, title, body, ref_id)
values (
  p.user_id,
  'bet_result',
  case
    when v_won then '✅ Gewonnen!'
    when v_won = false then '❌ Verloren'
    else '⏳ Wette aufgelöst'
  end,
  case
    when v_won then '+' || v_points || ' Punkte!'
    when v_won = false then 'Leider verloren.'
    else 'Du hattest keine Seite gewählt.'
  end,
  p_bet_id
);
```

- [ ] **Step 2: Remove the generic notification block from answerBet in bets.ts**

Delete lines 183-191 (the `allUserIds.map` notification insert) since it's now handled in the DB function.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/010_fix_participants_update_rls.sql lib/actions/bets.ts
git commit -m "feat: personalized win/loss notifications per participant"
```

---

### Task 7: Fix invite token race condition

**Files:**
- Modify: `lib/actions/friends.ts` (acceptInvite function)

Two users redeeming the same token simultaneously can both succeed.

- [ ] **Step 1: Add atomic update with null-check**

Find the `used_by` update inside `acceptInvite` and replace it with:

```typescript
// Replace the used_by update with an atomic conditional update
const { data: claimed, error: claimError } = await supabase
  .from('invite_links')
  .update({ used_by: user.id })
  .eq('id', invite.id)
  .is('used_by', null)          // Only succeeds if not yet used
  .select('id')
  .single()

if (claimError || !claimed) {
  return { success: false, message: 'Dieser Einladungslink wurde bereits verwendet.' }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/friends.ts
git commit -m "fix: atomic invite token claim prevents race condition"
```

---

## Batch B — UX & Error Handling

### Task 8: Add 404 page

**Files:**
- Create: `app/not-found.tsx`

- [ ] **Step 1: Create not-found.tsx**

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎲</div>
        <h1 className="text-2xl font-bold text-zinc-900">Seite nicht gefunden</h1>
        <p className="text-zinc-500 text-sm">Diese Seite existiert nicht oder wurde verschoben.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat: add 404 not-found page"
```

---

### Task 9: Add global error boundary

**Files:**
- Create: `app/error.tsx`

- [ ] **Step 1: Create error.tsx**

```tsx
// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-zinc-900">Etwas ist schiefgelaufen</h1>
        <p className="text-zinc-500 text-sm">Ein unerwarteter Fehler ist aufgetreten.</p>
        <button
          onClick={reset}
          className="inline-block mt-4 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Nochmal versuchen
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/error.tsx
git commit -m "feat: add global error boundary"
```

---

### Task 10: Fix return null → redirect in protected pages

**Files:**
- Modify: `app/(app)/dashboard/page.tsx:13`
- Modify: `app/(app)/bets/[id]/page.tsx:30`
- Modify: `app/(app)/bets/new/page.tsx` (multiple nulls)
- Modify: `app/(app)/friends/page.tsx`
- Modify: `app/(app)/leaderboard/page.tsx`
- Modify: `app/(app)/groups/page.tsx`
- Modify: `app/(app)/profile/page.tsx`

Pages return `null` when user is not logged in — shows blank page instead of redirecting.

- [ ] **Step 1: Add redirect import to each page and replace `return null` with `redirect('/login')`**

Pattern to apply in every page file that has `if (!user) return null`:

```typescript
// Add to imports:
import { redirect } from 'next/navigation'

// Replace:
if (!user) return null
// With:
if (!user) redirect('/login')
```

Also in `app/(app)/profile/page.tsx`:
```typescript
// Replace:
if (!profile) return null
// With:
if (!profile) redirect('/login')
```

Apply to all 7 files listed above.

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx \
        app/\(app\)/bets/new/page.tsx \
        app/\(app\)/bets/\[id\]/page.tsx \
        app/\(app\)/friends/page.tsx \
        app/\(app\)/leaderboard/page.tsx \
        app/\(app\)/groups/page.tsx \
        app/\(app\)/profile/page.tsx
git commit -m "fix: replace return null with redirect('/login') in protected pages"
```

---

### Task 11: Add OG/Meta tags to bet detail page

**Files:**
- Modify: `app/(app)/bets/[id]/page.tsx`

Shared bet links show no preview. Add `generateMetadata` so sharing shows the question + stake.

- [ ] **Step 1: Add generateMetadata export**

Add before the default export in `app/(app)/bets/[id]/page.tsx`:

```typescript
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const bet = await getBetById(id)
  if (!bet) return { title: 'Wette nicht gefunden — Wettfreunde' }

  return {
    title: `${bet.question} — Wettfreunde`,
    description: `Einsatz: ${bet.stake}`,
    openGraph: {
      title: `🎲 ${bet.question}`,
      description: `Einsatz: ${bet.stake}`,
      siteName: 'Wettfreunde',
      type: 'website',
    },
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/bets/\[id\]/page.tsx
git commit -m "feat: add OG meta tags to bet detail page for link sharing"
```

---

### Task 12: Add loading.tsx to all app routes

**Files:**
- Create: `app/(app)/dashboard/loading.tsx`
- Create: `app/(app)/bets/[id]/loading.tsx`
- Create: `app/(app)/bets/new/loading.tsx`
- Create: `app/(app)/friends/loading.tsx`
- Create: `app/(app)/leaderboard/loading.tsx`
- Create: `app/(app)/groups/loading.tsx`
- Create: `app/(app)/profile/loading.tsx`

- [ ] **Step 1: Create a shared loading spinner component**

```tsx
// Reuse this pattern for each loading.tsx:
export default function Loading() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  )
}
```

Create this exact file in each of the 7 route directories listed above.

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/dashboard/loading.tsx \
        app/\(app\)/bets/\[id\]/loading.tsx \
        app/\(app\)/friends/loading.tsx \
        app/\(app\)/leaderboard/loading.tsx \
        app/\(app\)/groups/loading.tsx \
        app/\(app\)/profile/loading.tsx
git commit -m "feat: add loading.tsx spinners to all app routes"
```

---

### Task 13: Replace window.confirm with Dialog in DeleteBetButton

**Files:**
- Modify: `components/delete-bet-button.tsx`

`window.confirm` is browser-native and ugly on mobile. The app already has `components/ui/dialog.tsx`.

- [ ] **Step 1: Read the Dialog component to understand its API**

```bash
cat components/ui/dialog.tsx
```

- [ ] **Step 2: Rewrite DeleteBetButton to use Dialog**

```tsx
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
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} loading={isPending}>
            {t('deleteBet')}
          </Button>
        </div>
      </Dialog>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
```

Note: Adapt Dialog usage to match the actual API of `components/ui/dialog.tsx`.

- [ ] **Step 3: Add 'Abbrechen' (cancel) translation keys to de.json and en.json**

```json
// de.json — inside "betDetail":
"cancel": "Abbrechen"

// en.json — inside "betDetail":
"cancel": "Cancel"
```

Update the component to use `t('cancel')`.

- [ ] **Step 4: Commit**

```bash
git add components/delete-bet-button.tsx messages/de.json messages/en.json
git commit -m "feat: replace window.confirm with Dialog in DeleteBetButton"
```

---

## Final Checklist

- [ ] All Batch A tasks committed and migrations applied in Supabase
- [ ] All Batch B tasks committed
- [ ] Test full bet lifecycle: create → answer → points → notifications
- [ ] Test on mobile: loading states, nav, bet detail
- [ ] Push to GitHub → Vercel auto-deploys
- [ ] Smoke test on production URL

```bash
git push
```
