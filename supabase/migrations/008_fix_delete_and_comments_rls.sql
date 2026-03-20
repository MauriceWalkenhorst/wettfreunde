-- Fix 1: Add DELETE policy for bets (creator can delete pending bets)
create policy "Creators can delete own pending bets"
  on bets for delete to authenticated
  using (created_by = auth.uid() and status = 'pending');

-- Fix 2: Allow all authenticated users to view comments
drop policy if exists "Involved users can view comments" on bet_comments;
create policy "Authenticated users can view comments"
  on bet_comments for select to authenticated
  using (true);
