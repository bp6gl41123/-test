/* ========================================== */
/* ==== 【齊聚眾選：雙軌身分防禦系統 - auth.js】 ==== */
/* ==== (高科技重金屬奢華版 UI + 精準漏斗攔截邏輯) ==== */
/* ==== (純淨無毒版：三界完美顯示 + 破謊雷達) ====== */
/* ========================================== */

const LIFF_ID = '2009615655-TqsOx6OE'; 
const BROWSE_TIME_LIMIT = 5000; 

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 0; // 👉 測試地雷請改 0

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
                fetch('/api/track-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refCode: refCode }) });
                localStorage.setItem(clickKey, 'true'); 
            } catch (e) {}
        }
    }
}

// 🌟 本地天數追蹤
function trackVisitorDays() {
    const today = new Date().toLocaleDateString('en-CA'); 
    let visitedDays = JSON.parse(localStorage.getItem('qiJuVisitedDays')) || [];

    if (!visitedDays.includes(today)) {
        visitedDays.push(today);
        localStorage.setItem('qiJuVisitedDays', JSON.stringify(visitedDays));
    }
    return visitedDays.length > FREE_DAYS_LIMIT; 
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

// 🚀 系統大腦：啟動與判斷
document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. 核彈重置：?action=reset
    if (urlParams.get('action') === 'reset') {
        localStorage.clear();
        sessionStorage.clear();
        alert('💥 系統已重置：LINE 登入、金鑰、天數皆已清除，您現在是全新小白訪客！');
        window.location.href = window.location.pathname;
        return;
    }
    
    // 2. 登出金鑰：?action=logout
    if (urlParams.get('action') === 'logout') {
        localStorage.removeItem('qiJu_Key');
        localStorage.removeItem('qiJu_ExpiresAt');
        alert('🔄 測試專用：金鑰已註銷，恢復一般訪客身分！');
        window.location.href = window.location.pathname;
        return;
    }

    const authGate = document.getElementById('authGate');
    if (authGate) authGate.style.display = 'none';

    trackReferrals(); 

    if (window.location.search.includes('test=lock')) {
        setTimeout(() => { isRestrictedMode = true; }, 300);
    }

    // 🛡️ 漏斗第一層：實體金鑰檢查
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
                console.log('❌ 金鑰已過期！啟動地雷模式');
                localStorage.removeItem('qiJu_Key');
                localStorage.removeItem('qiJu_ExpiresAt');
                isRestrictedMode = true; 
                
                const mainContent = document.getElementById('mainContent');
                if (mainContent) mainContent.style.display = 'block'; 
                if (typeof window.init === 'function') window.init();
                return; 
            }
        }
    }

    window.isAdmin = false;

    // 🛡️ 漏斗第二層：LINE 登入狀態檢查
    let liffLoggedIn = false;
    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) liffLoggedIn = true;
    } catch (err) {}

    // 🎯 終極防禦判斷
    if (liffLoggedIn) {
        const isTrialExpired = trackVisitorDays(); 
        if (isTrialExpired) {
            isRestrictedMode = true;
            console.log("💣 LINE登入者試用期滿，地雷模式已開啟！");
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.style.display = 'block'; 
            if (typeof window.init === 'function') window.init();
        } else {
            fullUnlockSystem();
        }
    } else {
        trackVisitorDays(); 
        isRestrictedMode = false; 

        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block'; 
        if (typeof window.init === 'function') window.init(); 

        setTimeout(() => { showNewDoor(); }, BROWSE_TIME_LIMIT);
    }
});

/* ========================================== */
/* 💣 地雷防禦系統
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
        if (!document.getElementById('nukeTooltipsStyle')) {
            const style = document.createElement('style');
            style.id = 'nukeTooltipsStyle';
            style.innerHTML = `.pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }`;
            document.head.appendChild(style);
        }
    }
}

/* ========================================== */
/* 🚪 【召喚第一扇門】：破謊雷達 (三界完美顯示版)
/* ========================================== */
function showNewDoor() {
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

    let envClass = 'env-desktop'; 
    const screenW = window.screen.width;
    const windowW = window.innerWidth;
    
    if (screenW <= 768 || window.screen.height <= 768) {
        if (windowW > 800) {
            envClass = 'env-ant-view'; // 原生瀏覽器
        } else {
            envClass = 'env-line-mobile'; // LINE
        }
    }

    if (!document.getElementById('qijuModalStyles')) {
        const css = document.createElement('style');
        css.id = 'qijuModalStyles';
        css.innerHTML = `
            .qiju-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; z-index: 2147483647; background: rgba(0, 0, 0, 0.7); opacity: 0; transition: opacity 0.5s ease; }
            .qiju-modal-box { background: linear-gradient(145deg, #1a1c23 0%, #0d1117 100%); border: 2px solid #b48608; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.9), 0 0 30px rgba(180, 134, 8, 0.15), inset 0 0 20px rgba(0,0,0,0.8); text-align: center; font-family: sans-serif; pointer-events: auto; position: relative; overflow: hidden; box-sizing: border-box; }
            .qiju-modal-deco { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: repeating-linear-gradient(45deg, #333 0, #333 2px, #222 2px, #222 4px); border-bottom: 1px solid #b48608; }
            .qiju-modal-logo { background: linear-gradient(135deg, #fde047 0%, #b45309 100%); border-radius: 50%; display:flex; align-items:center; justify-content:center; color:#111; font-weight:900; border: 3px solid #78350f; box-shadow: 0 10px 20px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.6); text-shadow: 1px 1px 0px rgba(255,255,255,0.4); margin: 0 auto; }
            .qiju-modal-title { color: #fbbf24; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin: 0 0 8px; }
            .qiju-modal-desc { color: #94a3b8; font-weight: bold; }
            .qiju-modal-btn-line { width: 100%; box-sizing: border-box; background: linear-gradient(180deg, #06C755 0%, #048b3b 100%); color: white; border: 1px solid #22c55e; border-radius: 8px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(6, 199, 85, 0.3), inset 0 2px 4px rgba(255,255,255,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.5); transition: 0.2s; }
            .qiju-modal-divider { display: flex; align-items: center; }
            .qiju-modal-divider-line { flex: 1; height: 2px; border-bottom: 1px solid #111; }
            .qiju-modal-divider-text { color: #64748b; font-weight: 900; }
            .qiju-modal-input { width: 100%; box-sizing: border-box; border-radius: 6px; border: 1px solid #111; border-bottom: 2px solid #fbbf24; background: #050505; color: #fbbf24; font-weight: bold; text-align: center; box-shadow: inset 0 4px 10px rgba(0,0,0,0.8); outline: none; }
            .qiju-modal-btn-unlock { width: 100%; box-sizing: border-box; background: linear-gradient(180deg, #2a2d35 0%, #111418 100%); color: #fbbf24; border: 1px solid #b48608; border-radius: 6px; cursor: pointer; font-weight: 900; box-shadow: 0 6px 15px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1); transition: 0.2s; }
            .qiju-modal-footer a { color: #64748b; font-weight: bold; text-decoration: none; border-bottom: 1px dashed #64748b; padding-bottom: 2px; }
            #modalErrorMsg { color: #ef4444; font-weight: bold; display: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }

            /* 💻 界線一：電腦版 */
            .env-desktop .qiju-modal-box { width: 90%; max-width: 420px; padding: 40px 25px; }
            .env-desktop .qiju-modal-logo { width: 70px; height: 70px; font-size: 30px; margin-bottom: 20px; }
            .env-desktop .qiju-modal-title { font-size: 24px; letter-spacing: 2px; }
            .env-desktop .qiju-modal-desc { font-size: 14px; margin-bottom: 30px; letter-spacing: 1px; }
            .env-desktop .qiju-modal-btn-line { padding: 16px; font-size: 17px; margin-bottom: 25px; }
            .env-desktop .qiju-modal-divider { margin-bottom: 25px; }
            .env-desktop .qiju-modal-divider-text { font-size: 12px; padding: 0 15px; letter-spacing: 1px; }
            .env-desktop .qiju-modal-input { padding: 14px; margin-bottom: 15px; font-size: 16px; letter-spacing: 2px; }
            .env-desktop .qiju-modal-btn-unlock { padding: 14px; font-size: 16px; letter-spacing: 2px; }
            .env-desktop .qiju-modal-footer { margin-top: 20px; }
            .env-desktop .qiju-modal-footer a { font-size: 13px; }
            .env-desktop #modalErrorMsg { font-size: 13px; margin: 0 0 15px 0; }

            /* 📱 界線二：LINE 手機版 */
            .env-line-mobile .qiju-modal-box { width: 85%; padding: 30px 20px; }
            .env-line-mobile .qiju-modal-logo { width: 60px; height: 60px; font-size: 26px; margin-bottom: 15px; }
            .env-line-mobile .qiju-modal-title { font-size: 20px; letter-spacing: 1px; }
            .env-line-mobile .qiju-modal-desc { font-size: 13px; margin-bottom: 20px; }
            .env-line-mobile .qiju-modal-btn-line { padding: 14px; font-size: 15px; margin-bottom: 20px; }
            .env-line-mobile .qiju-modal-divider { margin-bottom: 20px; }
            .env-line-mobile .qiju-modal-divider-text { font-size: 11px; padding: 0 10px; }
            .env-line-mobile .qiju-modal-input { padding: 12px; margin-bottom: 12px; font-size: 15px; }
            .env-line-mobile .qiju-modal-btn-unlock { padding: 12px; font-size: 15px; }
            .env-line-mobile .qiju-modal-footer { margin-top: 15px; }
            .env-line-mobile .qiju-modal-footer a { font-size: 12px; }
            .env-line-mobile #modalErrorMsg { font-size: 12px; margin: 0 0 12px 0; }

            /* 🐜 界線三：原生螞蟻視角 (加強放大 1100px) */
            .env-ant-view .qiju-modal-box { width: 1100px; padding: 100px 70px; border-radius: 40px; border-width: 5px; }
            .env-ant-view .qiju-modal-deco { height: 16px; border-bottom-width: 3px;}
            .env-ant-view .qiju-modal-logo { width: 180px; height: 180px; font-size: 80px; margin-bottom: 50px; border-width: 8px; }
            .env-ant-view .qiju-modal-title { font-size: 70px; letter-spacing: 5px; margin-bottom: 20px; }
            .env-ant-view .qiju-modal-desc { font-size: 40px; margin-bottom: 80px; letter-spacing: 3px; }
            .env-ant-view .qiju-modal-btn-line { padding: 45px; font-size: 45px; margin-bottom: 60px; border-radius: 20px; border-width: 4px; }
            .env-ant-view .qiju-modal-divider { margin-bottom: 60px; }
            .env-ant-view .qiju-modal-divider-line { height: 6px; border-bottom-width: 3px;}
            .env-ant-view .qiju-modal-divider-text { font-size: 35px; padding: 0 40px; }
            .env-ant-view .qiju-modal-input { padding: 40px; margin-bottom: 40px; font-size: 45px; border-radius: 16px; border-width: 3px; border-bottom-width: 5px; }
            .env-ant-view .qiju-modal-btn-unlock { padding: 40px; font-size: 45px; border-radius: 16px; border-width: 4px; margin-bottom: 30px;}
            .env-ant-view .qiju-modal-footer { margin-top: 50px; }
            .env-ant-view .qiju-modal-footer a { font-size: 38px; border-bottom-width: 3px; }
            .env-ant-view #modalErrorMsg { font-size: 38px; margin: 0 0 40px 0; }
        `;
        document.head.appendChild(css);
    }

    const modal = document.createElement('div');
    modal.id = 'premium-auth-modal';
    modal.className = `qiju-modal-overlay ${envClass}`; 

    modal.innerHTML = `
        <div class="qiju-modal-box">
            <div class="qiju-modal-deco"></div>
            <div class="qiju-modal-logo">齊</div>
            <h2 class="qiju-modal-title">齊聚眾選 戰情中心</h2>
            <p class="qiju-modal-desc">您的體驗已達上限・請進行身分驗證</p>
            <button class="qiju-modal-btn-line" onclick="handleTransitionLogin('line')">
                使用 LINE 一鍵快速登入 (送試用)
            </button>
            <div class="qiju-modal-divider">
                <div class="qiju-modal-divider-line" style="background: linear-gradient(90deg, transparent, #475569);"></div>
                <div class="qiju-modal-divider-text">或使用金鑰解鎖</div>
                <div class="qiju-modal-divider-line" style="background: linear-gradient(270deg, transparent, #475569);"></div>
            </div>
            <input type="text" id="modalPasscodeInput" class="qiju-modal-input" placeholder="請輸入授權金鑰">
            <p id="modalErrorMsg"></p>
            <button class="qiju-modal-btn-unlock" onclick="checkPasscode()">解鎖數據權限</button>
            <div class="qiju-modal-footer">
                <a href="${getDynamicLineUrl()}" target="_blank">沒有金鑰？點此聯絡版大</a>
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
/* 🧠 統一驗證中心
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

document.addEventListener('keypress', (e) => {
    const authGate = document.getElementById('authGate');
    const modal = document.getElementById('premium-auth-modal');
    if (((authGate && authGate.style.display !== 'none') || modal) && e.key === 'Enter') checkPasscode();
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
