
-- Title-first search, independent of repository owner's GitHub nickname.
create index if not exists repos_name_lower_trgm_idx
on repo_radar.repos using gin ((lower(name)) extensions.gin_trgm_ops);
create index if not exists repos_name_compact_trgm_idx
on repo_radar.repos using gin ((regexp_replace(lower(name), '[[:space:]_.-]+', '', 'g')) extensions.gin_trgm_ops);
create or replace function repo_radar.search_catalog(
  q text default '', category_filter text default 'all', language_filter text default '',
  sort_by text default 'popular', include_description boolean default false,
  page_size integer default 48, page_offset integer default 0
)
returns table (
 id bigint, name text, owner_login text, full_name text, description text,
 html_url text, language text, stars integer, watchers_count integer,
 forks_count integer, category text, license_spdx text, pushed_at timestamptz,
 total_count bigint
)
language sql stable security invoker set search_path = ''
as $body$
with query_values as (
 select lower(btrim(left(coalesce(q,''),80))) term,
        regexp_replace(lower(btrim(left(coalesce(q,''),80))), '[[:space:]_.-]+', '', 'g') compact
),
ranked as (
 select r.*,
   case when v.term = '' then 9
   when lower(r.name) = v.term or regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g') = v.compact then 0
   when left(lower(r.name), length(v.term)) = v.term then 1
   when strpos(lower(r.name), v.term) > 0 then 2
   when v.compact <> '' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'), v.compact) > 0 then 3
   else 4 end rank
 from repo_radar.repos r cross join query_values v
 where not r.is_fork and not r.is_archived
 and (coalesce(category_filter,'all')='all' or r.category=category_filter)
 and (coalesce(language_filter,'')='' or r.language=language_filter)
 and (v.term='' or strpos(lower(r.name),v.term)>0
      or (v.compact<>'' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'),v.compact)>0)
      or (include_description and (strpos(lower(coalesce(r.description,'')),v.term)>0
           or exists(select 1 from unnest(r.topics) topic where strpos(lower(topic),v.term)>0))))
)
select r.id,r.name,r.owner_login,r.full_name,r.description,r.html_url,
       r.language,r.stars,r.watchers_count,r.forks_count,r.category,
       r.license_spdx,r.pushed_at,count(*) over() total_count
from ranked r
order by r.rank,
 case when sort_by='least' then r.stars end asc nulls last,
 case when sort_by='recent' then r.pushed_at end desc nulls last,
 case when sort_by='newest' then r.created_at end desc nulls last,
 case when sort_by='forked' then r.forks_count end desc nulls last,
 case when sort_by not in ('least','recent','newest','forked') then r.stars end desc nulls last,
 r.id desc
limit least(greatest(coalesce(page_size,48),1),100)
offset greatest(coalesce(page_offset,0),0);
$body$;
revoke all on function repo_radar.search_catalog(text,text,text,text,boolean,integer,integer) from public;
grant execute on function repo_radar.search_catalog(text,text,text,text,boolean,integer,integer) to anon,authenticated;
create or replace function repo_radar.list_repo_languages()
returns table(language text)
language sql stable security invoker set search_path=''
as $body$
 select distinct r.language from repo_radar.repos r
 where r.language is not null and btrim(r.language)<>'' and not r.is_fork and not r.is_archived
 order by r.language;
$body$;
revoke all on function repo_radar.list_repo_languages() from public;
grant execute on function repo_radar.list_repo_languages() to anon,authenticated;
create or replace function repo_radar.list_repo_category_counts()
returns table(category text,total bigint)
language sql stable security invoker set search_path=''
as $body$
 select r.category,count(*)::bigint from repo_radar.repos r
 where not r.is_fork and not r.is_archived group by r.category order by r.category;
$body$;
revoke all on function repo_radar.list_repo_category_counts() from public;
grant execute on function repo_radar.list_repo_category_counts() to anon,authenticated;
