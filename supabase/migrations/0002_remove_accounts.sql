-- AFL Player Cross: remove player accounts
-- Public sign-up/streak tracking is dropped -- stats now live client-side
-- (localStorage). Only admin authentication remains, gated by
-- admin_emails/is_admin() against Supabase Auth directly (no profiles
-- table needed for that check).

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

drop table if exists plays;
drop table if exists user_stats;
drop table if exists profiles;
