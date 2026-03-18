-- Fix circular RLS dependency between bets and bet_participants

-- Drop the problematic policies
drop policy if exists "Users can view bets they are involved in" on bets;
drop policy if exists "Creators can insert participants" on bet_participants;
drop policy if exists "System can update participants" on bet_participants;
drop policy if exists "Users can view bet participants for their bets" on bet_participants;

-- Simpler bets SELECT policy (no reference to bet_participants)
create policy "Users can view bets they are involved in"
  on bets for select to authenticated
  using (
    auth.uid() = created_by
    or auth.uid() = subject_id
  );

-- Simple bet_participants policies (no circular reference)
create policy "Users can view bet participants"
  on bet_participants for select to authenticated
  using (true);

create policy "Authenticated users can insert participants"
  on bet_participants for insert to authenticated
  with check (true);

create policy "Authenticated users can update participants"
  on bet_participants for update to authenticated
  using (true);
