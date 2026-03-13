/* ============================================================== */
/* ==== 【組件 E：核心引擎 - core_engine.js】 ==== */
/* ============================================================== */

const DB_KEY = 'DashboardDB_V90_Final'; 
window.dataDB = JSON.parse(localStorage.getItem(DB_KEY));
window.isNegativeMode = false; // 🪄 魔法反向開關

if (!window.dataDB) { window.dataDB = JSON.parse(JSON.stringify(defaultDB)); }

// 🎨 全站核心 CSS 注入
if (!document.getElementById('pickTooltipStyle')) {
    const style = document.createElement('style'); style.id = 'pickTooltipStyle';
    style.innerHTML = `
        /* 🎯 核心升級一：網格暴力均分化 (強制 8 欄絕對等寬，不受內容長度影響) */
        .grid-container { grid-template-columns: repeat(8, minmax(0, 1fr)) !important; }
        .expert-card { position: relative !important; } /* 確保泡泡能精準掛在卡片右上角 */

/* 🎯 核心升級二：泡泡框絕對懸浮化 (脫離空間搶奪，變成右上角小紅點) */
.pick-tooltip-container { position: absolute !important; top: -8px !important; right: -8px !important; margin-left: 0 !important; z-index: 5 !important; }
        
        /* 💡 修正對策：對比卡片內部的泡泡框恢復「名字後方模式」，避免撞到右上角的關閉按鈕 */
        .pk-column .pick-tooltip-container { position: relative !important; top: auto !important; right: auto !important; margin-left: 10px !important; display: inline-flex !important; }
        .pk-column .pick-icon { animation: floatPulse 2s infinite ease-in-out !important; }

.pick-icon { font-size: 16px; padding: 4px 8px !important; border: 2px solid #fff !important; box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important; background: #fffbeb; border-radius: 20px; cursor: pointer; transition: 0.2s; min-width: 34px; min-height: 34px; display: inline-flex !important; align-items: center; justify-content: center; }

        @media (pointer: coarse) { .pick-icon { font-size: 14px !important; min-width: 28px !important; min-height: 28px !important; padding: 3px 5px !important; } }

        /* 🎯 核心升級三：名字優雅省略化 (單行超出自動變...，絕對防禦破版) */
        .expert-card .name { 
            white-space: nowrap !important; 
            overflow: hidden !important; 
            text-overflow: ellipsis !important; 
            max-width: 100% !important; 
            display: block !important; 
            text-align: center !important;
            margin-top: 5px; /* 稍微往下推，避開頂樓空間 */
        }

        /* 📱 手機/LINE 版終極防護：徹底解決卡片高低不平的問題 (武裝版) */
        @media (max-width: 768px) {
            /* 手機版泡泡框稍微再縮小一點，更貼合邊緣 */
          .pick-tooltip-container { top: -6px !important; right: -6px !important; }
          .pick-icon { font-size: 10px !important; padding: 1px 4px !important; min-width: 22px !important; min-height: 22px !important; }
            
            /* 對策二：高度鎖死。強制卡片統一高度，並將內容垂直置中 */
            .expert-card, body.mode-neg .expert-card { 
                height: 105px !important; 
                padding: 10px 2px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important; 
                gap: 6px !important; 
                box-sizing: border-box !important;
            }
            
            /* 手機版名字優化：因為空間太窄，改為最多顯示兩行，超過才截斷 */
            .expert-card .name { 
                white-space: normal !important; 
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important; 
                -webkit-box-orient: vertical !important;
                font-size: 12px !important; 
                line-height: 1.2 !important; 
                word-break: break-all !important;
                margin-top: 0 !important;
            }

            /* 🎯 新增對策四 (版面解壓縮)：適度縮小兩側空白與卡片間距，讓 8 欄卡片在手機上完美置中呼吸 */
            .container { padding: 10px 10px !important; }
            .grid-container { gap: 6px !important; }

            /* 🎯 新增對策五 (泡泡框防撞牆：徹底消滅隱形白邊的終極殺招) */
            .expert-card:nth-child(8n+6) .pick-tooltip,
            .expert-card:nth-child(8n+7) .pick-tooltip,
            .expert-card:nth-child(8n+8) .pick-tooltip { left: auto !important; right: -5px !important; transform: none !important; }
            .expert-card:nth-child(8n+6) .pick-tooltip::after,
            .expert-card:nth-child(8n+7) .pick-tooltip::after,
            .expert-card:nth-child(8n+8) .pick-tooltip::after { left: auto !important; right: 15px !important; margin-left: 0 !important; }

            .expert-card:nth-child(8n+1) .pick-tooltip,
            .expert-card:nth-child(8n+2) .pick-tooltip { left: -5px !important; transform: none !important; }
            .expert-card:nth-child(8n+1) .pick-tooltip::after,
            .expert-card:nth-child(8n+2) .pick-tooltip::after { left: 15px !important; margin-left: 0 !important; }

            .podium-card:nth-child(3) .pick-tooltip { left: auto !important; right: -5px !important; transform: none !important; }
            .podium-card:nth-child(3) .pick-tooltip::after { left: auto !important; right: 15px !important; margin-left: 0 !important; }
            
            .podium-card:nth-child(2) .pick-tooltip { left: -5px !important; transform: none !important; }
            .podium-card:nth-child(2) .pick-tooltip::after { left: 15px !important; margin-left: 0 !important; }

/* 🚀 刪除多餘的橫向位移代碼！改為純垂直飛入。
               徹底根除 LINE 瀏覽器因為動畫跑到畫面外，而強行撐開產生大白邊的 Bug！ */
            .expert-card, .podium-card { --rx: 0px !important; } /* 強制所有卡片橫向位移歸零 */
            
            .expert-card:nth-child(4n+1) { --ry: -60px !important; }
            .expert-card:nth-child(4n+2) { --ry: -40px !important; }
            .expert-card:nth-child(4n+3) { --ry: 60px !important;  }
            .expert-card:nth-child(4n+4) { --ry: 40px !important;  }
            
            .podium-card:nth-child(1) { --ry: -80px !important; }
            .podium-card:nth-child(2) { --ry: 0px !important;   }
            .podium-card:nth-child(3) { --ry: 0px !important;   }
        }

        .pick-tooltip { 
            visibility: hidden; opacity: 0; position: absolute; bottom: 130%; left: 50%; transform: translateX(-50%); 
            background: linear-gradient(135deg, #1e293b, #0f172a); color: #fbbf24; text-align: left; padding: 14px 18px; 
            border-radius: 12px; border: 1px solid #fbbf24; 
            min-width: 220px; max-width: 280px; white-space: normal; 
            z-index: 10000; font-size: 14px; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.5); 
            transition: 0.3s; pointer-events: auto; line-height: 1.6; letter-spacing: 0.5px; 
            max-height: 220px; overflow-y: auto; overscroll-behavior: contain; 
        }
        
        .pick-tooltip::-webkit-scrollbar { width: 6px; }
        .pick-tooltip::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); border-radius: 8px; }
        .pick-tooltip::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 8px; }

        .pick-tooltip::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -6px; border-width: 6px; border-style: solid; border-color: #fbbf24 transparent transparent transparent; }

        .pick-tooltip-container:hover .pick-tooltip, .pick-tooltip.show-mobile { visibility: visible; opacity: 1; bottom: 145%; }
        .pk-column:hover { z-index: 10; } 
        .pk-column .pick-tooltip { bottom: auto; top: 130%; }
        .pk-column .pick-tooltip::after { top: auto; bottom: 100%; border-color: transparent transparent #fbbf24 transparent; }
        .pk-column .pick-tooltip-container:hover .pick-tooltip, .pk-column .pick-tooltip.show-mobile { bottom: auto; top: 145%; }

        @keyframes scatterFlyIn {
            0% { opacity: 0; transform: translate(var(--rx), var(--ry)) rotate(var(--rr)) scale(0.5); }
            100% { opacity: 1; transform: translate(var(--tx, 0px), var(--ty, 0px)) rotate(var(--rot, 0deg)) scale(1); }
        }

        .expert-card, .podium-card { 
            --rx: 0px; --ry: 0px; --rr: 0deg;
            animation: scatterFlyIn 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) backwards; 
        }

        .expert-card:nth-child(4n+1) { --rx: -800px; --ry: -500px; --rr: -120deg; animation-delay: 0.05s; }
        .expert-card:nth-child(4n+2) { --rx: 800px;  --ry: -600px; --rr: 150deg;  animation-delay: 0.1s; }
        .expert-card:nth-child(4n+3) { --rx: -700px; --ry: 700px;  --rr: -90deg;  animation-delay: 0.15s; }
        .expert-card:nth-child(4n+4) { --rx: 900px;  --ry: 400px;  --rr: 180deg;  animation-delay: 0.2s; }
        
        .podium-card:nth-child(1) { --rx: 0px;    --ry: -1000px; --rr: 360deg; }
        .podium-card:nth-child(2) { --rx: -1200px; --ry: 0px;     --rr: -360deg; }
        .podium-card:nth-child(3) { --rx: 1200px;  --ry: 0px;     --rr: 720deg; }

        .pocket-btn-wrapper { margin-top: 10px; border-top: 1px dashed #475569; padding-top: 8px; text-align: left; }
        .pocket-add-btn { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
        .pocket-add-btn:hover { background: linear-gradient(135deg, #fbbf24, #f59e0b); transform: translateY(-1px); }
        .pocket-add-btn.saved { background: linear-gradient(135deg, #10b981, #059669); color: white; }

        .sleep-card { background-color: #f8fafc; border-color: #cbd5e1; }
        .sleep-card .name { color: #94a3b8; }
        .sleep-card .badge { background-color: #e2e8f0; color: #94a3b8; }
        .sleep-card .sleep-text { color: #cbd5e1; }

        @keyframes flipFromWhite {
            0% { opacity: 1; transform: translate(var(--tx, 0px), var(--ty, 0px)) rotateY(180deg) rotate(var(--rot, 0deg)); background-color: #ffffff; color: transparent; border-color: #e2e8f0; }
            100% { opacity: 1; transform: translate(var(--tx, 0px), var(--ty, 0px)) rotateY(0deg) rotate(var(--rot, 0deg)); background-color: #1e293b; color: #fca5a5; border-color: #450a0a; }
        }

        body.mode-neg { background-color: #0f172a; color: #f8fafc; transition: background-color 0.5s; }

        body.mode-neg .expert-card {
            animation: flipFromWhite 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards !important; 
            transform-style: preserve-3d; perspective: 1000px; backface-visibility: hidden; 
            opacity: 0; background: #1e293b; z-index: 1;
        }

        body.mode-neg .podium-card { background: linear-gradient(135deg, #7f1d1d, #450a0a); border-color: #ef4444; }

        .mode-neg .rank-net { color: #f87171 !important; }

        body.mode-neg .sleep-card { background-color: #020617 !important; border-color: #1e293b !important; opacity: 0.7; }
        body.mode-neg .sleep-card .name { color: #475569 !important; }
        body.mode-neg .sleep-card .badge { background-color: #1e293b !important; color: #475569 !important; }
        body.mode-neg .sleep-card .sleep-text { color: #334155 !important; }

        /* ✅ 這是新的 (只留這個就好！) */
        body.mode-neg #expertGrid { 
            display: grid !important;
            grid-template-columns: repeat(8, 1fr) !important; 
            gap: 12px !important; /* 🎯 修正點：改為 12px，讓上下排間距恢復正常 */
            max-width: 1550px !important; 
            margin: 0px auto 30px auto !important; /* 🎯 修正點：下方留白恢復正常的 30px */
            position: relative;
            z-index: 50; 
            padding: 0 20px; 
        }
        
        body.mode-neg #expertGrid { 
            display: grid !important;
            grid-template-columns: repeat(8, 1fr) !important; 
            gap: 12px !important; /* 🎯 修正點：改為 12px，讓上下排間距恢復正常 */
            max-width: 1550px !important; 
            margin: 0px auto 30px auto !important; /* 🎯 修正點：下方留白恢復正常的 30px */
            position: relative;
            z-index: 50; 
            padding: 0 20px; 
        }
        
        /* 🚨 已經移除反向 U 形排列，恢復為原本正常的網格排版，同時保留紅光特效 */
        body.mode-neg .expert-card {
            padding: 15px 5px !important; 
            border-radius: 12px !important; 
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s !important;
        }

        body.mode-neg .expert-card:hover {
            transform: translateY(-2px) scale(1.02) !important;
            z-index: 100 !important;
            box-shadow: 0 15px 35px rgba(220, 38, 38, 0.7) !important;
        }

        body.mode-neg .expert-card.active {
            transform: translateY(-2px) scale(1.02) !important;
            z-index: 95 !important;
            border: 2.5px solid #ef4444 !important;
            background-color: #450a0a !important;
            box-shadow: 0 0 25px 5px rgba(220, 38, 38, 0.8) !important;
        }
        
        body.mode-neg .podium-card.active {
            border: 3px solid #ef4444 !important;
            background: linear-gradient(135deg, #991b1b, #450a0a) !important;
            box-shadow: 0 0 30px 10px rgba(220, 38, 38, 0.8) !important;
            transform: translateY(-10px) !important;
        }

        .mode-toggle-wrapper { display: flex; justify-content: center; margin-bottom: 20px; gap: 15px; }
        .toggle-btn { padding: 10px 24px; border-radius: 50px; cursor: pointer; font-weight: bold; transition: 0.3s; border: 2px solid #cbd5e1; background: #fff; color: #64748b; }
        .toggle-btn.active-pos { background: #1877f2; color: white; border-color: #1877f2; box-shadow: 0 4px 10px rgba(24,119,242,0.3); }
        .toggle-btn.active-neg { background: #dc2626; color: white; border-color: #dc2626; box-shadow: 0 4px 10px rgba(220,38,38,0.3); }
    `;
    document.head.appendChild(style);
}

window.userPocket = JSON.parse(localStorage.getItem('UserPocketDB')) || [];
window.activeSportKey = "";  
/* 🎯 變更預設首頁過濾器：從 'all' (賽季總榜) 改為 7 (近7場)，提升即時戰力參考價值 */
window.currentHomeFilter = 7;

// 🎯 【修復內鬼】這裡已經同步更新為有 sportKey 的新版邏輯！不會再覆蓋丟失賽事標籤了。
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

if (typeof dailyUpdates !== 'undefined') {
    dailyUpdates.forEach(([expert, sport, date, wl, net]) => {
        if (!window.dataDB[expert]) window.dataDB[expert] = {};
        if (!window.dataDB[expert][sport]) window.dataDB[expert][sport] = [];
        let isDuplicate = window.dataDB[expert][sport].some(r => r[0] === date && r[1] === wl && r[2] === net);
        if (!isDuplicate) window.dataDB[expert][sport].unshift([date, wl, net]); 
    });
    const currentYear = new Date().getFullYear();
    for (let exp in window.dataDB) { for (let sp in window.dataDB[exp]) { window.dataDB[exp][sp].sort((a, b) => { const parseDate = (dStr) => { let d = new Date(`${currentYear}/${dStr}`); if (d.getMonth() === 11 && new Date().getMonth() <= 2) d.setFullYear(currentYear - 1); return d.getTime(); }; return parseDate(b[0]) - parseDate(a[0]); }); } }
}
localStorage.setItem(DB_KEY, JSON.stringify(window.dataDB));

window.toggleIndexMode = function(mode) {
    window.isNegativeMode = (mode === 'neg');
    if (window.isNegativeMode) document.body.classList.add('mode-neg');
    else document.body.classList.remove('mode-neg');
    window.init();
};

window.init = function() {
    const grid = document.getElementById('expertGrid'); 
    const podiumArea = document.getElementById('podiumArea');
    const targetSport = window.activeSportKey || "nba_team"; 
    let systemLatestDate = window.getSystemLatestDate(targetSport); 
    // 🎯 特殊激活白名單：從 localStorage 讀取後台設定
    let qualifiedWhitelist = [];
    try { qualifiedWhitelist = JSON.parse(localStorage.getItem('AdminWhitelist_Experts')) || []; } catch(e) {}

    let rankedList = [];

    for (let name in window.dataDB) {
        let records = window.dataDB[name][targetSport] || []; 
        if (records.length === 0) continue;
        let diffDays = window.getDaysDiff(records[0][0], systemLatestDate); 
        let isActive = diffDays <= 3;
        // 🎯 門檻激活：計算不重複預測天數，未滿10天不進入正式排行
        let uniqueDates = new Set(records.map(r => r[0]));

let isQualified = uniqueDates.size >= 10 || qualifiedWhitelist.includes(name + '||' + targetSport);

        let sliceRec = window.currentHomeFilter === 'all' ? records : records.slice(0, window.currentHomeFilter);
        let net = sliceRec.reduce((sum, r) => sum + parseInt(r[2] || 0), 0);
        
        // 🎯 核心升級：精準計算勝率
        let w = 0, l = 0;
        sliceRec.forEach(r => {
            const wm = r[1].match(/(\d+)勝/);
            const lm = r[1].match(/(\d+)敗/);
            if(wm) w += parseInt(wm[1]);
            if(lm) l += parseInt(lm[1]);
        });
        let winRate = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;

        rankedList.push({ name, net, winRate, isActive, isQualified });
    
    }

// 🏆 首頁排序：活躍+已激活優先 -> 勝率優先 -> 淨值加權
    rankedList.sort((a, b) => { 
        const aRank = a.isActive && a.isQualified;
        const bRank = b.isActive && b.isQualified;
        if (aRank && !bRank) return -1; 
        if (!aRank && bRank) return 1;
        if (a.isActive && !b.isActive) return -1; 
        if (!a.isActive && b.isActive) return 1; 
        if (window.isNegativeMode) {
            return a.winRate - b.winRate || a.net - b.net; 
        } else {
            return b.winRate - a.winRate || b.net - a.net; 
        }
    });

    // 🔗 核心對接：將排序結果發佈為 masterRankMap，供量化觀測台直接引用
    window.masterRankMap = {};
    rankedList.forEach((player, index) => {
        window.masterRankMap[player.name] = {
            rank: index + 1,
            rate: player.winRate,
            isGod: index < 3 && player.isActive
        };
    });

// 💾 同步寫入 localStorage，讓量化觀測台直接讀取，100% 與前端一致
    // 以運動種類為 key 分開存，支援多運動切換
    try {
        localStorage.setItem('MasterRankMap_Cache_' + targetSport, JSON.stringify(window.masterRankMap));
    } catch(e) {}


    if(podiumArea) {
        podiumArea.innerHTML = ''; 

        const top3 = rankedList.filter(p => p.isActive && p.isQualified).slice(0, 3);
 
        const order = [1, 0, 2]; 
        order.forEach(i => {
            if (top3[i] && top3[i].isActive) { 
                const exp = top3[i]; 
                const isActiveSelect = window.selectedExperts.includes(exp.name) ? 'active' : '';
                const card = document.createElement('div'); 
                card.className = `podium-card rank-${i + 1} ${isActiveSelect}`;
                card.setAttribute('data-name', exp.name);
                card.style.animationDelay = window.isNegativeMode ? `${(i + 1) * 0.1}s` : '0s';
                
                // 🎯 UI 升級：顯示 勝率% (淨值)
                card.innerHTML = `<div class="rank-number">RANK ${i + 1}</div><span class="rank-crown">${window.isNegativeMode ? '🪄' : (i===0?'👑':(i===1?'🥈':'🥉'))}</span><div class="name" style="font-size:20px; display:flex; align-items:center; justify-content:center;">${exp.name} ${window.getPickTooltipHtml(exp.name)}</div><span class="rank-net">${exp.winRate}% <span style="font-size:16px; color:#64748b; font-weight:bold;">(淨${exp.net >= 0 ? '+' : ''}${exp.net})</span></span><div style="font-size:12px; color:#64748b; margin-top:5px;">${itemNames[targetSport] || '紀錄'}</div>`;
                card.onclick = () => window.toggleExpert(exp.name, card); 
                podiumArea.appendChild(card);
            }
        });
    }

    if(grid) {
        grid.innerHTML = ''; 
        const theRest = rankedList.slice(3);
        theRest.forEach((exp, idx) => {
            const card = document.createElement('div'); 
            const isActiveSelect = window.selectedExperts.includes(exp.name) ? 'active' : ''; 
            card.className = `expert-card ${isActiveSelect}`;
            card.setAttribute('data-name', exp.name);
            card.style.animationDelay = window.isNegativeMode ? `${(idx * 0.1) + 0.4}s` : '0s';
            
if (exp.isActive && exp.isQualified) {
                card.innerHTML = `<div style="font-size:11px; color:#94a3b8; margin-bottom:5px;">NO.${idx + 4}</div><div class="name" style="display:flex; align-items:center; justify-content:center;">${exp.name} ${window.getPickTooltipHtml(exp.name)}</div><span class="badge" style="color:#1877f2;">勝率 ${exp.winRate}% (淨${exp.net >= 0 ? '+' : ''}${exp.net})</span>`;
            } else if (exp.isActive && !exp.isQualified) {
                card.classList.add('sleep-card');
                card.innerHTML = `<div class="sleep-icon">📊</div><div class="sleep-text" style="font-size:11px; margin-bottom:5px;">資料累積中</div><span class="name" style="display:flex; align-items:center; justify-content:center;">${exp.name}</span><span class="badge" style="color:#f59e0b;">已累積 ${new Set((window.dataDB[exp.name][targetSport] || []).map(r => r[0])).size}/10 天</span>`;
            } else {
                card.classList.add('sleep-card');
                card.innerHTML = `<div class="sleep-icon">zZzZ</div><div class="sleep-text" style="font-size:11px; margin-bottom:5px;">無近期數據</div><span class="name" style="display:flex; align-items:center; justify-content:center;">${exp.name}</span><span class="badge">💤 休眠中</span>`;
            }

            card.onclick = () => window.toggleExpert(exp.name, card); 
            grid.appendChild(card);
        });
    }

    let toggleDiv = document.getElementById('modeToggle');
    if (!toggleDiv) {
        toggleDiv = document.createElement('div');
        toggleDiv.id = 'modeToggle';
        toggleDiv.className = 'mode-toggle-wrapper';
        const podium = document.getElementById('podiumArea');
        if(podium) podium.parentNode.insertBefore(toggleDiv, podium);
    }
    if(toggleDiv) {
        toggleDiv.innerHTML = `
            <div class="toggle-btn ${!window.isNegativeMode ? 'active-pos' : ''}" onclick="window.toggleIndexMode('pos')">📈 正向動能排行</div>
            <div class="toggle-btn ${window.isNegativeMode ? 'active-neg' : ''}" onclick="window.toggleIndexMode('neg')">🪄 反轉魔法排行</div>
        `;
    }

const tabs = document.getElementById('tabContainer');
    if (tabs && tabs.innerHTML === '') {
const categories = [ 
            { name: '🏀 美籃 NBA', items: [ { id: 'nba_team', label: 'NBA 讓分盤' }, { id: 'nba_total', label: 'NBA 大小分' }, { id: 'nba_team_total', label: 'NBA 單隊大小' }, { id: 'nba_team_spread', label: 'NBA 單隊讓盤' }, { id: 'nba_1h_total', label: 'NBA 上半大小' } ] }, 
            { name: '⚾ 美棒 MLB', items: [ { id: 'mlb_ml', label: 'MLB 獨贏(正常)' }, { id: 'mlb_runline', label: 'MLB 讓分盤' }, { id: 'mlb_total', label: 'MLB 大小分' }, { id: 'mlb_ml_high', label: 'MLB 高賠獨贏' } ] },
            { name: '🇯🇵 日棒 NPB', items: [ { id: 'npb_runline', label: '日棒讓分' }, { id: 'npb_ml', label: '日棒獨贏' }, { id: 'npb_total', label: '日棒大小' }, { id: 'npb_1h_runline', label: '日棒上半讓分' }, { id: 'npb_1h_ml', label: '日棒上半獨贏' }, { id: 'npb_1h_total', label: '日棒上半大小' } ] },
            { name: '⚽ 足球系列', items: [ { id: 'soccer_team', label: '足球隊伍' }, { id: 'soccer_total', label: '足球大小分' }, { id: 'soccer_ml', label: '足球獨贏' }, { id: 'soccer_btts', label: '足球兩隊進球' }, { id: 'soccer_corner_total', label: '足球角球大小' }, { id: 'soccer_corner_ml', label: '足球角球PK' } ] },
            { name: '🏒 冰球系列', items: [ { id: 'nhl_ml', label: '冰球獨贏(含加時)' }, { id: 'nhl_ml_reg', label: '冰球獨贏(不含加時)' }, { id: 'nhl_spread_ot', label: '冰球讓盤(含加時)' }, { id: 'nhl_spread_reg', label: '冰球讓盤(不含加時)' }, { id: 'nhl_total_ot', label: '冰球大小(含加時)' }, { id: 'nhl_total_reg', label: '冰球大小(不含加時)' }, { id: 'khl_team', label: '俄冰隊伍' }, { id: 'khl_total', label: '俄冰大小分' } ] },

            { name: '🌏 亞洲/歐籃', items: [ { id: 'euro_team', label: '歐籃隊伍' }, { id: 'euro_total', label: '歐籃大小' }, { id: 'euro_1h', label: '歐籃上半' }, { id: 'nbl_team', label: '澳籃隊伍' }, { id: 'nbl_total', label: '澳籃大小' }, { id: 'jbl_team', label: '日籃隊伍' },{ id: 'jbl_total', label: '日籃大小' },{ id: 'kbl_team', label: '韓籃隊伍' }, { id: 'kbl_total', label: '韓籃大小' }, { id: 'cba_team', label: '中籃隊伍' }, { id: 'cba_total', label: '中籃大小' } ] }, 
            { name: '🎮 電競系列', items: [ { id: 'lol_team', label: '電競隊伍' }, { id: 'lol_total', label: '電競大小' } ] }
        ];
        categories.forEach(cat => {
            const wrapper = document.createElement('div'); wrapper.className = 'dropdown-wrapper';
            wrapper.innerHTML = `<div class="category-btn">${cat.name}</div><div class="dropdown-content"></div>`;
            const content = wrapper.querySelector('.dropdown-content'); cat.items.forEach(item => window.appendTab(item.id, item.label, content)); tabs.appendChild(wrapper);
        });
    }
    if(typeof window.updateTabHighlights === 'function') window.updateTabHighlights();
};

window.appendTab = function(key, label, container) { const btn = document.createElement('label'); btn.className = `sport-tab`; btn.id = `l-${key}`; btn.innerHTML = label; btn.onclick = () => window.selectSport(key, btn); container.appendChild(btn); };
window.selectSport = function(key, el) {
    if (window.activeSportKey === key) { window.activeSportKey = ""; el.classList.remove('active'); } 
    else { window.activeSportKey = key; document.querySelectorAll('#tabContainer .sport-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); }
    window.init(); if (document.getElementById('details').style.display === 'block') window.renderDisplay();
};
window.toggleExpert = function(n, el) { 
    const i = window.selectedExperts.indexOf(n);
    if(i > -1) { window.selectedExperts.splice(i, 1); document.querySelectorAll(`[data-name="${n}"]`).forEach(c => c.classList.remove('active')); } 
    else { window.selectedExperts.push(n); if(el) el.classList.add('active'); } 
    if (typeof window.updateTabHighlights === 'function') window.updateTabHighlights();
    if (document.getElementById('details').style.display === 'block') window.renderDisplay();
};

window.init();


/* ============================================================== */
/* ==== 補充電線：好手賽事發光特效模組 ==== */
/* ============================================================== */
window.updateTabHighlights = function() {
    const tabs = document.querySelectorAll('#tabContainer .sport-tab');
    const categories = document.querySelectorAll('#tabContainer .dropdown-wrapper');
    
    // 1. 如果沒有選擇任何好手，恢復全部預設狀態 (不亮也不灰)
    if (window.selectedExperts.length === 0) {
        tabs.forEach(t => { t.classList.remove('tab-highlight', 'tab-dimmed'); });
        categories.forEach(c => { 
            const btn = c.querySelector('.category-btn');
            if (btn) btn.classList.remove('tab-highlight', 'tab-dimmed'); 
        });
        return;
    }

    // 2. 收集目前選中的好手，他們「有預測資料」的所有賽事 Key
    let activeKeys = new Set();
    window.selectedExperts.forEach(name => {
        if (window.dataDB[name]) {
            for (let key in window.dataDB[name]) {
                if (window.dataDB[name][key] && window.dataDB[name][key].length > 0) {
                    activeKeys.add(key);
                }
            }
        }
    });

    // 3. 更新各個小標籤的狀態
    tabs.forEach(tab => {
        // 從 tab 的 id (例如 'l-nba_team') 取出賽事 key ('nba_team')
        let sportKey = tab.id.replace('l-', '');
        
        if (activeKeys.has(sportKey)) {
            tab.classList.add('tab-highlight');
            tab.classList.remove('tab-dimmed');
        } else {
            tab.classList.add('tab-dimmed');
            tab.classList.remove('tab-highlight');
        }
    });

    // 4. 更新外層大分類按鈕的狀態 (只要底下有任何一個子項目發光，母按鈕就跟著發光)
    categories.forEach(wrapper => {
        const btn = wrapper.querySelector('.category-btn');
        const hasActiveChild = wrapper.querySelector('.tab-highlight');
        if (btn) {
            if (hasActiveChild) {
                btn.classList.add('tab-highlight');
                btn.classList.remove('tab-dimmed');
            } else {
                btn.classList.add('tab-dimmed');
                btn.classList.remove('tab-highlight');
            }
        }
    });
};