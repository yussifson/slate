-- 1. Enable Real-time for Chat Tables
begin;
  -- Try to add the tables to the real-time publication. 
  -- (If they are already added, you can safely ignore any errors about them already existing)
  alter publication supabase_realtime add table chat_messages;
  alter publication supabase_realtime add table chat_rooms;
  alter publication supabase_realtime add table chat_participants;
commit;

-- 2. Add Message Management Columns
alter table chat_messages add column if not exists reply_to_id uuid references chat_messages(id);
alter table chat_messages add column if not exists reactions jsonb default '{}'::jsonb;
alter table chat_messages add column if not exists is_edited boolean default false;
