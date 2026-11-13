alter table repo_radar.repos
  drop constraint if exists repos_originals_only_check,
  add constraint repos_popular_forks_check
    check (not is_fork or (stars is not null and stars >= 50));
