import { supabase } from '@/api/supabaseClient';

const tables = {
  members: 'ops_project_members',
  messages: 'ops_project_messages',
  reactions: 'ops_project_message_reactions',
  mentions: 'ops_project_message_mentions',
  risks: 'ops_project_risks',
  milestones: 'ops_project_milestones',
  activity: 'ops_project_activity',
};

const read = (table, companyId, projectId) => {
  let query = supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return projectId && projectId !== 'all' ? query.eq('project_id', projectId) : query;
};

export const JCLProjectCollaborationService = {
  async load(companyId, projectId) {
    if (!companyId) return { members: [], messages: [], reactions: [], mentions: [], risks: [], milestones: [], activity: [] };
    const entries = await Promise.all(Object.entries(tables).map(async ([key, table]) => {
      const { data, error } = await read(table, companyId, projectId);
      if (error) throw error;
      return [key, data || []];
    }));
    return Object.fromEntries(entries);
  },
  async create(table, companyId, payload) {
    const { data, error } = await supabase.from(table).insert({ ...payload, company_id: companyId }).select().single();
    if (error) throw error;
    return data;
  },
  async toggleReaction(companyId, messageId, userId, reaction) {
    const query = supabase.from(tables.reactions).select('id').eq('company_id', companyId).eq('message_id', messageId).eq('user_id', userId).eq('reaction', reaction).maybeSingle();
    const { data: existing, error: readError } = await query;
    if (readError) throw readError;
    if (existing) {
      const { error } = await supabase.from(tables.reactions).delete().eq('id', existing.id);
      if (error) throw error;
      return null;
    }
    return this.create(tables.reactions, companyId, { message_id: messageId, user_id: userId, reaction });
  },
};
