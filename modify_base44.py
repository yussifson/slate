import sys

def modify_base44():
    with open('src/api/base44Client.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add isNetworkError helper
    helper = '''// --- Offline Storage Cache Helpers (IndexedDB via idb-keyval) ---
const isNetworkError = (error) => {
    return !navigator.onLine || 
        error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error?.name === 'TypeError';
};
'''
    content = content.replace('// --- Offline Storage Cache Helpers (IndexedDB via idb-keyval) ---', helper)
    
    # 2. Modify create
    create_old = '''
                    if (!navigator.onLine) {
                        const tempId = crypto.randomUUID();
                        const record = { id: tempId, created_date: new Date().toISOString(), ...securedPayload };
                        
                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, [...cache, record]);

                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { id: tempId, type: 'create', tableName, payload: record }]);

                        return revealResults(record);
                    }

                    let res;
                    let retries = 5;
                    while (retries > 0) {
                        res = await supabase.from(tableName).insert(securedPayload).select().single();
                        if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204')) {
                            const match = res.error.message.match(/column \"?([^\"]+)\"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
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
'''
    create_new = '''
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
                                const match = res.error.message.match(/column \"?([^\"]+)\"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
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
'''
    content = content.replace(create_old.strip(), create_new.strip())

    # 3. Modify update
    update_old = '''
                    if (!navigator.onLine) {
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
                    }

                    let res;
                    let retries = 5;
                    while (retries > 0) {
                        res = await supabase.from(tableName).update(securedPayload).eq('id', id).select().single();
                        if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204')) {
                            const match = res.error.message.match(/column \"?([^\"]+)\"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
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
'''
    update_new = '''
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
                                const match = res.error.message.match(/column \"?([^\"]+)\"? of relation/i) || res.error.message.match(/Could not find the '([^']+)' column/);
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
'''
    content = content.replace(update_old.strip(), update_new.strip())

    # 4. Modify delete
    delete_old = '''
                    if (!navigator.onLine) {
                        const cache = await getLocalCache(tableName);
                        await setLocalCache(tableName, cache.filter(item => item.id !== id));

                        const outbox = await getOutbox();
                        await setOutbox([...outbox, { id, type: 'delete', tableName }]);

                        return { id };
                    }

                    const { data, error } = await supabase.from(tableName).delete().eq('id', id).select().single();
                    if (error) throw error;

                    const cache = await getLocalCache(tableName);
                    await setLocalCache(tableName, cache.filter(item => item.id !== id));

                    return revealResults(data);
'''
    delete_new = '''
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
'''
    content = content.replace(delete_old.strip(), delete_new.strip())

    with open('src/api/base44Client.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print('Modified base44Client.js')

modify_base44()
