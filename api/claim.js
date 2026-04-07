export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qr_id, threads_id } = req.body || {};

    if (!qr_id || !threads_id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };

    // 1. 查 QR
    const qrRes = await fetch(
      `${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${encodeURIComponent(qr_id)}&select=*`,
      { headers }
    );
    const qrData = await qrRes.json();

    if (!Array.isArray(qrData) || qrData.length === 0) {
      return res.status(404).json({ error: 'QR not found' });
    }

    if (qrData[0].is_used) {
      return res.status(400).json({ error: 'QR already used' });
    }

    // 2. 查 user
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?threads_id=eq.${encodeURIComponent(threads_id)}&select=*`,
      { headers }
    );
    const userData = await userRes.json();

    let userId;
    let currentPoints = 0;

    if (Array.isArray(userData) && userData.length > 0) {
      userId = userData[0].id;
      currentPoints = userData[0].points || 0;
    } else {
      const newUserRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ threads_id, points: 0 }])
      });

      const newUserData = await newUserRes.json();

      if (!Array.isArray(newUserData) || newUserData.length === 0) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      userId = newUserData[0].id;
      currentPoints = 0;
    }

    // 3. 更新 QR 為已使用
    const qrUpdateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${encodeURIComponent(qr_id)}&is_used=eq.false`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_used: true })
      }
    );

    if (!qrUpdateRes.ok) {
      return res.status(500).json({ error: 'Failed to update QR status' });
    }

    // 4. 更新 points
    const userUpdateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ points: currentPoints + 1 })
      }
    );

    if (!userUpdateRes.ok) {
      return res.status(500).json({ error: 'Failed to update user points' });
    }

    // 5. 記錄 scan log
    const logRes = await fetch(`${SUPABASE_URL}/rest/v1/scan_logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ qr_id, user_id: userId }])
    });

    if (!logRes.ok) {
      return res.status(500).json({ error: 'Failed to write scan log' });
    }

    return res.status(200).json({
      success: true,
      message: `已幫 @${threads_id} 增加 1 點`
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server error'
    });
  }
}
