/* ============================================================== */
/* ==== 【管理模組：行政管理 - core_admin.js】 ==== */
/* ============================================================== */

window.adminDelRecord = function(expertName, sportKey, dateStr, wlStr) { 
    const confirmMsg = `⚠️ 安全確認\n\n您即將刪除：${expertName}\n項目：${sportKey}\n日期：${dateStr}\n戰績：[${wlStr}]\n\n確定執行此操作且無法復原？`;
    if(!confirm(confirmMsg)) return; 
    
    if (window.dataDB[expertName] && window.dataDB[expertName][sportKey]) {
        let idx = window.dataDB[expertName][sportKey].findIndex(r => r[0] === dateStr && r[1] === wlStr); 
        if(idx > -1) { 
            window.dataDB[expertName][sportKey].splice(idx, 1); 
            localStorage.setItem('DashboardDB_V90_Final', JSON.stringify(window.dataDB)); 
            if (typeof window.renderDisplay === 'function') window.renderDisplay(); 
            if (typeof window.init === 'function') window.init(); 
        } 
    }
};

window.adminAddRecord = function(expertName, sportKey) { 
    let dateInput = prompt(`【手動新增紀錄】\n專家：${expertName}\n項目：${sportKey}\n\n請輸入日期 (格式 MM/DD):`, "02/25"); 
    if(!dateInput) return; 
    
    let wlInput = prompt(`請輸入戰績文字 (例如: 2勝 1敗):`); 
    if(!wlInput) return; 
    
    let netInput = prompt(`請輸入淨勝場次 (例如: +1 或 -2):`); 
    if(!netInput) return; 
    
    if(!window.dataDB[expertName]) window.dataDB[expertName] = {};
    if(!window.dataDB[expertName][sportKey]) window.dataDB[expertName][sportKey] = []; 
    
    let finalNet = netInput.includes('+') ? netInput : (parseInt(netInput) >= 0 ? '+' + netInput : netInput);
    window.dataDB[expertName][sportKey].unshift([dateInput, wlInput, finalNet]); 
    
    const currentYear = new Date().getFullYear(); 
    window.dataDB[expertName][sportKey].sort((a, b) => { 
        const parseDate = (dStr) => { 
            let d = new Date(`${currentYear}/${dStr}`); 
            if (d.getMonth() === 11 && new Date().getMonth() <= 2) d.setFullYear(currentYear - 1); 
            return d.getTime(); 
        }; 
        return parseDate(b[0]) - parseDate(a[0]); 
    }); 
    
    localStorage.setItem('DashboardDB_V62_Final', JSON.stringify(window.dataDB)); 
    if (typeof window.renderDisplay === 'function') window.renderDisplay(); 
    if (typeof window.init === 'function') window.init(); 
};