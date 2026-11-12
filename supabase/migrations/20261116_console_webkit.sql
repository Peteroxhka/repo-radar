-- Console WebKit requires both WebKit and an explicit console reference.
UPDATE repo_radar.repos AS r SET category='console_webkit'
WHERE NOT r.is_fork AND NOT r.is_archived
AND lower(concat_ws(' ',r.name,r.description,array_to_string(r.topics,' '))) ~ '(^|[^a-z0-9])web[ ._-]?kit([^a-z0-9]|$)'
AND lower(concat_ws(' ',r.name,r.description,array_to_string(r.topics,' '))) ~ '(^|[^a-z0-9])(ps3|ps4|ps5|playstation|ps[ ._-]?vita|wii[ ._-]?u|xbox|nintendo[ ._-]?switch)([^a-z0-9]|$)';
-- Only explicit, secure *.github.io URLs from saved GitHub repository metadata.
CREATE OR REPLACE FUNCTION repo_radar.list_catalog_sites(repo_ids bigint[])
RETURNS TABLE(id bigint, homepage text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $function$
 SELECT r.id,r.homepage FROM repo_radar.repos AS r
 WHERE r.id=ANY(coalesce(repo_ids,ARRAY[]::bigint[]))
 AND NOT r.is_fork AND NOT r.is_archived
 AND r.homepage ~* '^https://[a-z0-9-]+[.]github[.]io(/|$)';
$function$;
REVOKE ALL ON FUNCTION repo_radar.list_catalog_sites(bigint[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION repo_radar.list_catalog_sites(bigint[]) TO anon,authenticated;
