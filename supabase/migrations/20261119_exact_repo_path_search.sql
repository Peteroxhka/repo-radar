-- A title search stays title-first, but an exact owner/repository path must also work.
-- Owner handle alone does not match (no nickname search).
CREATE INDEX IF NOT EXISTS repo_radar_full_name_lower_idx ON repo_radar.repos(lower(full_name));
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
   when lower(r.full_name)=v.term then 0
   when lower(r.name) = v.term or regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g') = v.compact then 0
   when left(lower(r.name), length(v.term)) = v.term then 1
   when strpos(lower(r.name), v.term) > 0 then 2
   when v.compact <> '' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'), v.compact) > 0 then 3
   else 4 end rank
 from repo_radar.repos r cross join query_values v
 where not r.is_fork and not r.is_archived and not r.admin_hidden
 and (coalesce(category_filter,'all')='all' or r.category=category_filter)
 and (coalesce(language_filter,'')='' or r.language=language_filter)
 and (v.term='' or lower(r.full_name)=v.term or strpos(lower(r.name),v.term)>0
      or (v.compact<>'' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'),v.compact)>0)
      or (include_description and (strpos(lower(coalesce(r.description,'')),v.term)>0
           or exists(select 1 from unnest(r.topics) topic where strpos(lower(topic),v.term)>0))))
)
select r.id,r.name,r.owner_login,r.full_name,r.description,r.html_url,
       r.language,r.stars,r.watchers_count,r.forks_count,r.category,
       r.license_spdx,r.pushed_at,count(*) over() total_count
from ranked r
order by
 -- The selected sort must take priority over text relevance.
 case when sort_by='least' then r.stars end asc nulls last,
 case when sort_by='recent' then r.pushed_at end desc nulls last,
 case when sort_by='newest' then r.created_at end desc nulls last,
 case when sort_by='forked' then r.forks_count end desc nulls last,
 case when sort_by not in ('least','recent','newest','forked') then r.stars end desc nulls last,
 r.rank asc,
 r.id desc
limit least(greatest(coalesce(page_size,48),1),100)
offset greatest(coalesce(page_offset,0),0);
$body$;


