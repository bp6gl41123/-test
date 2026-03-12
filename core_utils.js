/* ============================================================== */
/* ==== 【組件 A：系統工具 - core_utils.js】 ==== */
/* ============================================================== */

window.getSystemLatestDate = function(sportKey) { let maxTime = 0; let maxStr = "01/01"; let currentYear = new Date().getFullYear(); for (let expert in window.dataDB) { if (window.dataDB[expert][sportKey] && window.dataDB[expert][sportKey].length > 0) { let dateStr = window.dataDB[expert][sportKey][0][0]; let d = new Date(`${currentYear}/${dateStr}`); if (d.getMonth() === 11 && new Date().getMonth() <= 2) d.setFullYear(currentYear - 1); if (d.getTime() > maxTime) { maxTime = d.getTime(); maxStr = dateStr; } } } return maxStr; };

window.getDaysDiff = function(recordDateStr, systemLatestStr) { if(!recordDateStr || !systemLatestStr) return 999; let currentYear = new Date().getFullYear(); let d1 = new Date(`${currentYear}/${systemLatestStr}`); let d2 = new Date(`${currentYear}/${recordDateStr}`); if (d1.getMonth() === 0 && d2.getMonth() === 11) d2.setFullYear(currentYear - 1); else if (d1.getMonth() === 11 && d2.getMonth() === 0) d1.setFullYear(currentYear - 1); return Math.floor(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)); };

window.changeHomeRanking = function(val, btn) { window.currentHomeFilter = val; document.querySelectorAll('.r-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); window.init(); };

window.getBadgeClass = function(net) {
    const n = parseInt(net);
    if (n > 0) return 'badge-pos';
    if (n < 0) return 'badge-neg';
    return 'badge-neu';
};