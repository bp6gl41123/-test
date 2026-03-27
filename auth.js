/* ========================================== */
/* ==== 【齊聚眾選：雙軌身分防禦系統 - auth.js】 ==== */
/* ==== (高科技重金屬奢華版：純 CSS 打造立體質感) ==== */
/* ==== (已修復：完整保留推廣字串邏輯) ============ */
/* ========================================== */

const LIFF_ID = '2009615655-TqsOx6OE'; 
const BROWSE_TIME_LIMIT = 5000; 

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 0; // 👉 測試地雷請改 0

// 🌟 推廣雷達 (完整保留)
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
                fetch('/api/track-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refCode: refCode }) });
                localStorage.setItem(clickKey, 'true'); 
            } catch (e) {}
        }
    }
}

// 🌟 本地天數追蹤 (完整保留)
function trackVisitorDays() {
    const today = new Date().toLocaleDateString('en-CA'); 
    let visitedDays = JSON.parse(localStorage.getItem('qiJuVisitedDays')) || [];

    if (!visitedDays.includes(today)) {
        visitedDays.push(today);
        localStorage.setItem('qiJuVisitedDays', JSON.stringify(visitedDays));
    }

    if (visitedDays.length > FREE_DAYS_LIMIT) {
        isRestrictedMode = true; 
        console.log("💣 訪客天數已達上限，地雷模式已開啟！(等待點擊觸發)");
    }
}

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

document.addEventListener('DOMContentLoaded', async () => {
    const authGate = document.getElementById('authGate');
    if (authGate) authGate.style.display = 'none';

    trackReferrals(); 
    trackVisitorDays(); 

    if (window.location.search.includes('test=lock')) {
        setTimeout(() => {
            isRestrictedMode = true;
        }, 300);
    }

    let ADMIN_KEY = '';
    try { if (typeof config !== 'undefined') ADMIN_KEY = atob(config.adminCode); } catch(e) {}

    const localKey = localStorage.getItem('qiJu_Key');
    const expiresAt = localStorage.getItem('qiJu_ExpiresAt');

    if (localKey) {
        if (ADMIN_KEY && localKey === ADMIN_KEY) {
            window.isAdmin = true;
            fullUnlockSystem();
            return;
        }
        if (expiresAt) {
            const now = new Date();
            const expireDate = new Date(expiresAt);
            if (now < expireDate) {
                window.isAdmin = false;
                fullUnlockSystem();
                return; 
            } else {
                localStorage.removeItem('qiJu_Key');
                localStorage.removeItem('qiJu_ExpiresAt');
                triggerLockdown(); 
                return; 
            }
        }
    }

    window.isAdmin = false;
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'block'; 
    if (typeof window.init === 'function') window.init(); 

    let liffLoggedIn = false;
    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) liffLoggedIn = true;
    } catch (err) {
        console.error('⚠️ LIFF 初始化失敗，忽略錯誤繼續');
    }

    if (liffLoggedIn) {
        fullUnlockSystem(); 
    } else {
        setTimeout(() => { showNewDoor(); }, BROWSE_TIME_LIMIT);
    }
});

/* ========================================== */
/* 💣 地雷防禦系統 (完整保留)
/* ========================================== */
document.addEventListener('click', (e) => {
    if (!isRestrictedMode || hasLockedDown) return;
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
    }, 800); 
}

function triggerLockdown() {
    if (hasLockedDown) return; 
    hasLockedDown = true; 

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
    }
}

/* ========================================== */
/* 🚪 【召喚第一扇門】：高科技重金屬奢華版
/* ========================================== */
function showNewDoor() {
    if (hasLockedDown) return; 
    if (document.getElementById('premium-auth-modal')) return;

    document.body.style.overflow = 'hidden';
    const mainContent = document.getElementById('mainContent') || document.body;
    mainContent.style.filter = 'blur(8px) brightness(0.5)';
    mainContent.style.pointerEvents = 'none';

    const modal = document.createElement('div');
    modal.id = 'premium-auth-modal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; z-index: 2147483647; background: rgba(0, 0, 0, 0.7); opacity: 0; transition: opacity 0.5s ease;`;

    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #1a1c23 0%, #0d1117 100%); border: 2px solid #b48608; border-radius: 16px; width: 90%; max-width: 420px; padding: 40px 25px; box-shadow: 0 25px 50px rgba(0,0,0,0.9), 0 0 30px rgba(180, 134, 8, 0.15), inset 0 0 20px rgba(0,0,0,0.8); text-align: center; font-family: sans-serif; pointer-events: auto; position: relative; overflow: hidden;">
            
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: repeating-linear-gradient(45deg, #333 0, #333 2px, #222 2px, #222 4px); border-bottom: 1px solid #b48608;"></div>

            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #fde047 0%, #b45309 100%); border-radius: 50%; margin: 0 auto 20px; display:flex; align-items:center; justify-content:center; color:#111; font-weight:900; font-size:30px; border: 3px solid #78350f; box-shadow: 0 10px 20px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.6); text-shadow: 1px 1px 0px rgba(255,255,255,0.4);">齊</div>

            <h2 style="color: #fbbf24; margin: 0 0 8px; font-size: 24px; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">齊聚眾選 戰情中心</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 30px; font-weight: bold; letter-spacing: 1px;">您的體驗已達上限・請進行身分驗證</p>

            <button onclick="handleTransitionLogin('line')" style="width: 100%; background: linear-gradient(180deg, #06C755 0%, #048b3b 100%); color: white; border: 1px solid #22c55e; padding: 16px; border-radius: 8px; font-size: 17px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-bottom: 25px; box-shadow: 0 8px 20px rgba(6, 199, 85, 0.3), inset 0 2px 4px rgba(255,255,255,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.5); transition: 0.2s;">
                使用 LINE 一鍵快速登入 (送試用)
            </button>

            <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="flex: 1; height: 2px; background: linear-gradient(90deg, transparent, #475569); border-bottom: 1px solid #111;"></div>
                <div style="color: #64748b; font-size: 12px; padding: 0 15px; font-weight: 900; letter-spacing: 1px;">或使用金鑰解鎖</div>
                <div style="flex: 1; height: 2px; background: linear-gradient(270deg, transparent, #475569); border-bottom: 1px solid #111;"></div>
            </div>

            <input type="text" id="modalPasscodeInput" placeholder="請輸入授權金鑰" style="width: 100%; padding: 14px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #111; border-bottom: 2px solid #fbbf24; background: #050505; color: #fbbf24; font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 2px; box-shadow: inset 0 4px 10px rgba(0,0,0,0.8); outline: none;">
            <p id="modalErrorMsg" style="color: #ef4444; font-size: 13px; font-weight: bold; margin: 0 0 15px 0; display: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8);"></p>
            
            <button onclick="checkPasscode()" style="width: 100%; background: linear-gradient(180deg, #2a2d35 0%, #111418 100%); color: #fbbf24; border: 1px solid #b48608; padding: 14px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 900; box-shadow: 0 6px 15px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1); letter-spacing: 2px; transition: 0.2s;">
                解鎖數據權限
            </button>
            
            <div style="margin-top: 20px;">
                <a href="${getDynamicLineUrl()}" target="_blank" style="color: #64748b; font-size: 13px; font-weight: bold; text-decoration: none; border-bottom: 1px dashed #64748b; padding-bottom: 2px;">沒有金鑰？點此聯絡版大</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { modal.style.opacity = '1'; }, 50);
}

function handleTransitionLogin(type) {
    if (type === 'line') {
        document.body.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d4af37;">
                <div style="width: 50px; height: 50px; border: 3px solid #333; border-top: 3px solid #d4af37; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom:20px;"></div>
                <h3 style="letter-spacing: 2px;">建立安全連線中...</h3>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
        setTimeout(() => { if (window.liff) liff.login({ redirectUri: window.location.href }); }, 1500);
    }
}

/* ========================================== */
/* 🧠 統一驗證中心 (完整保留)
/* ========================================== */
async function checkPasscode() {
    let userInput = '';
    let errorMsg = null;
    
    const iframe = document.querySelector('#authGate iframe');
    if (iframe && iframe.contentWindow) {
        try {
            const inputEl = iframe.contentWindow.document.getElementById('passcodeInput');
            if (inputEl) userInput = inputEl.value;
            errorMsg = iframe.contentWindow.document.getElementById('errorMsg');
        } catch(e) {} 
    }
    
    if (!userInput) {
        const inputEl = document.getElementById('modalPasscodeInput');
        if (inputEl) userInput = inputEl.value;
        if (!errorMsg) errorMsg = document.getElementById('modalErrorMsg');
    }

    if (!userInput) return;

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

    try {
        const isV2Key = userInput.toUpperCase().includes('V2');
        const apiUrl = isV2Key ? '/api/verify-key-v2' : '/api/verify-key';
        
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: userInput }) });
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
    
    isRestrictedMode = false;
    validClickCount = 0;
    hasLockedDown = false; 

    if (window.isAdmin === true) {
        if (typeof window.initAdminWidget === 'function') window.initAdminWidget();
        if (typeof window.initBackupWidget === 'function') window.initBackupWidget();
    }
    if (typeof window.init === 'function') window.init();
}

document.addEventListener('keypress', (e) => {
    const authGate = document.getElementById('authGate');
    const modal = document.getElementById('premium-auth-modal');
    if (((authGate && authGate.style.display !== 'none') || modal) && e.key === 'Enter') checkPasscode();
});

// 🚨 這裡就是剛剛被我遺漏，現在完美恢復的推廣字串邏輯！
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
