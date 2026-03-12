/**
 * ==========================================
 * 齊聚眾選 - 量化矩陣引擎 (Core Matrix Engine)
 * 負責：數據淨化、票數統計、區間判定、指標貼標
 * ==========================================
 */

const MatrixEngine = {
    
    // 1. 核心指標區間定義 (依據仁劭最新 6 大指標設定)
    getIndicatorTier: function(percent) {
        if (percent >= 70) return "70%";
        if (percent >= 59) return "65%";
        if (percent >= 47) return "55%";
        if (percent >= 36) return "40%";
        if (percent >= 25) return "30%";
        return "25%"; // 24% 以下
    },

    // 2. 隊名淨化防呆器 (洗掉讓分數字、大小分標籤等贅字)
    cleanTeamName: function(rawName) {
        if (!rawName) return "";
        // 利用正規表達式 (Regex) 過濾掉 "+1.5", "-5.5", "贏", "受讓", "大", "小" 等字眼
        let cleaned = rawName.replace(/[+-]?\d+(\.\d+)?/g, ''); // 移除數字與小數點
        cleaned = cleaned.replace(/[贏輸受讓大小分]/g, ''); // 移除常見盤口贅字
        return cleaned.trim();
    },

    // 3. 賽事上下文狀態機 (解決同名球隊問題，如: NBA勇士 vs MLB勇士)
    // 傳入單個好手的完整預測字串，回傳帶有聯盟標籤的乾淨陣列
    parseUserPicks: function(userPostText) {
        const lines = userPostText.split('\n');
        let currentLeague = "未知"; // 預設狀態
        let parsedPicks = [];

        for (let line of lines) {
            line = line.trim();
            if (line === "") continue;

            // 偵測是否出現聯盟標題，切換系統狀態大腦
            if (line.toUpperCase().includes('NBA') || line.includes('美籃')) {
                currentLeague = "NBA";
                continue; // 這是標題行，跳過不當作球隊
            } else if (line.toUpperCase().includes('MLB') || line.includes('美棒')) {
                currentLeague = "MLB";
                continue;
            }

            // 洗淨球隊名稱，並加上聯盟前綴 (例如: "NBA_勇士")
            const cleanName = this.cleanTeamName(line);
            if (cleanName) {
                // 如果文字裡包含大/小，特別標註為大小盤，避免跟讓分盤混在一起
                const isTotalScore = line.includes('大') || line.includes('小');
                const betType = isTotalScore ? "_大小盤" : "_讓分盤";
                
                parsedPicks.push({
                    league: currentLeague,
                    original: line,
                    team: cleanName,
                    uniqueId: `${currentLeague}_${cleanName}${betType}` // 系統辨識用的唯一 ID
                });
            }
        }
        return parsedPicks;
    },

    // 4. 矩陣結算大腦 (算出 % 數，並貼上終極指標與神手後綴)
    // 參數: 隊伍A票數, 隊伍B票數, 隊伍A的神手陣列(名字), 隊伍B的神手陣列(名字)
    calculateMatrixTag: function(votesA, votesB, godsA, godsB) {
        const totalVotes = Math.max(1, votesA + votesB); // 避免除以 0
        const pctA = Math.round((votesA / totalVotes) * 100);
        const pctB = 100 - pctA;

        // 取得 % 數指標區間
        const tierA = this.getIndicatorTier(pctA);
        const tierB = this.getIndicatorTier(pctB);

        // 判定神手後綴 (1, 2, 3, 4)
        let suffixA = godsA.length;
        let suffixB = godsB.length;

        // 🔥 核心商業邏輯：神仙打架 / 死亡交叉判定 🔥
        // 只要兩邊都有神手，強制把兩邊的後綴都改成 4
        if (godsA.length > 0 && godsB.length > 0) {
            suffixA = 4;
            suffixB = 4;
       
        }

        return {
            teamA: { pct: pctA, tag: suffixA > 0 ? `[指標${tierA}(${suffixA})]` : `[指標${tierA}]`, isConflict: suffixA === 4 },
            teamB: { pct: pctB, tag: suffixB > 0 ? `[指標${tierB}(${suffixB})]` : `[指標${tierB}]`, isConflict: suffixB === 4 }
        };
  },

    // 5. 核心排名對接：直接繼承前台真理名次，徹底解決跳動問題
    buildGlobalLeaderboard: function(sportKey) {
        const db = window.dataDB || {};
        const shadowDB = window.shadowDB || {}; 
        let rankDict = {};

        // 🏆 引用前台 core_ranking.js 產出的 masterRankMap
        const masterMap = window.masterRankMap || {};

        // 遍歷所有數據源 (真實 + 影子)
        const allNames = new Set([...Object.keys(db), ...Object.keys(shadowDB)]);

        allNames.forEach(name => {
            if (masterMap[name]) {
                // ✅ 真實好手：100% 繼承前台名次與勝率 (傲慢20絕對同步)
                rankDict[name] = {
                    globalRank: masterMap[name].rank,
                    winRate: masterMap[name].rate,
                    isGod: masterMap[name].rank <= 3
                };
            } else {
                // 👻 影子好手或未進榜者：在大腦端進行近 7 次保底計算
                let records = (shadowDB[name] && shadowDB[name][sportKey]) ? shadowDB[name][sportKey].slice(0, 7) : [];
                if (records.length === 0 && db[name]) records = db[name][sportKey] ? db[name][sportKey].slice(0, 7) : [];
                
                let w = 0, l = 0;
               records.forEach(r => {
                    const wm = r[1].match(/(\d+)勝/);
                    const lm = r[1].match(/(\d+)敗/);
                    if(wm) w += parseInt(wm[1]); if(lm) l += parseInt(lm[1]);
               });
                let rate = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;
                rankDict[name] = { globalRank: 99, winRate: rate, isGod: false };
            }
       });
        return rankDict;
    }
 };

// 若在 Node.js 環境測試可匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatrixEngine;
}