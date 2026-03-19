create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

alter table groups enable row level security;
alter table group_members enable row level security;

-- All authenticated users can read groups (open platform)
create policy "Authenticated read groups"
  on groups for select
  using (auth.role() = 'authenticated');

-- Creator can insert
create policy "Creator insert group"
  on groups for insert
  with check (created_by = auth.uid());

-- Creator can update/delete
create policy "Creator manage group"
  on groups for all
  using (created_by = auth.uid());

-- All authenticated users can read group_members
create policy "Authenticated read group_members"
  on group_members for select
  using (auth.role() = 'authenticated');

-- Creator can insert members (using SECURITY DEFINER function to avoid RLS loop)
create policy "Creator insert members"
  on group_members for insert
  with check (
    exists (
      select 1 from groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- Creator or the member themselves can delete
create policy "Creator or self delete member"
  on group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );
