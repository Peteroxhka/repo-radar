-- Bootstrap for a fresh database. Safe to run against an existing catalog.
create schema if not exists repo_radar;
grant usage on schema repo_radar to anon, authenticated, service_role;
create table if not exists repo_radar.repos (
  id bigint primary key,
  full_name text not null,
  name text not null,
  owner_login text not null,
  description text,
  html_url text not null,
  language text,
  topics text[] not null default '{}',
  stars bigint not null default 0,
  license_spdx text,
  category text not null default 'other',
  pushed_at timestamptz,
  created_at timestamptz,
  fetched_at timestamptz not null default now()
);
alter table repo_radar.repos enable row level security;
grant select on repo_radar.repos to anon, authenticated;
grant all on repo_radar.repos to service_role;
drop policy if exists "radar catalog public read" on repo_radar.repos;
create policy "radar catalog public read" on repo_radar.repos
for select to anon, authenticated using (true);
create table if not exists repo_radar.collector_state (
  key text primary key,
  last_repo_id bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table repo_radar.collector_state enable row level security;
revoke all on repo_radar.collector_state from public, anon, authenticated;
grant all on repo_radar.collector_state to service_role;
