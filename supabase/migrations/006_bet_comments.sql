create table if not exists bet_comments (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table bet_comments enable row level security;
create policy "Involved users can view comments"
  on bet_comments for select to authenticated
  using (
    exists (select 1 from bets b where b.id = bet_id and (b.created_by = auth.uid() or b.subject_id = auth.uid()))
    or exists (select 1 from bet_participants bp where bp.bet_id = bet_comments.bet_id and bp.user_id = auth.uid())
  );
create policy "Involved users can comment"
  on bet_comments for insert to authenticated
  with check (user_id = auth.uid());
create policy "Users can delete own comments"
  on bet_comments for delete to authenticated
  using (user_id = auth.uid());
