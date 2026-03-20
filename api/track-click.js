// api/track-click.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { refCode } = req.body;
    if (!refCode) return res.status(400).json({ error: 'Missing refCode' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    try {
        // 1. 先抓取該推薦碼目前的點擊數
        const getRes = await fetch(
            `${SUPABASE_URL}/rest/v1/fu6rm4?ref_code=eq.${encodeURIComponent(refCode)}&select=click_count`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        const data = await getRes.json();

        if (data && data.length > 0) {
            const newCount = (data[0].click_count || 0) + 1;

            // 2. 更新點擊數 (+1)
            await fetch(
                `${SUPABASE_URL}/rest/v1/fu6rm4?ref_code=eq.${encodeURIComponent(refCode)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ click_count: newCount })
                }
            );
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}