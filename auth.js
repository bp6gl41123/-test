/* ========================================== */
/* ==== 【開發模組：雙軌金鑰驗證 - auth.js】 ==== */
/* ==== (V15.4 終極地雷版：1點擊+滑動即死) ==== */
/* ========================================== */

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    // 🔒 新增：確保鎖定咒語只會執行一次
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 0;    

// 🌟 【新增】雙參數雷達：網址參數解析與記憶
// 🌟 【新增】雙參數雷達：網址參數解析與記憶 (含防禦型計次)
async function trackReferrals() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const authorCode = urlParams.get('author');

    if (refCode) localStorage.setItem('qiJu_ref', refCode);
    if (authorCode) localStorage.setItem('qiJu_author', authorCode);

    // 🛡️ 防禦型點擊偵測：每人每天針對同一個推薦碼只發送一次 API
    if (refCode) {
        const today = new Date().toLocaleDateString('en-CA');
        const clickKey = `click_sent_${refCode}_${today}`;
        
        if (!localStorage.getItem(clickKey)) {
            try {
                // 🚀 呼叫 Vercel 後端 API 增加點擊數
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

document.addEventListener('DOMContentLoaded', async () => {
    trackReferrals();

    // 🕵️ 管理員專屬後門：只要網址包含 ?test=lock，就延遲 0.5 秒強制上鎖！
    if (window.location.search.includes('test=lock')) {
        setTimeout(triggerLockdown, 500);
    }

    const savedKey = sessionStorage.getItem('verifiedKey');

    if (typeof config !== 'undefined' && savedKey) {

        // ✅ 修正後的程式碼
    if (savedKey === atob(config.adminCode) || savedKey) {
            window.isAdmin = (savedKey === atob(config.adminCode));
            fullUnlockSystem(); 
            return; 
        }
    }

    // 🚀 共存邏輯：背景自動驗證 V2 天次制金鑰 (永久記憶)
    const savedKeyV2 = localStorage.getItem('verifiedKey_v2');
    if (savedKeyV2) {
        try {
            const resV2 = await fetch('/api/verify-key-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: savedKeyV2 })
            });
            const dataV2 = await resV2.json();
            if (dataV2.valid) {
                window.isAdmin = false;
                fullUnlockSystem();
                return; // 驗證成功，自動解鎖並結束
            } else {
                localStorage.removeItem('verifiedKey_v2'); // 失效則清除記憶
            }
        } catch(e) {
            console.error('V2背景驗證失敗', e);
        }
    }

    trackVisitorDays();
    window.isAdmin = false;
    openDoorForVisitor(); 
});

function trackVisitorDays() {
    const today = new Date().toLocaleDateString('en-CA'); 
    let visitedDays = JSON.parse(localStorage.getItem('qiJuVisitedDays')) || [];

    if (!visitedDays.includes(today)) {
        visitedDays.push(today);
        localStorage.setItem('qiJuVisitedDays', JSON.stringify(visitedDays));
    }

    if (visitedDays.length > FREE_DAYS_LIMIT) {
        isRestrictedMode = true; 
    }
}

// 全域點擊攔截
document.addEventListener('click', (e) => {
    if (!isRestrictedMode || hasLockedDown) return;
    if (e.target.closest('#authGate')) return;

    validClickCount++;

    if (validClickCount === 1) {
        // 🎯 第 1 次點擊：放行他，但偷偷埋下「滑動地雷」
        armMovementTrap();
    } else if (validClickCount > 1) {
        // 如果他手速極快，在地雷啟動前又點了第 2 下，直接引爆
        e.preventDefault();  
        e.stopPropagation(); 
        triggerLockdown();
    }
}, true); 

// 💣 埋設滑動地雷 (延遲 0.8 秒啟動，給他看完第1次點擊效果的時間)
function armMovementTrap() {
    setTimeout(() => {
        if (hasLockedDown) return; 

        // 監聽：滑鼠移動、頁面滾動、手機觸控滑動、鍵盤按壓
        const trapEvents = ['mousemove', 'scroll', 'touchmove', 'keydown'];
        
        const detonateTrap = (e) => {
            if (hasLockedDown) return;
            // 如果他的滑鼠是在金鑰視窗裡面動，就不理他
            if (e.target && e.target.closest && e.target.closest('#authGate')) return;
            
            // 💥 引爆地雷！瞬間鎖死！
            triggerLockdown();

            // 拆除地雷監聽器 (避免重複觸發浪費效能)
            trapEvents.forEach(evt => document.removeEventListener(evt, detonateTrap, true));
        };

        // 把地雷掛載到全網頁
        trapEvents.forEach(evt => document.addEventListener(evt, detonateTrap, true));
        console.log("💣 滑動地雷已佈署！滑鼠一動即刻鎖死！");

    }, 800); // 800 毫秒的黃金延遲
}

// 🎯 關門放狗 + 終極鎖死 + 抹除泡泡框
function triggerLockdown() {
    if (hasLockedDown) return; 
    hasLockedDown = true; // 標記為已死亡狀態

    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    
    if (authGate) {
        authGate.style.display = 'block'; 
        authGate.classList.add('scatter-fly-in');  

        // 🚫 【終極鎖死魔法 1】禁止滾動、禁止反白、背景點擊失效
        document.body.style.overflow = 'hidden'; 
        document.body.style.userSelect = 'none'; 
        if (mainContent) {
            mainContent.style.pointerEvents = 'none'; 
            mainContent.style.filter = 'blur(8px)';   
        }

        // 🚫 【終極鎖死魔法 2】強制抹除所有推薦泡泡框！(防偷看)
        if (!document.getElementById('nukeTooltipsStyle')) {
            const style = document.createElement('style');
            style.id = 'nukeTooltipsStyle';
            style.innerHTML = `
                .pick-tooltip-container, .pick-tooltip {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transform: scale(0) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

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


    // 管理員金鑰走原本邏輯
    try {
        const ADMIN_KEY = atob(config.adminCode);
        if (userInput === ADMIN_KEY) {
            window.isAdmin = true;
            sessionStorage.setItem('verifiedKey', ADMIN_KEY);
            fullUnlockSystem();
            return;
        }
    } catch(e) {}

    // 會員金鑰走 API 驗證
    try {
        // 🚀 共存智慧分流：以金鑰是否包含 "V2" (不分大小寫) 來決定走哪支 API
        const isV2Key = userInput.toUpperCase().includes('V2');
        const apiUrl = isV2Key ? '/api/verify-key-v2' : '/api/verify-key';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: userInput })
        });

        const result = await response.json();

        if (result.valid) {
            if (isV2Key) {
                // 天次制：存入永久記憶 localStorage
                localStorage.setItem('verifiedKey_v2', userInput);
            } else {
                // 單次制：維持原本的暫時記憶 sessionStorage
                sessionStorage.setItem('verifiedKey', userInput);
            }
            sessionStorage.setItem('verifiedPlan', result.plan);
            sessionStorage.setItem('verifiedUser', result.user_name);
            sessionStorage.setItem('expiresAt', result.expires_at);
            
            // 新制額外提示剩餘天數
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
function openDoorForVisitor() {
    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    
    if (authGate) authGate.style.display = 'none'; 
    if (mainContent) mainContent.style.display = 'block'; 

    if (typeof window.init === 'function') window.init(); 
}

// 輸入正確密碼後的「完全解鎖與恢復原狀」
function fullUnlockSystem() {
    const authGate = document.getElementById('authGate');
    const mainContent = document.getElementById('mainContent');
    
    if (authGate) {
        authGate.classList.remove('scatter-fly-in');
        authGate.style.display = 'none'; 
    }
    if (mainContent) mainContent.style.display = 'block';

    // 🔓 解除所有鎖死魔法
    document.body.style.overflow = '';
    document.body.style.userSelect = '';
    if (mainContent) {
        mainContent.style.pointerEvents = '';
        mainContent.style.filter = '';
    }

    // 🔓 移除抹除泡泡框的咒語
    const nukeStyle = document.getElementById('nukeTooltipsStyle');
    if (nukeStyle) nukeStyle.remove();

    isRestrictedMode = false;
    validClickCount = 0;
    hasLockedDown = false; // 重置地雷狀態

    if (window.isAdmin === true) {
        if (typeof window.initAdminWidget === 'function') window.initAdminWidget();
        if (typeof window.initBackupWidget === 'function') window.initBackupWidget();
    }

    if (typeof window.init === 'function') window.init();
}

document.addEventListener('keypress', (e) => {
    const authGate = document.getElementById('authGate');
    if (authGate && authGate.style.display !== 'none' && e.key === 'Enter') {
        checkPasscode();
    }
});

// 🌟 【新增】LINE 收網組裝機：動態產生帶有記憶參數的官方連結
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

// 🌟 【新增】推廣者專用：產生雙軌分潤連結
window.generateShareLink = function(authorCode, promoterCode) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?author=${authorCode}&ref=${promoterCode}`;
};
