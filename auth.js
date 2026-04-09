

/* ========================================== */
/* ==== 【齊聚眾選：雙軌身分防禦系統 - auth.js】 ==== */
/* ==== (高科技重金屬奢華版 UI + 精準漏斗攔截邏輯) ==== */
/* ========================================== */

const LIFF_ID = '2009615655-TqsOx6OE'; 
const BROWSE_TIME_LIMIT = 5000;   /*const BROWSE_TIME_LIMIT = 5000;    */
let globalDoorTimer = null;

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 0;  /* 👉 測試地雷請改 0 */
const isMeta = /FBAN|FBAV|FBIOS|FBSV|FBSS|FB_IAB|Instagram|Barcelona/i.test(navigator.userAgent);

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

// 🌟 本地天數追蹤 (邏輯修復：只回傳結果，不無差別埋雷)
function trackVisitorDays() {
    const today = new Date().toLocaleDateString('en-CA'); 
    let visitedDays = JSON.parse(localStorage.getItem('qiJuVisitedDays')) || [];

    if (!visitedDays.includes(today)) {
        visitedDays.push(today);
        localStorage.setItem('qiJuVisitedDays', JSON.stringify(visitedDays));
    }
    // 回傳 true 代表試用期已滿
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

    // 🌟 升級版：核彈重置暗門 (殺光金鑰、LINE 登入記憶、訪客天數)
    if (window.location.search.includes('action=reset')) {
        const pwd = prompt('請輸入管理員密碼');
        if (pwd !== '1') {
            alert('❌ 密碼錯誤');
            window.location.href = window.location.pathname;
            return;
        }
        localStorage.clear();
        sessionStorage.clear();
        alert('💥 系統已重置：LINE 登入、金鑰、天數皆已清除，您現在是全新小白訪客！');
        window.location.href = window.location.pathname;
        return;
    }

    // Meta 環境：泡泡框從渲染開始就模糊
    if (isMeta) {
        const s = document.createElement('style');
        s.innerHTML = `.pick-tooltip { filter: blur(10px) !important; user-select: none !important; }`;
        document.head.appendChild(s);
    }

    trackReferrals(); 

    // 管理員地雷測試
    if (window.location.search.includes('test=lock')) {
        setTimeout(() => { isRestrictedMode = true; }, 300);
    }

    // ==========================================
    // 🛡️ 漏斗第一層：實體金鑰檢查 (優先權最高)
    // ==========================================
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
                return; // 試用/金鑰正常，放行
            } else {
                // 🚨 邏輯修復：金鑰過期，不再瞬間死刑！改為「開啟地雷模式」
                console.log('❌ 金鑰已過期！啟動地雷模式 (未點擊前可無限滑動)');
                localStorage.removeItem('qiJu_Key');
                localStorage.removeItem('qiJu_ExpiresAt');
                
                isRestrictedMode = true; // 將地雷通電
                
                // 顯示主頁面讓他看，直到他點擊才會觸發地雷
                const mainContent = document.getElementById('mainContent');
                if (mainContent) mainContent.style.display = 'block'; 
                if (typeof window.init === 'function') window.init();
                return; // 終止後續判斷，因為他已經是過期黑名單
            }
        }
    }

    window.isAdmin = false;

    // ==========================================
    // 🛡️ 漏斗第二層：LINE 登入狀態檢查
    // ==========================================
    let liffLoggedIn = false;
    try {
        const liff = await loadLiffSdk();
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
            liffLoggedIn = true;
            // ✅ 記錄登入成功事件
            try {
                const profile = await liff.getProfile();
                fetch('/api/track-login-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: 'login_success',
                        line_user_id: profile.userId
                    })
                }).catch(() => {});
            } catch(e) {}
        }
    } catch (err) {
        console.error('⚠️ LIFF 初始化失敗，忽略錯誤繼續');
    }

    // ==========================================
    // 🎯 終極防禦判斷 (落實兩段式邏輯)
    // ==========================================
    if (liffLoggedIn) {
    // 情況 A：LINE 登入成功，交給後端資料庫判斷試用期
    try {
        const profile = await liff.getProfile();
        const ref = localStorage.getItem('qiJu_ref') || null;

        const checkRes = await fetch('/api/apicheck-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                line_user_id: profile.userId,
                ref_code: ref
            })
        });
        const checkData = await checkRes.json();

        if (checkData.status === 'active_free' || checkData.status === 'active_paid') {
            // ✅ 試用期內或付費用戶 → 放行
            fullUnlockSystem();
        } else {
            // ❌ 試用期結束 → 鎖定
            isRestrictedMode = true;
            console.log("💣 資料庫確認試用期滿，地雷模式已開啟！");
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.style.display = 'block';
            if (typeof window.init === 'function') window.init();
        }
    } catch(e) {
        // API 失敗時，保守放行避免誤傷
        console.error('apicheck-user 失敗，保守放行', e);
        fullUnlockSystem();
    }

    } else {
        // 情況 B：未登入 LINE 的新客
        trackVisitorDays();
        isRestrictedMode = false;

        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'block'; 
        if (typeof window.init === 'function') window.init(); 

        if (isMeta) {
            // Meta 平台：不跳第一道門，泡泡框時段引爆另外處理
            console.log("📱 Meta 平台訪客，跳過第一道門");
        } else {
            // 一般訪客：點擊一次才觸發登入視窗
            console.log("🚪 未登入訪客，等待第一次點擊");
            
            const onFirstClick = () => {
                if (document.getElementById('premium-auth-modal')) return;
                showNewDoor();
                document.removeEventListener('click', onFirstClick, true);
            };
            document.addEventListener('click', onFirstClick, true);
        }
    }
});

/* ========================================== */
/* 💣 地雷防禦系統 (只剩泡泡框引爆，限時 22:00～10:00)
/* ========================================== */
function isInActiveHours() {
    try {
        const now = new Date();
        const twHour = (now.getUTCHours() + 8) % 24;
        return true;              /* return twHour >= 22 || twHour < 10; */
    } catch (e) {
        return false;
    }
}

// 由 core_tooltips.js 的泡泡框點擊時呼叫
window.tooltipGateTrigger = function() {

    if (isMeta) {
        document.querySelectorAll('.pick-tooltip').forEach(el => {
            el.style.filter = 'blur(10px)';
        });
        setTimeout(() => { showMetaLoginPrompt(); }, 400);
        return false; // 先讓泡泡框顯示出來（模糊）
    }

    // 一般用戶：試用期到 → 引爆第二道門
    if (!isRestrictedMode || hasLockedDown) return false;

    // ⏰ 台灣時間 22:00～10:00 才觸發地雷
    if (!isInActiveHours()) return true;     // 非時段內，正常顯示泡泡框

    document.querySelectorAll('.pick-tooltip').forEach(el => {
        el.style.filter = 'blur(10px)';
    });
    setTimeout(() => { triggerLockdown(); }, 400);
    return false; // 先讓泡泡框顯示出來（模糊）
};

// Meta 平台專屬：登入提示視窗
function showMetaLoginPrompt() {
    if (document.getElementById('meta-login-prompt')) return;

    const prompt = document.createElement('div');
    prompt.id = 'meta-login-prompt';
    prompt.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.4s ease;`;

    prompt.innerHTML = `
        <div style="background:#fff;border-radius:40px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);width:94%;max-width:900px;font-family:'PingFang TC','Microsoft JhengHei',sans-serif;">
            <div style="background:linear-gradient(135deg,#1a0e00,#3a2000);padding:48px 60px;display:flex;align-items:center;gap:32px;">
                <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#f5c842,#c8860a);display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:900;color:#fff;flex-shrink:0;border:6px solid #e8c040;">聚</div>
                <div>
                    <div style="font-size:40px;font-weight:900;color:#fff;margin-bottom:8px;">齊聚眾選 多人預測系統</div>
                    <div style="font-size:32px;color:rgba(255,255,255,0.65);">專家推薦 · 會員限定內容</div>
                </div>
            </div>
            <div style="padding:50px 60px;">
                <div style="font-size:40px;font-weight:900;color:#1a1a1a;margin-bottom:12px;">🔒 解鎖專家推薦內容</div>
                <div style="font-size:30px;color:#94a3b8;margin-bottom:36px;line-height:1.6;">加入官方 LINE 帳號，即可解鎖全站專家推薦</div>
                <div style="background:#fffbea;border:1px solid #f0d060;border-radius:20px;padding:32px 36px;margin-bottom:36px;">
                    <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:20px;font-size:32px;color:#5a3e00;line-height:1.6;"><div style="background:#d4a017;color:#fff;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;flex-shrink:0;margin-top:2px;">1</div>瀏覽全站專家推薦</div>
                    <div style="display:flex;align-items:flex-start;gap:20px;font-size:32px;color:#5a3e00;line-height:1.6;"><div style="background:#d4a017;color:#fff;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;flex-shrink:0;margin-top:2px;">2</div>點擊下方按鈕加入官方 LINE</div>
                </div>
                <button onclick="handleMetaOpenUrl()" style="width:100%;padding:40px;background:linear-gradient(180deg,#06C755,#048b3b);color:#fff;border:none;border-top:1px solid rgba(255,255,255,0.3);border-bottom:2px solid #025c28;border-radius:24px;font-size:36px;font-weight:900;cursor:pointer;box-shadow:0 4px 0 #025c28,0 6px 15px rgba(6,199,85,0.25);font-family:'PingFang TC','Microsoft JhengHei',sans-serif;">🟢 敲一下官方LINE 即可解鎖全站</button>
            </div>
        </div>
    `;

    document.body.appendChild(prompt);
    setTimeout(() => { prompt.style.opacity = '1'; }, 50);
}

function handleMetaOpenUrl() {
    const message = encodeURIComponent('版大請幫我解鎖全站內容');
    window.location.href = `https://line.me/R/oaMessage/@yhd0256r/?${message}`;
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
        // 🚨 救回：防偷看泡泡框抹除術
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

    // 🚨 救回：防偷看泡泡框抹除術 (在新門也生效)
    if (!document.getElementById('nukeTooltipsStyle')) {
        const style = document.createElement('style');
        style.id = 'nukeTooltipsStyle';
        style.innerHTML = `.pick-tooltip-container, .pick-tooltip { display: none !important; opacity: 0 !important; visibility: hidden !important; transform: scale(0) !important; }`;
        document.head.appendChild(style);
    }

    // 🎯 破謊雷達 V2：加入基因檢測，徹底區分電腦與手機
    let envClass = 'env-desktop'; // 預設：電腦版
    const windowW = window.innerWidth;
    
    // 驗 DNA：確認是不是真的是手機或平板
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileDevice) {
        const isLineApp = /Line\//i.test(navigator.userAgent);
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isLineApp) {
            envClass = 'env-line-mobile'; // LINE 內建瀏覽器 → 正常縮放
        } else if (windowW > 800 && isPortrait) {
            envClass = 'env-mobile-web'; // 網頁寬+手機直立 → 專屬尺寸
        } else if (windowW > 800) {
            envClass = 'env-ant-view'; // 原生瀏覽器畫布異常大 → 超大版
        } else {
            envClass = 'env-mobile-native'; // 原生手機瀏覽器 → 放大版
        }
    } else {
        // 如果是電腦 (不管螢幕多小、有沒有開 F12)，強制鎖死電腦版外觀
        envClass = 'env-desktop';
    }

    // 🌟 注入專屬三界 CSS (完美繼承你所有高科技重金屬視覺)
    if (!document.getElementById('qijuModalStyles')) {
        const css = document.createElement('style');
        css.id = 'qijuModalStyles';
css.innerHTML = `
            .qiju-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                display: flex; justify-content: center; align-items: center;
                z-index: 2147483647; background: rgba(0,0,0,0.55);
                opacity: 0; transition: opacity 0.5s ease;
            }
            .qiju-modal-box {
                background: #ffffff; border: 1px solid #e8e0cc; border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                text-align: center; font-family: "PingFang TC","Microsoft JhengHei",sans-serif;
                pointer-events: auto; position: relative; overflow: hidden; box-sizing: border-box;
            }
            .qiju-modal-deco { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #d4a017, #f5c842, #d4a017); }
            .qiju-modal-logo { background: #1a0e00; border-radius: 50%; display:flex; align-items:center; justify-content:center; color:#d4a017; font-weight:900; border: 3px solid #b48608; box-shadow: 0 6px 18px rgba(0,0,0,0.4); margin: 0 auto; }
            .qiju-modal-title { color: #1a1a1a; font-weight: 900; margin: 0 0 20px; }
            .qiju-benefit-banner { margin-bottom: 18px; padding: 12px 14px; text-align: center; }
            .qiju-benefit-icon { font-size: 20px; display: block; margin-bottom: 4px; }
            .qiju-benefit-text { color: #7a5500; font-weight: 600; font-size: 13px; }
            .qiju-modal-btn-line { width: 100%; box-sizing: border-box; background: linear-gradient(180deg, #06C755 0%, #048b3b 100%); color: white; border: none; border-top: 1px solid rgba(255,255,255,0.4); border-bottom: 2px solid #025c28; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 0 #025c28, 0 6px 15px rgba(6,199,85,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.3); transition: 0.2s; }
.qiju-modal-btn-open { width: 100%; box-sizing: border-box; background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%); color: #06C755; border: 2px solid #06C755; border-bottom: 3px solid #048b3b; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 0 #048b3b, 0 6px 15px rgba(6,199,85,0.15); transition: 0.2s; font-family: "PingFang TC","Microsoft JhengHei",sans-serif; }
            .qiju-modal-open-hint { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
            .env-desktop .qiju-modal-btn-open { padding: 16px; font-size: 16px; }
            .env-line-mobile .qiju-modal-btn-open { padding: 14px; font-size: 15px; }
           
            .qiju-modal-btn-line .line-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.4); flex-shrink: 0; animation: qiju-dot-pulse 2s ease-in-out infinite; }
            @keyframes qiju-dot-pulse { 0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 0 5px rgba(255,255,255,0.15); } }

            /* 電腦版 */
            .env-desktop .qiju-modal-box { width: 90%; max-width: 420px; padding: 40px 25px; }
            .env-desktop .qiju-modal-logo { width: 70px; height: 70px; font-size: 30px; margin-bottom: 20px; }
            .env-desktop .qiju-modal-title { font-size: 24px; letter-spacing: 2px; }
            .env-desktop .qiju-modal-btn-line { padding: 16px; font-size: 17px; }

            /* 手機版 */
            .env-line-mobile .qiju-modal-box { width: 85%; padding: 30px 20px; }
            .env-line-mobile .qiju-modal-logo { width: 60px; height: 60px; font-size: 26px; margin-bottom: 15px; }
            .env-line-mobile .qiju-modal-title { font-size: 20px; letter-spacing: 1px; }
            .env-line-mobile .qiju-modal-btn-line { padding: 14px; font-size: 15px; }
            .env-line-mobile .qiju-benefit-banner { padding: 10px 12px; margin-bottom: 14px; }

/* 📱 原生手機瀏覽器 */
            .env-mobile-native .qiju-modal-box { width: 88%; max-width: 600px; padding: 55px 40px 45px; }
            .env-mobile-native .qiju-modal-logo { width: 110px; height: 110px; font-size: 48px; margin-bottom: 28px; }
            .env-mobile-native .qiju-modal-title { font-size: 38px; letter-spacing: 3px; }
            .env-mobile-native .qiju-modal-btn-line { padding: 26px; font-size: 28px; border-radius: 16px; }
            .env-mobile-native .qiju-benefit-banner { padding: 18px; margin-bottom: 24px; }
            .env-mobile-native .qiju-benefit-icon { font-size: 32px; }
            .env-mobile-native .qiju-benefit-text { font-size: 22px; }


/* 📱 網頁寬+手機直立 (Chrome手機版) */
            .env-mobile-web .qiju-modal-box { width: 88%; max-width: 600px; padding: 55px 40px 45px; }
            .env-mobile-web .qiju-modal-logo { width: 110px; height: 110px; font-size: 48px; margin-bottom: 28px; }
            .env-mobile-web .qiju-modal-title { font-size: 38px; letter-spacing: 3px; }
            .env-mobile-web .qiju-modal-btn-line { padding: 26px; font-size: 28px; border-radius: 16px; }
            .env-mobile-web .qiju-benefit-banner { padding: 18px; margin-bottom: 24px; }
            .env-mobile-web .qiju-benefit-icon { font-size: 32px; }
            .env-mobile-web .qiju-benefit-text { font-size: 22px; }

/* 🌐 網頁版寬度+手機直立：強制放大覆蓋 */
            @media screen and (min-width: 801px) and (orientation: portrait) {
                .qiju-modal-box { width: 94% !important; max-width: 1300px !important; padding: 130px 130px 110px !important; border-radius: 55px !important; }
                .qiju-modal-deco { height: 18px !important; }
                .qiju-modal-logo { width: 290px !important; height: 290px !important; font-size: 132px !important; margin-bottom: 64px !important; border-width: 10px !important; }
                .qiju-modal-title { font-size: 104px !important; letter-spacing: 9px !important; margin-bottom: 64px !important; padding: 0 40px !important; }
                .qiju-modal-btn-line { padding: 60px 76px !important; font-size: 78px !important; border-radius: 38px !important; gap: 36px !important; }
                .qiju-modal-btn-line .line-dot { width: 42px !important; height: 42px !important; }
                .qiju-benefit-banner { padding: 40px !important; margin-bottom: 56px !important; border-radius: 32px !important; }
                .qiju-benefit-icon { font-size: 90px !important; margin-bottom: 14px !important; }
                .qiju-benefit-text { font-size: 60px !important; }
            }

            /* 螞蟻視角 */
            .env-ant-view .qiju-modal-box { width: 1250px; padding: 110px 80px; border-radius: 45px; border-width: 6px; }
            .env-ant-view .qiju-modal-deco { height: 18px; }
            .env-ant-view .qiju-modal-logo { width: 200px; height: 200px; font-size: 90px; margin-bottom: 55px; border-width: 8px; }
            .env-ant-view .qiju-modal-title { font-size: 80px; letter-spacing: 6px; margin-bottom: 70px; }
            .env-ant-view .qiju-modal-btn-line { padding: 50px; font-size: 50px; border-radius: 25px; border-width: 5px; }
            .env-ant-view .qiju-benefit-banner { padding: 35px; margin-bottom: 50px; border-radius: 30px; }
            .env-ant-view .qiju-benefit-icon { font-size: 60px; }
            .env-ant-view .qiju-benefit-text { font-size: 40px; }
        `;
        document.head.appendChild(css);


    }

    const modal = document.createElement('div');
    modal.id = 'premium-auth-modal';
    modal.className = `qiju-modal-overlay ${envClass}`; // 套用背景與雷達偵測到的環境 Class

    // HTML 結構被極致淨化，原本的所有呼叫、ID、推廣變數皆 100% 完美保留
    modal.innerHTML = `
        <div class="qiju-modal-box">
            <div class="qiju-modal-deco"></div>
            <div class="qiju-modal-logo">聚</div>
            <h2 class="qiju-modal-title">齊聚眾選<br>多人預測系統</h2>
            <div class="qiju-benefit-banner">
                <span class="qiju-benefit-icon">👑</span>
                <div class="qiju-benefit-text">LINE 登入享受 會員待遇 解鎖全站</div>
            </div>
            <button class="qiju-modal-btn-line" onclick="handleTransitionLogin('line')">
                <div class="line-dot"></div>
                <span>使用 LINE 一鍵快速登入</span>
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => { modal.style.opacity = '1'; }, 50);
}


// 🚨 升級版：LINE 登入過場動畫 (自帶破謊雷達，動態放大)
function handleTransitionLogin(type) {
    if (type === 'line') {
// ✅ 記錄點擊登入事件
        fetch('/api/track-login-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: 'click' })
        }).catch(() => {});
        // 🎯 啟動微型破謊雷達：決定放大倍率
        let scale = 1; // 預設 1 倍 (電腦版、LINE 內建瀏覽器)
        const screenW = window.screen.width;
        const windowW = window.innerWidth;
        
        if ((screenW <= 768 || window.screen.height <= 768) && windowW > 800) {
            scale = 3; // 原生瀏覽器騙局，強制放大 3 倍！
        }

        // 動態計算大小
        const spinnerSize = 50 * scale;
        const borderThickness = 3 * scale;
        const fontSize = 18 * scale;
        const marginBottom = 20 * scale;

        document.body.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#d4af37;">
                <div style="width: ${spinnerSize}px; height: ${spinnerSize}px; border: ${borderThickness}px solid #333; border-top: ${borderThickness}px solid #d4af37; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom:${marginBottom}px;"></div>
                <h3 style="font-size: ${fontSize}px; letter-spacing: ${2 * scale}px; margin: 0;">建立安全連線中...</h3>
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
    // ✅ 清除計時器，防止登入後還跳視窗
    if (globalDoorTimer) {
        clearTimeout(globalDoorTimer);
        globalDoorTimer = null;
    }

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
    
    // 🚨 救回：解除鎖定時，拔除抹除泡泡框的咒語
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

// 🌟 推廣連結動態組裝 (完整保留)
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
