import { supabase } from './supabaseClient';
import { SCHEMA_COLUMNS } from './schemaColumns';
import { encryptText, decryptText } from '../lib/encryption';
import { powerSync } from './PowerSyncConnector';

const toSnakeCase = (str) => {
    if (str === 'User') return 'profiles';
    let name = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    if (!name.endsWith('s') && !name.endsWith('x')) {
        if (name.endsWith('y')) name = name.slice(0, -1) + 'ies';
        else name += 's';
    }
    return name;
};

// --- E2EE Configuration ---
const SENSITIVE_FIELDS = ['notes', 'description', 'details', 'outcome_summary', 'content', 'resolution_notes'];

const getPassphrase = () => {
    return localStorage.getItem('optalflow_e2ee_passphrase') || null;
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
        for (const field of SENSITIVE_FIELDS) {
            if (revealed[field] && typeof revealed[field] === 'string' && revealed[field].includes(':')) {
                try {
                    revealed[field] = await decryptText(revealed[field], passphrase);
                } catch (e) {
                    // Not encrypted or wrong passphrase
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

            const tableName = toSnakeCase(prop);

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

                        if (sort.length > 0) {
                            query += ' ORDER BY ';
                            query += sort.map(s => `${s.field} ${s.direction === 'asc' ? 'ASC' : 'DESC'}`).join(', ');
                        }

                        const data = await powerSync.getAll(query, params);
                        return revealResults(data);
                    } catch (err) {
                        console.error(`[PowerSync] Filter failed on ${tableName}:`, err);
                        return [];
                    }
                },
                list: async () => {
                    try {
                        const data = await powerSync.getAll(`SELECT * FROM ${tableName}`);
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
                        const validCols = SCHEMA_COLUMNS[tableName];
                        let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                        if (validCols) {
                            cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                        }

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
                        
                        return revealResults(securedPayload);
                    } catch (err) {
                        console.error(`[PowerSync] Create failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                update: async (id, payload) => {
                    try {
                        const validCols = SCHEMA_COLUMNS[tableName];
                        let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                        if (validCols) {
                            cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                        }

                        const securedPayload = await securePayload(cleanedPayload);
                        securedPayload.updated_date = new Date().toISOString();

                        const keys = Object.keys(securedPayload);
                        const assignments = keys.map(k => `${k} = ?`).join(', ');
                        const values = [...Object.values(securedPayload), id];

                        await powerSync.execute(`UPDATE ${tableName} SET ${assignments} WHERE id = ?`, values);
                        
                        const updatedData = await powerSync.getOptional(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
                        return revealResults(updatedData);
                    } catch (err) {
                        console.error(`[PowerSync] Update failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                delete: async (id) => {
                    try {
                        await powerSync.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
                        return { id };
                    } catch (err) {
                        console.error(`[PowerSync] Delete failed on ${tableName}:`, err);
                        throw err;
                    }
                },
                subscribe: (callback) => {
                    console.warn(`[PowerSync] Legacy subscribe called on ${tableName}. Consider migrating to watched queries.`);
                    return () => {};
                }
            };
        }
    })
};
