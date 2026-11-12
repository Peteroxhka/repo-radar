-- Run after 20261113_chat_reliability.sql. Existing messages and files are untouched.
-- Harden uploads server-side: do not rely on browser filename/MIME validation.
-- Allow only non-executable extensions and known MIME types.
update storage.buckets
set allowed_mime_types=array_remove(allowed_mime_types,'application/octet-stream')
where id='repo-radar-dm' and allowed_mime_types is not null;

drop policy if exists "radar dm upload sender" on storage.objects;
create policy "radar dm upload sender" on storage.objects
for insert to authenticated with check (
  bucket_id='repo-radar-dm'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and array_length(storage.foldername(name),1)=2
  and lower(storage.extension(name)) = any(array[
    'jpg','jpeg','png','webp','gif','bmp','heic','mp4','webm','mov','m4v',
    'mp3','ogg','wav','m4a','aac','flac','pdf','txt','md','csv','json',
    'doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','zip','7z','rar'
  ])
);

-- Senders may access their own unsent files for failed-upload cleanup.
-- Receivers can only read attachments actually referenced by a message to them.
drop policy if exists "radar dm read participants" on storage.objects;
create policy "radar dm read participants" on storage.objects
for select to authenticated using (
  bucket_id='repo-radar-dm'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (
      (storage.foldername(name))[2] = (select auth.uid())::text
      and exists (
        select 1 from repo_radar.direct_messages m
        where m.file_path=storage.objects.name
          and m.recipient_id=(select auth.uid())
      )
    )
  )
);
