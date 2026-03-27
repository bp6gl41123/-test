/* ========================================== */
/* ==== 【齊聚眾選：雙軌身分防禦系統 - auth.js】 ==== */
/* ==== (混血進化版：保留推廣雷達 + 5秒雙軌攔截) ==== */
/* ========================================== */

const LIFF_ID = '2009615655-KgVItEBz'; // 測試網域的 LIFF 鑰匙
const BROWSE_TIME_LIMIT = 5000; // 5秒後攔截 (測試用)

// 🌟 保留核心 1：推廣雷達與防禦型計次
async function trackReferrals() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const authorCode = urlParams.get('author');

    if (refCode) localStorage.setItem('qiJu_ref', refCode);
    if (authorCode) localStorage.setItem('qiJu_author', authorCode);

    if (refCode) {
        const today = new Date().toLocaleDateString('en-CA');
        const clickKey = `click_sent_${refCode}_${today}`;
        if (!localStorage.getItem(clickKey)) {
            try {
                fetch('/api/track-click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refCode: refCode })
                });
                localStorage.setItem(clickKey, 'true'); 
            } catch (e) { console.error("點擊追蹤失敗", e); }
        }
    }
}

// 🌟 動態載入 LINE LIFF SDK
function loadLiffSdk() {
    return new Promise((resolve, reject) => {
        if (window.liff) return resolve(window.liff);
        const script = document.createElement('script');
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
        script.onload = () => resolve(window.liff);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 🚀 系統啟動與雙軌判斷
document.addEventListener('DOMContentLoaded', async () => {
    trackReferrals(); // 啟動推廣雷達

    // 🌟 保留核心 2：檢查老客戶的本地金鑰記憶
    const localKey = localStorage.getItem('qiJu_Key');
    const expiresAt = localStorage.getItem('qiJu_ExpiresAt');

    if (localKey && expiresAt) {
        const now = new Date();
        const expireDate = new Date(expiresAt);
        if (now < expireDate) {
            console.log('⚡ 金鑰尚在有效期限內，瞬間解鎖！');
            window.isAdmin = false; // 或依據 admin key 判斷
            fullUnlockSystem();
            return; // 終止後續攔截
        } else {
            localStorage.removeItem('qiJu_Key');
            localStorage.removeItem('qiJu_ExpiresAt');
        }
    }

    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
            console.log("✅ 已偵測到 LINE 身分，直接放行 (未來接 Supabase)");
            fullUnlockSystem(); 
            return; 
        }

        // ⏰ 啟動 5 秒自由體驗炸彈
        setTimeout(() => {
            showPremiumLoginPrompt();
        }, BROWSE_TIME_LIMIT);

    } catch (err) {
        console.error('LIFF 初始化失敗:', err);
    }
});

// 🎨 顯示「頂級專業版」雙軌登入視窗
function showPremiumLoginPrompt() {
    if (document.getElementById('premium-auth-modal')) return;

    // 鎖死背景
    document.body.style.overflow = 'hidden';
    const mainContent = document.getElementById('mainContent') || document.body;
    mainContent.style.filter = 'blur(8px) brightness(0.5)';
    mainContent.style.pointerEvents = 'none';

    // 抹除泡泡框防偷看
    const style = document.createElement('style');
    style.id = 'nukeTooltipsStyle';
    style.innerHTML = `.pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }`;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'premium-auth-modal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; z-index: 99999; background: rgba(0, 0, 0, 0.6); opacity: 0; transition: opacity 0.5s ease;`;

    // 介面融合：上面 LINE，下面接回舊版的「金鑰輸入」
    modal.innerHTML = `
        <div style="background: #111; border: 1px solid #d4af37; border-radius: 12px; width: 90%; max-width: 400px; padding: 30px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); text-align: center; font-family: sans-serif; pointer-events: auto;">
            
            <div style="width: 60px; height: 60px; background: #d4af37; border-radius: 50%; margin: 0 auto 15px; display:flex; align-items:center; justify-content:center; color:#111; font-weight:bold; font-size:24px;">齊</div>
            <h2 style="color: #d4af37; margin: 0 0 5px; font-size: 22px; letter-spacing: 1px;">齊聚眾選 會員中心</h2>
            <p style="color: #888; font-size: 14px; margin-bottom: 25px;">您的免費體驗已結束，請驗證身分解鎖即時指標</p>

            <button onclick="handleTransitionLogin('line')" style="width: 100%; background: #06C755; color: white; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                使用 LINE 一鍵快速登入 (送試用)
            </button>

            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="flex: 1; height: 1px; background: #333;"></div>
                <div style="color: #666; font-size: 12px; padding: 0 10px;">或使用專屬金鑰</div>
                <div style="flex: 1; height: 1px; background: #333;"></div>
            </div>

            <input type="text" id="passcodeInput" placeholder="請輸入付費金鑰" style="width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #333; background: #222; color: #fff; box-sizing: border-box;">
            <p id="errorMsg" style="color: #ff4d4d; font-size: 13px; margin: 0 0 10px 0; display: none;"></p>
            
            <button onclick="checkPasscode()" style="width: 100%; background: transparent; color: #d4af37; border: 1px solid #d4af37; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;">
                解鎖權限
            </button>
            
            <div style="margin-top: 15px;">
                <a href="${getDynamicLineUrl()}" target="_blank" style="color: #888; font-size: 12px; text-decoration: none;">沒有金鑰？點此聯絡版大</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { modal.style.opacity = '1'; }, 50);
}

// 🌌 LINE 安全轉場
function handleTransitionLogin(type) {
    if (type === 'line') {
        document.body.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d4af37; font-family:sans-serif;">
                <div style="width: 50px; height: 50px; border: 3px solid #333; border-top: 3px solid #d4af37; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom:20px;"></div>
                <h3 style="letter-spacing: 2px;">建立安全連線中...</h3>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
        setTimeout(() => { if (window.liff) liff.login({ redirectUri: window.location.href }); }, 1500);
    }
}

// 🌟 保留核心 3：金鑰驗證大腦 API
async function checkPasscode() {
    const inputEl = document.getElementById('passcodeInput');
    const errorMsg = document.getElementById('errorMsg');
    if (!inputEl) return;
    const userInput = inputEl.value;
    if (!userInput) return;

    try {
        const isV2Key = userInput.toUpperCase().includes('V2');
        const apiUrl = isV2Key ? '/api/verify-key-v2' : '/api/verify-key';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: userInput })
        });
        const result = await response.json();

        if (result.valid) {
            const isExpiredByDays = result.remaining_days !== undefined && result.remaining_days <= 0;
            const isExpiredByDate = result.expires_at && (new Date(result.expires_at) <= new Date());

            if (isExpiredByDays || isExpiredByDate) {
                if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerHTML = '❌ 金鑰已過期，請聯絡版大續約'; }
                return;
            }

            localStorage.setItem('qiJu_Key', userInput);
            let expireDateStr = result.expires_at || new Date(new Date().getTime() + 24*60*60*1000).toISOString();
            localStorage.setItem('qiJu_ExpiresAt', expireDateStr);
            
            if (result.remaining_days !== undefined) alert(`✅ 驗證成功！剩餘天數：${result.remaining_days} 天`);
            fullUnlockSystem();
        } else {
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = result.reason === 'used' ? '❌ 此金鑰已被使用' : (result.reason === 'expired' ? '❌ 金鑰已過期' : '❌ 密鑰錯誤');
            }
        }
    } catch (e) {
        if (errorMsg) { errorMsg.style.display = 'block'; errorMsg.innerHTML = '❌ 系統錯誤，請稍後再試'; }
    }
}

// 🔓 完全解鎖
function fullUnlockSystem() {
    const modal = document.getElementById('premium-auth-modal');
    if (modal) modal.remove();
    
    document.body.style.overflow = '';
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.filter = '';
        mainContent.style.pointerEvents = '';
    }
    const nukeStyle = document.getElementById('nukeTooltipsStyle');
    if (nukeStyle) nukeStyle.remove();

    if (typeof window.init === 'function') window.init();
}

// 🌟 保留：聯絡版大動態連結
window.getDynamicLineUrl = function() {
    const LINE_OFFICIAL_ID = "@yhd0256r"; 
    const ref = localStorage.getItem('qiJu_ref');
    const author = localStorage.getItem('qiJu_author');
    let message = "版大你好，我要買金鑰！";
    if (author && ref && author !== ref) message += ` (原創碼：${author}，推廣碼：${ref})`;
    else if (ref || author) message += ` (推薦碼：${ref || author})`;
    return `https://line.me/R/oaMessage/${LINE_OFFICIAL_ID}/?${encodeURIComponent(message)}`;
};

// 🌟 保留：推廣連結生成
window.generateShareLink = function(authorCode, promoterCode) {
    return `${window.location.origin}${window.location.pathname}?author=${authorCode}&ref=${promoterCode}`;
};
