-- One verified GitHub owner; privilege enforcement is on the database, not in JavaScript.
-- The user_id is resolved from the verified GitHub OAuth identity, never from an editable profile name.
CREATE TABLE IF NOT EXISTS repo_radar_private.site_admins (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 github_provider_id text NOT NULL UNIQUE
);
REVOKE ALL ON repo_radar_private.site_admins FROM PUBLIC, anon, authenticated;
INSERT INTO repo_radar_private.site_admins(user_id,github_provider_id)
SELECT i.user_id,i.provider_id FROM auth.identities i
WHERE i.provider='github' AND i.provider_id='206308662'
ON CONFLICT (user_id) DO NOTHING;

DO $verify$
BEGIN
 IF (SELECT count(*) FROM repo_radar_private.site_admins)!=1
 OR NOT EXISTS (SELECT 1 FROM repo_radar_private.site_admins a
   JOIN auth.identities i ON i.user_id=a.user_id AND i.provider='github' AND i.provider_id=a.github_provider_id
   WHERE a.github_provider_id='206308662')
 THEN RAISE EXCEPTION 'Unable to verify the single GitHub admin identity'; END IF;
END $verify$;

CREATE OR REPLACE FUNCTION repo_radar_private.is_site_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT EXISTS(
  SELECT 1 FROM repo_radar_private.site_admins a
  JOIN auth.identities i ON i.user_id=a.user_id
  WHERE a.user_id=(SELECT auth.uid()) AND i.provider='github'
    AND i.provider_id=a.github_provider_id
 );
$fn$;
REVOKE ALL ON FUNCTION repo_radar_private.is_site_admin() FROM PUBLIC, anon, authenticated;

-- Curated catalog actions only: no unrestricted SQL, auth, storage or user management.
ALTER TABLE repo_radar.repos ADD COLUMN IF NOT EXISTS admin_hidden boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS repo_radar_private.catalog_admin_log(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid NOT NULL,
 repo_id bigint NOT NULL,
 action text NOT NULL CHECK (action IN ('hide','restore')),
 reason text,
 changed_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON repo_radar_private.catalog_admin_log FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION repo_radar.admin_is_authorized()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
 SELECT repo_radar_private.is_site_admin();
$fn$;
REVOKE ALL ON FUNCTION repo_radar.admin_is_authorized() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION repo_radar.admin_is_authorized() TO authenticated;

CREATE OR REPLACE FUNCTION repo_radar.admin_dashboard()
RETURNS TABLE(total_repos bigint, visible_repos bigint, hidden_repos bigint, console_webkits bigint, profiles_count bigint, messages_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF NOT repo_radar_private.is_site_admin() THEN RAISE EXCEPTION 'Admin access denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT count(*)::bigint,
        count(*) FILTER(WHERE NOT r.admin_hidden AND NOT r.is_fork AND NOT r.is_archived)::bigint,
        count(*) FILTER(WHERE r.admin_hidden)::bigint,
        count(*) FILTER(WHERE r.category='console_webkit' AND NOT r.admin_hidden)::bigint,
        (SELECT count(*)::bigint FROM repo_radar.profiles),
        (SELECT count(*)::bigint FROM repo_radar.direct_messages)
 FROM repo_radar.repos r;
END $fn$;
REVOKE ALL ON FUNCTION repo_radar.admin_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION repo_radar.admin_dashboard() TO authenticated;

CREATE OR REPLACE FUNCTION repo_radar.admin_find_repos(search_text text DEFAULT '', max_results integer DEFAULT 30)
RETURNS TABLE(id bigint, name text, full_name text, category text, stars integer, admin_hidden boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF NOT repo_radar_private.is_site_admin() THEN RAISE EXCEPTION 'Admin access denied' USING ERRCODE='42501'; END IF;
 RETURN QUERY
 SELECT r.id,r.name,r.full_name,r.category,r.stars,r.admin_hidden
 FROM repo_radar.repos r
 WHERE btrim(coalesce(search_text,''))=''
    OR r.name ILIKE '%'||left(btrim(search_text),80)||'%'
    OR r.full_name ILIKE '%'||left(btrim(search_text),80)||'%'
 ORDER BY r.id DESC
 LIMIT least(greatest(coalesce(max_results,30),1),60);
END $fn$;
REVOKE ALL ON FUNCTION repo_radar.admin_find_repos(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION repo_radar.admin_find_repos(text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION repo_radar.admin_set_repo_hidden(repo_id bigint, hidden boolean, note text DEFAULT '')
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF NOT repo_radar_private.is_site_admin() THEN RAISE EXCEPTION 'Admin access denied' USING ERRCODE='42501'; END IF;
 IF repo_id IS NULL OR hidden IS NULL THEN RAISE EXCEPTION 'Invalid moderation action'; END IF;
 UPDATE repo_radar.repos r SET admin_hidden=hidden WHERE r.id=repo_id;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO repo_radar_private.catalog_admin_log(actor_id,repo_id,action,reason)
 VALUES ((SELECT auth.uid()),repo_id,CASE WHEN hidden THEN 'hide' ELSE 'restore' END,left(note,300));
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION repo_radar.admin_set_repo_hidden(bigint,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION repo_radar.admin_set_repo_hidden(bigint,boolean,text) TO authenticated;

-- Remove moderated entries consistently from search, facet counts and language options.
-- Fix catalog sort: popularity, most forked, recency, or least starred is primary.
-- Relevance is used only as a tie-breaker, rather than moving zero-star exact matches above popular results.
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
 where not r.is_fork and not r.is_archived and not r.admin_hidden
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


CREATE OR REPLACE FUNCTION repo_radar.list_repo_category_counts()
RETURNS TABLE(category text,total bigint)
LANGUAGE sql STABLE SET search_path=''
AS $fn$
 SELECT r.category,count(*)::bigint FROM repo_radar.repos r
 WHERE NOT r.is_fork AND NOT r.is_archived AND NOT r.admin_hidden
 GROUP BY r.category ORDER BY r.category;
$fn$;
CREATE OR REPLACE FUNCTION repo_radar.list_repo_languages()
RETURNS TABLE(language text)
LANGUAGE sql STABLE SET search_path=''
AS $fn$
 SELECT DISTINCT r.language FROM repo_radar.repos r
 WHERE r.language IS NOT NULL AND btrim(r.language)<>''
   AND NOT r.is_fork AND NOT r.is_archived AND NOT r.admin_hidden
 ORDER BY r.language;
$fn$;
