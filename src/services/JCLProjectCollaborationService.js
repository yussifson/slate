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

const getFallbackStore = (companyId, table) => {
  try {
    const key = `jcl_collab_fallback_${companyId}_${table}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const setFallbackStore = (companyId, table, items) => {
  try {
    const key = `jcl_collab_fallback_${companyId}_${table}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (_) {}
};

const read = (table, companyId, projectId) => {
  let query = supabase.from(table).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return projectId && projectId !== 'all' ? query.eq('project_id', projectId) : query;
};

export const JCLProjectCollaborationService = {
  async load(companyId, projectId) {
    if (!companyId) return { members: [], messages: [], reactions: [], mentions: [], risks: [], milestones: [], activity: [] };
    const entries = await Promise.all(Object.entries(tables).map(async ([key, table]) => {
      try {
        const { data, error } = await read(table, companyId, projectId);
        if (error) {
          const fallback = getFallbackStore(companyId, table);
          return [key, projectId && projectId !== 'all' ? fallback.filter(x => x.project_id === projectId) : fallback];
        }
        const fallback = getFallbackStore(companyId, table);
        const combined = [...(data || [])];
        fallback.forEach(item => {
          if (!combined.some(c => c.id === item.id)) {
            if (!projectId || projectId === 'all' || item.project_id === projectId) {
              combined.push(item);
            }
          }
        });
        return [key, combined];
      } catch (err) {
        const fallback = getFallbackStore(companyId, table);
        return [key, projectId && projectId !== 'all' ? fallback.filter(x => x.project_id === projectId) : fallback];
      }
    }));
    return Object.fromEntries(entries);
  },

  async create(table, companyId, payload) {
    const recordId = payload.id || crypto.randomUUID();
    const record = {
      ...payload,
      id: recordId,
      company_id: companyId,
      created_at: payload.created_at || new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from(table).insert(record).select().maybeSingle();
      if (error) {
        console.warn(`[JCLProjectCollaborationService] Remote insert for ${table} failed:`, error.message);
        const existing = getFallbackStore(companyId, table);
        setFallbackStore(companyId, table, [record, ...existing]);
        return record;
      }
      return data || record;
    } catch (err) {
      const existing = getFallbackStore(companyId, table);
      setFallbackStore(companyId, table, [record, ...existing]);
      return record;
    }
  },

  async toggleReaction(companyId, messageId, userId, reaction) {
    try {
      const query = supabase.from(tables.reactions).select('id').eq('company_id', companyId).eq('message_id', messageId).eq('user_id', userId).eq('reaction', reaction).maybeSingle();
      const { data: existing } = await query;
      if (existing) {
        await supabase.from(tables.reactions).delete().eq('id', existing.id);
        return null;
      }
    } catch (_) {}
    return this.create(tables.reactions, companyId, { message_id: messageId, user_id: userId, reaction });
  },
};
