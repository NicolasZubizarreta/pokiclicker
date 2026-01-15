// --- SAVE SYSTEM ---
function exportSave() {
    const json = JSON.stringify(state);
    const blob = new Blob([json], {type: "application/json;charset=utf-8"});
    saveAs(blob, "pokiclicker_save.json");
    showFeedback("SAUVEGARDÉ", "green");
}

function loadSaveFile() {
    document.getElementById('file-input').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            loadData(data);
            document.getElementById('starter-modal').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            document.getElementById('game-ui').classList.remove('opacity-0');
        } catch(err) {
            alert("Sauvegarde invalide !");
        }
    };
    reader.readAsText(file);
}

function loadGame() {
    const saved = localStorage.getItem('pokiClickerSave');
    if(saved) loadData(JSON.parse(saved));
}

function loadData(data) {
    state = {...state, ...data};
    // Init new fields if missing
    state.candyMode = false;
    state.candyTargetIdx = null;
    state.candyAmount = 1;
    state.shinyTokenMode = false;
    state.everstoneMode = false;
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.summaryPokemon = null;
    state.contextTarget = null;
    if(state.introBagUnlocked === undefined) state.introBagUnlocked = false;
    if(state.introMapUnlocked === undefined) state.introMapUnlocked = false;
    if(state.visitedLab === undefined) state.visitedLab = false;
    if(state.hasExitedLab === undefined) state.hasExitedLab = false;
    if(state.johtoUnlocked === undefined) state.johtoUnlocked = false;
    if(!state.currentRegion) state.currentRegion = ACTIVE_REGION_KEY;
    if(!REGIONS || !REGIONS[state.currentRegion]) state.currentRegion = ACTIVE_REGION_KEY;
    if(state.pcPage === undefined) state.pcPage = 1;
    if(state.hasSeenPantheonIntro === undefined) state.hasSeenPantheonIntro = false;
    if(state.boatClicked === undefined) state.boatClicked = false;
    if(state.hasVisitedRoute1 === undefined) state.hasVisitedRoute1 = false;
    if(state.starterId === undefined) state.starterId = null;
    if(!state.pokedex) state.pokedex = [];
    if(!state.milestones) state.milestones = [];
    if(state.unlockedZone === undefined) state.unlockedZone = 0;
    if(!state.badges) state.badges = [];
    if(state.casinoTokens === undefined) state.casinoTokens = 0;
    if(state.inv.omniExp === undefined) state.inv.omniExp = 0;
    if(state.inv.omniXp !== undefined) {
        state.inv.omniExp += state.inv.omniXp;
        delete state.inv.omniXp;
    }
    if(state.inv.shinyToken === undefined) state.inv.shinyToken = 0;
    if(state.inv.masterball === undefined) state.inv.masterball = 0;
    if(state.inv.repel === undefined) state.inv.repel = 0;
    if(state.inv.hyperballs === undefined) state.inv.hyperballs = 0;
    if(state.inv.xAttack === undefined) state.inv.xAttack = 0;
    if(state.inv.xSpecial === undefined) state.inv.xSpecial = 0;
    if(state.inv.superRepel === undefined) state.inv.superRepel = 0;
    if(state.inv.pokeDoll === undefined) state.inv.pokeDoll = 0;
    if(state.inv.everstone === undefined) state.inv.everstone = 0;
    if(state.inv.fireStone === undefined) state.inv.fireStone = 0;
    if(state.inv.waterStone === undefined) state.inv.waterStone = 0;
    if(state.inv.leafStone === undefined) state.inv.leafStone = 0;
    if(state.inv.thunderStone === undefined) state.inv.thunderStone = 0;
    if(state.inv.moonStone === undefined) state.inv.moonStone = 0;
    if(state.inv.calcium === undefined) state.inv.calcium = 0;
    if(!state.attackBoostEndTime) state.attackBoostEndTime = 0;
    if(!state.dpsBoostEndTime) state.dpsBoostEndTime = 0;
    if(!state.superRepelEndTime) state.superRepelEndTime = 0;
    if(!state.falseSwipeCooldown) state.falseSwipeCooldown = 0;
    if(!state.upgrades) state.upgrades = { runningShoes: false, amuletCoin: false, protein: false, expShare: false, pokeradar: false };
    if(state.upgrades.ctJackpot === undefined) state.upgrades.ctJackpot = false;
    if(!state.repelEndTime) state.repelEndTime = 0;
    if(state.stopOnRare === undefined) state.stopOnRare = true;
    if(state.autoStopSettings === undefined) {
        state.autoStopSettings = { 'Commun': false, 'Peu Commun': false, 'Rare': true, 'Très Rare': true, 'Légendaire': true, 'Shiny': true };
    }
    if(state.autoStopSettings.Nouveau === undefined) state.autoStopSettings.Nouveau = true;
    state.interruptedState = null; // Always reset on load
    if(state.stats.totalMoney === undefined) state.stats.totalMoney = state.money;
    if(!state.daycare) state.daycare = { unlocked: false, parents: [null, null], eggs: [], slots: 1 };
    
    // Re-bind images and init XP if missing (for old saves)
    const initP = (p) => {
        p.img = getSprite(p.id, p.isShiny);
        if(state.upgrades.shinyCharm === undefined) state.upgrades.shinyCharm = false;
        if(state.upgrades.diploma === undefined) state.upgrades.diploma = false;
        if(state.pokedexBackup === undefined) state.pokedexBackup = null;
        if(state.upgrades.falseSwipe === undefined) state.upgrades.falseSwipe = false;
        if(p.xp === undefined) p.xp = 0;
        if(p.maxXp === undefined) p.maxXp = calcMaxXp(p.id, p.level);
        if(p.happiness === undefined) p.happiness = 0;
        if(!p.gender) { // Assign gender to pokemon from old saves
            if (GENDERLESS_IDS.includes(p.id)) {
                p.gender = 'genderless';
            } else if (ALWAYS_MALE_IDS.includes(p.id)) {
                p.gender = 'male';
            } else if (ALWAYS_FEMALE_IDS.includes(p.id)) {
                p.gender = 'female';
            } else {
                p.gender = Math.random() < 0.5 ? 'male' : 'female'; // Default
            }
        }
        if(p.isFavorite === undefined) p.isFavorite = false;
        if(p.isRenamed === undefined) p.isRenamed = false;
        if(p.everstone === undefined) p.everstone = false;
        if(p.calciumBoosts === undefined) p.calciumBoosts = 0;
    };
    
    state.team.forEach(initP);
    state.pc.forEach(initP);
    
    initAudio();
    updateUI(); renderTeam(); renderBag(); renderShop(); renderPC(); updateZone(); updateBg(); updateRadarButton(); spawnEnemy(); startAutoClicker(); startAutoSave();
}

function checkMilestones() {
    const count = state.pokedex.length;
    MILESTONES.forEach(m => {
        if(count >= m.count && !state.milestones.includes(m.count)) {
            state.milestones.push(m.count);
            showFeedback(`PALIER ${m.count}: ${m.title}`, "yellow");
            
            // One-time rewards
            if(m.count === 20) state.money += 2500;
            if(m.count === 40) state.inv.omniExp++;
            if(m.count === 110) state.inv.shinyToken++;
            if(m.count === 130) { state.inv.masterball++; state.inv.candy+=10; }
            if(m.count === 151 && !state.hasSeenEnding) {
                setTimeout(startEndingSequence, 1500);
            }
            
            updateUI(); renderBag();
        }
    });
}

function startEndingSequence() {
    if(state.hasSeenEnding) return;
    state.hasSeenEnding = true;
    
    // Glitch Effect
    const glitch = document.getElementById('glitch-overlay');
    glitch.classList.remove('hidden');
    glitch.classList.add('glitch-black');

    // Teleport DURING glitch (screen is black/flickering)
    setTimeout(() => {
        // Force teleport to Lab (Zone -2)
        state.zoneIdx = -2;
        state.subStage = 1;
        updateBg(); 
        renderShop(); renderBag(); renderPC(); 
        spawnEnemy();
        updateZone();
    }, 500);
    
    setTimeout(() => {
        // Safety check: if not in Lab, abort sequence
        if(state.zoneIdx !== -2) {
            glitch.classList.remove('glitch-black');
            glitch.classList.add('hidden');
            return;
        }
        glitch.classList.remove('glitch-black');
        glitch.classList.add('hidden');
        
        // Setup Intro Overlay for Ending
        const overlay = document.getElementById('intro-overlay');
        const prof = document.getElementById('intro-prof');
        const box = document.getElementById('intro-dialog-box');
        const selection = document.getElementById('intro-selection');
        
        overlay.classList.remove('hidden');
        box.classList.add('hidden');
        selection.classList.add('hidden'); // Ensure starters are hidden
        selection.classList.remove('flex');
        
        // Prof Animation
        prof.src = "img/kanto/sprites/SpriteChen1.png";
        prof.classList.remove('opacity-0');
        prof.style.right = "50%";
        prof.style.transform = "translate(50%, 100%)"; // Start below
        prof.style.transition = "transform 2s ease-out";
        
        // Force reflow
        void prof.offsetWidth;
        
        prof.style.transform = "translate(50%, 0)"; // Move to center
        
        setTimeout(() => {
            box.classList.remove('hidden');
            box.classList.add('flex');
            
            // Setup Dialog
            activeDialogs = ENDING_DIALOGS;
            introIndex = 0;
            isEndingSequence = true;
            nextDialog();
        }, 2000);
        
    }, 2000);
}

function enterLab() {
    changeZone(-2);
    if (!state.visitedLab) {
        setTimeout(startIntro, 1000);
    }
}

function checkBadges() {
    getActiveRegion().badges.forEach(b => {
        if(state.zoneIdx === b.zoneIdx && !state.badges.includes(b.name)) {
            state.badges.push(b.name);
            showFeedback(`BADGE ${b.name.toUpperCase()} OBTENU !`, "yellow");
            playTone('up');

            // Open Badge Menu & Animate
            setTimeout(() => {
                const m = document.getElementById('badges-modal');
                m.classList.remove('hidden');
                renderBadges();
                const el = document.getElementById(`badge-slot-${b.name}`);
                if(el) {
                    el.style.opacity = '0';
                    setTimeout(() => {
                        el.style.opacity = '';
                        el.classList.add('badge-slam');
                    }, 800);
                }
            }, 1200);
        }
    });
}

function togglePokedex() {
    const m = document.getElementById('pokedex-modal');
    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        renderPokedex();
    } else {
        m.classList.add('hidden');
    }
}

function toggleBadges() {
    const m = document.getElementById('badges-modal');
    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        renderBadges();
    } else {
        m.classList.add('hidden');
    }
}

function toggleMilestones() {
    const m = document.getElementById('milestones-modal');
    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        renderMilestones();
    } else {
        m.classList.add('hidden');
    }
}

function toggleAutoStopSettingsModal() {
    const m = document.getElementById('auto-stop-settings-modal');
    if (m.classList.contains('hidden')) {
        renderAutoStopSettings();
        m.classList.remove('hidden');
    } else {
        m.classList.add('hidden');
    }
}

function updateMapButton() {
    const btn = document.getElementById('map-btn');
    const lockIcon = document.getElementById('map-icon-lock');
    const activeIcon = document.getElementById('map-icon-active');
    if(!btn) return;

    btn.classList.remove('animate-bounce', 'ring-4', 'ring-green-500', 'bg-green-900');

    if (state.unlockedZone >= 1 || state.cheat || state.introMapUnlocked) {
        btn.disabled = false;
        btn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
        lockIcon.classList.add('hidden');
        activeIcon.classList.remove('hidden');
        
        if (state.zoneIdx === 0 && state.unlockedZone === 1 && state.stats.kills === 0 && !state.hasVisitedRoute1) {
            btn.classList.add('animate-bounce', 'ring-4', 'ring-green-500', 'bg-green-900');
        }
    } else {
        btn.disabled = true;
        btn.classList.add('disabled:opacity-50', 'disabled:cursor-not-allowed');
        lockIcon.classList.remove('hidden');
        activeIcon.classList.add('hidden');
    }
}

function toggleMap() {
    const m = document.getElementById('map-modal');
    if(m.classList.contains('hidden')) {
        m.classList.remove('hidden');
        renderMap();
    } else {
        m.classList.add('hidden');
    }
}

function updateRadarButton() {
    const btn = document.getElementById('radar-btn');
    const lockIcon = document.getElementById('radar-icon-lock');
    const activeIcon = document.getElementById('radar-icon-active');
    if(!btn) return;

    if (state.upgrades.pokeradar) {
        btn.disabled = false;
        btn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
        lockIcon.classList.add('hidden');
        activeIcon.classList.remove('hidden');
    } else {
        btn.disabled = true;
        btn.classList.add('disabled:opacity-50', 'disabled:cursor-not-allowed');
        lockIcon.classList.remove('hidden');
        activeIcon.classList.add('hidden');
    }
}

function toggleRadarModal() {
    if (!state.upgrades.pokeradar) return;
    const modal = document.getElementById('radar-modal');
    if (modal.classList.contains('hidden')) {
        renderRadar();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function renderRadar() {
    const zone = getActiveRegion().zones[state.zoneIdx];
    const grid = document.getElementById('radar-grid');
    document.getElementById('radar-zone-name').innerText = zone.name;
    grid.innerHTML = '';

    const rarityColors = { "Commun": "bg-slate-500 text-white", "Peu Commun": "bg-green-600 text-white", "Rare": "bg-blue-600 text-white", "Très Rare": "bg-purple-600 text-white", "Légendaire": "bg-yellow-500 text-black", "Boss": "bg-red-600 text-white", "Conseil 4": "bg-indigo-600 text-white", "Maître": "bg-black text-yellow-300" };

    zone.pokemons.forEach(p => {
        const caught = state.pokedex.includes(p.id);
        const imgSrc = getSprite(p.id, false);
        const imgClass = caught ? '' : 'grayscale brightness-0';
        const colorClasses = rarityColors[p.rarity] || "bg-gray-500 text-white";
        grid.innerHTML += `<div class="aspect-square bg-slate-900/50 rounded-lg flex flex-col items-center justify-center p-2 relative border border-slate-700"><img src="${imgSrc}" class="w-20 h-20 object-contain ${imgClass}" title="${p.name}"><div class="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md ${colorClasses}">${p.rarity}</div></div>`;
    });
}

function flyToZone(zoneId) {
    const overlay = document.getElementById('gen1-fly-overlay');
    const trainer = document.getElementById('fly-trainer');
    const mapModal = document.getElementById('map-modal');
    const mapContainer = document.getElementById('map-container');
    const mapImg = mapContainer.querySelector('img');

    // Prevent multiple clicks during animation
    if (overlay.style.display === 'flex') return;

    // 1. Find current zone coordinates to position the trainer
    let currentArea = getActiveRegion().mapData.find(a => a.zoneId === state.zoneIdx);
    if (!currentArea) {
        currentArea = getActiveRegion().mapData.find(a => a.zoneId === 0) || getActiveRegion().mapData[0];
    }
    if (!currentArea) return;

    let centerX, centerY;
    const coords = currentArea.coords;
    if (currentArea.type === 'circle') {
        centerX = coords[0];
        centerY = coords[1];
    } else if (currentArea.type === 'rect') {
        centerX = (coords[0] + coords[2]) / 2;
        centerY = (coords[1] + coords[3]) / 2;
    } else if (currentArea.type === 'polygon') {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < coords.length; i += 2) {
            minX = Math.min(minX, coords[i]);
            maxX = Math.max(maxX, coords[i]);
            minY = Math.min(minY, coords[i+1]);
            maxY = Math.max(maxY, coords[i+1]);
        }
        centerX = (minX + maxX) / 2;
        centerY = (minY + maxY) / 2;
    }

    // Convert to percentage for absolute positioning
    trainer.style.left = `${(centerX / mapImg.naturalWidth) * 100}%`;
    trainer.style.top = `${(centerY / mapImg.naturalHeight) * 100}%`;
    trainer.classList.remove('hidden');
    
    // Animation SpriteFly (1 à 5)
    let frame = 1;
    trainer.src = `img/kanto/sprites/SpriteFly${frame}.png`;
    const animInterval = setInterval(() => {
        frame++;
        if(frame <= 5) trainer.src = `img/kanto/sprites/SpriteFly${frame}.png`;
        else clearInterval(animInterval);
    }, 150); // 150ms par frame

    // 2. Wait a bit, then start the fly animation
    setTimeout(() => {
        // Show overlay (Black Band)
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 50);

        // 3. Set timeout for the duration of the fly animation
        setTimeout(() => {
            // Execute the zone change
            if(state.cheat && zoneId > state.unlockedZone) state.unlockedZone = zoneId;
            state.zoneIdx = zoneId; 
            state.subStage = 1; 
            updateBg(); renderShop(); renderBag(); renderPC(); spawnEnemy(); 
            
            // Close map and hide/reset animation overlay
            overlay.classList.remove('active');
            overlay.classList.add('closing');
            
            setTimeout(() => {
                mapModal.classList.add('hidden');
                overlay.style.display = 'none';
                overlay.classList.remove('closing');
                
                trainer.classList.add('hidden');
            }, 500);
        }, 2500); // 2.5s animation
    }, 800); // Wait for trainer to appear and pose
}

function showZoneInfo(zoneId) {
    const zone = getActiveRegion().zones[zoneId];
    if (!zone) return;

    const isUnlocked = zoneId <= state.unlockedZone || state.cheat;
    const isCeladopole = zoneId === 11;

    document.getElementById('zone-info-name').innerText = isCeladopole ? "Céladopole" : zone.name;
    if (zoneId <= 0) {
        document.getElementById('zone-info-desc').innerText = "";
    } else {
        document.getElementById('zone-info-desc').innerText = `Zone ${zoneId}`;
    }
    
    const bgUrl = zone.bg.includes("http") || zone.bg.includes("img/kanto/") ? `url('${encodeURI(zone.bg)}')` : '';
    const bgEl = document.getElementById('zone-info-bg');
    bgEl.style.backgroundImage = bgUrl;
    if (!bgUrl) bgEl.style.background = zone.bg;

    const actions = document.getElementById('zone-info-actions');
    actions.innerHTML = "";

    const enabledClasses = "w-full py-2 rounded font-bold text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 hover:scale-105";
    const disabledClasses = "w-full py-2 rounded font-bold text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-wider bg-slate-700 text-gray-500 border border-slate-600 cursor-not-allowed opacity-70";

    const buildButton = (label, icon, enabled, onClick) => {
        const btn = document.createElement('button');
        btn.className = enabled ? enabledClasses : disabledClasses;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">${icon}</span> ${label}`;
        btn.disabled = !enabled;
        if (enabled) btn.onclick = onClick;
        return btn;
    };

    const flyToExtraZone = (targetId) => {
        closeZoneInfo();
        flyToZone(targetId);
    };

    const goLabel = isUnlocked ? (isCeladopole ? "Arène" : "Y ALLER") : "BLOQUÉ";
    const goIcon = isUnlocked ? "flight_takeoff" : "lock";
    const goBtn = buildButton(goLabel, goIcon, isUnlocked, () => {
        closeZoneInfo();
        flyToZone(zoneId);
    });
    goBtn.id = "zone-info-go-btn";
    actions.appendChild(goBtn);

    if (isCeladopole) {
        actions.appendChild(buildButton("Centre Commercial", "storefront", isUnlocked, () => flyToExtraZone(-6)));
        actions.appendChild(buildButton("Casino", "casino", isUnlocked, () => flyToExtraZone(-7)));
    }

    document.getElementById('zone-info-modal').classList.remove('hidden');
}

function closeZoneInfo() {
    document.getElementById('zone-info-modal').classList.add('hidden');
}

function showDiplomaModal() {
    document.getElementById('diploma-modal').classList.remove('hidden');
}

function hideDiplomaModal() {
    document.getElementById('diploma-modal').classList.add('hidden');
}

function showMapTooltip(text, e, color='yellow') {
    if (window.innerWidth < 1024) return;
    const t = document.getElementById('map-tooltip');
    t.innerText = text;
    
    // Reset classes
    t.className = "fixed z-[100] bg-slate-900 border-2 text-xs font-bold px-3 py-2 rounded-lg pointer-events-none hidden transition-opacity duration-200 pixel-font tracking-wide";
    
    // Apply color
    const colors = {
        red: { text: 'text-red-400', border: 'border-red-400', shadow: 'rgba(248, 113, 113, 0.5)' },
        blue: { text: 'text-blue-400', border: 'border-blue-400', shadow: 'rgba(96, 165, 250, 0.5)' },
        amber: { text: 'text-amber-400', border: 'border-amber-400', shadow: 'rgba(251, 191, 36, 0.5)' },
        green: { text: 'text-green-400', border: 'border-green-400', shadow: 'rgba(74, 222, 128, 0.5)' },
        gray: { text: 'text-gray-400', border: 'border-gray-400', shadow: 'rgba(156, 163, 175, 0.5)' },
        yellow: { text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'rgba(250, 204, 21, 0.5)' }
    };
    const c = colors[color] || colors.yellow;
    
    t.classList.add(c.text, c.border);
    t.style.boxShadow = `0 0 10px ${c.shadow}`;
    
    t.classList.remove('hidden');
    moveMapTooltip(e);
}
function moveMapTooltip(e) {
    const t = document.getElementById('map-tooltip');
    t.style.left = (e.clientX + 15) + 'px';
    t.style.top = (e.clientY + 15) + 'px';
}
function hideMapTooltip() {
    document.getElementById('map-tooltip').classList.add('hidden');
}

function renderMap() {
    const img = document.querySelector('#map-container img');
    const c = document.getElementById('map-svg');
    
    if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => renderMap();
        return;
    }
    
    c.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
    c.innerHTML = "";
    
    getActiveRegion().mapData.forEach(area => {
        const isUnlocked = area.zoneId !== null && (area.zoneId <= state.unlockedZone || state.cheat);
        const isCurrent = area.zoneId === state.zoneIdx;
        
        // Determine Color
        let fillClass = "fill-gray-600/50"; // Default Locked/Placeholder
        if (isUnlocked) {
            if (area.color === "red") fillClass = "fill-red-500/50";
            else if (area.color === "orange") fillClass = "fill-amber-500/50";
            else if (area.color === "cyan") fillClass = "fill-cyan-400/50";
            else fillClass = "fill-blue-500/50";
        }
        if (isCurrent) fillClass = "fill-green-400/70 animate-pulse";

        if (area.zoneId === 1 && state.zoneIdx === 0 && state.unlockedZone === 1 && state.stats.kills === 0) {
            fillClass = "flash-green-strong";
        }

        // Create SVG Element
        let el = document.createElementNS("http://www.w3.org/2000/svg", area.type);
        
        if (area.type === "rect") {
            el.setAttribute("x", area.coords[0]);
            el.setAttribute("y", area.coords[1]);
            el.setAttribute("width", area.coords[2] - area.coords[0]);
            el.setAttribute("height", area.coords[3] - area.coords[1]);
        } else if (area.type === "circle") {
            el.setAttribute("cx", area.coords[0]);
            el.setAttribute("cy", area.coords[1]);
            el.setAttribute("r", area.coords[2]);
        } else if (area.type === "polygon") {
            el.setAttribute("points", area.coords.join(" "));
        }

        el.setAttribute("class", `${fillClass} stroke-white stroke-2 transition-all duration-300 hover:stroke-yellow-400 hover:fill-opacity-80 cursor-pointer`);
        
        // Tooltip Title
        let title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        if (area.zoneId !== null && area.zoneId >= 1) {
            title.textContent = `${area.name} (Zone ${area.zoneId})`;
        } else {
            title.textContent = area.name;
        }
        el.appendChild(title);

        if (area.zoneId !== null) {
            el.onclick = (e) => { 
                e.stopPropagation();
                showZoneInfo(area.zoneId);
            };
        }
        c.appendChild(el);
    });
}

function renderMilestones() {
    const l = document.getElementById('milestones-list');
    l.innerHTML = "";
    
    MILESTONES.forEach(m => {
        const unlocked = state.pokedex.length >= m.count;
        const div = document.createElement('div');
        div.className = `p-3 rounded border flex justify-between items-center ${unlocked ? 'bg-slate-700 border-green-500' : 'bg-slate-900 border-slate-700 grayscale opacity-50'}`;
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${unlocked ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-gray-500'}">${m.count}</div>
                <div>
                    <div class="font-bold ${unlocked ? 'text-yellow-400' : 'text-gray-400'}">${m.title}</div>
                    <div class="text-xs text-gray-300">${m.desc}</div>
                </div>
            </div>
            ${unlocked ? '<span class="material-symbols-outlined text-green-400">check_circle</span>' : '<span class="material-symbols-outlined text-gray-600">lock</span>'}
        `;
        l.appendChild(div);
    });
}

function renderBadges() {
    const g = document.getElementById('badges-grid');
    g.innerHTML = "";
    
    getActiveRegion().badges.forEach(b => {
        const unlocked = state.badges.includes(b.name);
        const div = document.createElement('div');
        div.id = `badge-slot-${b.name}`;
        div.className = `aspect-square rounded-full border-4 flex items-center justify-center relative transition-all group ${unlocked ? 'bg-[#E6E6E6] border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-900 border-slate-700 grayscale opacity-50'}`;
        div.innerHTML = `
            <img src="img/kanto/badges/${b.name}.png" class="w-3/4 h-3/4 object-contain ${unlocked?'':'brightness-0 invert opacity-30'}">
        `;
        div.onmouseenter = () => document.getElementById('badge-tooltip').innerHTML = `<span class="text-yellow-400 font-bold">${b.name}</span>: ${b.desc}`;
        div.onmouseleave = () => document.getElementById('badge-tooltip').innerText = "Survolez un badge pour voir son effet";
        g.appendChild(div);
    });
    
    if(state.badges.length === 0) {
        document.getElementById('badge-tooltip').innerText = "Aucun badge obtenu. Battez les champions d'arène !";
    }
}

function resetSave() {
    const regionKey = state.currentRegion || ACTIVE_REGION_KEY;
    const regionName = regionKey.toUpperCase();
    if(!confirm(`R\xe9initialiser la progression de ${regionName} ?`)) return;

    state.money = 0;
    state.inv = { balls: 0, superballs: 0, hyperballs: 0, candy: 0, omniExp: 0, shinyToken: 0, masterball: 0, repel: 0, xAttack: 0, xSpecial: 0, superRepel: 0, pokeDoll: 0, everstone: 0, fireStone: 0, waterStone: 0, leafStone: 0, thunderStone: 0, moonStone: 0, calcium: 0 };
    state.upgrades = { runningShoes: false, amuletCoin: false, protein: false, expShare: false, hardStone: false, bicycle: false, luckyEgg: false, leftovers: false, pokeradar: false, falseSwipe: false, ctJackpot: false, shinyCharm: false, diploma: false };
    state.team = [];
    state.pc = [];
    state.pokedex = [];
    state.pokedexBackup = null;
    state.badges = [];
    state.milestones = [];
    state.zoneIdx = -4;
    state.subStage = 1;
    state.unlockedZone = 0;
    state.auto = true;
    state.autoClicker = false;
    state.starterId = null;
    state.stats = { kills: 0, totalMoney: 0 };
    state.repelEndTime = 0;
    state.attackBoostEndTime = 0;
    state.dpsBoostEndTime = 0;
    state.superRepelEndTime = 0;
    state.falseSwipeCooldown = 0;
    state.boatClicked = false;
    state.introBagUnlocked = false;
    state.introMapUnlocked = false;
    state.hasExitedLab = false;
    state.hasVisitedRoute1 = false;
    state.visitedLab = false;
    state.hasSeenPantheonIntro = false;
    state.hasSeenEnding = false;
    state.casinoTokens = 0;
    state.daycare = { unlocked: false, parents: [null, null], eggs: [], slots: 1 };
    state.swapIdx = null;
    state.candyMode = false;
    state.candyTargetIdx = null;
    state.candyAmount = 1;
    state.shinyTokenMode = false;
    state.everstoneMode = false;
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.stoneMode = false;
    state.stoneType = null;
    state.summaryPokemon = null;
    state.contextTarget = null;

    updateUI(); renderTeam(); renderBag(); renderShop(); renderPC(); updateZone(); updateBg(); updateRadarButton(); spawnEnemy();
    localStorage.setItem('pokiClickerSave', JSON.stringify(state));
    showFeedback(`PROGRESSION ${regionName} R\xc9INITIALIS\xc9E`, "red", 2000);
}

function toggleHelpModal() {
    const m = document.getElementById('help-modal');
    if (!m) return;
    if (m.classList.contains('hidden')) {
        m.classList.remove('hidden');
    } else {
        m.classList.add('hidden');
    }
}









