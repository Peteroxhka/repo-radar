-- Large public GitHub repository catalog and resumable importer state.
alter table repo_radar.repos
  add column if not exists is_fork boolean not null default false,
  add column if not exists is_archived boolean not null default false,
  add column if not exists forks_count integer not null default 0,
  add column if not exists watchers_count integer not null default 0,
  add column if not exists open_issues_count integer not null default 0,
  add column if not exists default_branch text,
  add column if not exists homepage text,
  add column if not exists updated_at timestamptz;

create index if not exists repos_stars_id_idx
  on repo_radar.repos (stars desc, id desc);
create index if not exists repos_category_stars_id_idx
  on repo_radar.repos (category, stars desc, id desc);
create index if not exists repos_language_stars_id_idx
  on repo_radar.repos (language, stars desc, id desc);

create extension if not exists pg_trgm with schema extensions;
create index if not exists repos_full_name_trgm_idx
  on repo_radar.repos using gin (full_name extensions.gin_trgm_ops);
create index if not exists repos_description_trgm_idx
  on repo_radar.repos using gin (description extensions.gin_trgm_ops);

create table if not exists repo_radar.collector_state (
  key text primary key,
  last_repo_id bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table repo_radar.collector_state enable row level security;
revoke all on table repo_radar.collector_state from public, anon, authenticated;
grant select, insert, update, delete on table repo_radar.collector_state to service_role;
grant usage on schema repo_radar to service_role;

insert into repo_radar.collector_state(key, last_repo_id)
values ('public_repositories', 0)
on conflict (key) do nothing;
