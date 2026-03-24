/* ============================================================== */
/* ==== 【組件 D：戰力表現 - core_ranking.js】 ==== */
/* ============================================================== */

window.selectedExperts = [];  
window.excludedExperts = [];  
window.expandStates = {};
window.manualSwapList = []; 

window.toggleManualSwap = function(name) {
    const idx = window.manualSwapList.indexOf(name);
    if (idx > -1) window.manualSwapList.splice(idx, 1);
    else window.manualSwapList.push(name);
    window.renderDisplay(); 
};

window.handleCompare = function() { 
    window.excludedExperts = []; window.expandStates = {}; 
    if (window.selectedExperts.length === 0 && window.activeSportKey === "") return alert('請點選好手'); 
    document.getElementById('details').style.display = 'block'; 
    window.renderDisplay(); 
    document.getElementById('details').scrollIntoView({ behavior: 'smooth' }); 
};

// 🎯 [核心新增] 智慧滾動偵測：自動判斷按鈕是否該往左滑動避開邊緣
window.addEventListener('scroll', function() {
    const detailsDiv = document.getElementById('details');
    
    // 若對比區塊不存在或尚未顯示，確保按鈕退回右側邊緣
    if (!detailsDiv || detailsDiv.style.display === 'none') {
        if (typeof window.setFloatingButtonsCompareMode === 'function') window.setFloatingButtonsCompareMode(false);
        return;
    }
    
    // 取得對比區塊距離螢幕頂部的相對位置
    const rect = detailsDiv.getBoundingClientRect();
    
    // 判斷邏輯：當畫面往下滑，對比區塊進入螢幕可視範圍 (到達螢幕高度的 70% 處) 時，按鈕往左滑動
    if (rect.top < window.innerHeight * 0.7) {
        if (typeof window.setFloatingButtonsCompareMode === 'function') {
            window.setFloatingButtonsCompareMode(true);
        }
    } else {
        // 當畫面往上滑回上方主畫面時，按鈕退回最右側，繼續維持原本完美的重疊層次感
        if (typeof window.setFloatingButtonsCompareMode === 'function') {
            window.setFloatingButtonsCompareMode(false);
        }
    }
});

// 🎯 手機版強制：沒對比時也用相同的隱藏/露出邏輯
if (window.innerWidth < 1024) {
    window.addEventListener('scroll', function() {
        var detailsDiv = document.getElementById('details');
        if (detailsDiv && detailsDiv.offsetParent !== null) return;
        var anchor = document.getElementById('tabContainer');
        if (!anchor || typeof window.setFloatingButtonsCompareMode !== 'function') return;
        if (anchor.getBoundingClientRect().top < window.innerHeight * 0.7) {
            window.setFloatingButtonsCompareMode(true);
        } else {
            window.setFloatingButtonsCompareMode(false);
        }
    });
}

window.renderDisplay = function() {
    const display = document.getElementById('displayArea'); const header = document.getElementById('singleHeader');
    const layouts = display.querySelectorAll('.pk-layout'); const scrollMap = {}; layouts.forEach(l => { if(l.id) scrollMap[l.id] = l.scrollLeft; });
    const mainScroll = display.scrollLeft; 
    display.innerHTML = ''; display.className = ''; display.style.flexDirection = '';
    header.style.display = 'none';
    if (window.selectedExperts.length === 0 && window.activeSportKey !== "") window.renderRankMode(); else if (window.selectedExperts.length === 1) window.renderNormalMode(); else window.renderPKMode();
    setTimeout(() => { const newLayouts = display.querySelectorAll('.pk-layout'); newLayouts.forEach(l => { if(l.id && scrollMap[l.id]) l.scrollLeft = scrollMap[l.id]; }); display.scrollLeft = mainScroll; }, 0);
};

window.toggleExpand = function(n) { window.expandStates[n] = !window.expandStates[n]; window.renderDisplay(); };

window.renderPKMode = function() {
    const display = document.getElementById('displayArea'); if (!display) return;
    const key = window.activeSportKey || "nba_team"; display.className = 'pk-layout';
    let htmlStr = ''; 
    window.selectedExperts.forEach(n => {
        try {
            let dbData = (window.dataDB[n] && window.dataDB[n][key]) ? window.dataDB[n][key] : [];
            const hasMore = dbData.length > 20; const showFull = window.expandStates[n];
            const btnHtml = hasMore ? `<button class="expand-btn" onclick="window.toggleExpand('${n}')">${showFull ? '🔼 收起歷史' : '🔍 展開更多歷史'}</button>` : '';
            htmlStr += `<div class="pk-column"><div class="close-x" onclick="window.toggleExpert('${n}', null);">×</div><div class="pk-name-label" style="display:flex; align-items:center; justify-content:center;">${n} ${window.getPickTooltipHtml(n)}</div>${window.getRankBanner(typeof itemNames !== 'undefined' && itemNames[key] ? itemNames[key] : '紀錄', n, key)}<div class="table-header"><div>日期</div><div style="width:70px;text-align:center;">戰績</div><div style="flex:1;padding-left:5px;">反饋</div></div>${window.buildHTML(dbData, !showFull, n, key)}${btnHtml}</div>`;
        } catch(e) { console.error("資料異常跳過:", n); }
    });
    display.innerHTML = htmlStr; 
};

window.renderRankMode = function() {
    const display = document.getElementById('displayArea'); let allSorted = []; let systemLatestDate = window.getSystemLatestDate(window.activeSportKey);
    // 🎯 特殊激活白名單
    let qualifiedWhitelistRM = [];
    try { qualifiedWhitelistRM = JSON.parse(localStorage.getItem('AdminWhitelist_Experts')) || []; } catch(e) {}

    for(let name in window.dataDB) {
        if(window.excludedExperts.includes(name)) continue; let list = window.dataDB[name][window.activeSportKey] || []; if(list.length === 0) continue;
        
let diffDays = window.getDaysDiff(list[0][0], systemLatestDate); if (diffDays > 3) continue;
        // 🎯 門檻激活：不重複天數 < 10 天不進入賽事排行
let uniqueDatesRank = new Set(list.map(r => r[0]));
        if (uniqueDatesRank.size < 10 && !qualifiedWhitelistRM.includes(name)) continue;

        let w=0, l=0, n20=0; list.slice(0, 20).forEach(r => { const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]); n20 += parseInt(r[2] || 0); }); let rate = (w+l) > 0 ? (w/(w+l)) : 0; allSorted.push({ name, w, l, net: n20, rate });
    }
    allSorted.sort((a,b) => b.rate - a.rate || b.net - a.net);
    const isActuallyPositive = (item) => { const naturallyPositive = item.rate >= 0.5; const isSwapped = window.manualSwapList.includes(item.name); return isSwapped ? !naturallyPositive : naturallyPositive; };

const top6 = allSorted.filter(item => isActuallyPositive(item)); 
    const bottom6 = allSorted.filter(item => !isActuallyPositive(item)).sort((a,b) => a.rate - b.rate || a.net - b.net);
    /* 🎯 專業化名詞與圖示升級：戰力紅/黑榜 ➔ 正向/反向指標，骷髏頭 ➔ 魔法杖 */
    display.innerHTML = `<div class="rank-group-title" style="color:#16a34a; border-bottom:2px solid #bbf7d0;">🏆 ${itemNames[window.activeSportKey]} - 正向指標</div><div class="pk-layout" id="topLayout"></div><div class="rank-group-title" style="color:#dc3545; border-bottom:2px solid #fecaca;">🪄 ${itemNames[window.activeSportKey]} - 反向指標</div><div class="pk-layout" id="bottomLayout"></div>`;
    top6.forEach((item, i) => document.getElementById('topLayout').innerHTML += window.renderRankCard(item, i, window.activeSportKey, false));

    bottom6.forEach((item, i) => document.getElementById('bottomLayout').innerHTML += window.renderRankCard(item, i, window.activeSportKey, true));
};

window.renderRankCard = function(item, idx, key, isReverse) {
    let cls = isReverse ? "title-rank-neg" : (idx===0 ? "title-rank-1" : (idx===1 ? "title-rank-2" : (idx===2 ? "title-rank-3" : "title-unranked")));
    let bCls = isReverse ? "rank-neg-badge" : (idx===0 ? "rank-1-badge" : (idx===1 ? "rank-2-badge" : (idx===2 ? "rank-3-badge" : "")));
    const showFull = window.expandStates[item.name]; const hasMore = window.dataDB[item.name][key] && window.dataDB[item.name][key].length > 20;
    const btnHtml = hasMore ? `<button class="expand-btn" onclick="window.toggleExpand('${item.name}')">${showFull ? '🔼 收起' : '🔍 展開歷史'}</button>` : '';
    const swapText = isReverse ? '暫居正向區' : '暫居反向區'; const swapColor = isReverse ? '#16a34a' : '#dc3545';
const swapBtn = `<button onclick="event.stopPropagation(); window.toggleManualSwap('${item.name}')" style="cursor:pointer; font-size:13px; color:${swapColor}; border:1.5px solid ${swapColor}; padding:4.5px 12px; border-radius:4px; font-weight:900; white-space:nowrap; background:transparent; transition:0.2s; height:28px; line-height:1;">${swapText}</button>`;
    
// 🎯 新增的：收入麾下按鈕邏輯
    let recruitKey = `${item.name}||${key}`;
    let isRecruited = window.userRecruit && window.userRecruit.includes(recruitKey);
    let recruitBtn = `<button class="recruit-btn ${isRecruited ? 'recruited' : ''}" onclick="event.stopPropagation(); if(window.toggleRecruit) window.toggleRecruit('${item.name}', this, '${key}')">${isRecruited ? '⭐ 已收錄' : '📌 收入麾下'}</button>`;

    return `<div class="pk-column">${recruitBtn}<div class="close-x" onclick="window.excludeAndRedraw('${item.name}')">×</div><div class="pk-name-label" style="display:flex; align-items:center; justify-content:center; padding: 10px 5px;">${item.name} ${window.getPickTooltipHtml(item.name)}</div><div class="title-container ${cls}"><h4 class="section-title">勝率 ${(item.rate*100).toFixed(0)}%</h4><span class="rank-badge ${bCls}">${isReverse?'反向':''} NO.${idx+1} (${item.net>=0?'+'+item.net:item.net})</span></div>${window.buildHTML(window.dataDB[item.name][key] || [], !showFull, item.name, key, swapBtn)}${btnHtml}</div>`;
};

window.excludeAndRedraw = function(name) { window.excludedExperts.push(name); window.renderDisplay(); };

window.renderNormalMode = function() {
    const area = document.getElementById('displayArea'); const header = document.getElementById('singleHeader'); 
    const key = window.activeSportKey || "nba_team"; const n = window.selectedExperts[0]; const base = key.split('_')[0];
    header.style.display = 'flex';
    document.getElementById('expertTitle').innerHTML = `${n} ${window.getPickTooltipHtml(n)} <span style="font-size: 16px; color:#94a3b8; font-weight:normal; margin-left:10px;">- 專家戰力履歷</span>`;
    document.getElementById('topBadge').innerText = base.toUpperCase();
    const records = window.dataDB[n][key] || []; let totalW = 0, totalL = 0, totalNet = 0;
    records.forEach(r => { const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); if(wm) totalW += parseInt(wm[1]); if(lm) totalL += parseInt(lm[1]); totalNet += parseInt(r[2] || 0); });
    const totalRate = (totalW + totalL) > 0 ? Math.round((totalW / (totalW + totalL)) * 100) : 0;
    // ⚙️ 升級版雙核引擎：同時計算勝率與淨值 (取代了舊的 getRate)
    const getStats = (num) => { let w = 0, l = 0, net = 0; records.slice(0, num).forEach(r => { const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]); net += parseInt(r[2] || 0); }); return { rate: (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0, net: net }; };
    
    // 📊 預先結算四個區間的包裹數據
    const s30 = getStats(30), s20 = getStats(20), s7 = getStats(7), s3 = getStats(3);

    // 📱 手機版相容性偵測 (Responsive Web Design)
    const isMobile = window.innerWidth < 1024;
    // 如果是手機，改為上下 1 欄 (1fr)，否則維持左右並排 (1fr 1.8fr)
    const gridLayout = isMobile ? 'grid-template-columns: 1fr; gap: 15px;' : 'grid-template-columns: 1fr 1.8fr; gap: 25px;';
    // 如果是手機，分隔線從右邊改到底部
    const dividerStyle = isMobile ? 'border-bottom: 1px solid #475569; padding-bottom: 20px; margin-bottom: 10px;' : 'border-right: 1px solid #475569; padding-right: 30px;';
    // 手機版允許底下 4 個小標籤換行 (變成 2x2 排列)
    const statsFlex = isMobile ? 'flex-wrap: wrap; gap: 15px;' : '';

    // 🏆 終極版 radarHtml：具備手機偵測的變形排版
    const radarHtml = `
    <div style="display: grid; ${gridLayout} margin-bottom: 30px; background: #1e293b; color: white; padding: 35px; border-radius: 20px; box-shadow: 0 12px 30px rgba(0,0,0,0.2);">
        <div style="${dividerStyle}">
            <div style="display: inline-block; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; padding: 4px 12px; border-radius: 8px; font-size: 14px; font-weight: bold; margin-bottom: 15px; letter-spacing: 1px; box-shadow: 0 0 10px rgba(56,189,248,0.2);">📌 目前項目：${itemNames[key] || key}</div>
            <div style="font-size: 20px; color: #94a3b8; margin-bottom: 12px; font-weight: bold;">🏆 全賽季實力總榜</div>
            <div style="font-size: 56px; font-weight: 900; color: #fbbf24; line-height: 1;">${totalNet >= 0 ? '+' : ''}${totalNet} <span style="font-size: 26px; color: #fff;">注</span></div>
            <div style="font-size: 26px; margin-top: 15px; font-weight: bold;">總勝率：<span style="color: #34d399;">${totalRate}%</span></div>
            <div style="font-size: 16px; color: #94a3b8; margin-top: 8px;">(${totalW}勝 ${totalL}敗 / 歷史留存)</div>
        </div>
       

<div style="display: flex; flex-direction: column; width: 100%;">
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 13px; padding: 4px 15px; border-radius: 20px; letter-spacing: 0.5px; font-weight: bold;">👆 點擊下方按鈕，可自由開關觀測線</span>
            </div>
            
            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="chart-toggle-btn" data-idx="0" style="background: rgba(16,185,129,0.15); border: 1.5px solid #10b981; color: #10b981; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 15px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🟩 30場指標</button>
                <button class="chart-toggle-btn" data-idx="1" style="background: rgba(56,189,248,0.15); border: 1.5px solid #38bdf8; color: #38bdf8; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 15px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🟦 20場指標</button>
                <button class="chart-toggle-btn" data-idx="2" style="background: rgba(168,85,247,0.15); border: 1.5px solid #a855f7; color: #a855f7; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 15px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🟪 7場維持度</button>
                <button class="chart-toggle-btn" data-idx="3" style="background: rgba(251,191,36,0.15); border: 1.5px solid #fbbf24; color: #fbbf24; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 15px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🟨 3場近況</button>
            </div>

            <div style="position: relative; height: 200px; width: 100%; margin-bottom: 25px;">
                <canvas id="normalModeChart"></canvas>
            </div>

            <div style="display: flex; justify-content: space-around; align-items: center; text-align: center; border-top: 1px dashed #475569; padding-top: 20px; ${statsFlex}">

                <div style="min-width: 100px;"><div style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-weight: bold;">30日指標</div><div style="font-size: 34px; font-weight: 900; color: #34d399;">${s30.rate}%</div><div style="font-size: 16px; color: ${s30.net >= 0 ? '#fbbf24' : '#ef4444'}; margin-top: 8px; font-weight: bold;">${s30.net >= 0 ? '+' : ''}${s30.net} 注</div></div>
                <div style="min-width: 100px;"><div style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-weight: bold;">20日指標</div><div style="font-size: 34px; font-weight: 900;">${s20.rate}%</div><div style="font-size: 16px; color: ${s20.net >= 0 ? '#fbbf24' : '#ef4444'}; margin-top: 8px; font-weight: bold;">${s20.net >= 0 ? '+' : ''}${s20.net} 注</div></div>
                <div style="min-width: 100px;"><div style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-weight: bold;">7日維持度</div><div style="font-size: 34px; font-weight: 900;">${s7.rate}%</div><div style="font-size: 16px; color: ${s7.net >= 0 ? '#fbbf24' : '#ef4444'}; margin-top: 8px; font-weight: bold;">${s7.net >= 0 ? '+' : ''}${s7.net} 注</div></div>
                <div style="min-width: 100px;"><div style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-weight: bold;">3日近況</div><div style="font-size: 34px; font-weight: 900; color: ${s3.rate>=60?'#f87171':'#fff'}">${s3.rate}%</div><div style="font-size: 16px; color: ${s3.net >= 0 ? '#fbbf24' : '#ef4444'}; margin-top: 8px; font-weight: bold;">${s3.net >= 0 ? '+' : ''}${s3.net} 注</div></div>
            </div>
        </div>
    </div>`;

    const isSingleColumn = key.includes('_total') || key.includes('_ml') || key.includes('_reg') || key.includes('_spread') || key.includes('_btts') || key === 'nbl_team' || key === 'jp_team' || key === 'kbl_team';
    area.className = 'data-layout'; area.style.flexDirection = 'column';
    if (isSingleColumn) { area.innerHTML = `${radarHtml} <div class="record-column" style="max-width: 100%;">${window.getRankBanner(itemNames[key] || '紀錄', n, key)}<div class="table-header"><div>日期</div><div style="width:80px;text-align:center;">戰績</div><div style="flex:1;padding-left:10px;">反饋</div></div>${window.buildHTML(records, false, n, key)}</div>`; } 
    else { let rightKey = base + '_total'; if (key === 'nhl_spread_ot') rightKey = 'nhl_total_ot'; area.innerHTML = `${radarHtml} <div style="display:flex; gap:20px;"><div class="record-column">${window.getRankBanner(itemNames[key] || '隊伍紀錄', n, key)}<div class="table-header"><div>日期</div><div style="width:80px;text-align:center;">戰績</div><div style="flex:1;padding-left:10px;">反饋</div></div>${window.buildHTML(records, false, n, key)}</div><div class="record-column">${window.getRankBanner('大小紀錄', n, rightKey)}<div class="table-header"><div>日期</div><div style="width:80px;text-align:center;">戰績</div><div style="flex:1;padding-left:10px;">反饋</div></div>${window.buildHTML(window.dataDB[n][rightKey] || [], false, n, rightKey)}</div></div>`; }

// 🎯 呼叫 Chart.js 渲染圖表
    setTimeout(() => {
        const canvas = document.getElementById('normalModeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const c30 = '#10b981', c20 = '#38bdf8', c7 = '#a855f7', c3 = '#fbbf24';

        // 沿用已算好的生涯數據
        let trueTotalMatches = totalW + totalL;
        let careerRate = totalRate;

        const careerLevelPlugin = {
            id: 'careerLevel',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const yAxis = chart.scales.y;
                const chartArea = chart.chartArea;
                const yPos = yAxis.getPixelForValue(careerRate);

                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; 
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(chartArea.left, yPos);
                ctx.lineTo(chartArea.right, yPos);
                ctx.stroke();

                const text = `生涯 ${careerRate}% (${trueTotalMatches}場)`;
                ctx.font = 'bold 12px sans-serif'; // 配合微縮版，字體稍微縮小
                const textWidth = ctx.measureText(text).width;
                const paddingX = 10, boxHeight = 22; 
                const boxWidth = textWidth + paddingX * 2;
                const boxX = chartArea.left; 
                let boxY = yPos - boxHeight / 2;

                if (boxY < chartArea.top) boxY = chartArea.top + 2;
                if (boxY + boxHeight > chartArea.bottom) boxY = chartArea.bottom - boxHeight - 2;

                ctx.fillStyle = 'rgba(236, 72, 153, 0.9)'; 
                ctx.beginPath();
                ctx.rect(boxX, boxY, boxWidth, boxHeight);
                ctx.fill();

                ctx.fillStyle = '#ffffff'; 
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2);
                ctx.restore();
            }
        };           

        new Chart(ctx, {
            type: 'line',
            plugins: [careerLevelPlugin], 
            data: {
                datasets: [
                    { label: '30場', data: generateAuthenticTrack(30, records), borderColor: c30, borderWidth: 2, pointRadius: 1, tension: 0.2 },
                    { label: '20場', data: generateAuthenticTrack(20, records), borderColor: c20, borderWidth: 2, pointRadius: 1, tension: 0.2 },
                    { label: '7場', data: generateAuthenticTrack(7, records), borderColor: c7,  borderWidth: 2.5, pointRadius: 1.5, tension: 0.2 },
                    { label: '3場', data: generateAuthenticTrack(3, records), borderColor: c3,  borderWidth: 3, pointRadius: 2, pointHitRadius: 10, tension: 0.2 }
                ]
            },
            // 🚨 語法修復：補回被誤刪的 options 與 plugins 大門，讓設定生效！
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                plugins: {
                    // 🚨 隱藏原生殘缺圖例，畫面交由我們新建的實體 HTML 按鈕控制
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#94a3b8', bodyFont: { weight: 'bold' }, callbacks: { label: function(c) { if (c.dataIndex === 0) return null; return c.dataset.label + ': ' + Math.round(c.raw.y) + '%'; } } }
                },

                scales: {
                    x: { type: 'linear', position: 'bottom', reverse: true, min: 1, max: 31, ticks: { stepSize: 1, autoSkip: false, color: '#64748b', maxRotation: 0, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.02)' } },
                    y: { position: 'right', min: 0, max: 100, ticks: { stepSize: 20, color: '#fbbf24', font: { weight: 'bold' }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        }); // 👈 這裡宣告結束

        // 🚨 終極綁定引擎：讓 HTML 按鈕可以控制畫布裡的線條顯示與隱藏！
        document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-idx'));
                const myChart = Chart.getChart(canvas); // 抓取當前圖表
                if(!myChart) return;
                
                const meta = myChart.getDatasetMeta(idx);
                // 切換隱藏狀態
                meta.hidden = meta.hidden === null ? !myChart.data.datasets[idx].hidden : null;
                myChart.update();
                
                // 視覺回饋：如果被隱藏，按鈕變暗；如果開啟，按鈕發光
                if (meta.hidden) {
                    this.style.opacity = '0.3';
                    this.style.filter = 'grayscale(100%)';
                } else {
                    this.style.opacity = '1';
                    this.style.filter = 'none';
                }
            });
        });
        
    }, 150);
};

window.getRankBanner = function(title, name, key) {
    let list = []; let systemLatestDate = window.getSystemLatestDate(key);
    // 🎯 特殊激活白名單
    let qualifiedWhitelistRB = [];
    try { qualifiedWhitelistRB = JSON.parse(localStorage.getItem('AdminWhitelist_Experts')) || []; } catch(e) {}

for(let n in window.dataDB) { if(window.dataDB[n][key] && window.dataDB[n][key].length > 0){ let diffDays = window.getDaysDiff(window.dataDB[n][key][0][0], systemLatestDate); if (diffDays > 3) continue;
        // 🎯 門檻激活：不重複天數 < 10 天不進入 getRankBanner 排名
let uniqueDatesRB = new Set(window.dataDB[n][key].map(r => r[0]));
if (uniqueDatesRB.size < 10 && !qualifiedWhitelistRB.includes(n + '||' + key)) continue;

        let w=0, l=0, n20=0; window.dataDB[n][key].slice(0, 20).forEach(r => { const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]); n20 += parseInt(r[2] || 0); }); let rate = (w+l) > 0 ? (w/(w+l)) : 0; list.push({name: n, net: n20, rate: rate}); } }
 
const target = list.find(r => r.name === name);
    if (!target) {
        const wlKey = (name + '||' + key).replace(/'/g, "\\'");
        const activateBtn = (window.isAdmin === true)
            ? `<span onclick="window.adminActivateExpert('${wlKey}')" style="cursor:pointer; background:#f59e0b; color:white; font-size:11px; font-weight:bold; padding:3px 10px; border-radius:6px; border:none;">⭐ 點擊激活</span>`
            : `<span style="background:#f1f5f9; color:#94a3b8; font-size:12px; padding:3px 10px; border-radius:6px;">未激活榜單</span>`;
        return `<div class="title-container title-unranked"><h4 class="section-title">${title}</h4>${activateBtn}</div>`;
    }

    let isReverse = target.rate < 0.5; let rankIdx = -1; let cls = "title-unranked"; let bCls = ""; let rankPrefix = "近況";
    if (!isReverse) { let topList = list.filter(item => item.rate >= 0.5); topList.sort((a,b) => b.rate - a.rate || b.net - a.net); rankIdx = topList.findIndex(r => r.name === name); if(rankIdx === 0) { cls = "title-rank-1"; bCls = "rank-1-badge"; } else if(rankIdx === 1) { cls = "title-rank-2"; bCls = "rank-2-badge"; } else if(rankIdx === 2) { cls = "title-rank-3"; bCls = "rank-3-badge"; } } 
    else { let bottomList = list.filter(item => item.rate < 0.5); bottomList.sort((a,b) => a.rate - b.rate || a.net - b.net); rankIdx = bottomList.findIndex(r => r.name === name); rankPrefix = "反向"; cls = "title-rank-neg"; bCls = "rank-neg-badge"; }
    return `<div class="title-container ${cls}"><h4 class="section-title">${title}</h4><span class="rank-badge ${bCls}">${(rankIdx !== -1)?`${rankPrefix} NO.${rankIdx+1}`:'近況'} (${target.net>=0?'+'+target.net:target.net})</span></div>`;
};


window.buildHTML = function(list, limitTo20, expertName = null, sportKey = null, prefixBtn = '') {
// 💡 歸類標記：強制鎖定 window.isAdmin 狀態
const canEdit = (window.isAdmin === true);

    let addBtnHtml = (expertName && sportKey && canEdit) ? 
        `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div class="func-left">${prefixBtn}</div>
            <button onclick="window.adminAddRecord('${expertName}', '${sportKey}')" style="background:#10b981; color:white; border:none; padding:5px 12px; border-radius:4px; font-size:13px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">➕ 新增戰績</button>
        </div>` : (prefixBtn ? `<div style="margin-bottom:10px;">${prefixBtn}</div>` : '');


    if(!list || list.length === 0) { let hint = ''; if (expertName && window.dataDB[expertName]) { let avail = []; for (let k in window.dataDB[expertName]) { if (window.dataDB[expertName][k].length > 0 && itemNames[k]) avail.push(itemNames[k]); } if (avail.length > 0) hint = `<div style="margin-top:10px;font-size:14px;color:#f59e0b;">💡 該好手主要預測：<b>${avail.join('、')}</b></div>`; } return `${addBtnHtml}<div style="padding:40px 20px;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:8px;">目前項目無數據${hint}</div>`; }
    let show = limitTo20 ? list.slice(0, 20) : list; let html = addBtnHtml;
    for (let i = 0; i < show.length; i += 10) {
        const chunk = show.slice(i, i + 10); let w=0, l=0, n=0; chunk.forEach(r => { const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/); if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]); n += parseInt(r[2] || 0); }); const rate = Math.round((w/(w+l))*100) || 0; let sCls = (rate>=55)?"summary-pos":(rate<=40?"summary-neg":"summary-neu");
        html += `<div class="summary-row ${sCls}"><div class="summary-stats">${w}勝 ${l}敗 | 淨勝 ${n>=0?'+'+n:n} | ${rate}%</div></div>`;
        chunk.forEach((r, idx) => { 
            let val = parseInt(r[2] || 0); let bg = val > 0 ? "bg-pos" : (val < 0 ? "bg-neg" : "bg-neu"); 
            let sH = val > 0 ? `<span class="score-pos">+${val}</span>` : (val < 0 ? `<span class="score-neg">${val}</span>` : `<span class="score-neu">0</span>`); 

// 💡 歸類標記：修正語法，只有管理員能生成垃圾桶按鈕
let delBtnHtml = (expertName && sportKey && canEdit) ? `<span onclick="window.adminDelRecord('${expertName}', '${sportKey}', '${r[0]}', '${r[1]}')" style="cursor:pointer; position:absolute; right:10px; font-size:14px; filter:grayscale(100%); transition:0.2s;" onmouseover="this.style.filter='none'" onmouseout="this.style.filter='grayscale(100%)'" title="刪除此筆">🗑️</span>` : '';

            html += `<div class="record-row ${bg} ${idx===chunk.length-1 && i+10<show.length?'ten-day-gap':''}"><div class="col-date">${r[0]}</div><div class="col-record">${r[1]}</div><div class="score-wrapper" style="display:flex; align-items:center; position:relative;">${sH}${delBtnHtml}</div></div>`; 
        });
    } return html;
};

window.adminActivateExpert = function(wlKey) {
    var parts = wlKey.split('||');
    var expertName = parts[0];
    var sportKey = parts[1];
    var sportLabel = (typeof itemNames !== 'undefined' && itemNames[sportKey]) ? itemNames[sportKey] : sportKey;
    if (!confirm('激活「' + expertName + '」的【' + sportLabel + '】榜單資格？')) return;
    var whitelist = [];
    try { whitelist = JSON.parse(localStorage.getItem('AdminWhitelist_Experts')) || []; } catch(e) {}
    if (whitelist.includes(wlKey)) { alert('已在白名單中。'); return; }
    whitelist.push(wlKey);
    localStorage.setItem('AdminWhitelist_Experts', JSON.stringify(whitelist));
    if (typeof window.renderWhitelistArea === 'function') window.renderWhitelistArea();
    window.renderDisplay();
    alert('✅ 已激活「' + expertName + '」/ ' + sportLabel);
};




/* ========================================================================= */
/* 🚀 專家動能實力總表 (Project Momentum) - 100% 繼承 core_engine 大腦
/* ========================================================================= */

window.openMomentumRadar = function() {
    const mainContent = document.getElementById('mainContent');
    const radarPage = document.getElementById('momentumRadarPage');
    if (!radarPage) {
        alert("找不到戰情室畫面，請確認 index.html 已經更新！");
        return;
    }
    // 🚨 LINE WebView 終極方案：用 screen.width 判斷，手機版與電腦版走不同路徑
    window.scrollTo(0, 0);
    mainContent.style.display = 'none';

    var safeWidth = window.screen.width || window.innerWidth;
    if (safeWidth < 1024) {
        // 📱 手機版：先隱形 → 用 screen.width 算 scale → 延遲才顯示
        radarPage.style.display = 'block';
        radarPage.style.visibility = 'hidden';
        var scale = safeWidth / 980;
        var safeHeight = window.screen.height || window.innerHeight;
        radarPage.style.transformOrigin = 'top left';
        radarPage.style.transform = 'scale(' + scale + ')';
        radarPage.style.width = '980px';
        radarPage.style.height = Math.round(safeHeight / scale) + 'px';
        setTimeout(function() {
            radarPage.scrollTo(0, 0);
            radarPage.style.visibility = 'visible';
        }, 100);
    } else {
        // 🖥️ 電腦版：直接顯示，不做 scale，不做延遲
        radarPage.style.display = 'block';
        radarPage.scrollTo(0, 0);
    }     

    // 🎯 完美繼承：讀取 core_engine.js 中的 currentHomeFilter
    let defaultTimeframe = window.currentHomeFilter || 20;
    window.renderMomentumRadar(defaultTimeframe); 
};

window.closeMomentumRadar = function() {
    var radarPage = document.getElementById('momentumRadarPage');
    radarPage.style.display = 'none';
    radarPage.style.transform = 'none';
    radarPage.style.width = '100%';
    radarPage.style.height = '100%';
    document.getElementById('mainContent').style.display = 'block';

    // 🚨 核心防呆升級：關閉時也強制傳入 true 更新一次主頁高度，確保完美歸位！
    if (typeof window.scalePage === 'function') {
        setTimeout(function() { window.scalePage(true); }, 100);
    }
};


// 2. 數據轉換器 (真實累積勝率走勢演算法 - 終極動能竄出版)
function generateAuthenticTrack(maxMatches, records) {
    let data = [];
    if (!records || records.length === 0) return data;

    let sliceRec = records.slice(0, maxMatches);
    let actualLen = sliceRec.length;
    if (actualLen === 0) return data;

    // 1. 隱形起點：從實際場次數「+1」的地方底部竄出 (例如 20 場就從 21 竄出)
    data.push({ x: actualLen + 1, y: 0 });

    // 2. 時序反轉：從最舊的那一場開始，推到最新的一場
    let reversed = sliceRec.slice().reverse();
    let totalW = 0, totalL = 0;

    reversed.forEach((r, index) => {
        const wm = r[1].match(/(\d+)勝/);
        const lm = r[1].match(/(\d+)敗/);
        if(wm) totalW += parseInt(wm[1]);
        if(lm) totalL += parseInt(lm[1]);

        // 3. 沿用前台公式：計算累積到這場為止的「真實勝率」
        let rate = (totalW + totalL) > 0 ? Math.round((totalW / (totalW + totalL)) * 100) : 0;
        
        // 4. 座標推進：例如 20 場，第一節點就是 X=20，最後的牆壁剛好是 X=1
        let xPos = actualLen - index; 
        data.push({ x: xPos, y: rate });
    });

    return data;
}


// 畫面渲染主邏輯
window.renderMomentumRadar = function(timeframe = 20, btnElement = null) {
    if (btnElement) {
        const btns = btnElement.parentElement.querySelectorAll('.r-btn');
        btns.forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        const filterBar = document.querySelector('#momentumRadarPage .ranking-filter-bar');
        if(filterBar) {
            const btns = filterBar.querySelectorAll('.r-btn');
            btns.forEach(b => {
                b.classList.remove('active');
                let txt = timeframe === 'all' ? '總榜' : timeframe.toString();
                if(b.innerText.includes(txt)) b.classList.add('active');
            });
        }
    }

    const listContainer = document.getElementById('momentumRadarList');
    listContainer.innerHTML = ''; 
    
    const key = window.activeSportKey || 'nba_team'; 
    const badgeName = typeof itemNames !== 'undefined' && itemNames[key] ? itemNames[key] : key;

    let systemLatestDate = window.getSystemLatestDate ? window.getSystemLatestDate(key) : new Date().toISOString().split('T')[0];
    let qualifiedWhitelist = [];
    try { qualifiedWhitelist = JSON.parse(localStorage.getItem('AdminWhitelist_Experts')) || []; } catch(e) {}

    let filterThreshold = timeframe === 'all' ? 0 : parseInt(timeframe);
    let allSorted = [];

    // ==========================================
    // 🎯 核心移植：從 core_engine.js 提取的過濾邏輯
    // ==========================================
    for (let name in window.dataDB) {
        let records = window.dataDB[name][key] || [];
        if (records.length === 0) continue;

        // 1. 休眠判斷
        let diffDays = window.getDaysDiff ? window.getDaysDiff(records[0][0], systemLatestDate) : 0;
        let isActive = diffDays <= 3;

        // 2. 門檻激活判斷
        let uniqueDates = new Set(records.map(r => r[0]));
        let isQualified = uniqueDates.size >= filterThreshold || qualifiedWhitelist.includes(name + '||' + key);

        // 3. 結算當前勝率與淨值
        let sliceRec = timeframe === 'all' ? records : records.slice(0, filterThreshold);
        let net = sliceRec.reduce((sum, r) => sum + parseInt(r[2] || 0), 0);

        let w = 0, l = 0;
        sliceRec.forEach(r => {
            const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/);
            if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]);
        });
        let winRate = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;

        // 4. 四線圖表專用勝率
        const getLineRate = (days) => {
            let tw=0, tl=0;
            records.slice(0, days).forEach(r => {
                const m1 = r[1].match(/(\d+)勝/); const m2 = r[1].match(/(\d+)敗/);
                if(m1) tw += parseInt(m1[1]); if(m2) tl += parseInt(m2[1]);
            });
            return (tw+tl)>0 ? Math.round((tw/(tw+tl))*100) : 0;
        };

        allSorted.push({
            name, net, winRate, recordsLen: records.length,
            isActive, isQualified, // ⬅️ 關鍵標記存入
            r30: getLineRate(30), r20: getLineRate(20), r7: getLineRate(7), r3: getLineRate(3)
        });
    }

    // ==========================================
    // 🎯 核心移植：從 core_engine.js 提取的排序引擎
    // ==========================================
    allSorted.sort((a, b) => {
        const aRank = a.isActive && a.isQualified;
        const bRank = b.isActive && b.isQualified;
        
        // 沉澱機制發動：沒達標/休眠的人強制往下沉！
        if (aRank && !bRank) return -1;
        if (!aRank && bRank) return 1;
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        // 勝率與淨值比較 (支援正反向模式)
        if (window.isNegativeMode) {
            return a.winRate - b.winRate || a.net - b.net;
        } else {
            return b.winRate - a.winRate || b.net - a.net;
        }
    });

    // 🚨 找回消失的心臟代碼：這行絕對不能少！過濾並產生 displayList 陣列！
    const displayList = window.isNegativeMode ? allSorted.filter(item => item.winRate < 50) : allSorted.filter(item => item.winRate >= 50);

// 🎯 終極升級：戰情室內建無縫下拉選單 (移植自主頁核心)
    // 1. 定義選單結構 (與主頁 100% 同步)
    const categories = [
        { name: '🏀 美籃 NBA', items: [ { id: 'nba_team', label: 'NBA 讓分盤' }, { id: 'nba_total', label: 'NBA 大小分' }, { id: 'nba_team_total', label: 'NBA 單隊大小' }, { id: 'nba_team_spread', label: 'NBA 單隊讓盤' }, { id: 'nba_1h_total', label: 'NBA 上半大小' } ] }, 
        { name: '⚾ 美棒 MLB', items: [ { id: 'mlb_ml', label: 'MLB 獨贏(正常)' }, { id: 'mlb_runline', label: 'MLB 讓分盤' }, { id: 'mlb_total', label: 'MLB 大小分' }, { id: 'mlb_ml_high', label: 'MLB 高賠獨贏' } ] },
        { name: '🇯🇵 日棒 NPB', items: [ { id: 'npb_runline', label: '日棒讓分' }, { id: 'npb_ml', label: '日棒獨贏' }, { id: 'npb_total', label: '日棒大小' }, { id: 'npb_1h_runline', label: '日棒上半讓分' }, { id: 'npb_1h_ml', label: '日棒上半獨贏' }, { id: 'npb_1h_total', label: '日棒上半大小' } ] },
        { name: '⚽ 足球系列', items: [ { id: 'soccer_team', label: '足球隊伍' }, { id: 'soccer_total', label: '足球大小分' }, { id: 'soccer_ml', label: '足球獨贏' }, { id: 'soccer_btts', label: '足球兩隊進球' }, { id: 'soccer_corner_total', label: '足球角球大小' }, { id: 'soccer_corner_ml', label: '足球角球PK' } ] },
        { name: '🏒 冰球系列', items: [ { id: 'nhl_ml', label: '冰球獨贏(含加時)' }, { id: 'nhl_ml_reg', label: '冰球獨贏(不含加時)' }, { id: 'nhl_spread_ot', label: '冰球讓盤(含加時)' }, { id: 'nhl_spread_reg', label: '冰球讓盤(不含加時)' }, { id: 'nhl_total_ot', label: '冰球大小(含加時)' }, { id: 'nhl_total_reg', label: '冰球大小(不含加時)' }, { id: 'khl_team', label: '俄冰隊伍' }, { id: 'khl_total', label: '俄冰大小分' } ] },
        { name: '🌏 亞洲/歐籃', items: [ { id: 'euro_team', label: '歐籃隊伍' }, { id: 'euro_total', label: '歐籃大小' }, { id: 'euro_1h', label: '歐籃上半' }, { id: 'nbl_team', label: '澳籃隊伍' }, { id: 'nbl_total', label: '澳籃大小' }, { id: 'jbl_team', label: '日籃隊伍' },{ id: 'jbl_total', label: '日籃大小' },{ id: 'kbl_team', label: '韓籃隊伍' }, { id: 'kbl_total', label: '韓籃大小' }, { id: 'cba_team', label: '中籃隊伍' }, { id: 'cba_total', label: '中籃大小' } ] }, 
        { name: '🎮 電競系列', items: [ { id: 'lol_team', label: '電競隊伍' }, { id: 'lol_total', label: '電競大小' } ] }
    ];

    // 2. 生成 HTML 結構 (暗黑科技風的 hover 展開選單)
    let menuHtml = '';
    categories.forEach(cat => {
        let subItems = '';
        cat.items.forEach(item => {
            let activeCls = (item.id === key) ? 'color:#fbbf24; font-weight:900;' : 'color:#cbd5e1;';
            subItems += `<div onclick="window.activeSportKey='${item.id}'; window.renderMomentumRadar('${timeframe}');" style="padding:10px 15px; cursor:pointer; border-bottom:1px solid #334155; transition:0.2s; ${activeCls}" onmouseover="this.style.background='#334155'" onmouseout="this.style.background='transparent'">${item.label}</div>`;
        });
        menuHtml += `
            <div style="position:relative; display:inline-block; margin: 0 5px;" onmouseover="this.querySelector('.sub-menu').style.display='block'" onmouseout="this.querySelector('.sub-menu').style.display='none'">
                <div style="background:#1e293b; color:#94a3b8; border:1px solid #475569; padding:8px 18px; border-radius:20px; font-size:14px; font-weight:bold; cursor:pointer; transition:0.2s;" onmouseover="this.style.borderColor='#38bdf8'; this.style.color='#38bdf8';" onmouseout="this.style.borderColor='#475569'; this.style.color='#94a3b8';">${cat.name} ▾</div>
                <div class="sub-menu" style="display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); background:#0f172a; border:1px solid #38bdf8; border-radius:8px; min-width:160px; z-index:9999; box-shadow:0 10px 25px rgba(0,0,0,0.5); padding:5px 0; margin-top:5px;">
                    ${subItems}
                </div>
            </div>
        `;
    });

    const sportBadgeHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 30px; margin-top: 10px; z-index: 500; position: relative;">
            <div style="background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; padding: 8px 30px; border-radius: 30px; font-size: 18px; font-weight: 900; letter-spacing: 2px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); margin-bottom: 15px;">
                📌 當前觀測：${badgeName}
            </div>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
                ${menuHtml}
            </div>
        </div>
    `;

    if(displayList.length === 0) {
        listContainer.innerHTML = sportBadgeHtml + '<div style="color:#94a3b8; text-align:center; font-size:20px; padding:50px; font-weight:bold;">目前項目無符合條件之好手</div>';
        return;
    }

    // 印出標誌與選單
    listContainer.innerHTML = sportBadgeHtml;

    // 渲染畫面
    displayList.forEach((exp, index) => {
        const isTopTier = exp.isActive && exp.isQualified;
        let cardBorder = '#334155'; let rankBg = '#475569'; let rankColor = '#fff'; let glow = '';
        let rankStr = `NO.${index + 1}`;
        
        if (isTopTier) {
            if(index === 0) { cardBorder = '#fbbf24'; rankBg = '#fbbf24'; rankColor = '#000'; glow = 'box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);'; rankStr = 'RANK 1'; }
            else if(index === 1) { cardBorder = '#94a3b8'; rankBg = '#94a3b8'; rankColor = '#000'; glow = 'box-shadow: 0 0 15px rgba(148, 163, 184, 0.2);'; rankStr = 'RANK 2'; }
            else if(index === 2) { cardBorder = '#ea580c'; rankBg = '#ea580c'; rankColor = '#fff'; glow = 'box-shadow: 0 0 15px rgba(234, 88, 12, 0.2);'; rankStr = 'RANK 3'; }
        } else {
            // ❄️ 沉澱者外觀
            cardBorder = '#475569'; rankBg = '#334155'; rankColor = '#94a3b8';
        }

        const rowDiv = document.createElement('div');
        // ❄️ 沉澱者特效
        let opacityStyle = isTopTier ? 'opacity: 1;' : 'opacity: 0.65; filter: grayscale(30%);';
        let sleepBadge = !isTopTier ? `<div style="position: absolute; top: -12px; right: 15px; background: #475569; color: #cbd5e1; padding: 4px 10px; border-radius: 20px; font-weight: 900; font-size: 12px; border: 1px solid #64748b; letter-spacing: 1px; z-index: 5;">❄️ 沉澱中</div>` : '';

        // 🚨 LINE 瀏覽器終極防護：強制鎖定卡片寬度為電腦版尺寸，確保圖表永遠不被擠壓，完美交由外部引擎等比例縮小！
        rowDiv.style.cssText = `display: flex; gap: 25px; background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid ${cardBorder}; ${glow} ${opacityStyle} position: relative; min-width: 880px; box-sizing: border-box;`;
        
        const safeId = `radarChart_${rankStr.replace(/\s/g,'')}_${exp.name.replace(/\s+/g, '')}`;

        rowDiv.innerHTML = `
            ${sleepBadge}
            <div style="width: 200px; background: #0f172a; border-radius: 15px; padding: 20px 10px; text-align: center; position: relative; border: 1px solid #334155; display:flex; flex-direction:column; justify-content:center;">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${rankBg}; color: ${rankColor}; padding: 4px 15px; border-radius: 20px; font-weight: 900; font-size: 14px; letter-spacing: 1px; white-space: nowrap;">${rankStr}</div>
                ${index === 0 && isTopTier ? '<div style="font-size:28px; margin-bottom:5px;">👑</div>' : ''}
                <div style="font-size: 18px; font-weight: bold; color: #f8fafc; margin-bottom: 5px;">${exp.name}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-bottom: 15px; background: rgba(255,255,255,0.05); display:inline-block; padding:2px 8px; border-radius:5px; margin-left:auto; margin-right:auto;">${badgeName}</div>
                <div style="font-size: 38px; font-weight: 900; color: ${window.isNegativeMode ? '#f87171' : '#38bdf8'}; line-height: 1;">${exp.winRate}%</div>

                <div style="color: ${exp.net >= 0 ? '#fbbf24' : '#ef4444'}; font-size: 16px; font-weight: bold; margin-top: 10px;">
                    ${exp.net >= 0 ? '+' : ''}${exp.net} 注 
                    <span style="font-size: 12px; color: #94a3b8; font-weight: normal; margin-left: 4px;">
                        ${timeframe === 'all' ? '(總榜)' : '(近' + timeframe + '場)'}
                    </span>
                </div>

            </div>
            <div style="flex: 1; position: relative; height: 220px; width: 100%;">
                <canvas id="${safeId}"></canvas>
            </div>
        `;
        listContainer.appendChild(rowDiv);


        setTimeout(() => {
            const ctx = document.getElementById(safeId).getContext('2d');
            // 💡 拔除淡化特效，讓四種顏色的線永遠保持 100% 飽和度
            const c30 = '#10b981';
            const c20 = '#38bdf8';
            const c7  = '#a855f7';
            const c3  = '#fbbf24';


// 🎯 結算專家生涯真實總預測數與勝率
            let cW = 0, cL = 0;
            let expertRecords = window.dataDB[exp.name][key] || [];
            expertRecords.forEach(r => {
                const wm = r[1].match(/(\d+)勝/); const lm = r[1].match(/(\d+)敗/);
                if(wm) cW += parseInt(wm[1]); if(lm) cL += parseInt(lm[1]);
            });
            // 🚨 修正 3：真實總預測數 (勝+敗)，讓數據邏輯 100% 嚴謹
            let trueTotalMatches = cW + cL;
            let careerRate = trueTotalMatches > 0 ? Math.round((cW / trueTotalMatches) * 100) : 0;

            // 🎯 終極版雷射浮標外掛 (防裁切 + 相容舊手機)
            const careerLevelPlugin = {
                id: 'careerLevel',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    const yAxis = chart.scales.y;
                    const chartArea = chart.chartArea;
                    const yPos = yAxis.getPixelForValue(careerRate);

                    ctx.save();
                    
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; 
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(chartArea.left, yPos);
                    ctx.lineTo(chartArea.right, yPos);
                    ctx.stroke();

                    const text = `生涯 ${careerRate}% (${trueTotalMatches}場)`;
                    ctx.font = 'bold 14px sans-serif'; 
                    const textWidth = ctx.measureText(text).width;
                    const paddingX = 12, boxHeight = 26; 
                    const boxWidth = textWidth + paddingX * 2;
                    
                    const boxX = chartArea.left; 
                    let boxY = yPos - boxHeight / 2;

                    // 🚨 修正 2：防裁切保護！如果 100% 碰到天花板、或 0% 碰到地板，強制內縮
                    if (boxY < chartArea.top) boxY = chartArea.top + 2;
                    if (boxY + boxHeight > chartArea.bottom) boxY = chartArea.bottom - boxHeight - 2;

                    ctx.fillStyle = 'rgba(236, 72, 153, 0.9)'; 
                    ctx.beginPath();
                    // 🚨 修正 1：捨棄舊版 iPhone 會當機的 roundRect，改用絕對安全的 rect
                    ctx.rect(boxX, boxY, boxWidth, boxHeight);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff'; 
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // 文字的 Y 軸座標必須跟著受保護的 boxY 居中對齊
                    ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2);
                    
                    ctx.restore();
                }
            };
            new Chart(ctx, {
                type: 'line',
                plugins: [careerLevelPlugin], // 👈 啟動剛寫好的生涯雷射浮標外掛！
                data: {

                    // 💡 不再根據 timeframe 改變粗細，讓四條線同時清晰呈現
                    datasets: [
                        { label: '30場指標', data: generateAuthenticTrack(30, window.dataDB[exp.name][key] || []), borderColor: c30, borderWidth: 2.5, pointRadius: 1, tension: 0.2 },
                        { label: '20場指標', data: generateAuthenticTrack(20, window.dataDB[exp.name][key] || []), borderColor: c20, borderWidth: 2.5, pointRadius: 1, tension: 0.2 },
                        { label: '7場維持度', data: generateAuthenticTrack(7,  window.dataDB[exp.name][key] || []), borderColor: c7,  borderWidth: 3,   pointRadius: 2, tension: 0.2 },
                        { label: '3場近況',   data: generateAuthenticTrack(3,  window.dataDB[exp.name][key] || []), borderColor: c3,  borderWidth: 4,   pointRadius: 3, pointHitRadius: 10, tension: 0.2 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    // 🚨 修正核心：改為 nearest 與 axis: 'x'，絕對精準對齊游標位置！不再抓錯資料！
                    interaction: { mode: 'nearest', axis: 'x', intersect: false },
                    plugins: { 

                        // 🎯 視覺升級：將圖例移至正中央 (center)，並加上 padding (20) 讓四個按鈕均勻散開不擁擠
                        legend: { position: 'top', align: 'center', labels: { color: '#cbd5e1', font: { size: 12, weight: 'bold' }, boxWidth: 20, padding: 20 } },

                        tooltip: { 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            titleColor: '#94a3b8', 
                            bodyFont: { weight: 'bold' }, 
                            callbacks: { 
                                label: function(c) { 
                                    // 🛡️ 終極防呆：攔截第 0 個點！不讓用戶看到底部的 0%
                                    if (c.dataIndex === 0) return null; 
                                    return c.dataset.label + ': ' + Math.round(c.raw.y) + '%'; 
                                } 
                            } 
                        }
                    },
                    // 🚨 終極修正：X 軸 1~31 完整顯示，並強制每個節點對齊刻度！
                    scales: {
                        x: { 
                            type: 'linear', 
                            position: 'bottom', 
                            reverse: true, 
                            min: 1, 
                            max: 31, 
                            title: { display: true, text: '距今場次', color: '#475569' }, 
                            ticks: { 
                                stepSize: 1,       // 👈 關鍵 1：每 1 單位就畫一個刻度
                                autoSkip: false,   // 👈 關鍵 2：強制顯示所有數字，不允許系統自動隱藏
                                color: '#64748b' 
                            }, 
                            grid: { color: 'rgba(255,255,255,0.02)' } 
                        },
                        y: { 
                            position: 'right', 
                            min: 0, 
                            max: 100, 
                            title: { display: true, text: '勝率牆 (%)', color: '#fbbf24' }, 
                            ticks: { stepSize: 20, color: '#fbbf24', font: { weight: 'bold' }, callback: v => v + '%' }, 
                            grid: { color: 'rgba(255,255,255,0.05)' } 
                        }
                    }
                }
            });
        }, 150);

    });
};