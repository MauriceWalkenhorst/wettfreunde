alter table profiles add column if not exists streak integer not null default 0;

create or replace function increment_points(target_user_id uuid, amount integer)
returns integer
language plpgsql security definer
as $$
declare new_streak integer;
begin
  update profiles set points = points + amount, streak = streak + 1
  where id = target_user_id returning streak into new_streak;
  return new_streak;
end;
$$;

create or replace function reset_streak(target_user_id uuid)
returns void language plpgsql security definer
as $$
begin update profiles set streak = 0 where id = target_user_id; end;
$$;

create or replace function add_bonus_points(target_user_id uuid, amount integer)
returns void language plpgsql security definer
as $$
begin update profiles set points = points + amount where id = target_user_id; end;
$$;
