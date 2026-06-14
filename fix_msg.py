with open('C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivMessaging.jsx', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i, line in enumerate(lines):
    if "room_type: 'direct'" in line and 'crypto.randomUUID()' in line:
        lines[i] = "      const _p = { room_type: 'direct', id: crypto.randomUUID(), company_id: companyId, created_by: currentUser.id }; window.__tmpRoomId = _p.id;"
    if 'newRoom =' in line and 'Math.random' in line:
        lines[i] = "    const newRoom = { id: window.__tmpRoomId };"

with open('C:/Users/USER/OneDrive/Documents/airflake/src/components/universal/UnivMessaging.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Fixed messaging logic via simple injection.')
