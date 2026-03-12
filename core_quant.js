/**
 * ==========================================
 * 齊聚眾選 - 量化引擎 (Core Quant Engine) V7 終極完美同步版
 * ==========================================
 */

const MatrixEngine = {
    getIndicatorTier: function(percent) {
        if (percent >= 70) return "70%";
        if (percent >= 59) return "65%";
        if (percent >= 47) return "55%";
        if (percent >= 36) return "40%";
        if (percent >= 25) return "30%";
        return "25%"; 
    },

    cleanTeamName: function(raw) {
        if (!raw) return "";
        let cleaned = raw.replace(/[+-]\d+(\.\d+)?/g, ''); 
        cleaned = cleaned.replace(/[大小]分?/g, ''); 
        cleaned = cleaned.replace(/讓分?/g, ''); 
        cleaned = cleaned.replace(/[贏pkPK]/ig, ''); 
        cleaned = cleaned.trim();
        if (cleaned.includes('76')) return '七六';
        if (cleaned.includes('快船')) return '快艇';
        return cleaned;
    },

    getSystemLatestDate: function(db, sportKey) { 
        let maxTime = 0; let maxStr = "01/01"; let currentYear = new Date().getFullYear(); 
        for (let expert in db) { 
            if (db[expert][sportKey] && db[expert][sportKey].length > 0) { 
                let dateStr = db[expert][sportKey][0][0]; 
                let d = new Date(`${currentYear}/${dateStr}`); 
                if (d.getMonth() === 11 && new Date().getMonth() <= 2) d.setFullYear(currentYear - 1); 
                if (d.getTime() > maxTime) { maxTime = d.getTime(); maxStr = dateStr; } 
            } 
        } 
        return maxStr; 
    },

    getDaysDiff: function(recordDateStr, systemLatestStr) { 
        if(!recordDateStr || !systemLatestStr) return 999; 
        let currentYear = new Date().getFullYear(); 
        let d1 = new Date(`${currentYear}/${systemLatestStr}`); 
        let d2 = new Date(`${currentYear}/${recordDateStr}`); 
        if (d1.getMonth() === 0 && d2.getMonth() === 11) d2.setFullYear(currentYear - 1); 
        else if (d1.getMonth() === 11 && d2.getMonth() === 0) d1.setFullYear(currentYear - 1); 
        return Math.floor(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)); 
    },

// 🔥 終極修正：智慧防呆參數 + 強制綁定首頁本機資料庫 (LocalStorage)
    buildGlobalLeaderboard: function(arg1, arg2) {
        var categoryKey = arg2 ? arg2 : arg1;
        var rankDict = {};
        var i, name, shadowVirtual, cached;

        // 🔗 第一優先：讀取 admin_matrix.html 自己算好的 adminRankMap
        // 這份資料已包含 dailyUpdates 合併，與前端計算流程完全一致
        if (window.adminRankMap && Object.keys(window.adminRankMap).length > 0) {
            rankDict = {};
            shadowVirtual = {};
            try { shadowVirtual = JSON.parse(localStorage.getItem('QuantDB_Virtual_Experts')) || {}; } catch(e) {}
            for (name in window.adminRankMap) {
                rankDict[name] = {
                    winRate: window.adminRankMap[name].rate,
                    globalRank: window.adminRankMap[name].rank,
                    isGod: window.adminRankMap[name].isGod
                };
            }
            for (name in shadowVirtual) {
                if (!rankDict[name]) {
                    rankDict[name] = { winRate: 0, globalRank: 999, isGod: false };
                }
            }
            return rankDict;
        }

        // 🔗 第二優先：讀取前端 core_engine.js 以運動種類分開寫入的排名快取
        try {
            cached = JSON.parse(localStorage.getItem('MasterRankMap_Cache_' + categoryKey));
            if (cached && Object.keys(cached).length > 0) {
                rankDict = {};
                shadowVirtual = {};
                try { shadowVirtual = JSON.parse(localStorage.getItem('QuantDB_Virtual_Experts')) || {}; } catch(e) {}
                for (name in cached) {
                    rankDict[name] = {
                        winRate: cached[name].rate,
                        globalRank: cached[name].rank,
                        isGod: cached[name].isGod
                    };
                }
                for (name in shadowVirtual) {
                    if (!rankDict[name]) {
                        rankDict[name] = { winRate: 0, globalRank: 999, isGod: false };
                    }
                }
                return rankDict;
            }
        } catch(e) {}

        // 🚨 Fallback：前端尚未執行過 init()（快取不存在）才走這裡
        // 讀取前台真實資料庫 (DashboardDB_V83_Final)
        var realDB = {};
        try { realDB = JSON.parse(localStorage.getItem('DashboardDB_V83_Final')) || {}; } catch(e) {}

        // 讀取炸魚專用影子資料庫 (QuantDB_Virtual_Experts)
        var shadowDBFallback = {};
        try { shadowDBFallback = JSON.parse(localStorage.getItem('QuantDB_Virtual_Experts')) || {}; } catch(e) {}

        // 完美融合：真實好手 + 虛擬好手，一同進入大腦算牌
        var activeDB = {};
        for (var k in realDB) activeDB[k] = realDB[k];
        for (var k2 in shadowDBFallback) activeDB[k2] = shadowDBFallback[k2];

        // 如果 LocalStorage 沒抓到任何東西，才降級使用靜態 defaultDB
        if (Object.keys(activeDB).length === 0) {
            activeDB = (typeof defaultDB !== 'undefined') ? defaultDB : (typeof window.dataDB !== 'undefined' ? window.dataDB : {});
        }

        var leaderboard = [];
        var systemLatestDate = this.getSystemLatestDate(activeDB, categoryKey);

        for (var author in activeDB) {
            var records = activeDB[author][categoryKey] || [];
            if (records.length === 0) continue;

            var diffDays = this.getDaysDiff(records[0][0], systemLatestDate);
            var isActive = diffDays <= 3;

            var sliceRec = records.slice(0, 7);
            var net = sliceRec.reduce(function(sum, r) { return sum + parseInt(r[2] || 0); }, 0);

            var w = 0, l = 0;
            sliceRec.forEach(function(r) {
                var wm = r[1].match(/(\d+)勝/);
                var lm = r[1].match(/(\d+)敗/);
                if (wm) w += parseInt(wm[1]);
                if (lm) l += parseInt(lm[1]);
            });
            var winRate = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;

            leaderboard.push({ name: author, net: net, winRate: winRate, isActive: isActive });
        }

        // 活躍優先 -> 勝率優先 -> 淨值加權
        leaderboard.sort(function(a, b) {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            return (b.winRate - a.winRate) || (b.net - a.net);
        });

        rankDict = {};
        leaderboard.forEach(function(player, index) {
            var rank = index + 1;
            rankDict[player.name] = {
                winRate: player.winRate,
                globalRank: rank,
                isGod: rank <= 3 && player.isActive
            };
        });
        return rankDict;
    },

    calculateMatrixTag: function(votesA, votesB, godsA, godsB) {
        const totalVotes = Math.max(1, votesA + votesB);
        if (totalVotes === 1) return null; 

        const pctA = Math.round((votesA / totalVotes) * 100);
        const pctB = 100 - pctA;
        const tierA = this.getIndicatorTier(pctA);
        const tierB = this.getIndicatorTier(pctB);
        let suffixA = godsA.length;
        let suffixB = godsB.length;
        
        if (godsA.length > 0 && godsB.length > 0) { suffixA = 4; suffixB = 4; }

        return {
            teamA: { pct: pctA, tag: suffixA > 0 ? `[指標${tierA}(${suffixA})]` : `[指標${tierA}]`, isConflict: suffixA === 4 },
            teamB: { pct: pctB, tag: suffixB > 0 ? `[指標${tierB}(${suffixB})]` : `[指標${tierB}]`, isConflict: suffixB === 4 }
        };
    }
};