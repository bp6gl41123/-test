/* ============================================================== */
/* ==== 【功能模組：備份匯出 - core_backup.js】 ==== */
/* ============================================================== */

window.exportToDataJS = function() { 
    let output = "/* ============================================================== */\n";
    output += "/* ==== 【數據庫模組 - data.js】(管理系統自動匯出版本) ==== */\n";
    output += "/* ============================================================== */\n\n";
    output += "const defaultDB = " + JSON.stringify(window.dataDB, null, 4) + ";\n\n"; 
    output += "// 以上代碼已包含最新所有戰績，請全選覆蓋 data.js 的內容。";

    navigator.clipboard.writeText(output).then(() => { 
        alert("🎉 完整數據庫代碼已成功複製到剪貼簿！\n\n1. 開啟您的 data.js 檔案\n2. 全選並刪除所有內容\n3. 貼上剛才複製的內容並存檔\n\n一切就大功告成了！"); 
    }).catch(err => { 
        alert("❌ 複製失敗，請至瀏覽器控制台手動選取輸出內容。"); 
        console.log(output);
    }); 
};
// 💡 修正：定義為全域函數，待 auth.js 驗證成功後再啟動
window.initBackupWidget = function() {
    if (window.isAdmin !== true) return;
    if(!document.getElementById('exportBtn')){

        const btn = document.createElement("div"); 
        btn.id = 'exportBtn';
        btn.innerHTML = "💾 備份與匯出實體檔案代碼"; 
        btn.style.cssText = "position:fixed; bottom:25px; right:25px; background:linear-gradient(135deg, #1877f2, #0056b3); color:white; padding:14px 22px; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow:0 6px 20px rgba(0,0,0,0.4); z-index:9999; border: 1px solid rgba(255,255,255,0.2); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);"; 
        btn.onmouseover = function() { this.style.transform = "scale(1.05) translateY(-3px)"; };
        btn.onmouseout = function() { this.style.transform = "scale(1) translateY(0)"; };
        btn.onclick = window.exportToDataJS; 
document.body.appendChild(btn); 
    }
}; // ✅ 改成函數結尾


