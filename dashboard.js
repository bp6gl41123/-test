

// ── 儀表板：寶庫 & 麾下 同步更新 ──────────────────────────
function dbSyncAll() {
  var pocket  = JSON.parse(localStorage.getItem('UserPocketDB'))  || [];
  var recruit = JSON.parse(localStorage.getItem('UserRecruitDB')) || [];

  var pBtn = document.getElementById('db-pocket-btn');
  var rBtn = document.getElementById('db-recruit-btn');
  if (!pBtn || !rBtn) return;

  // 寶庫
  var pDot = document.getElementById('db-pocket-dot');
  if (pocket.length > 0) {
    pBtn.style.border     = '1px solid rgba(201,168,76,0.5)';
    pBtn.style.background = 'rgba(201,168,76,0.15)';
    pBtn.style.boxShadow  = '0 0 14px rgba(201,168,76,0.2),inset 0 0 8px rgba(201,168,76,0.08)';
    pBtn.querySelector('span:last-child').style.color = '#e8c96a';
    if (pDot) pDot.style.display = 'block';
  } else {
    pBtn.style.border     = '1px solid rgba(201,168,76,0.15)';
    pBtn.style.background = 'rgba(255,255,255,0.06)';
    pBtn.style.boxShadow  = 'none';
    pBtn.querySelector('span:last-child').style.color = 'rgba(201,168,76,0.35)';
    if (pDot) pDot.style.display = 'none';
  }

  // 麾下
  var rDot = document.getElementById('db-recruit-dot');
  if (recruit.length > 0) {
    rBtn.style.border     = '1px solid rgba(129,140,248,0.45)';
    rBtn.style.background = 'rgba(129,140,248,0.12)';
    rBtn.style.boxShadow  = '0 0 14px rgba(129,140,248,0.2),inset 0 0 8px rgba(129,140,248,0.06)';
    rBtn.querySelector('span:last-child').style.color = '#c4b5fd';
    if (rDot) rDot.style.display = 'block';
  } else {
    rBtn.style.border     = '1px solid rgba(201,168,76,0.15)';
    rBtn.style.background = 'rgba(255,255,255,0.06)';
    rBtn.style.boxShadow  = 'none';
    rBtn.querySelector('span:last-child').style.color = 'rgba(201,168,76,0.35)';
    if (rDot) rDot.style.display = 'none';
  }
}

// 點擊處理
function dbShowToast(msg) {
  var t = document.getElementById('db-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'db-toast';
    t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%) translateY(10px);z-index:99999;background:linear-gradient(135deg,#d4872a,#e8a040);color:#fff8f0;font-size:15px;font-weight:800;padding:13px 32px;border-radius:50px;box-shadow:0 6px 24px rgba(200,120,30,0.45);opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;letter-spacing:0.8px;text-shadow:0 1px 3px rgba(0,0,0,0.2);';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(function() {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2000);
}

window.dbOpenPocket = function() {
  var pocket = JSON.parse(localStorage.getItem('UserPocketDB')) || [];
  if (pocket.length === 0) { dbShowToast('你尚未收錄任何好手'); return; }
  if (typeof window.openPocketModal === 'function') window.openPocketModal();
};

window.dbOpenRecruit = function() {
  var recruit = JSON.parse(localStorage.getItem('UserRecruitDB')) || [];
  if (recruit.length === 0) { dbShowToast('你尚未收錄任何好手'); return; }
  if (typeof window.openRecruitModal === 'function') window.openRecruitModal();
};

// 初始化 + 掛鉤到現有系統的更新函數
(function() {
  // 等 DOM 與其他模組載入完成後再跑
  function waitAndInit() {
    dbSyncAll();

    // 攔截 updatePocketWidget，同步觸發儀表板更新
    var origPocket = window.updatePocketWidget;
    window.updatePocketWidget = function() {
      if (typeof origPocket === 'function') origPocket();
      dbSyncAll();
    };

    // 攔截 updateRecruitWidget，同步觸發儀表板更新
    var origRecruit = window.updateRecruitWidget;
    window.updateRecruitWidget = function() {
      if (typeof origRecruit === 'function') origRecruit();
      dbSyncAll();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    setTimeout(waitAndInit, 300);
  }
})();

// ── 當期推薦好手 彈窗 ─────────────────────────────────────
var bulletinData = null;

window.openBulletinModal = function() {
  var modal = document.getElementById('bulletinModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (!bulletinData) {
    fetch('/bulletin_data.json?t=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) { bulletinData = data; renderBulletin(); })
      .catch(function() { renderBulletin(); });
  } else {
    renderBulletin();
  }
};

window.closeBulletinModal = function() {
  var modal = document.getElementById('bulletinModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

function renderBulletin() {
  var data = bulletinData;
  var listEl      = document.getElementById('bulletinExpertList');
  var announceEl  = document.getElementById('bulletinAnnounce');
  var announceText= document.getElementById('bulletinAnnounceText');
  var emptyEl     = document.getElementById('bulletinEmpty');
  var updatedEl   = document.getElementById('bulletinUpdatedAt');
  if (!listEl) return;

  listEl.innerHTML = '';

  var statusMapPositive = {
    green:  { label:'推薦中', bg:'rgba(22,163,74,0.15)',  color:'#4ade80', border:'rgba(22,163,74,0.35)' },
    yellow: { label:'普通',   bg:'rgba(234,179,8,0.15)',  color:'#fbbf24', border:'rgba(234,179,8,0.35)' },
    red:    { label:'觀察',   bg:'rgba(220,38,38,0.15)',  color:'#f87171', border:'rgba(220,38,38,0.35)' }
  };

  var statusMapReverse = {
    green:  { label:'推薦中', bg:'rgba(168,85,247,0.15)', color:'#c084fc', border:'rgba(168,85,247,0.35)' },
    yellow: { label:'普通',   bg:'rgba(168,85,247,0.08)', color:'#a78bfa', border:'rgba(168,85,247,0.2)'  },
    red:    { label:'觀察',   bg:'rgba(168,85,247,0.05)', color:'#7c3aed', border:'rgba(168,85,247,0.15)' }
  };

  var hasContent = data && data.experts && data.experts.length > 0;

  if (hasContent) {
    emptyEl.style.display = 'none';

    var positiveList = data.experts.filter(function(e){ return e.direction !== 'reverse'; });
    var reverseList  = data.experts.filter(function(e){ return e.direction === 'reverse'; });

    function makeExpertRow(expert, isReverse) {
      var sMap = isReverse ? statusMapReverse : statusMapPositive;
      var s = sMap[expert.status] || sMap['yellow'];
      var events = (expert.events || '').trim().split('\n').filter(function(l){ return l.trim(); });
      var evHTML = events.map(function(ev){
        return '<span style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:3px;padding:0px 5px;font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">' + ev.trim() + '</span>';
      }).join('');

      var rowBorder = isReverse ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.07)';
      var rowBg     = isReverse ? 'rgba(168,85,247,0.05)' : 'rgba(255,255,255,0.03)';

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:5px;background:' + rowBg + ';border:1px solid ' + rowBorder + ';border-radius:5px;padding:3px 7px;min-height:26px;';
      row.innerHTML =
        '<span style="flex-shrink:0;display:inline-block;background:' + s.bg + ';color:' + s.color + ';border:1px solid ' + s.border + ';border-radius:20px;padding:1px 6px;font-size:9px;font-weight:900;white-space:nowrap;">' + s.label + '</span>' +
        '<span style="color:#f1f5f9;font-size:11px;font-weight:900;white-space:nowrap;min-width:55px;">' + expert.name + '</span>' +
        '<div style="flex:1;display:flex;flex-wrap:nowrap;overflow:hidden;gap:2px;">' + evHTML + '</div>';
      return row;
    }

    // ── 正向區塊 ──
    if (positiveList.length > 0) {
      var posHeader = document.createElement('div');
      posHeader.style.cssText = 'color:#4ade80;font-size:11px;font-weight:900;letter-spacing:1px;margin-bottom:4px;padding:3px 8px;background:rgba(22,163,74,0.08);border-left:3px solid #4ade80;border-radius:4px;';
      posHeader.textContent = '✅ 正向好手';
      listEl.appendChild(posHeader);
      positiveList.forEach(function(expert){
        listEl.appendChild(makeExpertRow(expert, false));
      });
    }

    // ── 反向區塊 ──
    if (reverseList.length > 0) {
      var revHeader = document.createElement('div');
      revHeader.style.cssText = 'color:#c084fc;font-size:11px;font-weight:900;letter-spacing:1px;margin:8px 0 4px;padding:3px 8px;background:rgba(168,85,247,0.08);border-left:3px solid #c084fc;border-radius:4px;';
      revHeader.textContent = '🔄 反向好手';
      listEl.appendChild(revHeader);
      reverseList.forEach(function(expert){
        listEl.appendChild(makeExpertRow(expert, true));
      });
    }

  } else {
    emptyEl.style.display = 'block';
  }

  // 公告按鈕列
  var hasBulletins = data && data.bulletins && data.bulletins.length > 0;
  if (hasBulletins) {
    announceEl.style.display = 'block';
    announceText.innerHTML = '';
    data.bulletins.forEach(function(b, i) {
      if (!b.title.trim()) return;
      var btn = document.createElement('button');
      btn.textContent = b.title;
      btn.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(201,168,76,0.25);color:#C9A84C;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;transition:0.2s;white-space:nowrap;';
      btn.onmouseover = function(){ this.style.background='rgba(201,168,76,0.12)'; };
      btn.onmouseout  = function(){ if(!this.classList.contains('bl-active')) this.style.background='rgba(255,255,255,0.05)'; };
      btn.onclick = function() {
        var isActive = btn.classList.contains('bl-active');
        // 關掉所有
        document.querySelectorAll('.bl-btn-item').forEach(function(b){ b.classList.remove('bl-active'); b.style.background='rgba(255,255,255,0.05)'; });
        closeBulletinFloat();
        if (!isActive) {
          btn.classList.add('bl-active');
          btn.style.background = 'rgba(201,168,76,0.18)';
          openBulletinFloat(b.title, b.content);
        }
      };
      btn.className = 'bl-btn-item';
      announceText.appendChild(btn);
    });
  } else {
    announceEl.style.display = 'none';
  }

  if (data && data.updatedAt) {
    var d = new Date(data.updatedAt);
    updatedEl.textContent = '更新時間：' + d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
  } else {
    updatedEl.textContent = '';
  }

  var dot = document.getElementById('bulletin-dot');
  if (dot) dot.style.display = hasContent ? 'block' : 'none';
}

// ── 公告浮動視窗 ──────────────────────────
function openBulletinFloat(title, content) {
  var el = document.getElementById('bulletinFloat');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bulletinFloat';
    el.style.cssText = 'position:fixed;bottom:100px;right:16px;width:300px;max-height:260px;z-index:99999;display:flex;flex-direction:column;background:rgba(15,23,42,0.6);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(201,168,76,0.3);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.07);overflow:hidden;animation:blFloatIn 0.25s ease;';
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(201,168,76,0.15);flex-shrink:0;">' +
      '<span style="color:#C9A84C;font-size:13px;font-weight:900;">📢 ' + title + '</span>' +
      '<span onclick="closeBulletinFloat(true)" style="cursor:pointer;color:#64748b;font-size:16px;font-weight:bold;line-height:1;padding:2px 6px;border-radius:4px;transition:0.2s;" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#64748b\'">✕</span>' +
    '</div>' +
    '<div style="overflow-y:auto;flex:1;padding:12px 14px;">' +
      '<div style="color:#cbd5e1;font-size:12px;line-height:1.8;white-space:pre-wrap;">' + content + '</div>' +
    '</div>';
  el.style.display = 'flex';
}

function closeBulletinFloat(clearActive) {
  var el = document.getElementById('bulletinFloat');
  if (el) el.style.display = 'none';
  if (clearActive) {
    document.querySelectorAll('.bl-btn-item').forEach(function(b){ b.classList.remove('bl-active'); b.style.background='rgba(255,255,255,0.05)'; });
  }
}

// 點擊背景關閉彈窗（只綁一次）
(function() {
  function bindBulletinClose() {
    var modal = document.getElementById('bulletinModal');
    if (!modal) return;
    modal.addEventListener('click', function(e) {
      if (e.target === modal) window.closeBulletinModal();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindBulletinClose);
  } else {
    bindBulletinClose();
  }
})();