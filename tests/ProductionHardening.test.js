import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());

const read = (file) => readFileSync(resolve(root, file), 'utf8');

describe('production hardening safeguards', () => {
  it('configures baseline security headers for the deployed SPA', () => {
    const config = JSON.parse(read('vercel.json'));
    const headers = config.headers?.[0]?.headers ?? [];
    const values = Object.fromEntries(headers.map(({ key, value }) => [key, value]));

    expect(values['X-Content-Type-Options']).toBe('nosniff');
    expect(values['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(values['Strict-Transport-Security']).toContain('max-age=63072000');
    expect(values['X-Frame-Options']).toBe('SAMEORIGIN');
  });

  it('does not cache authenticated Supabase REST responses in the service worker', () => {
    const config = read('vite.config.js');
    expect(config).not.toContain('supabase-data-cache');
    expect(config).not.toContain("supabase\.co\\/rest\\/v1");
  });

  it('does not render raw AI HTML or production stack traces', () => {
    const app = read('src/App.jsx');
    const video = read('src/components/video/VideoRoom.jsx');

    expect(app).toContain('import.meta.env.DEV');
    expect(app).not.toContain('<pre>{this.state.error?.stack}</pre>');
    expect(video).not.toContain('dangerouslySetInnerHTML');
    expect(video).toContain('ReactMarkdown');
  });
});
