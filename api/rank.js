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

    const apiUrl = `${SUPABASE_URL}/rest/v1/users?select=threads_id,points&order=points.desc&limit=20`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      const text = await response.text();

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Supabase request failed',
          url: apiUrl,
          detail: text
        });
      }

      return res.status(200).json({
        success: true,
        url: apiUrl,
        data: JSON.parse(text)
      });
    } catch (fetchErr) {
      return res.status(500).json({
        error: 'fetch failed',
        url: apiUrl,
        supabaseUrlExists: !!SUPABASE_URL,
        supabaseUrlValue: SUPABASE_URL,
        keyExists: !!SUPABASE_KEY,
        fetchMessage: fetchErr.message
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server error'
    });
  }
}
