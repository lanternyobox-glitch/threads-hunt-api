export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qr_id, threads_id } = req.body;

    if (!qr_id || !threads_id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };

    // 1. 查 QR
    let qrRes = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${qr_id}&select=*`, {
      headers
    });
    let qrData = await qrRes.json();

    if (!qrData.length) {
      return res.status(404).json({ error: 'QR not found' });
    }

    if (qrData[0].is_used) {
      return res.status(400).json({ error: 'QR already used' });
    }

    // 2. 查 user
    let userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?threads_id=eq.${threads_id}&select=*`, {
      headers
    });
    let userData = await userRes.json();

    let user_id;
    let points = 0;

    if (userData.length) {
      user_id = userData[0].id;
      points = userData[0].points;
    } else {
      let newUserRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ threads_id, points: 0 })
      });

      let newUser = await newUserRes.json();
      user_id = newUser[0].id;
      points = 0;
    }

    // 3. 更新 QR
    await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${qr_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_used: true })
    });

    // 4. 更新 points
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ points: points + 1 })
    });

    // 5. 記錄 log
    await fetch(`${SUPABASE_URL}/rest/v1/scan_logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ qr_id, user_id })
    });

    return res.status(200).json({
      success: true,
      message: `已幫 @${threads_id} 增加 1 點`
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
