import { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby4IEYEAPeR8TqD54TjuZ4jIGxAEeJN3U-KJenLNkk7g_Wq1ui2nweS0MHM_x4kCU5D/exec';

const GET_TIMEOUT_MS = 25_000;
const POST_TIMEOUT_MS = 30_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const controller = new AbortController();
    const timeoutMs = req.method === 'POST' ? POST_TIMEOUT_MS : GET_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const fetchInit: RequestInit = {
      method: req.method,
      signal: controller.signal,
    };

    if (req.method === 'POST') {
      fetchInit.headers = { 'Content-Type': 'text/plain' };
      fetchInit.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(
      `${GOOGLE_SCRIPT_URL}?t=${Date.now()}`,
      fetchInit,
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Google Apps Script returned HTTP ${response.status}`,
      });
    }

    const data = await response.json();

    // GET: short cache; POST: no cache
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, s-maxage=30, max-age=10');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error';
    console.error('[googleScriptProxy] Error:', message);

    return res.status(502).json({
      error: 'Gagal terhubung ke Google Apps Script',
      detail: message,
    });
  }
}
