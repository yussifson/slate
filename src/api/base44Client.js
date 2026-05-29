import { supabase } from './supabaseClient';
import { SCHEMA_COLUMNS } from './schemaColumns';
import { encryptText, decryptText } from '../lib/encryption';
import { get, set } from 'idb-keyval';

const toSnakeCase = (str) => {
    if (str === 'User') return 'profiles';
    let name = str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
    if (!name.endsWith('s') && !name.endsWith('x')) {
        if (name.endsWith('y')) name = name.slice(0, -1) + 'ies';
        else name += 's';
    }
    return name;
};

// --- E2EE Configuration & Passphrase Accessor ---
const SENSITIVE_FIELDS = ['notes', 'description', 'details', 'outcome_summary', 'content', 'resolution_notes'];

const getPassphrase = () => {
    try {
        return localStorage.getItem('base44_e2ee_passphrase') || null;
    } catch (e) {
        return null;
    }
};

// Cryptographic Hook: Intercept & Encrypt Outgoing Write Payload
const securePayload = async (payload) => {
    const passphrase = getPassphrase();
    if (!passphrase || !payload) return payload;
    const secured = { ...payload };
    for (const field of SENSITIVE_FIELDS) {
        if (secured[field] && typeof secured[field] === 'string') {
            secured[field] = await encryptText(secured[field], passphrase);
        }
    }
    return secured;
};

// Cryptographic Hook: Intercept & Decrypt Incoming Read Results
const revealResults = async (data) => {
    const passphrase = getPassphrase();
    if (!passphrase || !data) return data;
    const revealItem = async (item) => {
        const revealed = { ...item };
        for (const field of SENSITIVE_FIELDS) {
            if (revealed[field] && typeof revealed[field] === 'string') {
                revealed[field] = await decryptText(revealed[field], passphrase);
            }
        }
        return revealed;
    };

    if (Array.isArray(data)) {
        return Promise.all(data.map(revealItem));
    }
    return revealItem(data);
};

// --- Offline Storage Cache Helpers (IndexedDB via idb-keyval) ---
const isNetworkError = (error) => {
    return !navigator.onLine || 
        error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error?.message?.includes('ERR_NETWORK_CHANGED') ||
        error?.message?.includes('Request timeout') ||
        error?.name === 'TypeError' ||
        error?.name === 'AuthRetryableFetchError';
};

const getLocalCache = async (tableName) => {
    try {
        const val = await get(`base44_cache_${tableName}`);
        return val ? val : [];
    } catch (e) {
        console.error("LocalCache Read Error:", e);
        return [];
    }
};

const setLocalCache = async (tableName, data) => {
    try {
        await set(`base44_cache_${tableName}`, data);
    } catch (e) {
        console.error("LocalCache Write Error:", e);
    }
};

const getOutbox = async () => {
    try {
        const val = await get('base44_offline_outbox');
        return val ? val : [];
    } catch (e) {
        return [];
    }
};

const setOutbox = async (outbox) => {
    try {
        await set('base44_offline_outbox', outbox);
    } catch (e) {}
};

// Automatic Background Sync Engine
export const syncOfflineOutbox = async () => {
    if (!navigator.onLine) return;
    const outbox = await getOutbox();
    if (outbox.length === 0) return;

    console.log(`[Offline Sync] Found ${outbox.length} queued mutations. Commencing synchronization...`);
    const remaining = [];

    for (const item of outbox) {
        try {
            const { type, tableName, id, payload } = item;
            if (type === 'create') {
                await supabase.from(tableName).insert(payload);
            } else if (type === 'update') {
                await supabase.from(tableName).update(payload).eq('id', id);
            } else if (type === 'delete') {
                await supabase.from(tableName).delete().eq('id', id);
            } else if (type === 'upload') {
                const res = await fetch(payload);
                const blob = await res.blob();
                await supabase.storage.from(item.bucket).upload(item.path, blob);
            }
            console.log(`[Offline Sync] Synchronized ${type} mutation successfully.`);
        } catch (err) {
            console.error(`[Offline Sync] Mutation failed. Re-queueing.`, err);
            remaining.push(item);
        }
    }

    await setOutbox(remaining);

    if (remaining.length === 0) {
        console.log("[Offline Sync] Synchronized all offline operations successfully.");
        window.dispatchEvent(new CustomEvent('base44_sync_complete'));
    }
};

// Hook background listeners
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        syncOfflineOutbox();
    });
    // Run initial sync check
    setTimeout(syncOfflineOutbox, 1500);
}

// Custom adapter mimicking base44/sdk using supabase with Offline-First architecture
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
            console.log(`Invited user: ${email} with role: ${role}`);
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
            if (!navigator.onLine) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64data = reader.result;
                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { type: 'upload', bucket, path, payload: base64data }]);
                        
                        // Fake return data matching supabase signature
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
    mergeWithOutbox: async (tableName, serverData) => {
        const outbox = await getOutbox();
        const pendingCreates = outbox.filter(item => item.tableName === tableName && item.type === 'create').map(i => i.payload);
        const pendingUpdates = outbox.filter(item => item.tableName === tableName && item.type === 'update');
        const pendingDeletes = outbox.filter(item => item.tableName === tableName && item.type === 'delete').map(i => i.id);

        let mergedData = Array.isArray(serverData) ? [...serverData] : (serverData ? [serverData] : []);
        
        mergedData = mergedData.filter(d => !pendingDeletes.includes(d.id));

        for (const update of pendingUpdates) {
            const idx = mergedData.findIndex(d => d.id === update.id);
            if (idx >= 0) mergedData[idx] = { ...mergedData[idx], ...update.payload };
        }

        for (const create of pendingCreates) {
            const idx = mergedData.findIndex(d => d.id === create.id);
            if (idx >= 0) mergedData[idx] = create;
            else mergedData.push(create);
        }

        return Array.isArray(serverData) ? mergedData : (mergedData[0] || null);
    },
    entities: new Proxy({}, {
        get: (target, entityName) => {
            if (typeof entityName !== 'string') return undefined;
            if (entityName === 'then') return undefined;
            const tableName = toSnakeCase(entityName);
            
            return {
                filter: async (filter = {}, sort = []) => {
                    let data = [];
                    if (!navigator.onLine) {
                        data = await getLocalCache(tableName);
                    } else {
                        try {
                            let req = supabase.from(tableName).select('*');
                            for (const [k, v] of Object.entries(filter)) {
                                req = req.eq(k, v);
                            }
                            for (const s of sort) {
                                req = req.order(s.field, { ascending: s.direction === 'asc' });
                            }
                            const res = await req;
                            if (res.error) throw res.error;
                            let serverData = res.data || [];
                            data = await base44Client.mergeWithOutbox(tableName, serverData);
                            await setLocalCache(tableName, data);
                        } catch (err) {
                            console.warn(`[Offline Mode] Filter failed, falling back to local cache.`, err);
                            data = await getLocalCache(tableName);
                        }
                    }

                    // Perform clientside filter & sort on cached records
                    let filtered = [...data];
                    for (const [k, v] of Object.entries(filter)) {
                        filtered = filtered.filter(item => item[k] == v);
                    }
                    for (const s of sort) {
                        filtered.sort((a, b) => {
                            let valA = a[s.field];
                            let valB = b[s.field];
                            if (valA === undefined || valB === undefined) return 0;
                            if (typeof valA === 'string') {
                                return s.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                            }
                            return s.direction === 'asc' ? valA - valB : valB - valA;
                        });
                    }
                    return revealResults(filtered);
                },
                list: async () => {
                    let data = [];
                    if (!navigator.onLine) {
                        data = await getLocalCache(tableName);
                        return revealResults(data);
                    }
                    try {
                        const res = await supabase.from(tableName).select('*');
                        if (res.error) throw res.error;
                        let serverData = res.data || [];
                        data = await base44Client.mergeWithOutbox(tableName, serverData);
                        await setLocalCache(tableName, data);
                    } catch (err) {
                        console.warn(`[Offline Mode] List failed, using local cache.`, err);
                        data = await getLocalCache(tableName);
                    }
                    return revealResults(data);
                },
                findUnique: async (query) => {
                    if (navigator.onLine) {
                        try {
                            let req = supabase.from(tableName).select('*');
                            for (const [k, v] of Object.entries(query.filter)) {
                                req = req.eq(k, v);
                            }
                            const { data, error } = await req.single();
                            if (error) throw error;
                            const mergedData = await base44Client.mergeWithOutbox(tableName, data);
                            return revealResults(mergedData);
                        } catch (err) {
                            console.warn(`[Offline Mode] FindUnique failed, falling back to cache.`, err);
                        }
                    }
                    const cached = await getLocalCache(tableName);
                    const record = cached.find(item => {
                        return Object.entries(query.filter).every(([k, v]) => item[k] == v);
                    });
                    if (!record) throw new Error("Record not found offline");
                    return revealResults(record);
                },
                create: async (payload) => {
                    const validCols = SCHEMA_COLUMNS[tableName];
                    let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                    if (validCols) {
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                    }

                    // Encrypt sensitive fields
                    const securedPayload = await securePayload(cleanedPayload);

                    const performOfflineCreate = async () => {
                        const tempId = crypto.randomUUID();
                        const record = { id: tempId, created_date: new Date().toISOString(), ...securedPayload };
                        
                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, [...cache, record]);

                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { id: tempId, type: 'create', tableName, payload: record }]);

                        return revealResults(record);
                    };

                    if (!navigator.onLine) {
                        return performOfflineCreate();
                    }

                    try {
                        let res;
                        let retries = 5;
                        while (retries > 0) {
                            res = await supabase.from(tableName).insert(securedPayload).select().single();
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

                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, [...cache.filter(c => c.id !== res.data.id), res.data]);

                        return revealResults(res.data);
                    } catch (err) {
                        if (isNetworkError(err)) {
                            console.warn(`[Offline Mode] Create failed, queuing offline mutation.`, err);
                            return performOfflineCreate();
                        }
                        throw err;
                    }
                },
                update: async (id, payload) => {
                    const validCols = SCHEMA_COLUMNS[tableName];
                    let cleanedPayload = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === "" ? null : v]));
                    if (validCols) {
                        cleanedPayload = Object.fromEntries(Object.entries(cleanedPayload).filter(([k]) => validCols.includes(k)));
                    }

                    // Encrypt sensitive fields
                    const securedPayload = await securePayload(cleanedPayload);

                    const performOfflineUpdate = async () => {
                        const cache = await getLocalCache(tableName);
                        const recordIndex = cache.findIndex(item => item.id === id);
                        let updatedRecord = { id };
                        if (recordIndex !== -1) {
                            updatedRecord = { ...cache[recordIndex], ...securedPayload };
                            cache[recordIndex] = updatedRecord;
                            await setLocalCache(tableName, cache);
                        }

                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { id, type: 'update', tableName, payload: securedPayload }]);

                        return revealResults(updatedRecord);
                    };

                    if (!navigator.onLine) {
                        return performOfflineUpdate();
                    }

                    try {
                        let res;
                        let retries = 5;
                        while (retries > 0) {
                            res = await supabase.from(tableName).update(securedPayload).eq('id', id).select().single();
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

                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, cache.map(item => item.id === id ? res.data : item));

                        return revealResults(res.data);
                    } catch (err) {
                        if (isNetworkError(err)) {
                            console.warn(`[Offline Mode] Update failed, queuing offline mutation.`, err);
                            return performOfflineUpdate();
                        }
                        throw err;
                    }
                },
                delete: async (id) => {
                    const performOfflineDelete = async () => {
                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, cache.filter(item => item.id !== id));

                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { id, type: 'delete', tableName }]);

                        return { id };
                    };

                    if (!navigator.onLine) {
                        return performOfflineDelete();
                    }

                    try {
                        const { data, error } = await supabase.from(tableName).delete().eq('id', id).select().single();
                        if (error) throw error;

                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, cache.filter(item => item.id !== id));

                        return revealResults(data);
                    } catch (err) {
                        if (isNetworkError(err)) {
                            console.warn(`[Offline Mode] Delete failed, queuing offline mutation.`, err);
                            return performOfflineDelete();
                        }
                        throw err;
                    }
                },
                subscribe: (callback) => {
                    if (!navigator.onLine) return () => {};
                    const channel = supabase.channel(`public:${tableName}`)
                        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
                            let type = payload.eventType.toLowerCase();
                            if (type === 'insert') type = 'create';
                            const data = payload.new || payload.old;
                            revealResults(data).then(decryptedData => {
                                callback({ type, data: decryptedData });
                            });
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
