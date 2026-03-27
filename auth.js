/* ========================================== */
/* ==== 【齊聚眾選：雙軌身分防禦系統 - auth.js】 ==== */
/* ==== (究極完全體：地雷防禦網 + 兩扇門切換) ==== */
/* ========================================== */

const LIFF_ID = '2009615655-KgVItEBz'; 
const BROWSE_TIME_LIMIT = 5000; // 5秒體驗時間

// 💣 繼承 V15.4 的地雷變數
let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 99;    

// 🌟 推廣雷達
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

// 🌟 本地訪客天數追蹤 (V15.4 核心)
function trackVisitorDays() {
    const today = new Date().toLocaleDateString('en-CA'); 
    let visitedDays = JSON.parse(localStorage.getItem('qiJuVisitedDays')) || [];

    if (!visitedDays.includes(today)) {
        visitedDays.push(today);
        localStorage.setItem('qiJuVisitedDays', JSON.stringify(visitedDays));
    }

    if (visitedDays.length > FREE_DAYS_LIMIT) {
        isRestrictedMode = true; // 超過天數，開啟地雷模式
    }
}

// 🌟 載入 LINE SDK
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

// 🚀 系統大腦：啟動與判斷
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. 預設隱藏舊門 (pricing_v2.html)，保持畫面乾淨
    const authGate = document.getElementById('authGate');
    if (authGate) authGate.style.display = 'none';

    trackReferrals(); 
    trackVisitorDays(); // 執行本地天數檢查

    // 2. 🕵️ 改良版後門：管理員地雷測試
    if (window.location.search.includes('test=lock')) {
        setTimeout(() => {
            if (localStorage.getItem('qiJu_Key')) return;
            isRestrictedMode = true;
            console.log("🕵️ 管理員測試模式：地雷已就緒");
        }, 300);
    }

    // 3. 取得管理員金鑰 (V15.4 核心)
    let ADMIN_KEY = '';
    try { if (typeof config !== 'undefined') ADMIN_KEY = atob(config.adminCode); } catch(e) {}

    // 4. 檢查金鑰狀態
    const localKey = localStorage.getItem('qiJu_Key');
    const expiresAt = localStorage.getItem('qiJu_ExpiresAt');

    if (localKey) {
        // 管理員免死金牌
        if (ADMIN_KEY && localKey === ADMIN_KEY) {
            window.isAdmin = true;
            fullUnlockSystem();
            return;
        }

        // 會員到期判定
        if (expiresAt) {
            const now = new Date();
            const expireDate = new Date(expiresAt);
            if (now < expireDate) {
                console.log('⚡ 金鑰尚在有效期限內，瞬間解鎖！');
                window.isAdmin = false;
                fullUnlockSystem();
                return; 
            } else {
                console.log('❌ 金鑰已過期！直接召喚第二扇門 (舊版付費牆)！');
                localStorage.removeItem('qiJu_Key');
                localStorage.removeItem('qiJu_ExpiresAt');
                triggerLockdown(); // 👉 金鑰過期，直接觸發地雷鎖死！
                return; 
            }
        }
    }

    window.isAdmin = false;

    // 5. 確保主畫面開啟
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'block'; 
    if (typeof window.init === 'function') window.init(); 

    // 6. 判斷是否需要召喚第一扇門 (黑金新門)
    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
            fullUnlockSystem(); 
            return; 
        }

        // 新客 5 秒定時炸彈
        setTimeout(() => {
            showNewDoor();
        }, BROWSE_TIME_LIMIT);

    } catch (err) {
        console.error('LIFF 初始化失敗:', err);
    }
});

/* ========================================== */
/* 💣 地雷防禦系統 (繼承自 V15.4)
/* ========================================== */

document.addEventListener('click', (e) => {
    if (!isRestrictedMode || hasLockedDown) return;
    // 點擊新門或舊門都不算觸發地雷
    if (e.target.closest('#authGate') || e.target.closest('#premium-auth-modal')) return;

    validClickCount++;

    if (validClickCount === 1) {
        armMovementTrap();
    } else if (validClickCount > 1) {
        e.preventDefault();  
        e.stopPropagation(); 
        triggerLockdown();
    }
}, true); 

function armMovementTrap() {
    setTimeout(() => {
        if (hasLockedDown) return; 

        const trapEvents = ['mousemove', 'scroll', 'touchmove', 'keydown'];
        const detonateTrap = (e) => {
            if (hasLockedDown) return;
            if (e.target && e.target.closest && (e.target.closest('#authGate') || e.target.closest('#premium-auth-modal'))) return;
            
            triggerLockdown();
            trapEvents.forEach(evt => document.removeEventListener(evt, detonateTrap, true));
        };

        trapEvents.forEach(evt => document.addEventListener(evt, detonateTrap, true));
        console.log("💣 滑動地雷已佈署！滑鼠一動即刻召喚舊門！");

    }, 800); 
}

// 🚪 【召喚第二扇門】：舊版付費牆 (pricing_v2.html)
function triggerLockdown() {
    if (hasLockedDown) return; 
    hasLockedDown = true; 

    // 拆除可能正在顯示的新門
    const modal = document.getElementById('premium-auth-modal');
    if (modal) modal.remove();

    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    
    if (authGate) {
        authGate.style.display = 'block'; 
        authGate.classList.add('scatter-fly-in');  

        document.body.style.overflow = 'hidden'; 
        document.body.style.userSelect = 'none'; 
        if (mainContent) {
            mainContent.style.pointerEvents = 'none'; 
            mainContent.style.filter = 'blur(8px)';   
        }

        if (!document.getElementById('nukeTooltipsStyle')) {
            const style = document.createElement('style');
            style.id = 'nukeTooltipsStyle';
            style.innerHTML = `.pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }`;
            document.head.appendChild(style);
        }
    }
}

/* ========================================== */
/* 🚪 【召喚第一扇門】：黑金雙軌新門
/* ========================================== */
function showNewDoor() {
    // 如果地雷已經引爆 (已經在顯示舊門了)，就不要再彈出新門干擾
    if (hasLockedDown) return; 
    if (document.getElementById('premium-auth-modal')) return;

    document.body.style.overflow = 'hidden';
    const mainContent = document.getElementById('mainContent') || document.body;
    mainContent.style.filter = 'blur(8px) brightness(0.5)';
    mainContent.style.pointerEvents = 'none';

    if (!document.getElementById('nukeTooltipsStyle')) {
        const style = document.createElement('style');
        style.id = 'nukeTooltipsStyle';
        style.innerHTML = `.pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }`;
        document.head.appendChild(style);
    }

    const modal = document.createElement('div');
    modal.id = 'premium-auth-modal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; z-index: 2147483647; background: rgba(0, 0, 0, 0.6); opacity: 0; transition: opacity 0.5s ease;`;

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
            <input type="text" id="modalPasscodeInput" placeholder="請輸入付費金鑰" style="width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #333; background: #222; color: #fff; box-sizing: border-box;">
            <p id="modalErrorMsg" style="color: #ff4d4d; font-size: 13px; margin: 0 0 10px 0; display: none;"></p>
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

/* ========================================== */
/* 🧠 統一驗證中心 (大腦 API + 支援新舊門)
/* ========================================== */
async function checkPasscode() {
    let userInput = '';
    let errorMsg = null;
    
    // 優先尋找舊門
    const iframe = document.querySelector('#authGate iframe');
    if (iframe && iframe.contentWindow) {
        try {
            const iframeDoc = iframe.contentWindow.document;
            const inputEl = iframeDoc.getElementById('passcodeInput');
            if (inputEl) userInput = inputEl.value;
            errorMsg = iframeDoc.getElementById('errorMsg');
        } catch(e) {} 
    }
    
    // 尋找新門
    if (!userInput) {
        const inputEl = document.getElementById('modalPasscodeInput');
        if (inputEl) userInput = inputEl.value;
        if (!errorMsg) errorMsg = document.getElementById('modalErrorMsg');
    }

    if (!userInput) return;

    // 🌟 恢復管理員金鑰邏輯 (V15.4)
    try {
        let ADMIN_KEY = '';
        if (typeof config !== 'undefined') ADMIN_KEY = atob(config.adminCode);
        if (userInput === ADMIN_KEY) {
            window.isAdmin = true;
            localStorage.setItem('qiJu_Key', ADMIN_KEY);
            const adminExpire = new Date();
            adminExpire.setDate(adminExpire.getDate() + 30); 
            localStorage.setItem('qiJu_ExpiresAt', adminExpire.toISOString());
            fullUnlockSystem();
            return;
        }
    } catch(e) {}

    // 會員金鑰 API
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
            
            sessionStorage.removeItem('verifiedKey'); 
            localStorage.removeItem('verifiedKey_v2');
            
            if (result.remaining_days !== undefined) alert(`✅ 驗證成功！剩餘天數：${result.remaining_days} 天`);
            
            window.isAdmin = false;
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

// 🔓 終極解鎖魔法：拆新門、拆舊門、初始化管理員 (V15.4)
function fullUnlockSystem() {
    const modal = document.getElementById('premium-auth-modal');
    if (modal) modal.remove();
    
    const authGate = document.getElementById('authGate');
    if (authGate) {
        authGate.classList.remove('scatter-fly-in');
        authGate.style.display = 'none';
    }

    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.filter = '';
        mainContent.style.pointerEvents = '';
        mainContent.style.display = 'block';
    }
    
    const nukeStyle = document.getElementById('nukeTooltipsStyle');
    if (nukeStyle) nukeStyle.remove();

    isRestrictedMode = false;
    validClickCount = 0;
    hasLockedDown = false; 

    if (window.isAdmin === true) {
        if (typeof window.initAdminWidget === 'function') window.initAdminWidget();
        if (typeof window.initBackupWidget === 'function') window.initBackupWidget();
    }

    if (typeof window.init === 'function') window.init();
}

// 🌟 恢復 Enter 鍵登入 (V15.4)
document.addEventListener('keypress', (e) => {
    const authGate = document.getElementById('authGate');
    const modal = document.getElementById('premium-auth-modal');
    // 不管是新門還是舊門打開，只要按 Enter 就觸發
    if (((authGate && authGate.style.display !== 'none') || modal) && e.key === 'Enter') {
        checkPasscode();
    }
});

window.getDynamicLineUrl = function() {
    const LINE_OFFICIAL_ID = "@yhd0256r"; 
    const ref = localStorage.getItem('qiJu_ref');
    const author = localStorage.getItem('qiJu_author');
    let message = "版大你好，我要買金鑰！";
    if (author && ref && author !== ref) message += ` (原創碼：${author}，推廣碼：${ref})`;
    else if (ref || author) message += ` (推薦碼：${ref || author})`;
    return `https://line.me/R/oaMessage/${LINE_OFFICIAL_ID}/?${encodeURIComponent(message)}`;
};

window.generateShareLink = function(authorCode, promoterCode) {
    return `${window.location.origin}${window.location.pathname}?author=${authorCode}&ref=${promoterCode}`;
};
