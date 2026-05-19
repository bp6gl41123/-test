export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'No key provided' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    try {
        // 查詢金鑰
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/fu6rm4?key=eq.${encodeURIComponent(key)}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        const data = await response.json();

        if (!data || data.length === 0) {
            return res.status(200).json({ valid: false, reason: 'not_found' });
        }

        const record = data[0];

        // 檢查是否已使用（一次性）
        const { revalidate, line_user_id: lineIdForCheck } = req.body;
        if (record.used && !revalidate) {
            // 已使用，但檢查這個 LINE ID 是不是原本綁定的人
            if (lineIdForCheck && record.bound_line_id && lineIdForCheck === record.bound_line_id) {
                // 是同一個人，直接放行，不當作新使用
                console.log('V1 LINE ID 吻合，放行:', lineIdForCheck);
            } else {
                return res.status(200).json({ valid: false, reason: 'used' });
            }
        }

        // 檢查是否過期
        const now = new Date();
        const expiresAt = new Date(record.expires_at);
        if (now > expiresAt) {
            return res.status(200).json({ valid: false, reason: 'expired' });
        }

        // 標記為已使用，並綁定 LINE ID
        const { line_user_id } = req.body;
        await fetch(
            `${SUPABASE_URL}/rest/v1/fu6rm4?key=eq.${encodeURIComponent(key)}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    used: true,
                    bound_line_id: line_user_id || null
                })
            }
        );

        return res.status(200).json({
            valid: true,
            plan: record.plan,
            user_name: record.user_name,
            expires_at: record.expires_at
        });

    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}
