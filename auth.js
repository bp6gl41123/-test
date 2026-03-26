/* ========================================== */
/* ==== 【開發模組：LINE 終極身分防禦 - auth.js】 ==== */
/* ==== (V16.0 完美融合版：保留所有原功能 + LIFF) ==== */
/* ========================================== */

// 你的專屬 LIFF ID
const LIFF_ID = '2009615655-Qfz6sgKV'; 

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    
const MAX_CLICKS = 1;         
// const FREE_DAYS_LIMIT = 99; // 註：天數計算已全面移交給 Supabase 雲端大腦判斷

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

// 🌟 【原版保留】雙參數雷達：網址參數解析與記憶 (含防禦型計次)
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
            } catch (e) {
                console.error("點擊追蹤失敗", e);
            }
        }
    }
}

// 🚀 核心防禦：初始化與登入攔截
document.addEventListener('DOMContentLoaded', async () => {
    trackReferrals();
    
    // 🕵️ 【原版保留】管理員測試模式後門
    if (window.location.search.includes('test=lock')) {
        setTimeout(() => {
            if (localStorage.getItem('qiJu_Key')) return;
            isRestrictedMode = true;
            console.log("🕵️ 管理員測試模式：地雷已就緒");
        }, 300);
    }

    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });

        // 🛑 第一道門：如果沒有登入 LINE，強制跳轉
        if (!liff.isLoggedIn()) {
            console.log("未偵測到 LINE 身分，強制跳轉登入...");
            const redirectUri = window.location.href; 
            liff.login({ redirectUri: redirectUri });
            return; 
        }

        // ✅ 第二道門：已登入，取得身分並呼叫大腦
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const savedRef = localStorage.getItem('qiJu_ref');

        console.log("👤 LINE 身分確認：", lineUserId);

        const response = await fetch('/api/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                line_user_id: lineUserId,
                ref_code: savedRef
            })
        });

        const brainResult = await response.json();
        
        // 判斷大腦的裁決
        if (brainResult.status === 'active_paid' || brainResult.status === 'active_free') {
            console.log(`✅ 大腦核准放行。狀態：${brainResult.status}，剩餘天數：${brainResult.remaining_days}`);
            
            if (brainResult.status === 'active_free') {
                isRestrictedMode = true; // 免費仔，掛上滑動地雷
            } else {
                isRestrictedMode = false; // 付費大佬，完全自由
                window.isAdmin = (brainResult.key_type === 'Admin');
            }
            
            openDoorForVisitor(); 

        } else if (brainResult.status === 'expired' || brainResult.shouldLock) {
            console.log("❌ 大腦裁決：試用期已滿或無權限。啟動封鎖。");
            triggerLockdown(); // 直接啟動封鎖畫面
        }

    } catch (err) {
        console.error('LIFF 初始化或大腦連線失敗:', err);
        triggerLockdown(); // 防禦機制：系統異常時預設鎖定
    }
});

// 🖱️ 【原版保留】全域點擊攔截
document.addEventListener('click', (e) => {
    if (!isRestrictedMode || hasLockedDown) return;
    if (e.target.closest('#authGate')) return;

    validClickCount++;

    if (validClickCount === 1) {
        armMovementTrap();
    } else if (validClickCount > 1) {
        e.preventDefault();  
        e.stopPropagation(); 
        triggerLockdown();
    }
}, true); 

// 💣 【原版保留】埋設滑動地雷
function armMovementTrap() {
    setTimeout(() => {
        if (hasLockedDown) return; 
        const trapEvents = ['mousemove', 'scroll', 'touchmove', 'keydown'];
        const detonateTrap = (e) => {
            if (hasLockedDown) return;
            if (e.target && e.target.closest && e.target.closest('#authGate')) return;
            triggerLockdown();
            trapEvents.forEach(evt => document.removeEventListener(evt, detonateTrap, true));
        };
        trapEvents.forEach(evt => document.addEventListener(evt, detonateTrap, true));
    }, 800); 
}

// 🎯 【原版保留】關門放狗 + 終極鎖死
function triggerLockdown() {
    if (hasLockedDown) return; 
    hasLockedDown = true; 
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
            style.innerHTML = `
                .pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }
            `;
            document.head.appendChild(style);
        }
    }
}

// 🔐 【原版保留】完整金鑰驗證邏輯
async function checkPasscode() {
    let userInput = '';
    let errorMsg = null;
    
    const iframe = document.querySelector('#authGate iframe');
    if (iframe && iframe.contentWindow) {
        const iframeDoc = iframe.contentWindow.document;
        const inputEl = iframeDoc.getElementById('passcodeInput');
        if (inputEl) userInput = inputEl.value;
        errorMsg = iframeDoc.getElementById('errorMsg');
    } else {
        const inputEl = document.getElementById('passcodeInput');
        if (inputEl) userInput = inputEl.value;
        errorMsg = document.getElementById('errorMsg');
    }
    
    if (!userInput) return;

    // 管理員金鑰
    try {
        const ADMIN_KEY = atob(config.adminCode);
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

    // 會員金鑰 (API 驗證)
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
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.innerHTML = '❌ 金鑰已過期，請聯絡版大續約';
                }
                localStorage.removeItem('qiJu_Key');
                localStorage.removeItem('qiJu_ExpiresAt');
                return; 
            }

            localStorage.setItem('qiJu_Key', userInput);
            let expireDateStr = result.expires_at;
            if (!expireDateStr) {
                const tomorrow = new Date();
                tomorrow.setHours(tomorrow.getHours() + 24);
                expireDateStr = tomorrow.toISOString();
            }
            localStorage.setItem('qiJu_ExpiresAt', expireDateStr);
            
            sessionStorage.removeItem('verifiedKey'); 
            localStorage.removeItem('verifiedKey_v2');
            
            if (result.remaining_days !== undefined) {
                alert(`✅ 驗證成功！剩餘天數：${result.remaining_days} 天`);
            }
            
            window.isAdmin = false;
            fullUnlockSystem();
        } else {
            if (errorMsg) errorMsg.style.display = 'block';
            if (result.reason === 'used') {
                if (errorMsg) errorMsg.innerHTML = '❌ 此金鑰已被使用過';
            } else if (result.reason === 'expired') {
                if (errorMsg) errorMsg.innerHTML = '❌ 金鑰已過期，請聯絡版大續約';
            } else {
                if (errorMsg) errorMsg.innerHTML = '❌ 密鑰錯誤或已過期';
            }
        }
    } catch (e) {
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = '❌ 系統錯誤，請稍後再試';
        }
    }
}

// 🚪 【原版保留】開門邏輯
function openDoorForVisitor() {
    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    if (authGate) authGate.style.display = 'none'; 
    if (mainContent) mainContent.style.display = 'block'; 
    if (typeof window.init === 'function') window.init(); 
}

// 🔓 【原版保留】解鎖系統 (包含 Admin Widget 啟動)
function fullUnlockSystem() {
    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    if (authGate) {
        authGate.classList.remove('scatter-fly-in');
        authGate.style.display = 'none'; 
    }
    if (mainContent) mainContent.style.display = 'block';

    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    if (mainContent) {
        mainContent.style.pointerEvents = '';
        mainContent.style.filter = '';
    }

    const nukeStyle = document.getElementById('nukeTooltipsStyle');
    if (nukeStyle) nukeStyle.remove();

    isRestrictedMode = false;
    validClickCount = 0;
    hasLockedDown = false; 

    // 恢復管理員套件啟動邏輯
    if (window.isAdmin === true) {
        if (typeof window.initAdminWidget === 'function') window.initAdminWidget();
        if (typeof window.initBackupWidget === 'function') window.initBackupWidget();
    }

    if (typeof window.init === 'function') window.init();
}

// ⌨️ 【原版保留】鍵盤事件
document.addEventListener('keypress', (e) => {
    const authGate = document.getElementById('authGate');
    if (authGate && authGate.style.display !== 'none' && e.key === 'Enter') {
        checkPasscode();
    }
});

// 🌟 【原版保留】LINE 收網組裝機
window.getDynamicLineUrl = function() {
    const LINE_OFFICIAL_ID = "@yhd0256r"; 
    const ref = localStorage.getItem('qiJu_ref');
    const author = localStorage.getItem('qiJu_author');
    
    let message = "版大你好，我要買金鑰！";
    if (author && ref && author !== ref) {
        message += ` (原創碼：${author}，推廣碼：${ref})`;
    } else if (ref || author) {
        const singleCode = ref || author;
        message += ` (推薦碼：${singleCode})`;
    } else {
        message += ` (無推薦人)`;
    }
    return `https://line.me/R/oaMessage/${LINE_OFFICIAL_ID}/?${encodeURIComponent(message)}`;
};

// 🌟 【原版保留】推廣者專用：產生雙軌分潤連結
window.generateShareLink = function(authorCode, promoterCode) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?author=${authorCode}&ref=${promoterCode}`;
};