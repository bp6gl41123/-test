import { createClient } from '@supabase/supabase-js';

// 頂級工程師守則 1：環境變數隱藏機密。
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 全局常數設定：免費試用天數
const FREE_TRIAL_DAYS = 7;

export default async function handler(req, res) {
  // 頂級工程師守則 2：防禦非預期請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { line_user_id, ref_code } = req.body;

  if (!line_user_id) {
    return res.status(400).json({ error: 'Missing line_user_id. Access Denied.' });
  }

  try {
    const now = new Date();

    // ------------------------------------------------------------------
    // 步驟一：檢查該 LINE 用戶是否存在於我們的資料庫中
    // ------------------------------------------------------------------
    let { data: user, error: userError } = await supabase
      .from('line_users')
      .select('*')
      .eq('line_user_id', line_user_id)
      .single();

    // ------------------------------------------------------------------
    // 步驟二：如果找不到，代表是【全新免費用戶】
    // ------------------------------------------------------------------
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from('line_users')
        .insert([{
            line_user_id: line_user_id,
            first_visit_date: now.toISOString(),
            ref_code: ref_code || null // 永久綁定推薦人
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        status: 'active_free',
        remaining_days: FREE_TRIAL_DAYS,
        message: '歡迎新朋友！99 天免費用額度已啟用。'
      });
    }

    // ------------------------------------------------------------------
    // 步驟三：查 fu6rm4 表，看這個 LINE ID 有沒有綁定的有效金鑰（V1 / V2 都認）
    // ------------------------------------------------------------------
    const { data: keys, error: keyError } = await supabase
      .from('fu6rm4')
      .select('*')
      .eq('bound_line_id', line_user_id)
      .gte('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1);

    if (keyError) {
      console.error('fu6rm4 查詢錯誤:', keyError);
      throw keyError;
    }

    // 【情境 A：有綁定金鑰的付費用戶】
    if (keys && keys.length > 0) {
      const validKey = keys[0];
      const isV2 = validKey.key && validKey.key.toUpperCase().includes('V2');

      // V2 計日制：額外確認天數沒耗盡
      if (isV2 && validKey.total_days > 0 && validKey.used_days >= validKey.total_days) {
        console.log('V2 金鑰天數耗盡，不放行:', validKey.key);
        // 天數耗盡，繼續往下走試用期判斷
      } else {
        const expireDate = new Date(validKey.expires_at);
        const remainingDays = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
          status: 'active_paid',
          remaining_days: remainingDays,
          plan: validKey.plan,
          user_name: validKey.user_name,
          message: '尊爵會員，歡迎回來！'
        });
      }
    }

    // ------------------------------------------------------------------
    // 步驟四：沒有有效金鑰，計算他 99 天的試用期用完了沒
    // ------------------------------------------------------------------
    const firstVisitDate = new Date(user.first_visit_date);
    const trialExpireDate = new Date(firstVisitDate.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // 【情境 B：還在免費試用期內】
    if (now < trialExpireDate) {
      const remainingDays = Math.ceil((trialExpireDate - now) / (1000 * 60 * 60 * 24));

      return res.status(200).json({
        status: 'active_free',
        remaining_days: remainingDays,
        message: '免費試用期中。'
      });
    }

    // 【情境 C：白嫖期結束，且無付費金鑰 -> 下令前端引爆地雷】
    return res.status(200).json({
      status: 'expired',
      remaining_days: 0,
      shouldLock: true, // 前端 auth.js 看到這個 true，就會立刻鎖死畫面
      message: '試用期已結束，請購買金鑰解鎖。'
    });

  } catch (error) {
    console.error('Supabase API Error:', error);
    return res.status(500).json({ error: '內部伺服器錯誤，請稍後再試。' });
  }
}