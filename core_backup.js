/* ============================================================== */
/* ==== 【功能模組：備份匯出 - core_backup.js】(V16 雙軌防呆版) ==== */
/* ============================================================== */

window.exportToDataJS = function() { 

    // === 🛡️ 備份前置作業：啟動自動清洗防呆機制 ===
    for (let player in window.dataDB) {
        for (let category in window.dataDB[player]) {
            window.dataDB[player][category].forEach(record => {
                // 確保這筆紀錄有三個欄位 [日期, 戰績, 淨值]
                if (record.length >= 3) {
                    let netValue = record[2];
                    
                    if (netValue !== undefined && netValue !== null) {
                        // 1. 強制轉為字串，並清除所有隱形的換行符號與空白 (防止 03/05 的引號斷裂事件)
                        netValue = String(netValue).trim();
                        
                        // 2. 自動修正不規範的平手盤 (+0 或 -0)
                        if (netValue === "+0" || netValue === "-0" || netValue === "0") {
                            netValue = "0";
                        } 
                        // 3. 如果是純數字且大於 0 (Excel 貼上的)，強制幫它穿上 "+" 裝甲
                        else if (!netValue.startsWith("+") && !netValue.startsWith("-")) {
                            let num = Number(netValue);
                            if (!isNaN(num) && num > 0) {
                                netValue = "+" + netValue;
                            }
                        }
                        
                        // 將洗乾淨的資料寫回記憶體，準備安全匯出
                        record[2] = netValue;
                    }
                }
            });
        }
    }
    // ==========================================================

    let output = "/* ============================================================== */\n";
    output += "/* ==== 【數據庫模組 - data.js】(管理系統自動匯出版本) ==== */\n";
    output += "/* ============================================================== */\n\n";
    output += "const defaultDB = " + JSON.stringify(window.dataDB, null, 4) + ";\n\n"; 

    // === 🚀 核心升級：雙軌備份 (實體檔案下載 + 剪貼簿複製) ===

    // 軌道一：保留您原本的習慣，同時複製到剪貼簿當作雙重保險
    navigator.clipboard.writeText(output).catch(err => { 
        console.log("剪貼簿複製遭瀏覽器阻擋，將僅使用下載模式。", err);
    });

    // 軌道二：生成實體 .js 檔案並觸發下載
    try {
        const blob = new Blob([output], { type: 'text/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js'; // 直接設定預設下載檔名為 data.js
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert("📥 下載成功！\n\n1. 系統已自動清洗 03/05 等日期的格式錯誤與髒資料！\n2. 請將剛下載的「data.js」直接丟入專案資料夾取代舊檔即可。\n\n(備註：保險起見，代碼也已同步複製到您的剪貼簿中了！)");
        
    } catch (err) {
        alert("❌ 下載失敗，可能是您的瀏覽器阻擋了。但別擔心，代碼已複製到您的剪貼簿，您可以手動貼上！");
        console.error("下載實體檔案時發生錯誤：", err);
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