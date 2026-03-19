-- Fix bets RLS: participants (who are neither creator nor subject) could not see bets
-- Safe now because bet_participants policy is `using (true)` — no circular reference

drop policy if exists "Users can view bets they are involved in" on bets;

create policy "Users can view bets they are involved in"
  on bets for select to authenticated
  using (
    auth.uid() = created_by
    or auth.uid() = subject_id
    or exists (
      select 1 from bet_participants bp
      where bp.bet_id = bets.id and bp.user_id = auth.uid()
    )
  );

-- Ensure increment_points RPC exists (SECURITY DEFINER to bypass RLS on profiles update)
create or replace function increment_points(target_user_id uuid, amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set points = points + amount
  where id = target_user_id;
end;
$$;
