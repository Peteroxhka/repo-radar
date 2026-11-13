CREATE OR REPLACE FUNCTION repo_radar.list_repo_category_counts()
 RETURNS TABLE(category text, total bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 SELECT r.category,count(*)::bigint FROM repo_radar.repos r
 WHERE (not r.is_fork or r.stars >= 50) AND NOT r.is_archived AND NOT r.admin_hidden
 GROUP BY r.category ORDER BY r.category;
$function$;

CREATE OR REPLACE FUNCTION repo_radar.admin_dashboard()
 RETURNS TABLE(total_repos bigint, visible_repos bigint, hidden_repos bigint, console_webkits bigint, profiles_count bigint, messages_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 IF NOT repo_radar_private.is_site_admin() THEN RAISE EXCEPTION 'Admin access denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT count(*)::bigint,
        count(*) FILTER(WHERE NOT r.admin_hidden AND (not r.is_fork or r.stars >= 50) AND NOT r.is_archived)::bigint,
        count(*) FILTER(WHERE r.admin_hidden)::bigint,
        count(*) FILTER(WHERE r.category='console_webkit' AND NOT r.admin_hidden)::bigint,
        (SELECT count(*)::bigint FROM repo_radar.profiles),
        (SELECT count(*)::bigint FROM repo_radar.direct_messages)
 FROM repo_radar.repos r;
END $function$;

CREATE OR REPLACE FUNCTION repo_radar.list_repo_languages()
 RETURNS TABLE(language text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 SELECT DISTINCT r.language FROM repo_radar.repos r
 WHERE r.language IS NOT NULL AND btrim(r.language)<>''
   AND (not r.is_fork or r.stars >= 50) AND NOT r.is_archived AND NOT r.admin_hidden
 ORDER BY r.language;
$function$;

CREATE OR REPLACE FUNCTION repo_radar.list_catalog_sites(repo_ids bigint[])
 RETURNS TABLE(id bigint, homepage text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT r.id, r.homepage FROM repo_radar.repos AS r
  WHERE r.id = ANY(coalesce(repo_ids, ARRAY[]::bigint[]))
    AND (not r.is_fork or r.stars >= 50) AND NOT r.is_archived
    AND r.homepage ~* '^https://[a-z0-9-]+[.]github[.]io(/|$)';
$function$;

CREATE OR REPLACE FUNCTION repo_radar.search_catalog(q text DEFAULT ''::text, category_filter text DEFAULT 'all'::text, language_filter text DEFAULT ''::text, sort_by text DEFAULT 'popular'::text, include_description boolean DEFAULT false, page_size integer DEFAULT 48, page_offset integer DEFAULT 0)
 RETURNS TABLE(id bigint, name text, owner_login text, full_name text, description text, html_url text, language text, stars integer, watchers_count integer, forks_count integer, category text, license_spdx text, pushed_at timestamp with time zone, total_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
with query_values as (
 select lower(btrim(left(coalesce(q,''),80))) term,
        substring(lower(btrim(left(coalesce(q,''),80))) from '^@([a-z0-9-]+)$') owner_term,
        regexp_replace(lower(btrim(left(coalesce(q,''),80))), '[[:space:]_.-]+', '', 'g') compact
),
ranked as (
 select r.*,
   case when v.term = '' then 9
   when lower(r.full_name)=v.term or lower(r.owner_login)=v.term then 0
   when lower(r.name) = v.term or regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g') = v.compact then 0
   when left(lower(r.name), length(v.term)) = v.term then 1
   when strpos(lower(r.name), v.term) > 0 then 2
   when v.compact <> '' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'), v.compact) > 0 then 3
   else 4 end rank
 from repo_radar.repos r cross join query_values v
 where (not r.is_fork or r.stars >= 50) and not r.is_archived and not r.admin_hidden
 and (coalesce(category_filter,'all')='all' or r.category=category_filter)
 and (coalesce(language_filter,'')='' or r.language=language_filter)
 and (case when left(v.term,1)='@' then lower(r.owner_login)=v.owner_term else (v.term='' or lower(r.full_name)=v.term or lower(r.owner_login)=v.term or strpos(lower(r.name),v.term)>0
      or (v.compact<>'' and strpos(regexp_replace(lower(r.name), '[[:space:]_.-]+', '', 'g'),v.compact)>0)
      or (include_description and (strpos(lower(coalesce(r.description,'')),v.term)>0
           or exists(select 1 from unnest(r.topics) topic where strpos(lower(topic),v.term)>0)))) end)
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
$function$;
