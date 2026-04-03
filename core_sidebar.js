/* ============================================================== */
/* ==== 【功能模組：手機側邊欄 - core_sidebar.js】              */
/* ==== 手機版專用：滑動展開寶庫＋麾下，電腦版完全不介入        */
/* ============================================================== */

(function initMobileSidebar() {

    // 只在手機版執行
    if (window.innerWidth >= 1024) return;

    // 等 pocket 和 recruit 的浮動按鈕都建立後再執行
    function waitAndInit() {
        const pocketBtn  = document.querySelector('.floating-pocket-btn');
        const recruitBtn = document.querySelector('.floating-recruit-btn');

        if (!pocketBtn || !recruitBtn) {
            setTimeout(waitAndInit, 100);
            return;
        }

        // ── 1. 把原本兩個按鈕隱藏，改由側邊欄控制 ──────────────────
        pocketBtn.style.display  = 'none';
        recruitBtn.style.display = 'none';

        // ── 2. 注入側邊欄 CSS ────────────────────────────────────────
        const style = document.createElement('style');
        style.id = 'mobileSidebarStyle';
        style.innerHTML = `

        /* 側邊欄容器：平時藏在右邊界外，只露出拉把 */
        #mobileSidebar {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%) translateX(calc(100% - 14px));
            z-index: 9996;
            display: flex;
            flex-direction: row;
            align-items: center;
            transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* 展開狀態 */
        #mobileSidebar.open {
            transform: translateY(-50%) translateX(0);
        }

        /* 拉把（透明，平時唯一可見的部分） */
        #sidebarHandle {
            width: 14px;
            height: 80px;
            background: transparent;
            border-radius: 8px 0 0 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
            flex-shrink: 0;
        }

        /* 拉把箭頭符號（隱藏） */
        #sidebarHandle::after {
            content: '';
        }



        /* 按鈕面板 */
        #sidebarPanel {
            display: flex;
            flex-direction: column;
            gap: 0;
            background: transparent;
        }

        /* 每個功能按鈕 */
        .sidebar-btn {
            width: 64px;
            padding: 14px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            font-weight: 900;
            font-size: 11px;
            color: white;
            text-shadow: 0 1px 3px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: -4px 4px 16px rgba(0,0,0,0.4);
            position: relative;
        }

        /* 寶庫按鈕 */
        #sidebarPocketBtn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 0 0 0 0;
            border-bottom: 1px solid rgba(255,255,255,0.15);
        }

        /* 麾下按鈕 */
        #sidebarRecruitBtn {
            background: linear-gradient(135deg, #4f46e5, #312e81);
            border-radius: 0 0 0 0;
        }

        /* 數字角標 */
        .sidebar-badge {
            position: absolute;
            top: 6px;
            right: 6px;
            background: #dc2626;
            color: white;
            border-radius: 50%;
            font-size: 10px;
            font-weight: 900;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        /* 遮罩：點空白處收起 */
        #sidebarOverlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9994;
            background: transparent;
        }

        #sidebarOverlay.show {
            display: block;
        }
        `;
        document.head.appendChild(style);

        // ── 3. 建立側邊欄 HTML ───────────────────────────────────────
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);

        const sidebar = document.createElement('div');
        sidebar.id = 'mobileSidebar';
        sidebar.innerHTML = `
            <div id="sidebarHandle"></div>
            <div id="sidebarPanel">
                <div class="sidebar-btn" id="sidebarPocketBtn">
                    <span style="font-size:20px;">🎁</span>
                    <span>我的</span>
                    <span>寶庫</span>
                    <span class="sidebar-badge" id="sidebarPocketBadge" style="display:none;">0</span>
                </div>
                <div class="sidebar-btn" id="sidebarRecruitBtn">
                    <span style="font-size:20px;">🏯</span>
                    <span>麾下</span>
                    <span>名單</span>
                    <span class="sidebar-badge" id="sidebarRecruitBadge" style="display:none;">0</span>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);

        // ── 4. 展開 / 收起邏輯 ──────────────────────────────────────
        const handle = document.getElementById('sidebarHandle');

        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        }

        // 點拉把 → 切換展開收起
        handle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        });

        // 支援從右往左滑動展開
        let touchStartX = 0;
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            const dx = touchStartX - e.changedTouches[0].clientX;
            const startedNearRight = touchStartX > window.innerWidth - 30;
            // 從右邊界往左滑超過 30px → 展開
            if (startedNearRight && dx > 30) openSidebar();
        }, { passive: true });

        // 點遮罩收起
        overlay.addEventListener('click', closeSidebar);

        // ── 5. 點按鈕觸發對應 Modal ──────────────────────────────────
        document.getElementById('sidebarPocketBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            closeSidebar();
            if (typeof window.openPocketModal === 'function') window.openPocketModal();
        });

        document.getElementById('sidebarRecruitBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            closeSidebar();
            if (typeof window.openRecruitModal === 'function') window.openRecruitModal();
        });

        // ── 6. 同步角標數字 ──────────────────────────────────────────
        function updateSidebarBadges() {
            const pocketCount  = (window.userPocket  || []).length;
            const recruitCount = (window.userRecruit || []).length;

            const pBadge = document.getElementById('sidebarPocketBadge');
            const rBadge = document.getElementById('sidebarRecruitBadge');

            if (pBadge) {
                pBadge.textContent = pocketCount;
                pBadge.style.display = pocketCount > 0 ? 'flex' : 'none';
            }
            if (rBadge) {
                rBadge.textContent = recruitCount;
                rBadge.style.display = recruitCount > 0 ? 'flex' : 'none';
            }
        }

        // 攔截原本的 updatePocketWidget / updateRecruitWidget，順便更新角標
        const origPocket  = window.updatePocketWidget;
        const origRecruit = window.updateRecruitWidget;

        window.updatePocketWidget = function() {
            if (typeof origPocket === 'function') origPocket();
            updateSidebarBadges();
        };

        window.updateRecruitWidget = function() {
            if (typeof origRecruit === 'function') origRecruit();
            updateSidebarBadges();
        };

        // 初始化一次角標
        updateSidebarBadges();
    }

    // DOM 載入後開始等待
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitAndInit);
    } else {
        waitAndInit();
    }

})();