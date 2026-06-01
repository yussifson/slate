-- 1. Enable Real-time for Chat Tables
begin;
  -- Remove them first just in case to avoid duplicates
  alter publication supabase_realtime drop table if exists chat_messages;
  alter publication supabase_realtime drop table if exists chat_rooms;
  alter publication supabase_realtime drop table if exists chat_participants;

  -- Add them to the realtime publication
  alter publication supabase_realtime add table chat_messages;
  alter publication supabase_realtime add table chat_rooms;
  alter publication supabase_realtime add table chat_participants;
commit;

-- 2. Add Message Management Columns
alter table chat_messages add column if not exists reply_to_id uuid references chat_messages(id);
alter table chat_messages add column if not exists reactions jsonb default '{}'::jsonb;
alter table chat_messages add column if not exists is_edited boolean default false;
