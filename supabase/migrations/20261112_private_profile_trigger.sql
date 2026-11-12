-- Compatible with both the legacy public function and the current private one.
create schema if not exists repo_radar_private;
revoke all on schema repo_radar_private from public, anon, authenticated;
do $$
begin
  if to_regprocedure('repo_radar_private.create_profile_for_new_user()') is null
     and to_regprocedure('repo_radar.create_profile_for_new_user()') is not null then
    alter function repo_radar.create_profile_for_new_user() set schema repo_radar_private;
  end if;
  if to_regprocedure('repo_radar_private.create_profile_for_new_user()') is not null then
    drop trigger if exists repo_radar_on_auth_user_created on auth.users;
    create trigger repo_radar_on_auth_user_created after insert on auth.users
      for each row execute function repo_radar_private.create_profile_for_new_user();
    revoke all on function repo_radar_private.create_profile_for_new_user() from public, anon, authenticated;
  end if;
  if to_regprocedure('repo_radar.create_profile_for_new_user()') is not null then
    revoke all on function repo_radar.create_profile_for_new_user() from public, anon, authenticated;
  end if;
end;
$$;
