-- Apply after community.sql. Existing messages and attachments are preserved.
create index if not exists dm_conversation_cursor_idx
on repo_radar.direct_messages(sender_id, recipient_id, created_at desc, id desc);

create or replace function repo_radar.list_dm_contacts(page_offset integer default 0, page_size integer default 100)
returns table(peer_id uuid, last_message_at timestamptz)
language sql stable security invoker set search_path = ''
as $$
  select case when m.sender_id = (select auth.uid()) then m.recipient_id else m.sender_id end as peer_id,
         max(m.created_at) as last_message_at
  from repo_radar.direct_messages m
  where m.sender_id = (select auth.uid()) or m.recipient_id = (select auth.uid())
  group by 1
  -- Stable peer ordering avoids skipped contacts if a new message arrives between pages.
  order by 1
  limit greatest(1, least(coalesce(page_size,100),100))
  offset greatest(0, coalesce(page_offset,0));
$$;
revoke all on function repo_radar.list_dm_contacts(integer,integer) from public, anon;
grant execute on function repo_radar.list_dm_contacts(integer,integer) to authenticated;

-- Only the uploader can clean up an attachment not referenced by a sent message.
drop policy if exists "radar dm delete unsent own" on storage.objects;
create policy "radar dm delete unsent own" on storage.objects
for delete to authenticated using (
  bucket_id = 'repo-radar-dm'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1 from repo_radar.direct_messages m where m.file_path = storage.objects.name
  )
);
notify pgrst, 'reload schema';
