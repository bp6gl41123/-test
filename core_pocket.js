/* ============================================================== */
/* ==== 【功能模組：口袋系統 - core_pocket.js】 ==== */
/* ============================================================== */

window.userPocket = JSON.parse(localStorage.getItem('UserPocketDB')) || [];

// 🎯 【關鍵升級 3】接收並組合 sportKey，形成聯合鑰匙存入資料庫
window.toggleUserPocket = function(expertName, btnElement, sportKey) {
    let pocketKey = sportKey ? `${expertName}||${sportKey}` : expertName;
    
    const idx = window.userPocket.indexOf(pocketKey);
    if (idx > -1) { 
        window.userPocket.splice(idx, 1); 
        btnElement.className = 'pocket-add-btn'; 
        btnElement.innerHTML = '➕ 收錄寶庫'; 
    } else { 
        window.userPocket.push(pocketKey); 
        btnElement.className = 'pocket-add-btn saved'; 
        btnElement.innerHTML = '⭐ 已存寶庫'; 
    }
    localStorage.setItem('UserPocketDB', JSON.stringify(window.userPocket));
    
    if (typeof window.updatePocketWidget === 'function') window.updatePocketWidget(); 
};

(function initPocketWidget() {
    if (!document.getElementById('pocketWidgetStyle')) {
        const style = document.createElement('style'); style.id = 'pocketWidgetStyle';
        style.innerHTML = `
.floating-pocket-btn { position: fixed; top: calc(75% - 65px); right: -8px; transform: translateY(-50%); z-index: 9995; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; width: 75px; box-sizing: border-box; padding: 12px 10px 12px 18px; border-radius: 45px 0 0 45px; font-weight: 900; cursor: pointer; box-shadow: -8px 8px 30px rgba(0,0,0,0.5); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; gap: 4px; border: 2px solid rgba(255,255,255,0.2); text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            /* 🎯 正常狀態的懸浮展開 */
            .floating-pocket-btn:hover { right: 0; background: linear-gradient(135deg, #fbbf24, #f59e0b); padding-right: 22px; transform: translateY(-50%) scale(1.05); }
            
/* 🛡️ 隱形防護罩：向【右】擴大 40px 的點擊熱區，防止誤觸右側卡片 */
            .floating-recruit-btn::before { 
                content: ""; 
                position: absolute; 
                top: -20px; 
                bottom: -20px; 
                left: 0; 
                right: -200px; /* 👈 關鍵修正：向「右」偷出 40px 的隱形點擊區！ */
                background: transparent; 
            }

/* 🎯 視覺魔術版：利用 transform 平移縮進，實體維持在原位，絕對不會撐出白邊！ */
            .floating-pocket-btn.is-comparing { transform: translate(52px, -50%); opacity: 0.7; }
            .floating-pocket-btn.is-comparing:hover { transform: translate(-8px, -50%) scale(1.05); opacity: 1; }

            .pocket-badge { background: #dc2626; color: white; border-radius: 50%; padding: 3px 10px; font-size: 14px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); position: relative; top: -5px; }
            .pocket-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(15px); z-index: 10001; display: none; justify-content: center; align-items: center; opacity: 0; transition: 0.4s ease; }
            .pocket-modal-overlay.show { display: flex; opacity: 1; }
            .pocket-modal-content { background: #f8fafc; width: 95%; max-width: 800px; border-radius: 30px; overflow: hidden; box-shadow: 0 50px 120px rgba(0,0,0,0.8); transform: translateY(50px) scale(0.9); transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .pocket-modal-overlay.show .pocket-modal-content { transform: translateY(0) scale(1); }
            .pocket-modal-header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 25px 35px; display: flex; justify-content: space-between; align-items: center; color: #fbbf24; border-bottom: 5px solid #fbbf24; }
            .pocket-list { max-height: 75vh; overflow-y: auto; padding: 15px 0; margin: 0; list-style: none; }
            .pocket-item { padding: 25px 35px; border-bottom: 1px solid #e2e8f0; animation: pocketItemIn 0.5s ease-out backwards; }
            @keyframes pocketItemIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
            .pocket-item-name { font-weight: 900; font-size: 24px; color: #0f172a; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
            .pocket-item-text { color: #334155; font-size: 16px; line-height: 1.8; background: white; padding: 20px; border-radius: 20px; border: 1px solid #cbd5e1; box-shadow: inset 0 3px 10px rgba(0,0,0,0.05); font-weight: 500; }
            .pocket-remove-btn { color: #dc2626; font-size: 14px; cursor: pointer; font-weight: bold; background: #fee2e2; padding: 8px 16px; border-radius: 10px; transition: 0.2s; border: 1px solid transparent; }
            .pocket-remove-btn:hover { background: #fca5a5; border-color: #ef4444; }
            .pocket-modal-footer { padding: 30px; text-align: center; background: white; border-top: 1px solid #e2e8f0; }
            .pocket-clear-btn { background: #f1f5f9; color: #64748b; border: 2px solid #cbd5e1; padding: 14px 35px; border-radius: 15px; cursor: pointer; font-weight: 900; transition: 0.3s; font-size: 16px; }
            .pocket-clear-btn:hover { background: #dc2626; color: white; border-color: #dc2626; transform: scale(1.05); }
            /* 💡 新增的標籤 CSS */
            .pocket-sport-tag { font-size: 14px; background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin-left: 10px; vertical-align: middle; }
            @media (max-width: 1023px) {
                .pocket-modal-content { border-radius: 12px !important; max-height: 80vh !important; }
                .pocket-modal-header { padding: 10px 14px !important; }
                .pocket-modal-header h3 { font-size: 11px !important; letter-spacing: 0 !important; }
                .pocket-modal-header div { font-size: 20px !important; }
                .pocket-modal-content > div { padding: 4px 12px 2px !important; }
                .pocket-modal-content > div h4 { font-size: 10px !important; margin-bottom: 2px !important; }
                .pocket-modal-content > div ul { font-size: 8px !important; line-height: 1.3 !important; padding-left: 14px !important; }
                .pocket-modal-content > div > div { padding: 4px 8px !important; margin-top: 3px !important; line-height: 1.1 !important; }
                .pocket-modal-content > div > div strong { font-size: 10px !important; margin-bottom: 0px !important; }
                .pocket-modal-content > div > div span { font-size: 9px !important; margin-top: 0px !important; }
                .pocket-item { padding: 10px 14px !important; }
                .pocket-item-name { font-size: 10px !important; margin-bottom: 6px !important; }
                .pocket-item-text { font-size: 7px !important; padding: 8px !important; border-radius: 8px !important; line-height: 1.5 !important; }
                .pocket-remove-btn { font-size: 6px !important; padding: 3px 6px !important; border-radius: 5px !important; }
                .pocket-modal-footer { padding: 10px !important; }
                .pocket-clear-btn { padding: 6px 14px !important; font-size: 7px !important; border-radius: 8px !important; }
                .pocket-sport-tag { font-size: 6px !important; padding: 2px 5px !important; }
            }

/* 💻 真正的電腦版專屬：永久保持 Hover 展開狀態 */
@media (min-width: 1024px) {
    .floating-recruit-btn { 
        right: 0 !important; 
        padding-right: 22px !important; 
        background: linear-gradient(135deg, #6366f1, #3730a3) !important; 
    }
}

/* 📱 手機看網頁版專屬：阻斷文字膨脹 Bug、左右縮窄、上下拉長 */
@media (pointer: coarse) and (min-width: 1024px), (max-device-width: 1024px) and (min-width: 1024px) {
    .floating-recruit-btn { 
        width: 65px !important; 
        padding: 24px 12px 24px 12px !important; 
        -webkit-text-size-adjust: 100% !important; 
    }
}


        `; document.head.appendChild(style);
    }

    const floatBtn = document.createElement('div'); floatBtn.className = 'floating-pocket-btn';

    // 手機版：第一下展開，第二下開 Modal；電腦版直接開 Modal
    let pocketExpanded = false;
    
    // 1. 點擊邏輯
    floatBtn.addEventListener('click', function() {
        if (window.innerWidth < 1024) {
            // 🎯 只要按鈕滑出來了，或是變數是 true，點擊就直接開視窗！
            if (floatBtn.style.left === '0px' || pocketExpanded) {
                window.openPocketModal();
            } else {
                pocketExpanded = true;
                floatBtn.style.left = '0px';
            }
        } else {
            window.openPocketModal();
        }
    });

document.body.appendChild(floatBtn);

    // 2. 點擊外部縮回邏輯
    document.addEventListener('click', function(e) {
        if (pocketExpanded && !floatBtn.contains(e.target)) {
            pocketExpanded = false;
            if (typeof syncPocketBtnScale === 'function') syncPocketBtnScale();
        }
    });



const overlay = document.createElement('div'); overlay.className = 'pocket-modal-overlay';
    overlay.innerHTML = `
        <div class="pocket-modal-content" style="max-height: 90vh; display: flex; flex-direction: column;">
            
            <div class="pocket-modal-header" style="flex-shrink: 0;">
                <h3 style="margin:0;font-size:28px;letter-spacing:2px;font-weight:900;">🎁 我的寶庫精選推薦</h3>
                <div style="cursor:pointer;font-size:clamp(20px,4vw,50px);line-height:1;" onclick="closePocketModal()">&times;</div>
            </div>
            
            <div style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: clamp(4px, 1.5vw, 30px) clamp(14px, 3vw, 40px) clamp(2px, 0.8vw, 30px); text-align: left; font-family: sans-serif; flex-shrink: 0;">
                <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 24px; font-weight: 900;">💡 系統策略指南</h4>
                <ul style="margin: 0; padding-left: 28px; color: #475569; font-size: clamp(9px, 1.8vw, 20px); line-height: 1.8; font-weight: bold;">
                    <li style="margin-bottom: 10px;">任選 1~2 位您認為其成績有參考價值的好手即可。</li>
                    <li><span style="color: #1877f2;">鎖定單一選手，請「照單全跟」：</span><br>若您任意挑選牌支，成績就不會反映在您的真實損益上。<br>
                    <span style="font-size: clamp(8px, 1.5vw, 17px); color: #64748b; font-weight: normal; margin-top: 6px; display: inline-block;">(譬如：好手們常均三過二，就是他的三場全下，才有三過二的獲利)</span></li>
                </ul>

                <div style="background: #fff5f5; border: 2px solid #fecaca; border-left: 8px solid #ef4444; padding: clamp(6px, 1vw, 20px) clamp(10px, 2vw, 25px); border-radius: 10px; margin-top: clamp(6px, 1vw, 25px); box-shadow: 0 5px 10px rgba(239, 68, 68, 0.15);">
                    <strong style="color: #dc2626; font-size: clamp(10px, 2vw, 24px); display: block; margin-bottom: clamp(4px, 0.8vw, 10px); letter-spacing: 1px;">🚨 台灣運彩玩家 專屬策略</strong>
                    <span style="color: #991b1b; font-weight: 900; font-size: clamp(9px, 1.9vw, 22px); line-height: 1.1; display: inline-block;">反饋最好的玩法：選 1 場 (搭配另外 1 人)，合用 2X1 即可！</span><br>
                    <span style="color: #dc2626; font-size: clamp(8px, 1.6vw, 18px); font-weight: bold; margin-top: clamp(3px, 0.6vw, 8px); display: inline-block;">(備註：若該兩位好手，剛好有當日運彩單場，僅玩運彩單場！)</span>
                </div>
            </div>

            <ul class="pocket-list" id="pocketListArea" style="flex: 1; overflow-y: auto; min-height: 0; max-height: none;"></ul>
            
            <div class="pocket-modal-footer" style="flex-shrink: 0;">
                <button class="pocket-clear-btn" onclick="clearPocket()">🗑️ 清空所有收錄預測單</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

window.updatePocketWidget = () => {
        if (window.userPocket.length > 0) { 
            floatBtn.style.display = 'flex'; 
// core_pocket.js 對應的修改參考：
const isMobile = window.innerWidth < 1024;
const scale = isMobile ? window.innerWidth / 980 : 1;
const emojiSize = Math.round(20 * scale) + 'px';
const textSize = Math.round(16 * scale) + 'px';
floatBtn.innerHTML = `
    <span style="font-size:${emojiSize};">🎁</span>
    <span style="font-size:${textSize}; margin-top:2px; letter-spacing:1px; font-weight:900;">我的</span>
    <span style="font-size:${textSize}; letter-spacing:1px; font-weight:900;">寶庫</span>
    <span class="pocket-badge" style="font-size:${Math.round(14*scale)}px; padding:${Math.round(3*scale)}px ${Math.round(10*scale)}px; top:${Math.round(-5*scale)}px;">${window.userPocket.length}</span>
`;
        } else { 
            floatBtn.style.display = 'none'; 
        }
    };

window.openPocketModal = () => {
        const listArea = document.getElementById('pocketListArea'); listArea.innerHTML = '';
        if (window.userPocket.length === 0) { 
            listArea.innerHTML = '<div style="padding: 100px 20px; text-align: center; color: #94a3b8; font-weight:bold; font-size:20px;">您的專屬寶庫目前空空如也！<br><small style="font-weight:normal;">快去排行榜點擊「➕ 收錄寶庫」吧！</small></div>'; 
        } else {
            const itemNames = {
                "nba_main": "🏀 NBA主推", "mlb_main": "⚾ MLB主推",
                "npb_runline": "日棒讓分", "npb_ml": "日棒獨贏", "npb_total": "日棒大小", "npb_1h_runline": "日棒上半讓分", "npb_1h_ml": "日棒上半獨贏", "npb_1h_total": "日棒上半大小",
                "nba_team": "NBA 讓分盤", "nba_total": "NBA 大小分",
                "mlb_ml": "MLB 獨贏", "mlb_runline": "MLB 讓分盤", "mlb_total": "MLB 大小分", "mlb_ml_high": "MLB 高賠獨贏",
                "nhl_ml": "冰球獨贏(含加時)", "nhl_ml_reg": "冰球獨贏(不含加時)", "nhl_spread_ot": "冰球讓盤(含加時)", "nhl_spread_reg": "冰球讓盤(不含加時)", 
                "nhl_total_ot": "冰球大小(含加時)", "nhl_total_reg": "冰球大小(不含加時)", "khl_team": "俄冰隊伍", "khl_total": "俄冰大小分",
                
                "soccer_team": "足球隊伍", "soccer_total": "足球大小分", "soccer_ml": "足球獨贏", "soccer_btts": "足球兩隊進球",
                "euro_team": "歐籃隊伍", "euro_total": "歐籃大小", "cba_team": "中籃隊伍","jbl_team": "日籃讓盤", "jbl_total": "日籃大小", "kbl_team": "韓籃隊伍", "kbl_total": "韓籃大小", "nbl_team": "澳籃隊伍",
                "lol_team": "電競隊伍", "lol_total": "電競大小"
            };

            // 🎯 移植專屬排版引擎：將單行文字自動轉換為「垂直清單」
            const formatVertical = (text) => {
                if (!text) return '';
                if (text.includes('\n')) return text.replace(/\n/g, '<br>');
                if (text.includes('：') || text.includes(':')) {
                    let parts = text.split(/：|:/);
                    let title = parts[0].trim();
                    let itemsStr = parts.slice(1).join(':').trim();
                    let items = itemsStr.split(/、|，|,/);
                    let html = `<div style="color:#1e293b; font-weight:900; margin-bottom:5px;">${title}</div>`; // 口袋名單底色是白的，標題改用深色
                    html += items.map(item => `<div style="padding-left: 8px; line-height: 1.5;">${item.trim()}</div>`).join('');
                    return html;
                }
                return text;
            };

            window.userPocket.forEach((pocketKey, index) => {
                let name = pocketKey;
                let savedSportKey = "";
                if (pocketKey.includes("||")) {
                    let parts = pocketKey.split("||");
                    name = parts[0];
                    savedSportKey = parts[1];
                }

                let finalContent = "";
                
                // 🎯 同步 Tooltip 邏輯：精準抓取第 3 欄位資料
                if (typeof todayPicks !== 'undefined') {
                    if (Array.isArray(todayPicks)) {
                        const foundAll = todayPicks.filter(p => p[0] === name);
                        if (foundAll.length > 0) {
                            if (foundAll[0].length >= 3) {
                                // 新版 3 欄位格式
                                const exactMatch = foundAll.find(p => p[1] === savedSportKey);
                                if (exactMatch) finalContent = formatVertical(exactMatch[2]);
                            } else {
                                // 相容舊版 2 欄位格式
                                let rawText = foundAll[0][1] || "";
                                finalContent = typeof window.filterPickText === 'function' ? window.filterPickText(rawText, savedSportKey) : rawText;
                            }
                        }
                    } else {
                        // 最舊的 Object 格式相容
                        let rawText = todayPicks[name] || "";
                        finalContent = typeof window.filterPickText === 'function' ? window.filterPickText(rawText, savedSportKey) : rawText;
                    }
                }

                let pickText = finalContent ? finalContent : '<span style="color:#94a3b8; font-weight:normal;">今日該好手尚未發布任何推薦</span>';
                let tagHtml = savedSportKey ? `<span class="pocket-sport-tag">${itemNames[savedSportKey] || '通用'}</span>` : '';

                listArea.innerHTML += `
                <li class="pocket-item" style="animation-delay: ${index * 0.1}s;">
                    <div class="pocket-item-name">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${name} ${tagHtml}
                        </div>
                        <span class="pocket-remove-btn" onclick="window.removePocketItem('${pocketKey}')">移除</span>
                    </div>
                    <div class="pocket-item-text">${pickText}</div>
                </li>`;
            });
        }
        overlay.classList.add('show');
        // 手機版強制縮小上半部
        if (window.innerWidth < 1024) {
            const strategyDiv = overlay.querySelector('.pocket-modal-content > div:not(.pocket-modal-header):not(.pocket-modal-footer)');
            if (strategyDiv) {
                strategyDiv.style.padding = '6px 12px 4px';
                const h4 = strategyDiv.querySelector('h4');
                if (h4) { h4.style.fontSize = '11px'; h4.style.margin = '0 0 4px 0'; }
                const ul = strategyDiv.querySelector('ul');
                if (ul) { ul.style.fontSize = '9px'; ul.style.lineHeight = '1.3'; ul.style.paddingLeft = '14px'; }
                const li = strategyDiv.querySelectorAll('li');
                li.forEach(l => l.style.marginBottom = '2px');
                // 直接用 id 強制抓紅框
               const redBox = overlay.querySelector('.pocket-modal-content > div:nth-child(2) > div:last-child');
                if (redBox) {
                    redBox.setAttribute('style', 'background:#fff5f5; border:2px solid #fecaca; border-left:8px solid #ef4444; padding:5px 8px; border-radius:10px; margin-top:5px; box-shadow:0 5px 10px rgba(239,68,68,0.15);');
                    const strong = redBox.querySelector('strong');
                    if (strong) strong.setAttribute('style', 'color:#dc2626; font-size:10px; display:block; margin-bottom:2px; letter-spacing:0;');
                    const spans = redBox.querySelectorAll('span');
                    if (spans[0]) spans[0].setAttribute('style', 'color:#991b1b; font-weight:900; font-size:9px; line-height:1.2; display:inline-block;');
                    if (spans[1]) spans[1].setAttribute('style', 'color:#dc2626; font-size:8px; font-weight:bold; margin-top:1px; display:inline-block;');
                }
            }
        }
    };

    window.closePocketModal = () => overlay.classList.remove('show');
    
    // 🎯 刪除按鈕邏輯也升級為對準「聯合鑰匙」
    window.removePocketItem = (pocketKey) => {
        const idx = window.userPocket.indexOf(pocketKey);
        if(idx > -1) { 
            window.userPocket.splice(idx, 1); 
            localStorage.setItem('UserPocketDB', JSON.stringify(window.userPocket)); 
            window.updatePocketWidget(); 
            window.openPocketModal(); 
            if (typeof window.renderDisplay === 'function') window.renderDisplay(); 
        }
    };

    window.clearPocket = () => {
        if(!confirm('🚨 確定要清空所有的收錄預測單嗎？')) return;
        window.userPocket = []; 
        localStorage.setItem('UserPocketDB', JSON.stringify(window.userPocket)); 
        window.updatePocketWidget(); 
        window.closePocketModal(); 
        if (typeof window.renderDisplay === 'function') window.renderDisplay();
    };

    window.updatePocketWidget();

    // 手機版縮放同步
    function syncPocketBtnScale() {
        if (window.innerWidth < 1024) {
            const scale = window.innerWidth / 980;
            const w = Math.round(75 * scale);
            floatBtn.style.right = 'auto';
            floatBtn.style.width = w + 'px';
            floatBtn.style.height = Math.round(270 * scale) + 'px';
            floatBtn.style.left = '-' + Math.round(w - 14) + 'px';

            floatBtn.style.borderRadius = '0 45px 45px 0';
            floatBtn.style.padding = Math.round(8*scale) + 'px ' + Math.round(12*scale) + 'px ' + Math.round(8*scale) + 'px ' + Math.round(6*scale) + 'px';
            floatBtn.style.fontSize = Math.round(33*scale) + 'px';
            floatBtn.style.transform = '';
        } else {
            floatBtn.style.width = '';
            floatBtn.style.height = '';
            floatBtn.style.left = '';
            // 👇 補上這行：清除手機版的右側鎖定，讓它乖乖回歸 CSS 的預設右邊！
            floatBtn.style.right = ''; 
            floatBtn.style.borderRadius = '';
            floatBtn.style.padding = '';
            floatBtn.style.fontSize = '';
            floatBtn.style.transform = '';
        }
    }
    window.addEventListener('resize', syncPocketBtnScale);
    syncPocketBtnScale();

    // 🎯 方案 B 全域開關：讓主程式可以呼叫此函數來切換按鈕位置
    window.setFloatingButtonsCompareMode = function(isComparing) {
        const pocketBtn = document.querySelector('.floating-pocket-btn');
        const recruitBtn = document.querySelector('.floating-recruit-btn');
        if (isComparing) {
            if (pocketBtn) pocketBtn.classList.add('is-comparing');
            if (recruitBtn) recruitBtn.classList.add('is-comparing');
        } else {
            if (pocketBtn) pocketBtn.classList.remove('is-comparing');
            if (recruitBtn) recruitBtn.classList.remove('is-comparing');
        }
        // 手機版：交給 checkScrollPosition 控制，不用 is-comparing
        if (window.innerWidth < 1024) {
            if (pocketBtn) pocketBtn.classList.remove('is-comparing');
            if (recruitBtn) recruitBtn.classList.remove('is-comparing');
        }
    };
// 手機版：偵測是否在上半部，自動露出按鈕
    if (window.innerWidth < 1024) {
        function checkScrollPosition() {
            if (window.innerWidth >= 1024) return;

            const details = document.getElementById('details');
            const pocketBtn = document.querySelector('.floating-pocket-btn');
            const recruitBtn = document.querySelector('.floating-recruit-btn');
            if (!details || !pocketBtn || !recruitBtn) return;

            const detailsTop = details.getBoundingClientRect().top;
            const isInUpperArea = detailsTop > window.innerHeight * 0.5;

            if (isInUpperArea) {
                // 上半部：露出按鈕
                const scale = window.innerWidth / 980;
                const w = Math.round(75 * scale);
                pocketBtn.style.left = '-' + Math.round(w - 14) + 'px';
                recruitBtn.style.left = '-' + Math.round(w - 14) + 'px';
            } else {
                // 下半部：完全縮回去
                const scale = window.innerWidth / 980;
                const w = Math.round(75 * scale);
                pocketBtn.style.left = '-' + w + 'px';
                recruitBtn.style.left = '-' + w + 'px';
            }
        }
        window.addEventListener('scroll', checkScrollPosition);
        checkScrollPosition();
    }

})();