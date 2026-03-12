/* ============================================================== */
/* ==== 【量化觀測台 - 虛擬好手管理模組 core_quant_virtual.js】 ==== */
/* ============================================================== */

// ── 初始化：從 localStorage 讀取虛擬好手資料庫 ──
window.shadowDB = {};
try {
    var _saved = localStorage.getItem('QuantDB_Virtual_Experts');
    if (_saved) window.shadowDB = JSON.parse(_saved) || {};
} catch(e) {}

// ── 隱藏清單（✕按鈕用，重整後恢復）──
window.shadowHidden = [];

// ── 儲存到 localStorage ──
window.saveShadowDB = function() {
    try {
        localStorage.setItem('QuantDB_Virtual_Experts', JSON.stringify(window.shadowDB));
    } catch(e) {}
};

// ── 日期排序器（降冪，新的排前面）──
function sortExpertRecords(records) {
    var currentYear = new Date().getFullYear();
    var currentMonth = new Date().getMonth();
    records.sort(function(a, b) {
        var parseDate = function(dStr) {
            if (!dStr) return 0;
            var parts = dStr.split('/');
            if (parts.length !== 2) return 0;
            var m = parseInt(parts[0], 10) - 1;
            var d = parseInt(parts[1], 10);
            var dateObj = new Date(currentYear, m, d);
            if (m >= 9 && currentMonth <= 2) dateObj.setFullYear(currentYear - 1);
            return dateObj.getTime();
        };
        return parseDate(b[0]) - parseDate(a[0]);
    });
}

// ── 新增虛擬好手 ──
window.quantCreateExpert = function() {
    var name = prompt('請輸入虛擬好手名稱（例如：冥燈大師）：');
    if (!name || !name.trim()) return;
    name = name.trim();
    if (window.shadowDB[name]) {
        alert('「' + name + '」已存在，請換一個名稱。');
        return;
    }
    window.shadowDB[name] = { nba_team: [] };
    window.saveShadowDB();
    window.renderVirtualArea();
};

// ── 永久刪除虛擬好手 ──
window.quantDelExpert = function(name) {
    if (!confirm('⚠️ 確定永久刪除「' + name + '」及其所有戰績？\n此操作無法復原。')) return;
    delete window.shadowDB[name];
    window.saveShadowDB();
    window.renderVirtualArea();
};

// ── 暫時隱藏虛擬好手（✕按鈕，重整後恢復）──
window.quantHideExpert = function(name) {
    window.shadowHidden.push(name);
    window.renderVirtualArea();
};

// ── 新增戰績 ──
window.quantAddRecord = function(name) {
    var dateInput = prompt('日期（格式 MM/DD）：', '03/08');
    if (!dateInput) return;
    var wlInput = prompt('戰績（例如：2勝1敗）：', '1勝0敗');
    if (!wlInput) return;
    var netInput = prompt('淨值（例如：+1 或 -2）：', '+1');
    if (!netInput) return;

    var finalNet = netInput;
    if (!finalNet.includes('+') && !finalNet.includes('-')) {
        finalNet = parseInt(finalNet) >= 0 ? '+' + finalNet : finalNet;
    }

    if (!window.shadowDB[name]) window.shadowDB[name] = {};
    if (!window.shadowDB[name]['nba_team']) window.shadowDB[name]['nba_team'] = [];

    window.shadowDB[name]['nba_team'].push([dateInput, wlInput, finalNet]);
    sortExpertRecords(window.shadowDB[name]['nba_team']);
    window.saveShadowDB();
    window.renderVirtualArea();
};

// ── 刪除單筆戰績 ──
window.quantDelRecord = function(name, dateStr, wlStr) {
    if (!confirm('刪除「' + name + '」' + dateStr + ' ' + wlStr + '？')) return;
    var records = window.shadowDB[name]['nba_team'] || [];
    var idx = records.findIndex(function(r) { return r[0] === dateStr && r[1] === wlStr; });
    if (idx > -1) records.splice(idx, 1);
    window.saveShadowDB();
    window.renderVirtualArea();
};

// ── 展開/收起更多歷史 ──
window.shadowExpandStates = {};
window.quantToggleExpand = function(name) {
    window.shadowExpandStates[name] = !window.shadowExpandStates[name];
    window.renderVirtualArea();
};

// ── 建立單張卡片的 HTML ──
function buildVirtualCardHTML(name) {
    var records = (window.shadowDB[name] && window.shadowDB[name]['nba_team']) ? window.shadowDB[name]['nba_team'] : [];

    // 統計近7場勝率
    var slice7 = records.slice(0, 7);
    var w7 = 0, l7 = 0, net7 = 0;
    slice7.forEach(function(r) {
        var wm = r[1].match(/(\d+)勝/), lm = r[1].match(/(\d+)敗/);
        if (wm) w7 += parseInt(wm[1]);
        if (lm) l7 += parseInt(lm[1]);
        net7 += parseInt(r[2] || 0);
    });
    var winRate7 = (w7 + l7) > 0 ? Math.round(w7 / (w7 + l7) * 100) : 0;
    var netStr7 = net7 >= 0 ? '+' + net7 : '' + net7;

    // 建立戰績清單 HTML（每10筆一組小結）
    var showFull = window.shadowExpandStates[name] || false;
    var displayRecords = showFull ? records : records.slice(0, 20);
    var hasMore = records.length > 20;

    var recordsHTML = '';
    for (var i = 0; i < displayRecords.length; i += 10) {
        var chunk = displayRecords.slice(i, i + 10);
        var cw = 0, cl = 0, cn = 0;
        chunk.forEach(function(r) {
            var wm = r[1].match(/(\d+)勝/), lm = r[1].match(/(\d+)敗/);
            if (wm) cw += parseInt(wm[1]);
            if (lm) cl += parseInt(lm[1]);
            cn += parseInt(r[2] || 0);
        });
        var cRate = (cw + cl) > 0 ? Math.round(cw / (cw + cl) * 100) : 0;
        var cNetStr = cn >= 0 ? '+' + cn : '' + cn;
        var sCls = cRate >= 55 ? 'summary-pos' : (cRate <= 40 ? 'summary-neg' : 'summary-neu');

        recordsHTML += '<div class="summary-row ' + sCls + '"><div class="summary-stats">' + cw + '勝 ' + cl + '敗 | 淨勝 ' + cNetStr + ' | ' + cRate + '%</div></div>';

        chunk.forEach(function(r, idx) {
            var val = parseInt(r[2] || 0);
            var bg = val > 0 ? 'bg-pos' : (val < 0 ? 'bg-neg' : 'bg-neu');
            var scoreHTML = val > 0 ? '<span class="score-pos">+' + val + '</span>' : (val < 0 ? '<span class="score-neg">' + val + '</span>' : '<span class="score-neu">0</span>');
            var isGap = (idx === chunk.length - 1 && i + 10 < displayRecords.length) ? 'ten-day-gap' : '';
            var delBtn = '<span onclick="window.quantDelRecord(\'' + name.replace(/'/g, "\\'") + '\', \'' + r[0] + '\', \'' + r[1].replace(/'/g, "\\'") + '\')" style="cursor:pointer; position:absolute; right:10px; font-size:14px; filter:grayscale(100%); transition:0.2s;" onmouseover="this.style.filter=\'none\'" onmouseout="this.style.filter=\'grayscale(100%)\'">🗑️</span>';
            recordsHTML += '<div class="record-row ' + bg + ' ' + isGap + '"><div class="col-date">' + r[0] + '</div><div class="col-record">' + r[1] + '</div><div class="score-wrapper" style="display:flex; align-items:center; position:relative;">' + scoreHTML + delBtn + '</div></div>';
        });
    }

    var expandBtn = hasMore ? '<button class="expand-btn" onclick="window.quantToggleExpand(\'' + name.replace(/'/g, "\\'") + '\')">' + (showFull ? '🔼 收起歷史' : '🔍 展開更多歷史') + '</button>' : '';

    var safeNameJS = name.replace(/'/g, "\\'");

    return '<div class="pk-column" style="position:relative; min-width:220px;">'
        + '<button onclick="window.quantDelExpert(\'' + safeNameJS + '\')" style="position:absolute; left:8px; top:8px; background:#7f1d1d; color:#fca5a5; border:1px solid #ef4444; border-radius:6px; font-size:11px; font-weight:bold; padding:3px 8px; cursor:pointer; z-index:10;">🗑️ 刪除</button>'
        + '<div class="close-x" onclick="window.quantHideExpert(\'' + safeNameJS + '\')">×</div>'
        + '<div class="pk-name-label" style="display:flex; align-items:center; justify-content:center; padding: 30px 5px 10px 5px;">' + name + '</div>'
        + '<div class="title-container title-unranked"><h4 class="section-title">勝率 ' + winRate7 + '%</h4><span class="rank-badge">近7場 (' + netStr7 + ')</span></div>'
        + '<div style="display:flex; justify-content:flex-end; margin-bottom:10px;">'
        + '<button onclick="window.quantAddRecord(\'' + safeNameJS + '\')" style="background:#10b981; color:white; border:none; padding:5px 12px; border-radius:4px; font-size:13px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">➕ 新增戰績</button>'
        + '</div>'
        + '<div class="table-header"><div>日期</div><div style="width:70px;text-align:center;">戰績</div><div style="flex:1;padding-left:5px;">淨值</div></div>'
        + recordsHTML
        + expandBtn
        + '</div>';
}

// ── 主渲染函數：渲染整個虛擬好手區塊 ──
window.renderVirtualArea = function() {
    var area = document.getElementById('quant_virtual_area');
    if (!area) return;

    var allNames = Object.keys(window.shadowDB);
    var visibleNames = allNames.filter(function(n) { return window.shadowHidden.indexOf(n) === -1; });

    var cardsHTML = '';
    visibleNames.forEach(function(name) {
        cardsHTML += buildVirtualCardHTML(name);
    });

    area.innerHTML = '<div style="margin-top:40px; border-top:2px solid #334155; padding-top:30px;">'
        + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">'
        + '<h2 style="margin:0; color:#38bdf8; font-size:20px;">🔬 虛擬好手統計區</h2>'
        + '<button onclick="window.quantCreateExpert()" style="background:linear-gradient(135deg,#10b981,#047857); color:white; border:none; padding:10px 20px; border-radius:8px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 4px 10px rgba(16,185,129,0.3);">➕ 新增虛擬好手</button>'
        + '</div>'
        + (visibleNames.length === 0
            ? '<p style="text-align:center; color:#475569; padding:40px 0;">尚無虛擬好手。點擊右上角「新增虛擬好手」開始建立。</p>'
            : '<div class="pk-layout" style="overflow-x:auto; display:flex; gap:16px; padding-bottom:16px;">' + cardsHTML + '</div>'
        )
        + '</div>';
};

// ── 頁面載入後自動渲染 ──
document.addEventListener('DOMContentLoaded', function() {
    window.renderVirtualArea();
});