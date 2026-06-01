-- Create the chat_attachments bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('chat_attachments', 'chat_attachments', true)
on conflict (id) do update set public = true;

-- Allow public access to read files
create policy "Public Access" on storage.objects for select 
using ( bucket_id = 'chat_attachments' );

-- Allow authenticated users to upload files
create policy "Authenticated Users Upload" on storage.objects for insert 
with check ( bucket_id = 'chat_attachments' and auth.role() = 'authenticated' );

-- Allow users to update/delete their own files
create policy "Users Update Own Files" on storage.objects for update
using ( bucket_id = 'chat_attachments' and auth.uid() = owner );

create policy "Users Delete Own Files" on storage.objects for delete
using ( bucket_id = 'chat_attachments' and auth.uid() = owner );
