-- Repo Radar community schema. Execute in Supabase SQL Editor before enabling chat.
-- In Settings > API > Exposed schemas include repo_radar. Do not expose service_role keys.
create schema if not exists repo_radar;
grant usage on schema repo_radar to authenticated;

create table if not exists repo_radar.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table repo_radar.profiles enable row level security;
grant select, insert, update on repo_radar.profiles to authenticated;
drop policy if exists "profiles select" on repo_radar.profiles;
create policy "profiles select" on repo_radar.profiles for select to authenticated using (true);
drop policy if exists "profiles insert own" on repo_radar.profiles;
create policy "profiles insert own" on repo_radar.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles update own" on repo_radar.profiles;
create policy "profiles update own" on repo_radar.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function repo_radar.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  desired_name text;
  fallback_name text;
begin
  fallback_name := 'u_' || substr(replace(new.id::text, '-', ''), 1, 20);
  desired_name := lower(coalesce(new.raw_user_meta_data->>'username',
                                 new.raw_user_meta_data->>'user_name', ''));
  if desired_name !~ '^[a-z0-9_]{3,24}$' then desired_name := fallback_name; end if;
  begin
    insert into repo_radar.profiles(id, username, avatar_url)
    values (new.id, desired_name, new.raw_user_meta_data->>'avatar_url')
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into repo_radar.profiles(id, username, avatar_url)
    values (new.id, fallback_name, new.raw_user_meta_data->>'avatar_url')
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;
drop trigger if exists repo_radar_on_auth_user_created on auth.users;
create trigger repo_radar_on_auth_user_created
after insert on auth.users for each row execute function repo_radar.create_profile_for_new_user();

insert into repo_radar.profiles(id, username, avatar_url)
select id,'u_' || substr(replace(id::text,'-',''),1,20),raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

create table if not exists repo_radar.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references repo_radar.profiles(id) on delete cascade,
  recipient_id uuid not null references repo_radar.profiles(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 4000),
  file_path text,
  file_name text check (file_name is null or char_length(file_name) <= 180),
  file_type text check (file_type is null or char_length(file_type) <= 128),
  file_size bigint check (file_size is null or file_size between 0 and 26214400),
  created_at timestamptz not null default now(),
  constraint dm_different_people check (sender_id <> recipient_id),
  constraint dm_has_content check (length(btrim(content)) > 0 or file_path is not null),
  constraint dm_attachment_metadata check (
    (file_path is null and file_name is null and file_type is null and file_size is null)
    or (file_path is not null and file_name is not null and file_size is not null)
  ),
  constraint dm_sender_file_path check (file_path is null or (
    split_part(file_path,'/',1) = sender_id::text
    and split_part(file_path,'/',2) = recipient_id::text
    and split_part(file_path,'/',3) <> ''
  ))
);
create index if not exists direct_messages_sender_date on repo_radar.direct_messages(sender_id, created_at desc);
create index if not exists direct_messages_recipient_date on repo_radar.direct_messages(recipient_id, created_at desc);
alter table repo_radar.direct_messages enable row level security;
grant select, insert on repo_radar.direct_messages to authenticated;
drop policy if exists "dm participants read" on repo_radar.direct_messages;
create policy "dm participants read" on repo_radar.direct_messages for select to authenticated
using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
drop policy if exists "dm sender insert" on repo_radar.direct_messages;
create policy "dm sender insert" on repo_radar.direct_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and recipient_id <> sender_id);

-- Restrict uploads to non-executable everyday media and documents.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('repo-radar-avatars','repo-radar-avatars',true,5242880,
 array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('repo-radar-dm','repo-radar-dm',false,26214400,
 array['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/heic',
 'video/mp4','video/webm','video/quicktime','video/x-m4v',
 'audio/mpeg','audio/ogg','audio/wav','audio/x-wav','audio/mp4','audio/aac','audio/flac',
 'application/pdf','text/plain','text/markdown','text/csv','application/json',
 'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
 'application/vnd.oasis.opendocument.text','application/vnd.oasis.opendocument.spreadsheet',
 'application/vnd.oasis.opendocument.presentation',
 'application/zip','application/x-zip-compressed','application/x-7z-compressed','application/vnd.rar',
 'application/x-rar-compressed','application/octet-stream'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "radar avatar upload own" on storage.objects;
create policy "radar avatar upload own" on storage.objects for insert to authenticated
with check (bucket_id='repo-radar-avatars'
 and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "radar avatar read" on storage.objects;
create policy "radar avatar read" on storage.objects for select
using (bucket_id='repo-radar-avatars');

drop policy if exists "radar dm upload sender" on storage.objects;
create policy "radar dm upload sender" on storage.objects for insert to authenticated
with check (bucket_id='repo-radar-dm'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
 and (storage.foldername(name))[3] is null
 and name !~* '\\.(exe|bat|cmd|sh|ps1|msi|js|html|svg|apk)$');

drop policy if exists "radar dm read participants" on storage.objects;
create policy "radar dm read participants" on storage.objects for select to authenticated
using (bucket_id='repo-radar-dm' and (
 (storage.foldername(name))[1]=(select auth.uid())::text
 or (storage.foldername(name))[2]=(select auth.uid())::text
 ));

-- Enable realtime updates; clients also poll every 12 seconds as a fallback.
do $$
begin
  alter publication supabase_realtime add table repo_radar.direct_messages;
exception when duplicate_object then null;
end $$;
