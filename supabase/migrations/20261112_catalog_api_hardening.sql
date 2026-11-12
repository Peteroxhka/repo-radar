-- The public catalog is read-only for browser clients. The collector writes with service_role.
revoke insert, update, delete, truncate, references, trigger on table repo_radar.repos from anon, authenticated;
grant select on table repo_radar.repos to anon, authenticated;

create or replace function repo_radar.list_repo_languages()
returns table(language text)
language sql
stable
security invoker
set search_path = repo_radar
as $$
  select distinct r.language
  from repo_radar.repos as r
  where r.language is not null and btrim(r.language) <> ''
  order by r.language;
$$;
revoke all on function repo_radar.list_repo_languages() from public;
grant execute on function repo_radar.list_repo_languages() to anon, authenticated;

drop policy if exists "No client access to collector state" on repo_radar.collector_state;
create policy "No client access to collector state"
on repo_radar.collector_state
for all
to anon, authenticated
using (false)
with check (false);
