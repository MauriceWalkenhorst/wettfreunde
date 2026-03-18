-- Tabelle für Beweis-Fotos von Teilnehmern
create table bet_photos (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  photo_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table bet_photos enable row level security;

create policy "Participants can view bet photos"
  on bet_photos for select to authenticated
  using (true);

create policy "Participants can upload bet photos"
  on bet_photos for insert to authenticated
  with check (auth.uid() = uploaded_by);
