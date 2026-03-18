-- Enable pgcrypto for gen_random_bytes
create extension if not exists pgcrypto;

-- profiles: extends Supabase auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- friendships
create table friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

-- invite_links
create table invite_links (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  used_by uuid references profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- bets
create table bets (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  stake text not null,
  subject_id uuid not null references profiles(id),
  subject_answer boolean,
  proof_photo_path text,
  status text not null default 'pending'
    check (status in ('pending', 'answered', 'expired')),
  created_by uuid not null references profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

-- bet_participants (must exist before bets RLS policies)
create table bet_participants (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  side boolean,
  won boolean,
  points_awarded integer not null default 0,
  unique (bet_id, user_id)
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('bet_request', 'bet_result', 'friend_request', 'friend_accepted')),
  title text not null,
  body text,
  ref_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS: profiles
alter table profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- RLS: friendships
alter table friendships enable row level security;

create policy "Users can view their own friendships"
  on friendships for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can create friendships"
  on friendships for insert to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can update their own friendships"
  on friendships for update to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- RLS: invite_links
alter table invite_links enable row level security;

create policy "Anyone authenticated can view invite links"
  on invite_links for select to authenticated using (true);

create policy "Users can create invite links"
  on invite_links for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Users can update invite links"
  on invite_links for update to authenticated
  using (auth.uid() = created_by or used_by is null);

-- RLS: bets (after bet_participants exists)
alter table bets enable row level security;

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

create policy "Authenticated users can create bets"
  on bets for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Subject can answer their bets"
  on bets for update to authenticated
  using (auth.uid() = subject_id or auth.uid() = created_by);

-- RLS: bet_participants
alter table bet_participants enable row level security;

create policy "Users can view bet participants for their bets"
  on bet_participants for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from bets b
      where b.id = bet_id
        and (b.created_by = auth.uid() or b.subject_id = auth.uid())
    )
    or exists (
      select 1 from bet_participants bp2
      where bp2.bet_id = bet_participants.bet_id and bp2.user_id = auth.uid()
    )
  );

create policy "Creators can insert participants"
  on bet_participants for insert to authenticated
  with check (
    exists (
      select 1 from bets b where b.id = bet_id and b.created_by = auth.uid()
    )
  );

create policy "System can update participants"
  on bet_participants for update to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from bets b where b.id = bet_id and b.subject_id = auth.uid()
    )
  );

-- RLS: notifications
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users can create notifications"
  on notifications for insert to authenticated
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for proof photos
insert into storage.buckets (id, name, public)
values ('proof-photos', 'proof-photos', false)
on conflict do nothing;

create policy "Authenticated users can upload proof photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'proof-photos');

create policy "Involved users can view proof photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'proof-photos');
