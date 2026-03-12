/* ============================================================== */
/* ==== 【組件 B：智能 Tooltip - core_tooltips.js】 ==== */
/* ============================================================== */

// 🎯 [核心新增] 將切西瓜邏輯獨立成全域共用工具
window.filterPickText = function(rawText, sportKey) {
    if (!rawText) return '';
    let textToProcess = rawText.replace(/<br\s*[\/]?>/gi, '\n');
    let finalContent = '';

    if (sportKey !== "") {
        const itemNames = {
            "nba_team": "NBA 讓分盤", "nba_total": "NBA 大小分",
            "mlb_ml": "MLB 獨贏(正常)", "mlb_runline": "MLB 讓分盤", "mlb_total": "MLB 大小分", "mlb_ml_high": "MLB 高賠獨贏",
            "nhl_ml": "冰球獨贏(含加時)", "nhl_ml_reg": "冰球獨贏(不含加時)", "nhl_spread_ot": "冰球讓盤(含加時)", "nhl_spread_reg": "冰球讓盤(不含加時)",
            "nhl_total_ot":"冰球大小(含加時)", "nhl_total_reg": "冰球大小(不含加時)", "khl_team": "俄冰隊伍", "khl_total": "俄冰大小分",

            "soccer_team": "足球隊伍", "soccer_total": "足球大小分", "soccer_ml": "足球獨贏", "soccer_btts": "足球兩隊進球",

            // === 🌏 亞洲與歐籃 ===
            "euro_team": "歐籃隊伍", "euro_total": "歐籃大小", "cba_team": "中籃隊伍", "kbl_team": "韓籃隊伍", "kbl_total": "韓籃大小", "nbl_team": "澳籃隊伍",
            "jbl_team": "日籃讓盤", "jbl_total": "日籃大小",
            "lol_team": "電競隊伍", "lol_total": "電競大小"
        };
        
        let targetHeader = itemNames[sportKey];
        let allHeaders = Object.values(itemNames);
        let hasAnyHeader = allHeaders.some(h => textToProcess.includes(h));
        
        if (hasAnyHeader && targetHeader && textToProcess.includes(targetHeader)) {
            let lines = textToProcess.split('\n');
            let outputLines = [];
            let isMatchingBlock = false;
            
            for (let line of lines) {
                let textLine = line.trim();
                if (!textLine) continue;
                
                let isAnyHeader = allHeaders.some(h => textLine.includes(h));
                let isTargetHeader = textLine.includes(targetHeader);
                
                if (isTargetHeader) {
                    isMatchingBlock = true;
                    outputLines.push(`<span style="color:#fbbf24; font-weight:bold;">[${textLine}]</span>`);
                } else if (isAnyHeader) {
                    isMatchingBlock = false;
                } else {
                    if (isMatchingBlock) outputLines.push(line);
                }
            }
            if (outputLines.length > 0) finalContent = outputLines.join('<br>');
            else return ''; 
            
        } else if (hasAnyHeader) {
            return '';
        } else {
            finalContent = textToProcess.replace(/\n/g, '<br>');
        }
    } else { 
        finalContent = textToProcess.replace(/\n/g, '<br>'); 
    }
    return finalContent;
};

window.getPickTooltipHtml = function(name) {
    if (typeof todayPicks === 'undefined') return '';
    
    let sportKey = window.activeSportKey || "";

    // 🎯 核心防護：如果是在首頁總榜（尚未選擇任何賽事），直接不顯示對話框圖示
    if (sportKey === "") return '';

    let finalContent = "";

// 🎯 建立專屬排版引擎：將單行文字自動轉換為「垂直清單」
    const formatVertical = (text) => {
        if (!text) return '';
        
        // 🚀 終極修復：如果您已經手動加入 <br>，就直接原封不動回傳，絕對不要去切「時間的冒號」！
        if (text.includes('<br>')) return text;

        if (text.includes('\n')) return text.replace(/\n/g, '<br>');
        
        if (text.includes('：') || text.includes(':')) {
            let parts = text.split(/：|:/);
            let title = parts[0].trim();
            let itemsStr = parts.slice(1).join(':').trim();
            let items = itemsStr.split(/、|，|,/);
            
            let html = `<div style="color:#fbbf24; font-weight:900; margin-bottom:5px;">${title}</div>`;
            html += items.map(item => `<div style="padding-left: 8px; line-height: 1.5;">${item.trim()}</div>`).join('');
            return html;
        }
        return text;
    };

    if (Array.isArray(todayPicks)) {
        // 1. 找出該專家「所有」的推薦陣列
        const foundAll = todayPicks.filter(p => p[0] === name);
        if (foundAll.length > 0) {
            // 2. 自動判斷是否為新版 3 欄位結構
            if (foundAll[0].length >= 3) {
                if (sportKey !== "") {
                    // 精準配對當下切換的賽事，並套用「垂直排版引擎」
                    const exactMatch = foundAll.find(p => p[1] === sportKey);
                    if (exactMatch) finalContent = formatVertical(exactMatch[2]);
                } else {
                    // 若為總榜模式，串接所有推薦內容，並套用「垂直排版引擎」
                    finalContent = foundAll.map(p => formatVertical(p[2])).join('<hr style="border-top:1px dashed #fbbf24; margin: 12px 0; opacity: 0.5;">');
                }
            } else {
                // 相容舊版 2 欄位結構
                let rawText = foundAll[0][1] || "";
                finalContent = window.filterPickText(rawText, sportKey);
            }
        }
    } else {
        // 最舊的 Object 格式相容
        let rawText = todayPicks[name] || "";
        finalContent = window.filterPickText(rawText, sportKey);
    }
    
    // 如果過濾後沒有內容，就不顯示泡泡框
    if (!finalContent || !finalContent.trim()) return '';
    
// 3. 專屬收錄口袋邏輯
    let pocketKey = sportKey ? `${name}||${sportKey}` : name;
    let isSaved = window.userPocket.includes(pocketKey);
    
    let btnText = isSaved ? '⭐ 已存寶庫' : '➕ 收錄寶庫';
    let btnClass = isSaved ? 'pocket-add-btn saved' : 'pocket-add-btn';
    
    return `<div class="pick-tooltip-container"><span class="pick-icon" onclick="event.stopPropagation(); window.toggleMobileTooltip(this);" title="點擊查看今日推薦">💬</span><div class="pick-tooltip"><div class="pick-content">${finalContent}</div><div class="pocket-btn-wrapper"><button class="${btnClass}" onclick="event.stopPropagation(); window.toggleUserPocket('${name}', this, '${sportKey}')">${btnText}</button></div></div></div>`;
};

window.toggleMobileTooltip = function(iconElement) { document.querySelectorAll('.pick-tooltip.show-mobile').forEach(el => { if (el !== iconElement.nextElementSibling) el.classList.remove('show-mobile'); }); iconElement.nextElementSibling.classList.toggle('show-mobile'); };
document.addEventListener('click', (e) => { if(!e.target.closest('.pick-icon') && !e.target.closest('.pick-tooltip')) { document.querySelectorAll('.pick-tooltip.show-mobile').forEach(el => el.classList.remove('show-mobile')); } });





