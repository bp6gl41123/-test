/* ============================================================== */
/* ==== 【組件 C：勢力矩陣 - core_trend.js】 ==== */
/* ============================================================== */

window.activeTrendFilter = 'all'; 
window.activeTrendSportKey = "";

// 1. 生成趨勢頁面的項目標籤
window.appendTrendTab = function(key, label, container) { 
    const btn = document.createElement('label'); 
    btn.className = `sport-tab`; 
    btn.innerHTML = label; 
    btn.onclick = () => { 
        document.querySelectorAll('#trendTabContainer .sport-tab').forEach(t => t.classList.remove('active')); 
        btn.classList.add('active'); 
        window.activeTrendSportKey = key; 
        document.getElementById('trendFilters').style.display = 'flex'; 
        window.renderTrendChart(); 
    }; 
    container.appendChild(btn); 
};

// 2. 切換趨勢過濾器 (總榜 / 7次 / 3次)
window.setTrendFilter = function(val) { 
    window.activeTrendFilter = val; 
    document.querySelectorAll('.t-filter-btn').forEach(btn => btn.classList.remove('active')); 
    document.getElementById('t-filter-' + val).classList.add('active'); 
    if(window.activeTrendSportKey) window.renderTrendChart(); 
};

// 3. 趨勢頁面開關邏輯
window.openTrendPage = function() { document.getElementById('trendPage').style.display = 'block'; document.body.style.overflow = 'hidden'; };
window.closeTrendPage = function() { document.getElementById('trendPage').style.display = 'none'; document.body.style.overflow = 'auto'; };

// 4. 長條圖核心渲染引擎 (原裝邏輯)
window.renderTrendChart = function() {
    if (!window.activeTrendSportKey) return; 
    let key = window.activeTrendSportKey; 
    const chartBody = document.getElementById('trendChartBody'); 
    let systemLatestDate = window.getSystemLatestDate(key); 
    let filterText = window.activeTrendFilter === 'all' ? '歷史總榜' : `近 ${window.activeTrendFilter} 次預測`; 
    
    document.getElementById('trendChartTitle').innerText = `${itemNames[key]} - 戰績勢力分布 (${filterText})`; 
    chartBody.innerHTML = ''; 
    let chartData = [];

    for (let name in window.dataDB) {
        if (window.dataDB[name][key] && window.dataDB[name][key].length > 0) {
            let records = window.dataDB[name][key]; 
            let diffDays = window.getDaysDiff(records[0][0], systemLatestDate); 
            let isActive = diffDays <= 3; 
            
            // 計算 30 日指標
            let w30 = 0, l30 = 0;
            records.slice(0, 30).forEach(r => { 
                let wm = r[1].match(/(\d+)勝/); 
                let lm = r[1].match(/(\d+)敗/); 
                if(wm) w30 += parseInt(wm[1]); 
                if(lm) l30 += parseInt(lm[1]); 
            });
            let rate30 = (w30 + l30) > 0 ? Math.round((w30 / (w30 + l30)) * 100) : 0; 
            let rateColor = rate30 >= 55 ? '#16a34a' : (rate30 < 50 ? '#dc2626' : '#64748b'); 
            let baseBadge = `<span style="font-size:12px; border:1px solid ${rateColor}; color:${rateColor}; padding:2px 6px; border-radius:4px; margin-left:8px; background:white; line-height:1;" title="近30次整體勝率">30日 ${rate30}%</span>`;
            
            // 計算連勝/連敗氣泡
            let streakStr = ""; 
            let currentStreak = 0; 
            let streakType = null; 
            for(let i=0; i<records.length; i++) { 
                let net = parseInt(records[i][2] || 0); 
                if(net === 0) break; 
                if(streakType === null) streakType = net > 0 ? 'win' : 'loss'; 
                if((streakType === 'win' && net > 0) || (streakType === 'loss' && net < 0)) currentStreak++; 
                else break; 
            }
            if(currentStreak >= 2) streakStr = `<span class="streak-badge ${streakType === 'win' ? 'streak-win' : 'streak-loss'}">${streakType === 'win' ? '🔥' : '❄️'} ${currentStreak}連${streakType === 'win' ? '勝' : '敗'}</span>`;
            
// 根據過濾器切換資料範圍
            let targetRecords = window.activeTrendFilter === 'all' ? records : records.slice(0, parseInt(window.activeTrendFilter));
            if (targetRecords.length > 0) { 
                let totalNet = targetRecords.reduce((sum, r) => sum + parseInt(r[2] || 0), 0); 
                
                // 🎯 新增：精準計算該區間的勝率 (保留小數點，防止整數推擠導致名次失真)
                let tw = 0, tl = 0;
                targetRecords.forEach(r => {
                    let wm = r[1].match(/(\d+)勝/);
                    let lm = r[1].match(/(\d+)敗/);
                    if(wm) tw += parseInt(wm[1]);
                    if(lm) tl += parseInt(lm[1]);
                });
                let tRate = (tw + tl) > 0 ? (tw / (tw + tl)) : 0;

                chartData.push({ name, net: totalNet, rate: tRate, streak: streakStr, baseBadge: baseBadge, isActive }); 
            }
        }
    }

    // 🏆 排序修改：活躍優先 -> 勝率優先 -> 勝率相同則看淨值加權
    chartData.sort((a, b) => { 
        if (a.isActive && !b.isActive) return -1; 
        if (!a.isActive && b.isActive) return 1; 
        return b.rate - a.rate || b.net - a.net; 
    });

    if (chartData.length === 0) return chartBody.innerHTML = '<p style="text-align:center; padding:50px; color:#999; font-weight:bold; font-size:18px;">該項目此區間段尚無數據</p>';

   // 💡 拔除舊的 maxNet 縮放，改用勝率的 0~100 絕對值來畫寬度
    chartData.forEach((d, i) => {
        // 勝率轉換為整數 % 數顯示
        const displayRate = Math.round(d.rate * 100);
        // 寬度直接對應勝率
        const barWidth = displayRate;

        // 🎯 [智慧植入] 參照舊版 core_engine.js，支援陣列格式與長條圖泡泡
        let pickHtml = '';
        if (typeof todayPicks !== 'undefined' && Array.isArray(todayPicks)) {
            const myPick = todayPicks.find(p => p[0] === d.name);
            if (myPick && myPick[1]) {
                const content = myPick[1].replace(/\n/g, '<br>');
                pickHtml = `<div class="pick-tooltip-container"><div class="pick-icon">💡 <span style="font-size:12px; margin-left:4px; font-weight:bold; color:#d97706;">今日推薦</span></div><div class="pick-tooltip"><div style="color:#fcd34d; font-weight:bold; margin-bottom:6px; border-bottom:1px solid #334155; padding-bottom:4px;"><span>${d.name} · 本日精選單</span></div><div style="line-height:1.6; font-size:14px; color:#f1f5f9;">${content}</div></div></div>`;
            }
        }

        // 顏色邏輯：勝率 >= 50% 為正向色，否則為負向色
        const barColorClass = d.isActive ? (d.rate >= 0.5 ? 'bar-pos' : 'bar-neg') : '';
        const inactiveStyle = !d.isActive ? 'background: #cbd5e1;' : '';
        const nameColor = d.isActive ? '#1e293b' : '#94a3b8';
        const sign = d.net > 0 ? '+' : '';

        chartBody.innerHTML += `
            <div class="bar-row" style="animation-delay: ${i * 0.05}s; opacity: ${d.isActive ? 1 : 0.6};">
                <div class="bar-name" style="color: ${nameColor};">
                    ${d.isActive ? d.streak : '<span class="streak-badge" style="background:#e2e8f0; color:#64748b;">💤 休眠</span>'} 
                    ${d.isActive ? d.baseBadge : ''}
                    <span style="margin-left:10px; text-decoration: ${d.isActive ? 'none' : 'line-through'};">${d.name}</span>
                    ${pickHtml}
                </div>

                <div class="bar-wrapper">
                    <div class="bar-fill ${barColorClass}" style="width: ${barWidth}%; ${inactiveStyle}">
                    </div>
                </div>
                <div class="bar-val" style="color: ${nameColor}; font-weight:bold; min-width:85px; text-align:right;">
                    ${displayRate}% <span style="font-size:13px; color:#94a3b8; font-weight:normal;">(淨${sign}${d.net})</span>
                </div>
            </div>`; 
    });
};