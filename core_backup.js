/* ============================================================== */
/* ==== 【功能模組：備份匯出 - core_backup.js】(V16 雙軌防呆版) ==== */
/* ============================================================== */

window.exportToDataJS = function() {
    // 動態載入 data_history.js，確保 historyDB 在記憶體裡
    if (typeof historyDB === 'undefined') {
        const script = document.createElement('script');
        script.src = 'data_history.js';
        script.onload = function() {
            window.exportToDataJS();
        };
        document.head.appendChild(script);
        return;
    } 

    // === 🛡️ 備份前置作業：啟動自動清洗防呆機制 ===
    for (let player in window.dataDB) {
        // 過濾掉所有資料都是 null 的髒人名
        const allNull = Object.entries(window.dataDB[player]).every(([key, records]) => 
            key === 'summary' || records.every(record => record[0] === null || record[1] === null || record[2] === null)
        );
        if (allNull) {
            delete window.dataDB[player];
            continue;
        }
        for (let category in window.dataDB[player]) {
            if (category === 'summary') continue;
            // 過濾掉每筆有 null 的資料
            window.dataDB[player][category] = window.dataDB[player][category].filter(record => {
                return record.length >= 3 && record[0] !== null && record[1] !== null && record[2] !== null;
            });
            window.dataDB[player][category].forEach(record => {
                if (record.length >= 3) {
                    let netValue = record[2];
                    if (netValue !== undefined && netValue !== null) {
                        netValue = String(netValue).trim();
                        if (netValue === "+0" || netValue === "-0" || netValue === "0") {
                            netValue = "0";
                        } else if (!netValue.startsWith("+") && !netValue.startsWith("-")) {
                            let num = Number(netValue);
                            if (!isNaN(num) && num > 0) {
                                netValue = "+" + netValue;
                            }
                        }
                        record[2] = netValue;
                    }
                }
            });
        }
    }

    // === 📅 日期補年份工具 ===
    function addYear(dateStr) {
        if (!dateStr || dateStr.includes('/') && dateStr.split('/').length === 3) return dateStr;
        const parts = dateStr.split('/');
        if (parts.length !== 2) return dateStr;
        const month = parseInt(parts[0]);
        const year = month === 12 ? 2025 : 2026;
        return year + '/' + dateStr;
    }

    // === ✂️ 切割 data.js（近30筆）和 data_history.js（第31筆以後）===
    const recentDB = {};
    const historyRows = [];

    for (let player in window.dataDB) {
        recentDB[player] = { summary: {} };
        for (let category in window.dataDB[player]) {
            if (category === 'summary') continue;  // ← 補上這行，跳過 summary key

            const allRecords = window.dataDB[player][category];

            // 近30筆放進 recentDB，日期補年份
            recentDB[player][category] = allRecords.slice(0, 30).map(r => [addYear(r[0]), r[1], r[2]]);

            // 只取第31筆（剛被擠出的那一筆）
            if (allRecords.length > 30) {
                const r = allRecords[30];
                historyRows.push([player, category, addYear(r[0]), r[1], r[2]]);
            }

            // 計算全賽季 summary（近30筆 + historyDB 歷史全部）
            let totalWin = 0, totalLoss = 0, totalNet = 0;
            allRecords.forEach(r => {
                const wm = r[1].match(/(\d+)勝/);
                const lm = r[1].match(/(\d+)敗/);
                const nm = String(r[2]).replace(/[^0-9+\-]/g, '');
                totalWin += wm ? parseInt(wm[1]) : 0;
                totalLoss += lm ? parseInt(lm[1]) : 0;
                totalNet += nm ? parseInt(nm) : 0;
            });
            // 加入 historyDB 歷史筆數
            if (typeof historyDB !== 'undefined') {
                historyDB.forEach(h => {
                    if (h[0] === player && h[1] === category) {
                        const wm = h[3].match(/(\d+)勝/);
                        const lm = h[3].match(/(\d+)敗/);
                        const nm = String(h[4]).replace(/[^0-9+\-]/g, '');
                        totalWin += wm ? parseInt(wm[1]) : 0;
                        totalLoss += lm ? parseInt(lm[1]) : 0;
                        totalNet += nm ? parseInt(nm) : 0;
                    }
                });
            }
            recentDB[player].summary[category] = { win: totalWin, loss: totalLoss, net: totalNet };
        }
    }

    // === 📦 產生 data.js 內容 ===
    let dataOutput = "/* ============================================================== */\n";
    dataOutput += "/* ==== 【數據庫模組 - data.js】(管理系統自動匯出版本) ==== */\n";
    dataOutput += "/* ============================================================== */\n\n";
    dataOutput += "const defaultDB = " + JSON.stringify(recentDB, null, 4) + ";\n\n";

    // === 📦 產生 data_history.js 內容（每筆一行，新的在上面，手動貼到舊檔最上面）===
    let historyLines = historyRows.map(r => `    ${JSON.stringify(r)},`).join('\n');
    let historyOutput = "/* ============================================================== */\n";
    historyOutput += "/* ==== 【歷史數據庫 - data_history.js】(管理系統自動匯出版本) ==== */\n";
    historyOutput += "/* ==== 請將新增內容貼到舊檔案的最上面 ==== */\n";
    historyOutput += "/* ============================================================== */\n\n";
    historyOutput += "const historyDB = [\n";
    historyOutput += historyLines + "\n";
    historyOutput += "];\n\n";

    // === 🚀 下載兩個檔案 ===
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    navigator.clipboard.writeText(dataOutput).catch(err => {
        console.log("剪貼簿複製遭瀏覽器阻擋", err);
    });

    try {
        downloadFile(dataOutput, 'data.js');
        setTimeout(() => downloadFile(historyOutput, 'data_history_new.js'), 500);
        alert("📥 下載成功！\n\n已自動產生兩個檔案：\n1. data.js（近30筆，覆蓋前端）\n2. data_history.js（歷史資料，覆蓋前端）\n\n請將兩個檔案都丟入專案資料夾取代舊檔。");
    } catch (err) {
        alert("❌ 下載失敗，代碼已複製到剪貼簿。");
        console.error("下載失敗：", err);
    }
};
// 💡 修正：定義為全域函數，待 auth.js 驗證成功後再啟動 (保留原本的串聯架構)
window.initBackupWidget = function() {
    // 保留您的權限驗證邏輯
    if (window.isAdmin !== true) return;
    if(!document.getElementById('exportBtn')){

        const btn = document.createElement("div"); 
        btn.id = 'exportBtn';
        btn.innerHTML = "📥 下載並備份 data.js (防呆淨化)"; 
        // 樣式調整為藍色系，代表「下載」的視覺意象
        btn.style.cssText = "position:fixed; bottom:25px; right:25px; background:linear-gradient(135deg, #3b82f6, #2563eb); color:white; padding:15px 25px; border-radius:30px; cursor:pointer; box-shadow:0 10px 25px rgba(59,130,246,0.4); font-weight:bold; font-size:16px; z-index:9999; display:flex; align-items:center; gap:10px; transition:all 0.3s ease;"; 
        
        btn.onmouseover = () => {
            btn.style.transform = "translateY(-5px)";
            btn.style.boxShadow = "0 15px 35px rgba(59,130,246,0.5)";
        };
        btn.onmouseout = () => {
            btn.style.transform = "translateY(0)";
            btn.style.boxShadow = "0 10px 25px rgba(59,130,246,0.4)";
        };

        btn.onclick = window.exportToDataJS; 
        document.body.appendChild(btn); 
    }
};