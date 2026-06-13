import { supabase } from './supabaseClient';
import { SCHEMA_COLUMNS } from './schemaColumns';
import { encryptText, decryptText } from '../lib/encryption';
import { powerSync } from './PowerSyncConnector';
import { syncQueue } from '../services/syncQueue';

const TABLE_MAP = {
    Company: 'companies',
    User: 'profiles',
    Profile: 'profiles',
    Client: 'clients',
    LegalCase: 'legal_cases',
    Hearing: 'hearings',
    Task: 'tasks',
    Invoice: 'invoices',
    Document: 'documents',
    StaffRecord: 'staff_records',
    IndustryRecord: 'industry_records',
    Notification: 'notifications',
    TimeEntry: 'time_entries'
};


const getTableName = (prop) => {
    if (TABLE_MAP[prop]) return TABLE_MAP[prop];

    // Fallback just in case
    let name = prop.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    if (!name.endsWith('s') && !name.endsWith('x')) {
        if (name.endsWith('y')) name = name.slice(0, -1) + 'ies';
        else name += 's';
    }
    return name;
};

const getValidCols = (tableName) => {
    return SCHEMA_COLUMNS[tableName];
};

// --- E2EE Configuration ---
const SENSITIVE_FIELDS = ['notes', 'description', 'details', 'outcome_summary', 'content', 'resolution_notes'];

const getPassphrase = () => {
    return localStorage.getItem('slate_e2ee_passphrase') || null;
};

const securePayload = async (payload) => {
    const passphrase = getPassphrase();
    if (!passphrase) return payload;

    const secured = { ...payload };
    for (const field of SENSITIVE_FIELDS) {
        if (secured[field] && typeof secured[field] === 'string') {
            try {
                secured[field] = await encryptText(secured[field], passphrase);
            } catch (e) {
                console.error(`Encryption failed for field ${field}`, e);
            }
        }
    }
    return secured;
};

const revealResults = async (data) => {
    const passphrase = getPassphrase();
    if (!passphrase) return data;
    if (!data) return data;

    const processItem = async (item) => {
        const revealed = { ...item };
        for (const [key, value] of Object.entries(revealed)) {
            if (typeof value === 'string') {
                if (SENSITIVE_FIELDS.includes(key) && value.includes(':')) {
                    try {
                        revealed[key] = await decryptText(value, passphrase);
                    } catch (e) {
                        // Not encrypted or wrong passphrase
                    }
                } else if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                    try {
                        revealed[key] = JSON.parse(value);
                    } catch (e) {
                        // Not valid JSON
                    }
                }
            }
        }
        return revealed;
    };

    if (Array.isArray(data)) {
        return Promise.all(data.map(processItem));
    }
    return processItem(data);
};

export const syncOfflineOutbox = async () => {
    console.log('[PowerSync] Native sync engine active. Ignoring manual outbox trigger.');
};

/** Push CRUD actions to syncQueue so data survives offline safely. */
async function mirrorToSupabase(tableName, record, operation = 'upsert') {
    if (!record) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const row = typeof record === 'string' ? null : { ...record };
    if (row && !row.created_by && user?.id) row.created_by = user.id;

    if (operation === 'upsert') {
        const isUpdate = !!row.updated_date; // Heuristic to know if it's PUT or POST
        const action = isUpdate ? 'PUT' : 'POST';
        await syncQueue.enqueue({ action, endpoint: tableName, payload: isUpdate ? { id: row.id, data: row } : row });
    } else if (operation === 'delete') {
        const id = typeof record === 'string' ? record : record.id;
        await syncQueue.enqueue({ action: 'DELETE', endpoint: tableName, payload: { id } });
    }
}

async function fetchFromSupabase(tableName, filter = {}, sort = []) {
    let query = supabase.from(tableName).select('*');
    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) query = query.in(key, value);
        else query = query.eq(key, value);
    }
    if (sort) {
        if (typeof sort === 'string') {
            const direction = sort.startsWith('-') ? { ascending: false } : { ascending: true };
            const field = sort.startsWith('-') ? sort.slice(1) : sort;
            query = query.order(field, direction);
        } else if (Array.isArray(sort) && sort.length > 0) {
            const s = sort[0];
            query = query.order(s.field, { ascending: s.direction === 'asc' });
        }
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export const base44 = {
    auth: {
        me: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw error || new Error("Not logged in");
            
            const { data: profile } = await powerSync.execute('SELECT * FROM profiles WHERE id = ?', [user.id]).then(res => ({ data: res.rows._array[0] || null, error: null }));
            return profile;
        },
        register: async ({ email, password, company_id, role }) => {
            const options = company_id
                ? { data: { company_id, role: role || 'lawyer' } }
                : {};
            const { data, error } = await supabase.auth.signUp({ email, password, options });
            if (error) throw error;
            return data;
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
        resetPassword: async (email) => {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            return data;
        },
        updatePassword: async (newPassword) => {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return data;
        }
    },
    getEntities: async (caseType, companyId) => {
        const records = await base44.entities.LegalCase.filter({
            case_type: caseType,
            company_id: companyId
        });
        return records.map(r => {
            let data = {};
            try { data = typeof r.notes === 'string' ? JSON.parse(r.notes) : (r.notes || {}); } catch(e) {}
            return { ...r, data };
        });
    },
    createEntity: async (payload) => {
        const { data, ...rest } = payload;
        const casePayload = { ...rest };
        if (data !== undefined) casePayload.notes = data ? JSON.stringify(data) : null;
        const result = await base44.entities.LegalCase.create(casePayload);
        let parsedData = {};
        try { parsedData = typeof result.notes === 'string' ? JSON.parse(result.notes) : (result.notes || {}); } catch(e) {}
        return { ...result, data: parsedData };
    },
    updateEntity: async (id, payload) => {
        const { data, ...rest } = payload;
        const casePayload = { ...rest };
        if (data !== undefined) casePayload.notes = data ? JSON.stringify(data) : null;
        const result = await base44.entities.LegalCase.update(id, casePayload);
        let parsedData = {};
        try { parsedData = typeof result.notes === 'string' ? JSON.parse(result.notes) : (result.notes || {}); } catch(e) {}
        return { ...result, data: parsedData };
    },
    deleteEntity: async (id) => {
        return await base44.entities.LegalCase.delete(id);
    },
    storage: {
        upload: async (bucket, path, file) => {
            if (!navigator.onLine) {
                console.warn(`[Offline Mode] Storage upload queued locally for ${path}`);
                // Simple offline stub for storage (doesn't sync automatically yet)
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const base64 = reader.result;
                        resolve({ path, fullPath: `${bucket}/${path}` });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

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
                console.log("Mock sending email:", payload);
                return { success: true };
            }
        }
    },
    entities: new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'raw') return supabase;
            if (prop === 'powerSync') return powerSync;

            const tableName = getTableName(prop);

            return {
                filter: async (filter = {}, sort = []) => {
                    try {
                        let query = `SELECT * FROM ${tableName}`;
                        const params = [];
                        
                        const entries = Object.entries(filter);
                        if (entries.length > 0) {
                            query += ' WHERE ';
                            query += entries.map(([k, v]) => {
                                params.push(v);
                                return `${k} = ?`;
                            }).join(' AND ');
                        }

                        if (sort) {
                            if (typeof sort === 'string') {
                                const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
                                const field = sort.startsWith('-') ? sort.slice(1) : sort;
                                query += ` ORDER BY ${field} ${direction}`;
                            } else if (Array.isArray(sort) && sort.length > 0) {
                                query += ' ORDER BY ';
                                query += sort.map(s => `${s.field} ${s.direction === 'asc' ? 'ASC' : 'DESC'}`).join(', ');
                            }
                        }

                        const data = await powerSync.getAll(query, params);
                        if (!navigator.onLine) {
                            return revealResults(data || []);
                        }
                        
                        // If online, fetch from remote and merge to prevent optimistic UI disappearance
                        try {
                            const remote = await fetchFromSupabase(tableName, filter, sort);
                            const localData = data || [];
                            const localIds = new Set(localData.map(d => d.id));
                            const merged = [...localData];
                            for (const r of remote) {
                                if (!localIds.has(r.id)) merged.push(r);
                            }
                            return revealResults(merged);
                        } catch (remoteErr) {
                            console.error(`[Supabase] Filter failed on ${tableName}:`, remoteErr);
                            return revealResults(data || []);
                        }
                    } catch (err) {
                        console.warn(`[PowerSync] Filter failed on ${tableName}, trying Supabase:`, err.message);
                        if (navigator.onLine) {
                            try {
                                const remote = await fetchFromSupabase(tableName, filter, sort);
                                return revealResults(remote);
                            } catch (remoteErr) {
                                console.error(`[Supabase] Fallback Filter failed on ${tableName}:`, remoteErr);
                            }
                        }
                        return [];
                    }
                },
                list: async (sort = []) => {
                    try {
                        let query = `SELECT * FROM ${tableName}`;
                        if (sort) {
                            if (typeof sort === 'string') {
                                const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
                                const field = sort.startsWith('-') ? sort.slice(1) : sort;
                                query += ` ORDER BY ${field} ${direction}`;
                            } else if (Array.isArray(sort) && sort.length > 0) {
                                query += ' ORDER BY ';
                                query += sort.map(s => `${s.field} ${s.direction === 'asc' ? 'ASC' : 'DESC'}`).join(', ');
                            }
                        }
                        const data = await powerSync.getAll(query);
                        return revealResults(data);
                    } catch (err) {
                        console.error(`[PowerSync] List failed on ${tableName}:`, err);
                        return [];
                    }
                },
                findUnique: async (queryObj) => {
                    try {
                        let query = `SELECT * FROM ${tableName} WHERE `;
                        const params = [];
                        query += Object.entries(queryObj.filter).map(([k, v]) => {
                            params.push(v);
                            return `${k} = ?`;
                        }).join(' AND ');
                        
                        const data = await powerSync.getOptional(query, params);
                        if (!data) throw new Error("Record not found locally");
                        return revealResults(data);
                    } catch (err) {
                        console.error(`[PowerSync] FindUnique failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                create: async (payload) => {
                    try {
                        const validCols = getValidCols(tableName);
                        let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                        if (validCols) {
                            cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                        }
                        // Serialize objects/arrays for SQLite text columns
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).map(([k, v]) => {
                            if (v !== null && typeof v === 'object') return [k, JSON.stringify(v)];
                            return [k, v];
                        }));

                        const securedPayload = await securePayload(cleanedPayload);
                        const tempId = crypto.randomUUID();
                        securedPayload.id = tempId;
                        if (!securedPayload.created_date) {
                            securedPayload.created_date = new Date().toISOString();
                        }

                        const keys = Object.keys(securedPayload);
                        const placeholders = keys.map(() => '?').join(', ');
                        const values = Object.values(securedPayload);

                        await powerSync.execute(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`, values);

                        await mirrorToSupabase(tableName, securedPayload, 'upsert');
                        
                        return revealResults(securedPayload);
                    } catch (err) {
                        console.error(`[PowerSync] Create failed on ${tableName}:`, err);
                        if (navigator.onLine) {
                            try {
                                const validCols = getValidCols(tableName);
                                let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                                if (validCols) {
                                    cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                                }
                                const securedPayload = await securePayload(cleanedPayload);
                                securedPayload.id = securedPayload.id || crypto.randomUUID();
                                if (!securedPayload.created_date) securedPayload.created_date = new Date().toISOString();
                                await mirrorToSupabase(tableName, securedPayload, 'upsert');
                                return revealResults(securedPayload);
                            } catch (mirrorErr) {
                                throw mirrorErr;
                            }
                        }
                        throw err;
                    }
                },
                update: async (id, payload) => {
                    try {
                        const validCols = getValidCols(tableName);
                        let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                        if (validCols) {
                            cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                        }
                        // Serialize objects/arrays for SQLite text columns
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).map(([k, v]) => {
                            if (v !== null && typeof v === 'object') return [k, JSON.stringify(v)];
                            return [k, v];
                        }));

                        const securedPayload = await securePayload(cleanedPayload);
                        securedPayload.updated_date = new Date().toISOString();

                        const keys = Object.keys(securedPayload);
                        const assignments = keys.map(k => `${k} = ?`).join(', ');
                        const values = [...Object.values(securedPayload), id];

                        await powerSync.execute(`UPDATE tableName SET ${assignments} WHERE id = ?`, values);

                        const updatedData = await powerSync.getOptional(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
                        if (updatedData) {
                            await mirrorToSupabase(tableName, updatedData, 'upsert');
                        }
                        return revealResults(updatedData);
                    } catch (err) {
                        console.error(`[PowerSync] Update failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                delete: async (id) => {
                    try {
                        await powerSync.execute(`DELETE FROM tableName WHERE id = ?`, [id]);
                        await mirrorToSupabase(tableName, id, 'delete');
                        return { id };
                    } catch (err) {
                        console.error(`[PowerSync] Delete failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                subscribe: (callback) => {
                    const channelId = `public:${tableName}-${Math.random().toString(36).substring(7)}`;
                    const channel = supabase.channel(channelId)
                        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
                            let type = 'update';
                            if (payload.eventType === 'INSERT') type = 'create';
                            if (payload.eventType === 'DELETE') type = 'delete';
                            callback({ type, data: payload.new || payload.old });
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
