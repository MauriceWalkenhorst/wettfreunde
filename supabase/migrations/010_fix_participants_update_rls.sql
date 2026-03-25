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
