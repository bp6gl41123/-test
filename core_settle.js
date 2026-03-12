/* ============================================================== */
/* ==== 【功能模組：智能對獎 - core_settle.js】 ==== */
/* ============================================================== */

// 💡 修正：定義為全域函數，待 auth.js 驗證成功後再啟動
window.initAdminWidget = function() {
    // 💡 歸類標記：只有管理員能啟動指揮中心介面
    if (window.isAdmin !== true) return;

    if (!document.getElementById('adminWidgetStyle')) {
        const style = document.createElement('style'); style.id = 'adminWidgetStyle';
        style.innerHTML = `
            .admin-widget-btn { position: fixed; top: 25px; left: 25px; z-index: 9998; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.3s; }
            .admin-widget-btn:hover { background: linear-gradient(135deg, #2563eb, #1e40af); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
            .admin-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); z-index: 10000; display: none; justify-content: center; align-items: center; opacity: 0; transition: 0.4s ease; }
            .admin-modal-overlay.show { display: flex; opacity: 1; }
            .admin-modal-content { background: #1e293b; width: 95%; max-width: 850px; border-radius: 24px; border: 1px solid #334155; overflow: hidden; display: flex; flex-direction: column; max-height: 92vh; box-shadow: 0 30px 100px rgba(0,0,0,0.8); transform: translateY(30px); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .admin-modal-overlay.show .admin-modal-content { transform: translateY(0); }
            .admin-modal-header { background: #0f172a; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
            .admin-tab { flex: 1; text-align: center; padding: 16px; color: #94a3b8; font-weight: 900; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.3s; letter-spacing: 1px; }
            .admin-tab.active { color: #fbbf24; background: #1e293b; border-bottom-color: #fbbf24; }
            .admin-input { width: 60px; height: 38px; text-align: center; background: #020617; border: 1px solid #475569; color: #fbbf24; border-radius: 8px; font-weight: 900; font-size: 16px; outline: none; }
            .admin-input:focus { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
            .settle-card { background: #334155; padding: 20px; border-radius: 20px; margin-bottom: 18px; border-left: 8px solid #10b981; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            .group-box { background: rgba(15, 23, 42, 0.6); border-radius: 15px; padding: 15px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.05); }
            .group-title { font-size: 13px; font-weight: 900; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
            .badge-team { color: #3b82f6; text-transform: uppercase; } 
            .badge-total { color: #a78bfa; text-transform: uppercase; }
            .status-warn { background: #b45309; color: white; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
            .item-tag { background: rgba(255,255,255,0.1); color: #f8fafc; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-bottom: 8px; display: inline-block; margin-right: 8px; border: 1px solid rgba(255,255,255,0.05); }
        `; document.head.appendChild(style);
    }

    const btn = document.createElement('div'); btn.className = 'admin-widget-btn'; btn.innerHTML = '🤖 啟動智能分流結算中心'; document.body.appendChild(btn);
    const overlay = document.createElement('div'); overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = `
        <div class="admin-modal-content">
            <div class="admin-modal-header">
                <div style="display:flex; flex-direction:column;">
                    <h3 style="color:white;margin:0;font-size:20px;letter-spacing:1px;">🤖 結構化項目分流歸位系統</h3>
                    <small style="color:#94a3b8;font-size:11px;margin-top:4px;">版本號：V14.0 (徹底修復 76人與 .5 讓分誤判)</small>
                </div>
                <div style="color:#94a3b8;cursor:pointer;font-size:40px;line-height:1;" onclick="closeAdminModal()">&times;</div>
            </div>
            <div id="adminTabs" style="display:flex;background:#0f172a;">
                <div class="admin-tab active" onclick="switchAdminTab('NBA', this)">🏀 NBA 美國職籃</div>
                <div class="admin-tab" onclick="switchAdminTab('MLB', this)">⚾ MLB 美國職棒</div>
            </div>
            <div id="adminMainArea" style="padding:24px; overflow-y:auto; flex:1; background: #1e293b;"></div>
            <div id="adminFooter" style="padding:20px; border-top:1px solid #334155; background:#0f172a;"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    let curTab = 'NBA';
    btn.onclick = () => { overlay.classList.add('show'); renderInputStage(); };
    window.closeAdminModal = () => overlay.classList.remove('show');
    window.switchAdminTab = (t, el) => { curTab = t; document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active')); el.classList.add('active'); renderInputStage(); };

    function renderInputStage() {
        const listArea = document.getElementById('adminMainArea');
        const schedule = (typeof todaySchedule !== 'undefined') ? todaySchedule[curTab] : [];
        let html = schedule.map((m, i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;background:#334155;padding:18px;border-radius:18px;margin-bottom:12px;border:1px solid #475569;box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color:white;width:35%;text-align:center;font-weight:900;font-size:18px;">${m[0]}</div>
                <div style="display:flex;align-items:center;gap:15px;"><input type="number" id="away_${i}" class="admin-input"> <b style="color:#94a3b8;font-size:14px;">VS</b> <input type="number" id="home_${i}" class="admin-input"></div>
                <div style="color:white;width:35%;text-align:center;font-weight:900;font-size:18px;">${m[1]}</div>
            </div>`).join('');
        listArea.innerHTML = html || '<div style="color:#94a3b8;text-align:center;padding:80px;font-size:18px;font-weight:bold;">😢 本日暫無賽程資料</div>';
        document.getElementById('adminFooter').innerHTML = `<button onclick="startAutoClassificationSettle()" style="width:100%;padding:18px;background:#10b981;color:white;border:none;border-radius:15px;font-weight:bold;cursor:pointer;font-size:20px;box-shadow: 0 10px 25px rgba(16,185,129,0.3); letter-spacing:2px;">⚡ 輸入比分完畢，啟動項目細分對獎</button>`;
    }

    window.startAutoClassificationSettle = () => {
        const schedule = todaySchedule[curTab] || [];
        let matches = [];
        let allTeams = [];
        schedule.forEach((m, i) => {
            let a = parseInt(document.getElementById(`away_${i}`).value);
            let h = parseInt(document.getElementById(`home_${i}`).value);
            if(!isNaN(a) && !isNaN(h)) { matches.push({ away: m[0], home: m[1], aScore: a, hScore: h }); }
            allTeams.push(m[0], m[1]); 
        });
        if(matches.length === 0) return alert("請至少輸入一場正式比分！");

        let settleHtml = `<div style="color:#34d399;font-weight:bold;margin-bottom:25px;background:#020617;padding:18px;border-radius:15px;font-size:15px;border:1px solid #1e293b;line-height:1.8;">📌 本日賽果參考 (以此為對獎基準)：<br>${matches.map(m=>`<span style="background:#1e293b;padding:2px 8px;border-radius:5px;margin-right:8px;color:#f8fafc;">${m.away} <b style="color:#fbbf24;">${m.aScore}:${m.hScore}</b> ${m.home}</span>`).join(' ')}</div>`;
        
        Object.keys(window.dataDB).forEach(name => {
            let raw = todayPicks[name] || ""; if(!raw.trim()) return;
            
            let pickContext = "";
            let segs = raw.split(/(NBA推薦|MLB推薦|美籃推薦|美棒推薦|美棒隊伍|美籃隊伍)/i);
            const targetHead = curTab === 'NBA' ? /NBA推薦|美籃推薦|美籃隊伍/i : /MLB推薦|美棒推薦|美棒隊伍/i;
            for(let i=0; i<segs.length; i++){
                if(targetHead.test(segs[i])){
                    pickContext = segs[i+1] || "";
                    let nextTag = pickContext.match(/(NBA推薦|MLB推薦|美籃推薦|美棒推薦|美棒隊伍|美籃隊伍)/i);
                    if(nextTag) pickContext = pickContext.substring(0, nextTag.index);
                    break;
                }
            }
            if(!pickContext && !/(NBA推薦|MLB推薦|美籃推薦|美棒推薦)/i.test(raw)) pickContext = raw;
            if(!pickContext) return;

            let parsedText = pickContext.replace(/\n/g, '|'); 
            allTeams.forEach(team => {
                parsedText = parsedText.split(team).join(`|${team}`);
                if (team.includes('七六') || team.includes('76')) parsedText = parsedText.replace(/76人?/g, m => `|${m}`);
                if (team.match(/[賽塞]爾/)) parsedText = parsedText.replace(/[賽塞]爾(?:提克)?/g, m => `|${m}`);
                if (team.includes('獨行') || team.includes('小牛')) parsedText = parsedText.replace(/小牛|獨行俠?/g, m => `|${m}`);
                if (team.includes('拓荒')) parsedText = parsedText.replace(/拓荒(?:者)?/g, m => `|${m}`);
            });
            parsedText = parsedText.replace(/\|+/g, '|'); 

            let res = { team: { w:0, l:0, n:0, items:[] }, total: { w:0, l:0, n:0, items:[] }, warn: false };
            let rawLines = parsedText.split('|').map(s=>s.trim()).filter(s=>s);

            rawLines.forEach(seg => {
                let matchedMatch = matches.find(m => {
                    const checkAlias = (t) => {
                        if (seg.includes(t)) return true;
                        if ((t.includes('七六') || t.includes('76')) && seg.match(/76人?|七六人?/)) return true;
                        if (t.match(/[賽塞]爾/) && seg.match(/[賽塞]爾(?:提克)?/)) return true;
                        if ((t.includes('獨行') || t.includes('小牛')) && seg.match(/小牛|獨行俠?/)) return true;
                        if (t.includes('拓荒') && seg.match(/拓荒(?:者)?/)) return true;
                        return false;
                    };
                    return checkAlias(m.away) || checkAlias(m.home);
                });

                if (!matchedMatch) return; 

                let isTotal = /(大|小|總分)/.test(seg);
                let target = isTotal ? res.total : res.team;
                
                const checkAliasStrict = (t) => {
                    if (seg.includes(t)) return true;
                    if ((t.includes('七六') || t.includes('76')) && seg.match(/76人?|七六人?/)) return true;
                    if (t.match(/[賽塞]爾/) && seg.match(/[賽塞]爾(?:提克)?/)) return true;
                    if ((t.includes('獨行') || t.includes('小牛')) && seg.match(/小牛|獨行俠?/)) return true;
                    if (t.includes('拓荒') && seg.match(/拓荒(?:者)?/)) return true;
                    return false;
                };

                let isPickAway = checkAliasStrict(matchedMatch.away);
                let pScore = isPickAway ? matchedMatch.aScore : matchedMatch.hScore;
                let oScore = isPickAway ? matchedMatch.hScore : matchedMatch.aScore;
                let totalScore = matchedMatch.aScore + matchedMatch.hScore;

                if(isTotal) {
                    let cleanSeg = seg.replace(matchedMatch.away, '').replace(matchedMatch.home, '').replace(/76人?|七六人?/g, '');
                    let valMatch = cleanSeg.match(/(\d+\.?\d*)/);
                    
                    if(valMatch) {
                        let threshold = parseFloat(valMatch[1]);
                        if (seg.includes('大')) {
                            if (totalScore > threshold) { target.w++; target.n++; }
                            else if (totalScore < threshold) { target.l++; target.n--; }
                        } else if (seg.includes('小')) {
                            if (totalScore < threshold) { target.w++; target.n++; }
                            else if (totalScore > threshold) { target.l++; target.n--; }
                        } else {
                            res.warn = true; 
                        }
                        target.items.push(seg);
                    } else { 
                        res.warn = true; target.items.push(seg); 
                    }
                } else {
                    let spreadMatch = seg.match(/([+-]\s*\d+\.?\d*)/) || seg.match(/(受讓|讓)\s*(\d+\.?\d*)/);
                    let spread = 0;
                    if(spreadMatch) {
                        if(spreadMatch[0].includes('受讓')) spread = parseFloat(spreadMatch[2]);
                        else if(spreadMatch[0].includes('讓')) spread = -parseFloat(spreadMatch[2]);
                        else spread = parseFloat(spreadMatch[0].replace(/\s/g,''));
                    }
                    if((pScore + spread) > oScore) { target.w++; target.n++; }
                    else if((pScore + spread) < oScore) { target.l++; target.n--; }
                    target.items.push(seg);
                }
            });

            if(res.team.items.length > 0 || res.total.items.length > 0) {
                settleHtml += `
                <div class="settle-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="color:#60a5fa;font-weight:900;font-size:20px;letter-spacing:1px;">👤 ${name}</span>
                        ${res.warn ? '<span class="status-warn">⚠️ 盤口特殊，建議手動複查</span>' : '<span style="color:#10b981;font-size:13px;font-weight:bold;">✅ 結構分流判讀完成</span>'}
                    </div>
                    <div class="group-box">
                        ${res.team.items.length > 0 ? `
                        <div class="group-title badge-team">🟦 隊伍推薦 - 上方分流區</div>
                        <div style="margin-bottom:12px;">${res.team.items.map(it=>`<span class="item-tag">${it}</span>`).join('')}</div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                            <div style="background:#0f172a;padding:5px 12px;border-radius:8px;border:1px solid #475569;">
                                <input type="number" class="admin-input val-w" data-name="${name}" data-type="team" value="${res.team.w}"> 勝 
                                <input type="number" class="admin-input val-l" data-name="${name}" data-type="team" value="${res.team.l}"> 敗
                            </div>
                            <div style="background:#0f172a;padding:5px 12px;border-radius:8px;border:1px solid #475569;">
                                淨 <input type="number" class="admin-input val-n" data-name="${name}" data-type="team" value="${res.team.n}">
                            </div>
                        </div>` : ''}
                        
                        ${res.total.items.length > 0 ? `
                        <div class="group-title badge-total" style="margin-top:15px;">🟪 大小推薦 - 下方分流區</div>
                        <div style="margin-bottom:12px;">${res.total.items.map(it=>`<span class="item-tag" style="border-color:#8b5cf6;">${it}</span>`).join('')}</div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="background:#0f172a;padding:5px 12px;border-radius:8px;border:1px solid #475569;">
                                <input type="number" class="admin-input val-w" data-name="${name}" data-type="total" value="${res.total.w}"> 勝 
                                <input type="number" class="admin-input val-l" data-name="${name}" data-type="total" value="${res.total.l}"> 敗
                            </div>
                            <div style="background:#0f172a;padding:5px 12px;border-radius:8px;border:1px solid #475569;">
                                淨 <input type="number" class="admin-input val-n" data-name="${name}" data-type="total" value="${res.total.n}">
                            </div>
                        </div>` : ''}
                    </div>
                </div>`;
            }
        });

        document.getElementById('adminMainArea').innerHTML = settleHtml || '<div style="color:#94a3b8;text-align:center;padding:100px;font-size:20px;">此分頁項目本日無對應預測</div>';
        document.getElementById('adminFooter').innerHTML = `<button onclick="executeBatchStructuralSave()" style="width:100%;padding:18px;background:linear-gradient(135deg, #f59e0b, #d97706);color:white;border:none;border-radius:15px;font-weight:bold;cursor:pointer;font-size:20px;box-shadow: 0 10px 30px rgba(245,158,11,0.3);letter-spacing:2px;">🚀 分流核對無誤，一鍵歸位植入資料庫</button>`;
    };

    window.executeBatchStructuralSave = () => {
        let dateKey = prompt("請確認寫入日期 (MM/DD)", "02/25"); if(!dateKey) return;
        let finalCount = 0;
        document.querySelectorAll('.settle-card').forEach(card => {
            let name = card.querySelector('.val-w').getAttribute('data-name');
            ['team', 'total'].forEach(type => {
                let wInp = card.querySelector(`.val-w[data-type="${type}"]`);
                if(wInp) {
                    let w = parseInt(wInp.value) || 0, l = parseInt(card.querySelector(`.val-l[data-type="${type}"]`).value) || 0, n = parseInt(card.querySelector(`.val-n[data-type="${type}"]`).value) || 0;
                    if(w+l > 0) {
                        let k = (curTab==='NBA') ? (type==='team'?'nba_team':'nba_total') : (type==='team'?'mlb_runline':'mlb_total');
                        if(!window.dataDB[name][k]) window.dataDB[name][k] = [];
                        
                        let isDup = window.dataDB[name][k].some(r => r[0] === dateKey && r[1] === `${w}勝 ${l}敗`);
                        if(!isDup) {
                            window.dataDB[name][k].unshift([dateKey, `${w}勝 ${l}敗`, (n>=0?'+':'')+n]);
                            finalCount++;
                        }
                    }
                }
            });
        });
        localStorage.setItem('DashboardDB_V62_Final', JSON.stringify(window.dataDB));
        alert(`🎉 歸位成功！\n\n系統已精準植入 ${finalCount} 筆戰績。\n76人、賽爾提克等錯字與別名已全數追回並結算完畢！`); 
        closeAdminModal(); 
        if(typeof window.init === 'function') window.init();
}
}; // ✅ 改成單純的大括號加分號，結束這個函數定義