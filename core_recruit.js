/* ============================================================== */
/* ==== 【功能模組：收入麾下 (追蹤系統) - core_recruit.js】 ==== */
/* ============================================================== */

window.userRecruit = JSON.parse(localStorage.getItem('UserRecruitDB')) || [];

// 🎯 收錄按鈕觸發邏輯
window.toggleRecruit = function(expertName, btnElement, sportKey) {
    let recruitKey = sportKey ? `${expertName}||${sportKey}` : expertName;
    
    const idx = window.userRecruit.indexOf(recruitKey);
    if (idx > -1) { 
        window.userRecruit.splice(idx, 1); 
        btnElement.className = 'recruit-btn'; 
        btnElement.innerHTML = '📌 收入麾下'; 
    } else { 
        window.userRecruit.push(recruitKey); 
        btnElement.className = 'recruit-btn recruited'; 
        btnElement.innerHTML = '⭐ 已收錄'; 
    }
    localStorage.setItem('UserRecruitDB', JSON.stringify(window.userRecruit));
    
    if (typeof window.updateRecruitWidget === 'function') window.updateRecruitWidget(); 
};

(function initRecruitWidget() {
    if (!document.getElementById('recruitWidgetStyle')) {
        const style = document.createElement('style'); style.id = 'recruitWidgetStyle';
        style.innerHTML = `
/* 🎯 懸浮按鈕優化：調整 Padding 與寬度比例，讓框框貼合大字體，消除空洞感 */
.floating-recruit-btn { 
                position: fixed; 
                top: calc(75% + 65px); 
                right: -8px; 
                transform: translateY(-50%); 
                z-index: 9995; 
                background: linear-gradient(135deg, #4f46e5, #312e81); 
                color: white; 
                width: 75px; 
                box-sizing: border-box; 
                padding: 12px 10px 12px 18px; 
                border-radius: 45px 0 0 45px; 
                font-weight: 900; 
                cursor: pointer; 
                box-shadow: -8px 8px 30px rgba(0,0,0,0.5); 
                transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 4px; 
                border: 2px solid rgba(255,255,255,0.2); 
                text-shadow: 0 2px 4px rgba(0,0,0,0.3); 
            }

.floating-recruit-btn { position: fixed; top: calc(75% + 65px); right: -8px; transform: translateY(-50%); z-index: 9995; background: linear-gradient(135deg, #4f46e5, #312e81); color: white; width: 75px; box-sizing: border-box; padding: 12px 10px 12px 18px; border-radius: 45px 0 0 45px; font-weight: 900; cursor: pointer; box-shadow: -8px 8px 30px rgba(0,0,0,0.5); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; gap: 4px; border: 2px solid rgba(255,255,255,0.2); text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            /* 🎯 正常狀態的懸浮展開 */
            .floating-recruit-btn:hover { right: 0; background: linear-gradient(135deg, #6366f1, #3730a3); padding-right: 22px; transform: translateY(-50%) scale(1.05); }
            
/* 🛡️ 隱形防護罩：向左擴大 40px 的點擊熱區，防止誤觸下方卡片 */
            .floating-recruit-btn::before { 
                content: ""; 
                position: absolute; 
                top: -20px; 
                bottom: -20px; 
                left: -65px; /* 👈 向左偷出 40px 的隱形點擊區 */
                right: 0; 
                background: transparent; 
            }

/* 🎯 視覺魔術版：利用 transform 平移縮進，實體維持在原位，絕對不會撐出白邊！ */
            .floating-recruit-btn.is-comparing { transform: translate(52px, -50%); opacity: 0.7; }
            .floating-recruit-btn.is-comparing:hover { transform: translate(-8px, -50%) scale(1.05); opacity: 1; }

            .recruit-badge { background: #10b981; color: white; border-radius: 50%; padding: 3px 10px; font-size: 14px; font-weight: 900; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); position: relative; top: -5px; }
            
            /* 彈出視窗 UI */
            .recruit-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px); z-index: 10002; display: none; justify-content: center; align-items: center; opacity: 0; transition: 0.4s ease; }
            .recruit-modal-overlay.show { display: flex; opacity: 1; }
            .recruit-modal-content { background: #f8fafc; width: 95%; max-width: 600px; border-radius: 25px; overflow: hidden; box-shadow: 0 50px 120px rgba(0,0,0,0.9); transform: translateY(50px) scale(0.9); transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .recruit-modal-overlay.show .recruit-modal-content { transform: translateY(0) scale(1); }
            .recruit-modal-header { background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 25px 35px; display: flex; justify-content: space-between; align-items: center; color: #a5b4fc; border-bottom: 5px solid #6366f1; }
            .recruit-list { max-height: 65vh; overflow-y: auto; padding: 10px 0; margin: 0; list-style: none; }
            .recruit-item { padding: 20px 35px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
            .recruit-item:hover { background: #e0e7ff; }
            .recruit-item-name { font-weight: 900; font-size: 20px; color: #1e1b4b; display:flex; align-items:center; gap:10px; }
            .recruit-sport-tag { font-size: 13px; background: #c7d2fe; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-weight: bold; }
            .recruit-remove-btn { color: #dc2626; font-size: 13px; cursor: pointer; font-weight: bold; background: #fee2e2; padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; }
            .recruit-remove-btn:hover { background: #fca5a5; }
            .recruit-modal-footer { padding: 20px; text-align: center; background: white; border-top: 1px solid #e2e8f0; }
            
/* 💡 修正：將按鈕從名字框內移出，改為懸掛在整張卡片左上角 */
.recruit-btn { 
    position: absolute; 
    top: -12px;    /* 往上飄出卡片邊界 */
    left: -8px;    /* 往左飄出卡片邊界 */
    background: linear-gradient(135deg, #6366f1, #4f46e5); 
    color: white; 
    border: none; 
    padding: 6px 14px; 
    border-radius: 8px; 
    font-size: 12px; 
    font-weight: bold; 
    cursor: pointer; 
    transition: 0.2s; 
    /* 增加陰影深度，製造浮在卡片上方的立體感 */
    box-shadow: 3px 5px 12px rgba(0,0,0,0.3); 
    z-index: 105;  /* 確保層級高於卡片內的所有元素 */
    border: 1px solid rgba(255,255,255,0.2);
}

.recruit-btn:hover { 
    filter: brightness(1.1); 
    transform: scale(1.05); 
}

.recruit-btn.recruited { 
    background: linear-gradient(135deg, #10b981, #059669); 
}
            @media (max-width: 1023px) {
                .recruit-modal-content { border-radius: 12px !important; }
                .recruit-modal-header { padding: 10px 14px !important; }
                .recruit-modal-header h3 { font-size: 11px !important; letter-spacing: 0 !important; }
                .recruit-modal-header div { font-size: 20px !important; }
                .recruit-modal-content > div { padding: 5px 14px !important; font-size: 6px !important; }
                .recruit-item { padding: 8px 14px !important; }
                .recruit-item-name { font-size: 10px !important; }
                .recruit-sport-tag { font-size: 6px !important; padding: 2px 5px !important; }
                .recruit-remove-btn { font-size: 6px !important; padding: 3px 8px !important; }
                .recruit-modal-footer { padding: 10px !important; }
                .recruit-modal-footer button { padding: 6px 14px !important; font-size: 7px !important; }
            }
        `; document.head.appendChild(style);
    }

    const floatBtn = document.createElement('div'); floatBtn.className = 'floating-recruit-btn';

    // 手機版：第一下展開，第二下開 Modal；電腦版直接開 Modal
    let recruitExpanded = false;
    
    // 1. 點擊邏輯
    floatBtn.addEventListener('click', function() {
        if (window.innerWidth < 1024) {
            // 🎯 只要按鈕滑出來了，或是變數是 true，點擊就直接開視窗！
            if (floatBtn.style.left === '0px' || recruitExpanded) {
                window.openRecruitModal();
            } else {
                recruitExpanded = true;
                floatBtn.style.left = '0px';
            }
        } else {
            window.openRecruitModal();
        }
    });

    // 2. 點擊外部縮回邏輯
    document.addEventListener('click', function(e) {
        if (recruitExpanded && !floatBtn.contains(e.target)) {
            recruitExpanded = false;
            // 呼叫下方的縮放引擎讓它乖乖縮回去
            if (typeof syncRecruitBtnScale === 'function') syncRecruitBtnScale();
        }
    });

    // 3. 🎯 保留向右滑開邏輯 (高靈敏度版)
    let recruitTouchStartX = 0;
    document.addEventListener('touchstart', function(e) {
        recruitTouchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - recruitTouchStartX;
        const startedNearLeft = recruitTouchStartX < 200; 
        
        if (startedNearLeft && dx > 5 && !recruitExpanded) {
            recruitExpanded = true;
            floatBtn.style.left = '0px';
        }
    }, { passive: true });

    document.body.appendChild(floatBtn);

    const overlay = document.createElement('div'); overlay.className = 'recruit-modal-overlay';
    overlay.innerHTML = `
        <div class="recruit-modal-content">
            <div class="recruit-modal-header">
                <h3 style="margin:0;font-size:28px;letter-spacing:2px;font-weight:900;">🏯 麾下好手名單</h3>
                <div style="cursor:pointer;font-size:45px;line-height:1;color:white;" onclick="closeRecruitModal()">&times;</div>
            </div>
            <div style="padding:10px 35px; background:#f1f5f9; font-size:13px; color:#64748b; font-weight:bold; border-bottom:1px solid #e2e8f0;">💡 提示：將滑鼠移至名單上方，即可直接預覽該好手的 1:1 原版戰力卡片。</div>
            <ul class="recruit-list" id="recruitListArea"></ul>
            <div class="recruit-modal-footer">
                <button style="background: #f1f5f9; color: #64748b; border: 2px solid #cbd5e1; padding: 10px 25px; border-radius: 12px; cursor: pointer; font-weight: bold;" onclick="clearRecruit()">🗑️ 清空麾下名單</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

window.updateRecruitWidget = () => {
        if (window.userRecruit.length > 0) { 
            floatBtn.style.display = 'flex'; 
            /* 🎯 字體再次放大：將圖示升級至 24px，文字升級至 19px 極粗體 */
const isMobile = window.innerWidth < 1024;
const scale = isMobile ? window.innerWidth / 980 : 1;
const emojiSize = Math.round(20 * scale) + 'px';
const textSize = Math.round(16 * scale) + 'px';
floatBtn.innerHTML = `
                <span style="font-size:${emojiSize};">🏯</span>
                <span style="font-size:${textSize}; margin-top:2px; letter-spacing:1px; font-weight:900;">麾下</span>
                <span style="font-size:${textSize}; letter-spacing:1px; font-weight:900;">名單</span>
                <span class="recruit-badge" style="font-size:${Math.round(14*scale)}px; padding:${Math.round(3*scale)}px ${Math.round(10*scale)}px; top:${Math.round(-5*scale)}px;">${window.userRecruit.length}</span>
            `;
        } else { 
            floatBtn.style.display = 'none'; 
        }
    };
window.openRecruitModal = () => {
        const listArea = document.getElementById('recruitListArea'); listArea.innerHTML = '';
        if (window.userRecruit.length === 0) { 
            listArea.innerHTML = '<div style="padding: 80px 20px; text-align: center; color: #94a3b8; font-weight:bold; font-size:18px;">目前尚無收入麾下的好手。</div>'; 
        } else {
            // 🎯 升級完整字典，確保所有賽事(含日棒)標籤正確顯示
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

            window.userRecruit.forEach((recruitKey) => {

                let name = recruitKey, savedSportKey = "";
                if (recruitKey.includes("||")) {
                    let parts = recruitKey.split("||");
                    name = parts[0]; savedSportKey = parts[1];
                }
                
                let tagHtml = savedSportKey ? `<span class="recruit-sport-tag">${itemNames[savedSportKey] || savedSportKey}</span>` : '';

                // 綁定 onmouseenter / onmouseleave 觸發預覽特效
                listArea.innerHTML += `
                <li class="recruit-item" onmouseenter="window.showRecruitPreview('${name}', '${savedSportKey}', event)" onmouseleave="window.hideRecruitPreview()">
                    <div class="recruit-item-name">👤 ${name} ${tagHtml}</div>
                    <span class="recruit-remove-btn" onclick="window.removeRecruitItem('${recruitKey}'); event.stopPropagation();">移除</span>
                </li>`;
            });
        }
        overlay.classList.add('show');
    };

    window.closeRecruitModal = () => {
        overlay.classList.remove('show');
        window.hideRecruitPreview();
    }
    
    window.removeRecruitItem = (recruitKey) => {
        const idx = window.userRecruit.indexOf(recruitKey);
        if(idx > -1) { 
            window.userRecruit.splice(idx, 1); 
            localStorage.setItem('UserRecruitDB', JSON.stringify(window.userRecruit)); 
            window.updateRecruitWidget(); window.openRecruitModal(); 
            if (typeof window.renderDisplay === 'function') window.renderDisplay(); 
        }
    };

    window.clearRecruit = () => {
        if(!confirm('🚨 確定要清空麾下追蹤名單嗎？')) return;
        window.userRecruit = []; localStorage.setItem('UserRecruitDB', JSON.stringify(window.userRecruit)); 
        window.updateRecruitWidget(); window.closeRecruitModal(); 
        if (typeof window.renderDisplay === 'function') window.renderDisplay();
    };

/* 🛡️ 核心黑科技：1:1 唯讀預覽卡片特效 (絕對置中升級版) */
    window.showRecruitPreview = function(expertName, sportKey, event) {
        let tooltip = document.getElementById('recruitPreviewBox');
        if(!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'recruitPreviewBox';
            // 💡 絕對置中魔法：將 transform 加入 translateY(-50%)，讓它永遠垂直置中
            tooltip.style.cssText = 'position:fixed; z-index:10005; pointer-events:none; width:300px; transform:translateY(-50%) scale(0.95); transform-origin: center center; transition:opacity 0.2s; background:transparent; border-radius:12px; box-shadow:0 30px 60px rgba(0,0,0,0.7); opacity:0;';
            document.body.appendChild(tooltip);
        }

        // 模擬 core_ranking.js 算分邏輯來生成 mockItem
        let list = (window.dataDB[expertName] && window.dataDB[expertName][sportKey]) ? window.dataDB[expertName][sportKey] : [];
        let w=0, l=0, n20=0; 
        list.slice(0, 20).forEach(r => { 
            const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); 
            if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]); 
            n20 += parseInt(r[2] || 0); 
        }); 
        let rate = (w+l) > 0 ? (w/(w+l)) : 0; 
        let mockItem = { name: expertName, w: w, l: l, net: n20, rate: rate };
        let isReverse = rate < 0.5;
        
        // 呼叫您原有完美的渲染邏輯
        let cardHtml = window.renderRankCard(mockItem, isReverse ? -1 : 0, sportKey, isReverse); 
        tooltip.innerHTML = `<div style="background:#fff; border-radius:8px; overflow:hidden;">${cardHtml}</div>`;
        
        // 💡 排版校正：高度鎖定在螢幕正中央 (50%)，水平位置跟隨滑鼠左側
        tooltip.style.left = Math.max(20, event.clientX - 330) + 'px';
        tooltip.style.top = '50%';
        tooltip.style.opacity = '1';
    };

    window.hideRecruitPreview = function() {
        let tooltip = document.getElementById('recruitPreviewBox');
        if(tooltip) tooltip.style.opacity = '0';
    };

    window.updateRecruitWidget();

    // 手機版縮放同步
    function syncRecruitBtnScale() {
        if (window.innerWidth < 1024) {
            const scale = window.innerWidth / 980;
            const w = Math.round(75 * scale);
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
            floatBtn.style.borderRadius = '';
            floatBtn.style.padding = '';
            floatBtn.style.fontSize = '';
            floatBtn.style.transform = '';
        }
    }
    window.addEventListener('resize', syncRecruitBtnScale);
    syncRecruitBtnScale();

})();