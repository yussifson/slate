import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
    const file = req.body?.file;
    if (!file || typeof file !== 'string') return res.status(400).json({ error: 'File is required' });
    const buffer = Buffer.from(file, 'base64');
    const contentType = req.body.contentType || 'application/octet-stream';
    if (buffer.length === 0 || buffer.length > MAX_FILE_SIZE || !allowedTypes.has(contentType)) return res.status(400).json({ error: 'Unsupported or oversized file' });
    const safeName = String(req.body.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
    const companyId = String(req.body.companyId || 'unscoped').replace(/[^a-zA-Z0-9_-]/g, '');
    const blob = await put(`jcl/${companyId}/${crypto.randomUUID()}-${safeName}`, buffer, { access: 'private', contentType, addRandomSuffix: false });
    return res.status(200).json({ pathname: blob.pathname, filename: safeName, contentType, size: buffer.length });
  } catch (error) {
    console.error('[jcl-upload]', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
