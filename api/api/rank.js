export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=threads_id,points&order=points.desc&limit=20`,
      { headers }
    );

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
