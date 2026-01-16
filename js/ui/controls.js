// --- UI MODULE ---

function clickAttack(e) {
    if(enemy.dead) return;
    const dmg = getClick();
    damageEnemy(dmg);
    const img = document.getElementById('enemy-sprite');
    img.classList.remove('shake-anim'); 
    void img.offsetWidth; // Trigger reflow
    img.classList.add('shake-anim');
    
    // Determine color based on leader effectiveness
    const leaderMult = state.team.length > 0 ? getMultiplier(state.team[0].id, enemy.id) : 1;
    playTone('hit');
    
    // Damage number
    const d = document.createElement('div');
    d.innerText = getClick(); 
    d.className="absolute text-white font-bold text-xl pointer-events-none z-50 text-shadow";
    d.style.left=(e.clientX-10)+"px"; 
    d.style.top=(e.clientY-30)+"px"; 
    if(leaderMult > 1) d.style.color = "#4ade80"; // Green
    if(leaderMult < 1) d.style.color = "#f87171"; // Red
    d.style.transition="0.5s";
    document.body.appendChild(d);
    
    requestAnimationFrame(()=>{ d.style.transform="translateY(-30px)"; d.style.opacity="0"; });
    setTimeout(()=>d.remove(), 500);
}


function toggleAutoAttack() {
    state.auto = !state.auto;
    updateAutoBtn();
}


function updateAutoBtn() {
    ['auto-attack-btn', 'auto-attack-btn-m'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;

        const isDesktop = id === 'auto-attack-btn';
        let baseClass = "justify-center text-[9px] font-bold flex items-center gap-1 transition-all rounded shadow-md";
        baseClass += isDesktop ? " flex-1 py-1 px-1" : " p-1.5";

        const colorClass = state.auto 
            ? "bg-green-600 hover:bg-green-500 text-white border border-green-400" 
            : "bg-red-600 hover:bg-red-500 text-white border border-red-400";
        b.className = `${baseClass} ${colorClass}`;
    });
}


function toggleAutoClicker() {
    state.autoClicker = !state.autoClicker;
    updateAutoClickerBtn();
}


function updateAutoClickerBtn() {
    const hasLeftovers = state.upgrades.leftovers;
    ['auto-click-btn', 'auto-click-btn-m'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;

        b.classList.remove('hidden');

        const isDesktop = id === 'auto-click-btn';
        let baseClass = "justify-center text-[9px] font-bold flex items-center gap-1 transition-all rounded shadow-md";
        baseClass += isDesktop ? " flex-1 py-1 px-1" : " p-1.5";

        const iconSize = isDesktop ? "text-[12px]" : "text-sm";

        if (!hasLeftovers) {
            b.className = `${baseClass} bg-slate-700 text-gray-500 border border-slate-600 cursor-not-allowed opacity-50`;
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">lock</span>`;
            b.disabled = true;
            b.title = "Auto Click (Nécessite l'objet Restes)";
        } else {
            b.disabled = false;
            b.title = "Auto Click (Restes)";
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">ads_click</span>`;
            const colorClass = state.autoClicker 
                ? "bg-green-600 hover:bg-green-500 text-white border border-green-400" 
                : "bg-red-600 hover:bg-red-500 text-white border border-red-400";
            b.className = `${baseClass} ${colorClass}`;
        }
    });
}


function updateFalseSwipeBtn() {
    const hasUpgrade = state.upgrades.falseSwipe;
    const now = Date.now();
    const onCooldown = state.falseSwipeCooldown > now;
    
    ['false-swipe-btn', 'false-swipe-btn-m'].forEach(id => {
        const b = document.getElementById(id);
        if(!b) return;
        
        const isDesktop = id === 'false-swipe-btn';
        const iconSize = isDesktop ? "text-[12px]" : "text-sm";
        let baseClass = "justify-center text-[9px] font-bold flex items-center gap-1 transition-all rounded shadow-md";
        baseClass += isDesktop ? " flex-1 py-1 px-1" : " p-1.5";

        if (!hasUpgrade) {
            b.className = `${baseClass} bg-slate-700 text-gray-500 border border-slate-600 cursor-not-allowed opacity-50`;
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">lock</span>`;
            b.disabled = true;
            b.title = "Fauchage (Nécessite CT Fauchage)";
        } else if (enemy.isBoss) {
            b.className = `${baseClass} bg-slate-700 text-gray-400 border border-slate-600 cursor-not-allowed`;
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">block</span>`;
            b.disabled = true;
            b.title = `Inutilisable sur un Boss`;
        } else if (onCooldown) {
            const remaining = Math.ceil((state.falseSwipeCooldown - now) / 1000);
            b.className = `${baseClass} bg-slate-700 text-gray-400 border border-slate-600 cursor-not-allowed`;
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">schedule</span> ${remaining}`;
            b.disabled = true;
            b.title = `Recharge: ${remaining}s`;
        } else {
            if (enemy.isFalseSwiped) {
                 b.className = `${baseClass} bg-red-600 text-white border border-red-400 animate-pulse`;
                 b.title = "Fauchage Actif !";
            } else {
                 b.className = `${baseClass} bg-blue-600 hover:bg-blue-500 text-white border border-blue-400`;
                 b.title = "Utiliser Fauchage (Laisse à 1 PV)";
            }
            b.innerHTML = `<span class="material-symbols-outlined ${iconSize}">content_cut</span>`;
            b.disabled = false;
        }
    });
}


function startAutoClicker() {
    if(autoClickerInterval) clearInterval(autoClickerInterval);
    // 9 clicks per second = ~111ms
    autoClickerInterval = setInterval(() => {
        if(state.autoClicker && !enemy.dead && state.upgrades.leftovers) {
            damageEnemy(getClick());
        }
    }, 111);
}


function toggleStopOnRare() {
    state.stopOnRare = !state.stopOnRare;
    updateAutoStopBtn();
}


function updateAutoStopBtn() {
    ['auto-stop-btn', 'auto-stop-btn-m'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;

        const isDesktop = id === 'auto-stop-btn';
        let baseClass = "justify-center text-[9px] font-bold flex items-center gap-1 transition-all rounded-l-md shadow-md";
        baseClass += isDesktop ? " flex-grow py-1 px-1" : " p-1.5";

        const classTrue = `${baseClass} bg-green-600 hover:bg-green-500 text-white border border-green-400`;
        const classFalse = `${baseClass} bg-gray-600 hover:bg-gray-500 text-gray-300 border border-gray-400`;

        b.className = state.stopOnRare ? classTrue : classFalse;
    });
}


function showFeedback(t,c,d=1200) {
    const e = document.getElementById('feedback-msg');
    if(feedbackTimer) clearTimeout(feedbackTimer);
    e.innerHTML = `<span class="text-${c}-400 font-bold text-2xl pixel-font text-shadow-lg text-outline">${t}</span>`;
    e.classList.remove('hidden'); 
    e.classList.remove('animate-bounce');
    void e.offsetWidth; // Trigger reflow
    e.classList.add('animate-bounce');
    feedbackTimer = setTimeout(()=>e.classList.add('hidden'), d);
}

function showPalletSpeech(text, duration = 4000) {
    const bubble = document.getElementById('pallet-speech');
    if (!bubble) return;
    bubble.innerText = text;
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), duration);
}

function triggerChenEndGame() {
    startChenChallengeSequence(true);
}


function changeZone(d) {
    hideMapTooltip();
    
    // Transition Effect
    const overlay = document.getElementById('global-transition');
    overlay.classList.remove('opacity-0');

    setTimeout(() => {
        const n = state.zoneIdx + d;
        if(getActiveRegion().zones[n] && (n<=state.unlockedZone || state.cheat || n < 0)) {
            if (state.zoneIdx === -2 && n === 0) state.hasExitedLab = true;
            if (n === 1) state.hasVisitedRoute1 = true;
            if(state.cheat && n > state.unlockedZone) state.unlockedZone = n;
            state.zoneIdx = n; 
            state.subStage = 1;
            updateBg(); renderShop(); renderBag(); renderPC(); spawnEnemy();
        }
        
        setTimeout(() => {
            overlay.classList.add('opacity-0');
        }, 150);
    }, 300);
}


function shakeBtn(id) {
    const b = document.getElementById(id);
    b.classList.add('animate-pulse');
    setTimeout(()=>b.classList.remove('animate-pulse'), 300);
}


function showPC() {
    document.getElementById('right-menu-view').classList.add('hidden');
    document.getElementById('pc-view').classList.remove('hidden');
}


function hidePC() {
    document.getElementById('pc-view').classList.add('hidden');
    document.getElementById('right-menu-view').classList.remove('hidden');
}

function showProfile() {
    document.getElementById('right-menu-view').classList.add('hidden');
    document.getElementById('profile-view').classList.remove('hidden');
}

function hideProfile() {
    document.getElementById('profile-view').classList.add('hidden');
    document.getElementById('right-menu-view').classList.remove('hidden');
}


function showStats() {
    document.getElementById('stats-modal').classList.remove('hidden');
    renderStats();
}


function renderAutoStopSettings() {
    const list = document.getElementById('auto-stop-settings-list');
    const rarities = ['Commun', 'Peu Commun', 'Rare', 'Très Rare', 'Légendaire', 'Shiny', 'Nouveau'];
    list.innerHTML = '';
    rarities.forEach(rarity => {
        const isChecked = state.autoStopSettings[rarity];
        list.innerHTML += `
        <label class="flex items-center justify-between p-2 rounded bg-slate-700 hover:bg-slate-600 cursor-pointer">
            <span class="font-bold text-sm text-white">${rarity}</span>
            <input type="checkbox" onchange="updateAutoStopSetting('${rarity}')" ${isChecked ? 'checked' : ''} class="w-5 h-5 rounded text-blue-500 bg-slate-900 border-slate-500 focus:ring-blue-600">
        </label>
        `;
    });
}


function updateAutoStopSetting(rarity) {
    state.autoStopSettings[rarity] = !state.autoStopSettings[rarity];
}


function resumeAutoBattle() {
    if (state.interruptedState) {
        state.auto = state.interruptedState.auto;
        state.autoClicker = state.interruptedState.autoClicker;
        state.interruptedState = null; // Reset the flag
        updateAutoBtn();
        updateAutoClickerBtn();
        showFeedback("AUTO-COMBAT REPRIS", "green");
    }
}


function hideStats() {
    document.getElementById('stats-modal').classList.add('hidden');
}


function renderStats() {
    const c = document.getElementById('stats-content');
    
    // Calculations
    let baseDps = state.team.reduce((s,p) => s + ((BASE_STATS[p.id]||40) * p.level)/5, 0);
    let currentDps = getDPS(null);
    
    let dpsMults = [];
    if(hasMilestone(30)) dpsMults.push("Collectionneur (x1.5)");
    if(hasMilestone(90)) dpsMults.push("Maître (x1.5)");
    if(hasBadge("Cascade")) dpsMults.push("Badge Cascade (x1.3)");
    if(hasBadge("Foudre")) dpsMults.push("Badge Foudre (x1.2)");
    if(hasBadge("Volcan")) dpsMults.push("Badge Volcan (x1.5)");
    if(Date.now() < state.dpsBoostEndTime) dpsMults.push("Attaque Spé + (x2)");

    // Base Click est calculé sur le DPS TOTAL (currentDps), pas le DPS de base
    let baseClick = 5 + Math.floor(currentDps * 0.002);
    
    // Recalcul pour affichage neutre (sans dépendre de l'ennemi actuel)
    let currentClick = baseClick;
    if(hasMilestone(10)) currentClick *= 2;
    if(hasMilestone(90)) currentClick *= 1.5;
    if(state.upgrades.protein) currentClick = Math.floor(currentClick * 1.5);
    if(state.upgrades.hardStone) currentClick = Math.floor(currentClick * 1.3);
    if(hasBadge("Roche")) currentClick = Math.floor(currentClick * 1.5);
    if(hasBadge("Foudre")) currentClick = Math.floor(currentClick * 1.2);
    if(hasBadge("Volcan")) currentClick *= 1.5;
    if(Date.now() < state.attackBoostEndTime) currentClick *= 2;

    let clickMults = [];
    if(hasMilestone(10)) clickMults.push("Débutant (x2)");
    if(hasMilestone(90)) clickMults.push("Maître (x1.5)");
    if(state.upgrades.protein) clickMults.push("Protéine (x1.5)");
    if(state.upgrades.hardStone) clickMults.push("Pierre Dure (x1.3)");
    if(hasBadge("Roche")) clickMults.push("Badge Roche (x1.5)");
    if(hasBadge("Foudre")) clickMults.push("Badge Foudre (x1.2)");
    if(hasBadge("Volcan")) clickMults.push("Badge Volcan (x1.5)");
    if(Date.now() < state.attackBoostEndTime) clickMults.push("Attaque + (x2)");

    let moneyMults = [];
    if(state.upgrades.amuletCoin) moneyMults.push("Pièce Rune (x1.3)");
    if(hasBadge("Prisme")) moneyMults.push("Badge Prisme (x1.2)");
    let moneyTotalMult = (state.upgrades.amuletCoin?1.3:1) * (hasBadge("Prisme")?1.2:1);

    let xpMults = [];
    if(state.upgrades.expShare) xpMults.push("Multi Exp (x1.5)");
    if(state.upgrades.luckyEgg) xpMults.push("Oeuf Chance (x1.5)");
    if(state.inv.omniExp > 0) xpMults.push("Omni Exp (x2)");
    if(hasBadge("Âme")) xpMults.push("Badge Âme (x1.5)");
    let xpTotalMult = (state.upgrades.expShare?1.5:1) * (state.upgrades.luckyEgg?1.5:1) * (state.inv.omniExp>0?2:1) * (hasBadge("Âme")?1.5:1);

    let catchMults = [];
    if(hasBadge("Marais")) catchMults.push("Badge Marais (x1.3)");

    const statBlock = (title, base, mults, total, icon, color, baseLabel="Base") => `
        <div class="bg-slate-800 rounded p-3 border border-slate-700">
            <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-1">
                <span class="material-symbols-outlined text-${color}-400 text-sm">${icon}</span>
                <span class="text-xs font-bold text-${color}-300">${title}</span>
            </div>
            <div class="grid grid-cols-2 gap-y-1 text-[10px]">
                <div class="text-gray-400">${baseLabel}:</div><div class="text-right font-mono">${base}</div>
                <div class="text-gray-400">Boosts:</div><div class="text-right text-${color}-400">${mults.length>0 ? mults.join(", ") : "Aucun"}</div>
                <div class="text-white font-bold border-t border-slate-600 mt-1 pt-1">Total:</div><div class="text-right font-bold text-${color}-300 border-t border-slate-600 mt-1 pt-1 font-mono">${total}</div>
            </div>
        </div>`;

    c.innerHTML = `
        <div class="bg-slate-800 rounded p-3 border border-slate-700 mb-2">
            <div class="text-[10px] text-gray-400">POKÉMON VAINCUS</div>
            <div class="text-xl font-bold text-white pixel-font">${state.stats.kills}</div>
        </div>
        <div class="bg-slate-800 rounded p-3 border border-slate-700 mb-4">
            <div class="text-[10px] text-gray-400">ARGENT TOTAL</div>
            <div class="text-xl font-bold text-yellow-400 pixel-font">${formatMoney(state.stats.totalMoney || state.money)} $</div>
        </div>
        
        ${statBlock("DÉGÂTS CLIC", baseClick, clickMults, currentClick, "touch_app", "red", "Base (5+0.2% DPS)")}
        ${statBlock("DPS ÉQUIPE", baseDps.toFixed(1), dpsMults, currentDps.toFixed(1), "swords", "blue")}
        ${statBlock("GAINS ARGENT", "100%", moneyMults, "x"+moneyTotalMult.toFixed(2), "attach_money", "yellow")}
        ${statBlock("GAINS XP", "100%", xpMults, "x"+xpTotalMult.toFixed(2), "school", "green")}
        
        <div class="bg-slate-800 rounded p-3 border border-slate-700">
            <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-1">
                <span class="material-symbols-outlined text-purple-400 text-sm">radio_button_checked</span>
                <span class="text-xs font-bold text-purple-300">TAUX CAPTURE</span>
            </div>
            <div class="text-[10px] text-gray-400">Boosts Passifs: <span class="text-purple-300">${catchMults.length>0 ? catchMults.join(", ") : "Aucun"}</span></div>
        </div>
    `;
}


