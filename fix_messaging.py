import os

path = 'C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivMessaging.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """    // Create a new direct room
        await (async () => {
      const _p = { room_type: 'direct', id: crypto.randomUUID(), company_id: companyId, created_by: currentUser.id };
      const _k = Object.keys(_p);
      const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      await powerSync.execute(`INSERT INTO chat_rooms (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v);
    })();
    const newRoom = { id: `room_${Math.random().toString(36).substr(2, 9)}` };"""

replacement = """    // Create a new direct room
    const roomId = crypto.randomUUID();
    await (async () => {
      const _p = { room_type: 'direct', id: roomId, company_id: companyId, created_by: currentUser.id };
      const _k = Object.keys(_p);
      const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
      await powerSync.execute(`INSERT INTO chat_rooms (${_k.join(',')}) VALUES (${_k.map(()=>'?').join(',')})`, _v);
    })();
    const newRoom = { id: roomId };"""

if target in text:
    text = text.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Fixed!')
else:
    print('Still not found. Trying another method...')
    
    # Just find "const newRoom = { id: `room_${Math.random()"
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if 'newRoom =' in line and 'Math.random' in line:
            lines[i] = "    // BUG FIX: reusing the UUID injected above is hard to parse, let's just do it directly."
            break
