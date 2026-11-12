create schema if not exists repo_radar_private;
revoke all on schema repo_radar_private from public, anon, authenticated;
alter function repo_radar.create_profile_for_new_user() set schema repo_radar_private;
revoke all on function repo_radar_private.create_profile_for_new_user() from public, anon, authenticated;