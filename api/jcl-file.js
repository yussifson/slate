import { get } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
    const pathname = req.query.pathname;
    if (!pathname || !pathname.startsWith('jcl/')) return res.status(400).json({ error: 'Invalid pathname' });
    const result = await get(pathname, { access: 'private', ifNoneMatch: req.headers['if-none-match'] });
    if (!result) return res.status(404).json({ error: 'Not found' });
    if (result.statusCode === 304) return res.status(304).setHeader('ETag', result.blob.etag).end();
    res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.setHeader('ETag', result.blob.etag);
    return result.stream.pipe(res);
  } catch (error) {
    console.error('[jcl-file]', error);
    return res.status(500).json({ error: 'File delivery failed' });
  }
}
