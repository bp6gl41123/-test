/* ========================================== */
/* ==== 【開發模組：雙軌金鑰驗證 - auth.js】 ==== */
/* ==== (V15.4 終極地雷版：1點擊+滑動即死) ==== */
/* ========================================== */

let isRestrictedMode = false; 
let validClickCount = 0;      
let hasLockedDown = false;    // 🔒 新增：確保鎖定咒語只會執行一次
const MAX_CLICKS = 1;         
const FREE_DAYS_LIMIT = 0;    

document.addEventListener('DOMContentLoaded', () => {
    const savedKey = sessionStorage.getItem('verifiedKey');
    if (typeof config !== 'undefined' && savedKey) {
        const isAdmin = savedKey === atob(config.adminCode);
const isMember = (config.memberKeys || []).some(m => atob(m.key) === savedKey);
if (isAdmin || isMember) {
    window.isAdmin = isAdmin;
            fullUnlockSystem(); 
            return; 
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
    const authBox = document.querySelector('.auth-box');
    const mainContent = document.getElementById('mainContent');
    
    if (authGate) {
        authGate.style.display = 'flex';
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

function checkPasscode() {
    const userInput = document.getElementById('passcodeInput').value;
    const errorMsg = document.getElementById('errorMsg');
    
    try {
        const ADMIN_KEY = atob(config.adminCode); 

if (userInput === ADMIN_KEY) {
    window.isAdmin = true;
    sessionStorage.setItem('verifiedKey', ADMIN_KEY);
    fullUnlockSystem();
    return;
}

        const matched = (config.memberKeys || []).find(m => atob(m.key) === userInput);
if (matched) {
    if (matched.expiry && new Date().toLocaleDateString('en-CA') > matched.expiry) {
        errorMsg.innerHTML = `⚠️ 金鑰已於 ${matched.expiry} 到期，請聯絡版大續約。`;
        errorMsg.style.display = 'block';
        return;
    }
    window.isAdmin = false;
    sessionStorage.setItem('verifiedKey', userInput);
    fullUnlockSystem();

        } else {
            errorMsg.style.display = 'block';
            const authBox = document.querySelector('.auth-box');
            if (authBox) {
                authBox.style.transform = 'translateX(10px)';
                setTimeout(() => authBox.style.transform = 'translateX(-10px)', 100);
                setTimeout(() => authBox.style.transform = 'translateX(0)', 200);
            }
        }
    } catch (e) {
        alert("系統密鑰配置錯誤，請聯絡開發端檢查 config.js");
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
