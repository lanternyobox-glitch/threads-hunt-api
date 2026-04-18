export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL' });
    }

    if (!SUPABASE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/users`);
    url.searchParams.set('select', 'threads_id,points');
    url.searchParams.set('order', 'points.desc');
    url.searchParams.set('limit', '20');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'apikey': String(SUPABASE_KEY).trim(),
        'Authorization': `Bearer ${String(SUPABASE_KEY).trim()}`,
        'Accept': 'application/json'
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Supabase request failed',
        detail: text
      });
    }

    let data = [];
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: 'Invalid JSON from Supabase',
        detail: text
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server error'
    });
  }
}
