import { supabase } from './supabaseClient';
import { SCHEMA_COLUMNS } from './schemaColumns';

const toSnakeCase = (str) => {
    if (str === 'User') return 'profiles';
    let name = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    if (!name.endsWith('s') && !name.endsWith('x')) {
        if (name.endsWith('y')) name = name.slice(0, -1) + 'ies';
        else name += 's';
    }
    return name;
};

// Custom adapter mimicking base44/sdk using supabase
export const base44 = {
    auth: {
        me: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw error || new Error("Not logged in");
            
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return profile;
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },
        signOut: async () => {
            await supabase.auth.signOut();
        },
        logout: async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
        },
        resetPasswordForEmail: async (email) => {
             const { error } = await supabase.auth.resetPasswordForEmail(email);
             if (error) throw error;
        },
        updateUser: async (attributes) => {
            const { data, error } = await supabase.auth.updateUser(attributes);
            if (error) throw error;
            return data;
        },
        register: async ({ email, password }) => {
            // Bypass the supabase-js client to prevent it from auto-logging out the admin
            // when creating a new team member account.
            const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            if (!res.ok) {
                console.error("Signup Error:", data);
                throw new Error(data.msg || data.message || "Failed to create account");
            }
            return data;
        }
    },
    users: {
        inviteUser: async (email, role) => {
            // Invited user: ${email} with role: ${role}
            return { email, role };
        }
    },
    functions: {
        invoke: async (functionName, payload) => {
            const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
            if (error) throw error;
            return data;
        }
    },
    storage: {
        upload: async (bucket, path, file) => {
            const { data, error } = await supabase.storage.from(bucket).upload(path, file);
            if (error) throw error;
            return data;
        },
        getPublicUrl: (bucket, path) => {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            return data.publicUrl;
        }
    },
    integrations: {
        Core: {
            SendEmail: async (payload) => {
                // Mock sending email
                return { success: true };
            }
        }
    },
    entities: new Proxy({}, {
        get: (target, entityName) => {
            if (typeof entityName !== 'string') return undefined;
            if (entityName === 'then') return undefined;
            const tableName = toSnakeCase(entityName);
            
            return {
                filter: async (filter = {}, sort = []) => {
                    let req = supabase.from(tableName).select('*');
                    for (const [k, v] of Object.entries(filter)) {
                        req = req.eq(k, v);
                    }
                    for (const s of sort) {
                        req = req.order(s.field, { ascending: s.direction === 'asc' });
                    }
                    const { data, error } = await req;
                    if (error) throw error;
                    return data;
                },
                list: async () => {
                    const { data, error } = await supabase.from(tableName).select('*');
                    if (error) throw error;
                    return data;
                },
                findUnique: async (query) => {
                    let req = supabase.from(tableName).select('*');
                    for (const [k, v] of Object.entries(query.filter)) {
                        req = req.eq(k, v);
                    }
                    const { data, error } = await req.single();
                    if (error) throw error;
                    return data;
                },
                create: async (payload) => {
                    const validCols = SCHEMA_COLUMNS[tableName];
                    let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                    if (validCols) {
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                    }
                    let res;
                    let retries = 5;
                    while (retries > 0) {
                        res = await supabase.from(tableName).insert(cleanedPayload).select().single();
                        if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204')) {
                            const match = res.error.message.match(/column "?([^"]+)"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
                            if (match && match[1]) {
                                delete cleanedPayload[match[1]];
                                retries--;
                                continue;
                            }
                        }
                        break;
                    }
                    if (res.error) throw res.error;
                    return res.data;
                },
                update: async (id, payload) => {
                    const validCols = SCHEMA_COLUMNS[tableName];
                    let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                    if (validCols) {
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                    }
                    let res;
                    let retries = 5;
                    while (retries > 0) {
                        res = await supabase.from(tableName).update(cleanedPayload).eq('id', id).select().single();
                        // 42703 is the Postgres error code for undefined_column
                        if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204')) {
                            // Extract column name from error message (e.g., "column logo_light_url of relation companies does not exist")
                            const match = res.error.message.match(/column "?([^"]+)"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
                            if (match && match[1]) {
                                delete cleanedPayload[match[1]];
                                retries--;
                                continue;
                            }
                        }
                        break;
                    }
                    if (res.error) throw res.error;
                    return res.data;
                },
                delete: async (id) => {
                    const { data, error } = await supabase.from(tableName).delete().eq('id', id).select().single();
                    if (error) throw error;
                    return data;
                },
                subscribe: (callback) => {
                    const channel = supabase.channel(`public:${tableName}`)
                        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
                            let type = payload.eventType.toLowerCase();
                            if (type === 'insert') type = 'create';
                            const data = payload.new || payload.old;
                            callback({ type, data });
                        })
                        .subscribe();
                    
                    return () => {
                        supabase.removeChannel(channel);
                    };
                }
            };
        }
    })
};
