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

// No longer needed: syncOfflineOutbox is handled natively by PowerSync
export const syncOfflineOutbox = async () => {
    // Legacy shim to prevent breaking external calls
    console.log('[PowerSync] Native sync engine active. Ignoring manual outbox trigger.');
};

export const base44 = {
    ...new Proxy({}, {
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
                        
                        // Fetch the updated record
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
                    // PowerSync natively handles watch queries, but to support the legacy 
                    // base44 channel listener, we just create a dummy interval polling or ignore
                    // because React Query invalidation usually handles updates.
                    // For true real-time, components should use usePowerSyncWatchedQuery.
                    console.warn(`[PowerSync] Legacy subscribe called on ${tableName}. Consider migrating to watched queries.`);
                    return () => {};
                }
            };
        }
    })
};
