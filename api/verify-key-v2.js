export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'No key provided' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    try {
        // 1. 查詢金鑰詳細資訊
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
        
        // 取得今天的日期字串 (例如 "2026-03-18")
        const today = new Date().toLocaleDateString('en-CA'); 

        // 2. 檢查天數是否已用盡
        if (record.used_days >= record.total_days && record.total_days > 0) {
            return res.status(200).json({ valid: false, reason: 'expired' });
        }

        let currentUsedDays = record.used_days;

        // 3. 核心邏輯：判定是否為「今天第一次登入」
        // 如果最後登入日期不是今天，代表是新的一天，執行扣天數動作
        if (record.last_login_date !== today) {
            currentUsedDays += 1;

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
                        used_days: currentUsedDays, 
                        last_login_date: today,
                        // 如果扣完剛好滿了，順便把舊的 used 標籤打勾
                        used: currentUsedDays >= record.total_days 
                    })
                }
            );
        }

        // 4. 驗證成功，回傳剩餘天數給前端
        return res.status(200).json({
            valid: true,
            plan: record.plan,
            user_name: record.user_name,
            remaining_days: record.total_days - currentUsedDays
        });

    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
}
