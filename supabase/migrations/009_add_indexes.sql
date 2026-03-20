-- Add indexes for commonly queried columns to improve performance
create index if not exists idx_bet_participants_user_id on bet_participants(user_id);
create index if not exists idx_bet_participants_bet_id on bet_participants(bet_id);
create index if not exists idx_bets_subject_id on bets(subject_id);
create index if not exists idx_bets_created_by on bets(created_by);
create index if not exists idx_bets_status on bets(status);
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_group_members_group_id on group_members(group_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_friendships_user_a on friendships(user_a);
create index if not exists idx_friendships_user_b on friendships(user_b);
create index if not exists idx_bet_photos_bet_id on bet_photos(bet_id);
create index if not exists idx_bet_comments_bet_id on bet_comments(bet_id);
