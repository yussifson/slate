import re
import sys
import glob

def refactor(file):
    with open(file, 'r', encoding='utf-8') as f:
        text = f.read()

    orig = text

    # Insert: await supabase.from('...').insert(...)
    # Because there might be newlines, we can use \s*
    text = re.sub(
        r"await\s+supabase\s*\.from\('([^']+)'\)\s*\.insert\(([\s\S]*?)\)(?=;|\n|\.select|\.then)",
        r"""await (async () => {
      const _payload = Array.isArray(\2) ? \2[0] : \2;
      const _keys = Object.keys(_payload);
      const _vals = _keys.map(k => '?').join(', ');
      return db.execute(`INSERT INTO \1 (${_keys.join(', ')}) VALUES (${_vals})`, _keys.map(k => _payload[k]))
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )

    # Update: await supabase.from('...').update(...).eq('...', ...)
    text = re.sub(
        r"await\s+supabase\s*\.from\('([^']+)'\)\s*\.update\(([\s\S]*?)\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|\.select|\.then)",
        r"""await (async () => {
      const _payload = \2;
      const _keys = Object.keys(_payload);
      const _setClause = _keys.map(k => `${k} = ?`).join(', ');
      return db.execute(`UPDATE \1 SET ${_setClause} WHERE \3 = ?`, [..._keys.map(k => _payload[k]), \4])
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )

    # Delete: await supabase.from('...').delete().eq('...', ...)
    text = re.sub(
        r"await\s+supabase\s*\.from\('([^']+)'\)\s*\.delete\(\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|\.select|\.then)",
        r"await db.execute(`DELETE FROM \1 WHERE \2 = ?`, [\3]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))",
        text
    )
    
    # Also handle the cases where there is NO await, like in ternary operators:
    # supabase.from(TABLE).update(payload).eq('id', editId) : await supabase.from(TABLE).insert(payload)
    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\('([^']+)'\)\s*\.update\(([\s\S]*?)\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|:|\.select|\.then)",
        r"""db.execute(`UPDATE \1 SET ${Object.keys(\2).map(k => `${k} = ?`).join(', ')} WHERE \3 = ?`, [...Object.keys(\2).map(k => \2[k]), \4]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))""",
        text
    )

    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\('([^']+)'\)\s*\.insert\(([\s\S]*?)\)(?=;|\n|:|\.select|\.then)",
        r"""(async () => {
      const _payload = Array.isArray(\2) ? \2[0] : \2;
      const _keys = Object.keys(_payload);
      const _vals = _keys.map(k => '?').join(', ');
      return db.execute(`INSERT INTO \1 (${_keys.join(', ')}) VALUES (${_vals})`, _keys.map(k => _payload[k]))
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )

    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\('([^']+)'\)\s*\.delete\(\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|:|\.select|\.then)",
        r"db.execute(`DELETE FROM \1 WHERE \2 = ?`, [\3]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))",
        text
    )
    
    # UnivOrderRegistry, etc. uses supabase.from(TABLE). It's a variable!
    # Fix variables in supabase.from(TABLE) instead of supabase.from('table')
    text = re.sub(
        r"await\s+supabase\s*\.from\(([^)]+)\)\s*\.update\(([\s\S]*?)\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|\.select|\.then)",
        r"""await (async () => {
      const _payload = \2;
      const _keys = Object.keys(_payload);
      const _setClause = _keys.map(k => `${k} = ?`).join(', ');
      return db.execute(`UPDATE ${\1} SET ${_setClause} WHERE \3 = ?`, [..._keys.map(k => _payload[k]), \4])
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )
    
    text = re.sub(
        r"await\s+supabase\s*\.from\(([^)]+)\)\s*\.insert\(([\s\S]*?)\)(?=;|\n|\.select|\.then)",
        r"""await (async () => {
      const _payload = Array.isArray(\2) ? \2[0] : \2;
      const _keys = Object.keys(_payload);
      const _vals = _keys.map(k => '?').join(', ');
      return db.execute(`INSERT INTO ${\1} (${_keys.join(', ')}) VALUES (${_vals})`, _keys.map(k => _payload[k]))
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )
    
    text = re.sub(
        r"await\s+supabase\s*\.from\(([^)]+)\)\s*\.delete\(\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|\.select|\.then)",
        r"await db.execute(`DELETE FROM ${\1} WHERE \2 = ?`, [\3]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))",
        text
    )
    
    # non-await with variables
    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\(([^)]+)\)\s*\.update\(([\s\S]*?)\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|:|\.select|\.then)",
        r"""db.execute(`UPDATE ${\1} SET ${Object.keys(\2).map(k => `${k} = ?`).join(', ')} WHERE \3 = ?`, [...Object.keys(\2).map(k => \2[k]), \4]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))""",
        text
    )

    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\(([^)]+)\)\s*\.insert\(([\s\S]*?)\)(?=;|\n|:|\.select|\.then)",
        r"""(async () => {
      const _payload = Array.isArray(\2) ? \2[0] : \2;
      const _keys = Object.keys(_payload);
      const _vals = _keys.map(k => '?').join(', ');
      return db.execute(`INSERT INTO ${\1} (${_keys.join(', ')}) VALUES (${_vals})`, _keys.map(k => _payload[k]))
        .then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }));
    })()""",
        text
    )

    text = re.sub(
        r"(?<!await\s)supabase\s*\.from\(([^)]+)\)\s*\.delete\(\)\s*\.eq\('([^']+)',\s*([^)]+)\)(?=;|\n|:|\.select|\.then)",
        r"db.execute(`DELETE FROM ${\1} WHERE \2 = ?`, [\3]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ error }))",
        text
    )

    # Some variables selects like supabase.from(TABLE).select('*')...
    text = re.sub(
        r"(?:await\s+)?supabase\s*\.from\(([^)]+)\)\s*\.select\('\*'\)\s*\.eq\('company_id',\s*companyId\)\s*\.order\('created_at',\s*\{\s*ascending:\s*false\s*\}\)(?=;|\n)",
        r"await db.execute(`SELECT * FROM ${\1} WHERE company_id = ? ORDER BY created_at DESC`, [companyId]).then(res => ({ data: res.rows._array, error: null })).catch(error => ({ data: null, error }))",
        text
    )

    # Specific missing ones:
    text = text.replace("supabase.from('univ_parent_portal_access').select('*').eq('company_id', companyId).order('parent_name', { ascending: true })", "db.execute(`SELECT * FROM univ_parent_portal_access WHERE company_id = ? ORDER BY parent_name ASC`, [companyId]).then(res => ({ data: res.rows._array, error: null }))")
    text = text.replace("supabase.from('univ_students').select('id, first_name, last_name').eq('company_id', companyId)", "db.execute(`SELECT id, first_name, last_name FROM univ_students WHERE company_id = ?`, [companyId]).then(res => ({ data: res.rows._array, error: null }))")

    if text != orig:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(text)

for f in sys.argv[1:]:
    refactor(f)
