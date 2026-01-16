// --- UI MODULE ---

function updateShopPrices() {
    const elements = document.querySelectorAll('.shop-price-text');
    elements.forEach(el => {
        const id = el.getAttribute('data-id');
        if(ITEMS[id]) {
             const finalPrice = getPrice(getItemPrice(id));
             if (state.money >= finalPrice) {
                el.classList.remove('text-red-500');
                el.classList.add('text-yellow-400');
            } else {
                el.classList.remove('text-yellow-400');
                el.classList.add('text-red-500');
            }
        }
    });
}

function formatMoney(value) {
    const n = Number(value) || 0;
    const abs = Math.abs(n);
    const formatShort = (num, unit, decimals) => {
        const out = (num / unit).toFixed(decimals);
        return `${out.replace(/\.0$/, "")}${unit === 1e3 ? "K" : unit === 1e6 ? "M" : unit === 1e9 ? "B" : "T"}`;
    };

    if (abs >= 1e12) return formatShort(n, 1e12, abs < 1e13 ? 1 : 0);
    if (abs >= 1e9) return formatShort(n, 1e9, abs < 1e10 ? 1 : 0);
    if (abs >= 1e6) return formatShort(n, 1e6, abs < 1e7 ? 1 : 0);
    if (abs >= 1e4) return formatShort(n, 1e3, abs < 1e5 ? 1 : 0);
    return n.toLocaleString('fr-FR');
}


function updateUI() {
    document.getElementById('money-display').innerText = formatMoney(state.money);
    const currentDps = getDPS(enemy.dead ? null : enemy.id).toFixed(1);
    document.getElementById('total-dps').innerText = currentDps;
    if(document.getElementById('total-dps-m')) document.getElementById('total-dps-m').innerText = currentDps;
    document.getElementById('team-count').innerText = state.team.length;
    
    // Shop Stocks
    if(document.getElementById('shop-stock-pokeball')) document.getElementById('shop-stock-pokeball').innerText = state.inv.balls;
    if(document.getElementById('shop-stock-superball')) document.getElementById('shop-stock-superball').innerText = state.inv.superballs;
    if(document.getElementById('shop-stock-candy')) document.getElementById('shop-stock-candy').innerText = state.inv.candy;
    if(document.getElementById('shop-stock-hyperball')) document.getElementById('shop-stock-hyperball').innerText = state.inv.hyperballs;
    if(document.getElementById('shop-stock-masterball')) document.getElementById('shop-stock-masterball').innerText = state.inv.masterball;
    if(document.getElementById('shop-stock-repel')) document.getElementById('shop-stock-repel').innerText = state.inv.repel;
    if(document.getElementById('shop-stock-everstone')) document.getElementById('shop-stock-everstone').innerText = state.inv.everstone;
    updateAutoBtn();
    updateRadarButton();
    updateAutoStopBtn();
    updateMapButton();
    updateAutoClickerBtn();
    updateFalseSwipeBtn();
    updateMobileMenuButtons();
    updateShopPrices();
}


function updateZone() {
    const z = getActiveRegion().zones[state.zoneIdx];
    document.getElementById('zone-name').innerText = z.name;
    
    const zoneIdEl = document.getElementById('zone-id');
    const stageTextEl = document.getElementById('stage-text');
    const zoneProgressEl = document.getElementById('zone-progress');
    const zoneIdContainer = zoneIdEl.parentElement;

    if (state.zoneIdx <= 0) {
        zoneIdContainer.style.visibility = 'hidden';
        stageTextEl.style.display = 'none';
        zoneProgressEl.parentElement.style.display = 'none';
        
        // Hide enemy in Daycare (Zone -1)
        if (state.zoneIdx === -1) {
            document.getElementById('enemy-sprite').classList.add('hidden');
            document.getElementById('enemy-info-panel').classList.add('hidden');
            document.getElementById('daycare-panel').classList.remove('hidden');
            renderDaycare();
        } else {
            document.getElementById('daycare-panel').classList.add('hidden');
        }
    } else {
        zoneIdContainer.style.visibility = 'visible';
        zoneIdEl.innerText = state.zoneIdx;
        stageTextEl.style.display = 'inline';
        zoneProgressEl.parentElement.style.display = 'block';
        stageTextEl.innerText = state.subStage+"/10";
        zoneProgressEl.style.width = (state.subStage*10)+"%";
    }

    const mallPanel = document.getElementById('mall-shop-panel');
    if (mallPanel) {
        if (state.zoneIdx === -6) {
            mallPanel.classList.remove('hidden');
            mallPanel.classList.add('flex');
            renderMallPanel();
        } else {
            mallPanel.classList.add('hidden');
            mallPanel.classList.remove('flex');
        }
    }
    
    // Arrows
    const canNext = (state.zoneIdx < state.unlockedZone || state.cheat) && state.zoneIdx < getActiveRegion().zones.length-1;
    
    const prevD = document.getElementById('prev-zone-btn-d');
    const nextD = document.getElementById('next-zone-btn-d');
    
    if (state.zoneIdx <= 0) {
        if(prevD) prevD.style.display = 'none';
        if(nextD) nextD.style.display = 'none';
    } else {
        if(prevD) {
            prevD.style.display = 'flex';
            prevD.disabled = state.zoneIdx <= 1;
        }
        if(nextD) {
            nextD.style.display = 'flex';
            nextD.disabled = !canNext;
            nextD.className = canNext ? "w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white flex items-center justify-center transition transform hover:scale-105 animate-pulse shadow-lg shrink-0" : "w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-800 border border-slate-600 text-white flex items-center justify-center hover:bg-slate-700 transition disabled:opacity-50 shadow-lg shrink-0";
        }
    }
}


function updateBg() {
    const bg = getActiveRegion().zones[state.zoneIdx].bg;
    const bgDiv = document.getElementById('bg-image-div');
    const bgImg = document.getElementById('bg-img-element');
    const bgSvg = document.getElementById('bg-overlay-svg');

    // Reset styles that might be changed by mobile specific hacks
    bgImg.style.cssText = '';
    bgSvg.style.cssText = '';
    bgDiv.style.cssText = '';
    bgDiv.classList.remove('bg-blur');
    if (state.zoneIdx <= 0) {
        bgDiv.classList.remove('hidden');
        bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
        bgDiv.classList.add('bg-blur');
    }

    // Hide speech bubble by default
    document.getElementById('mom-speech').classList.add('hidden');
    document.getElementById('blue-speech').classList.add('hidden');
    document.getElementById('pallet-speech').classList.add('hidden');
    document.getElementById('pantheon-exit-btn').classList.add('hidden');

    // Zone 0 Special Handling (Interactive Map)
    if (state.zoneIdx === -4) {
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden');
        document.getElementById('mom-speech').classList.remove('hidden');
        
        bgImg.classList.remove('object-cover');
        bgImg.classList.add('object-contain');
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        bgImg.src = bg;
        bgImg.onload = () => {
            const labClass = state.visitedLab ? "transition-all hover:brightness-150 cursor-pointer" : "flash-green-strong cursor-pointer";
            bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
            bgSvg.innerHTML = `
                <a href="#" onclick="event.preventDefault()">
                    <rect x="262" y="181" width="7" height="6" fill="transparent" class="cursor-pointer"></rect>
                </a>
                <a href="#" onclick="event.preventDefault()">
                    <rect x="121" y="106" width="147" height="70" fill="transparent" class="cursor-pointer"></rect>
                </a>
                <a href="#" onclick="event.preventDefault()">
                    <rect x="284" y="571" width="138" height="69" fill="rgba(0, 255, 0, 0.3)" class="animate-pulse cursor-pointer lg:hover:fill-green-400/50 transition-colors" onmouseenter="showMapTooltip('Sortie', event, 'green')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(4)"></rect>
                </a>
            `;
        };
    } else if (state.zoneIdx === -2) {
        // Labo Prof Chen
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden');
        
        bgImg.classList.remove('object-cover');
        bgImg.classList.add('object-contain');
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        bgImg.src = bg;
        bgImg.onload = () => {
            let exitRect;
            if (state.visitedLab && !state.hasExitedLab) {
                exitRect = `<rect x="882" y="1815" width="282" height="123" class="flash-green-strong cursor-pointer transition-colors" onmouseenter="showMapTooltip('Sortie', event, 'green')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(2)"></rect>`;
            } else {
                exitRect = `<rect x="882" y="1815" width="282" height="123" fill="rgba(0, 255, 0, 0.3)" class="animate-pulse cursor-pointer lg:hover:fill-green-400/50 transition-colors" onmouseenter="showMapTooltip('Sortie', event, 'green')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(2)"></rect>`;
            }
            bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
            bgSvg.innerHTML = `
                <a href="#" onclick="event.preventDefault()">
                    ${exitRect}
                </a>
            `;
        };
    } else if (state.zoneIdx === -3) {
        // Chez Blue
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden');
        document.getElementById('blue-speech').classList.remove('hidden');
        
        bgImg.classList.remove('object-cover');
        bgImg.classList.add('object-contain');
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        bgImg.src = bg;
        bgImg.onload = () => {
            const labClass = state.visitedLab ? "transition-all hover:brightness-150 cursor-pointer" : "flash-green-strong cursor-pointer";
            bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
            bgSvg.innerHTML = `
                <a href="#" onclick="event.preventDefault()">
                    <polygon points="205,572 155,597 235,642 283,614" fill="rgba(0, 255, 0, 0.3)" class="animate-pulse cursor-pointer lg:hover:fill-green-400/50 transition-colors" onmouseenter="showMapTooltip('Sortie', event, 'green')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(3)"></polygon>
                </a>
            `;
        };
    } else if (state.zoneIdx === -1) {
        // Pension Pokémon
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden');
        
        bgImg.classList.remove('object-cover');
        bgImg.classList.add('object-contain');
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        bgImg.src = bg;
        bgImg.onload = () => {
            bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
            bgSvg.innerHTML = `
                <a href="#" onclick="event.preventDefault()">
                    <rect x="1077" y="1366" width="227" height="109" fill="rgba(220, 38, 38, 0.3)" stroke="rgba(252, 165, 165, 0.9)" stroke-width="3" class="animate-pulse cursor-pointer lg:hover:fill-red-400/50 transition-colors" onmouseenter="showMapTooltip('Sortie', event, 'red')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="exitDaycare()"></rect>
                </a>
            `;
        };
    } else if (state.zoneIdx === -5) {
        // Panthéon
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden'); // SVG activé pour les sprites
        document.getElementById('pantheon-exit-btn').classList.remove('hidden');
        bgSvg.innerHTML = ''; // Nettoyage impératif des anciens éléments (Zone 0)
        
        bgImg.classList.remove('object-cover');
        bgImg.classList.add('object-contain');
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        bgImg.src = bg;
        bgImg.onload = () => {
             bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
        };

    } else if (state.zoneIdx === -6 || state.zoneIdx === -7) {
        // Centre Commercial / Casino
        bgDiv.classList.remove('hidden');
        bgImg.classList.add('hidden');
        bgSvg.classList.add('hidden');
        bgSvg.innerHTML = '';
        bgDiv.classList.remove('bg-blur');
        
        if (bg.includes("http") || bg.includes("img/kanto/")) {
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
            bgDiv.style.background = "";
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
        } else {
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
            bgDiv.style.background = bg;
        }

    } else if (state.zoneIdx === 0) {
        // Bourg Palette
        bgDiv.classList.remove('hidden');
        bgImg.classList.remove('hidden');
        bgSvg.classList.remove('hidden');
        
        bgImg.classList.remove('object-contain', 'object-cover');
        bgImg.classList.add('object-contain');
        bgImg.style.objectPosition = "center";
        bgSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        bgImg.src = bg;
        bgImg.onload = () => {
            const chenFlash = state.chenChallengeActive && !state.chenChallengeCompleted;
            const labClass = chenFlash
                ? "flash-green-strong transition-all lg:hover:brightness-150 cursor-pointer"
                : (state.visitedLab ? "transition-all lg:hover:brightness-150 cursor-pointer" : "flash-green-strong cursor-pointer");
            
            let boatRect = `<rect x="638" y="1806" width="230" height="239" fill="rgba(75, 85, 99, 0.4)" stroke="rgba(209, 213, 219, 0.9)" stroke-width="3" class="transition-all lg:hover:brightness-150 cursor-pointer" onmouseenter="showMapTooltip('Bateau en direction de Johto', event, 'gray')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()"></rect>`;
            
            if (state.johtoUnlocked) {
                const pulseClass = state.boatClicked ? "" : "animate-pulse";
                boatRect = `<rect x="638" y="1806" width="230" height="239" fill="rgba(59, 130, 246, 0.3)" stroke="rgba(147, 197, 253, 0.9)" stroke-width="3" class="${pulseClass} cursor-pointer lg:hover:fill-blue-400/50 transition-colors" onmouseenter="showMapTooltip('Bateau vers Johto', event, 'blue')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="showJohtoModal()"></rect>`;
            }

            bgSvg.setAttribute('viewBox', `0 0 ${bgImg.naturalWidth} ${bgImg.naturalHeight}`);
            bgSvg.innerHTML = `
                <a href="#" onclick="event.preventDefault()">
                    <rect x="226" y="691" width="81" height="87" fill="rgba(220, 38, 38, 0.4)" stroke="rgba(252, 165, 165, 0.9)" stroke-width="3" class="transition-all lg:hover:brightness-150 cursor-pointer" onmouseenter="showMapTooltip('Chez Maman', event, 'red')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(-4)"></rect>
                </a>
                <a href="#" onclick="event.preventDefault()">
                    <rect x="667" y="692" width="80" height="85" fill="rgba(37, 99, 235, 0.4)" stroke="rgba(147, 197, 253, 0.9)" stroke-width="3" class="transition-all lg:hover:brightness-150 cursor-pointer" onmouseenter="showMapTooltip('Chez Blue', event, 'blue')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(-3)"></rect>
                </a>
                <a href="#" onclick="event.preventDefault()">
                    <rect x="392" y="1293" width="82" height="91" fill="rgba(146, 64, 14, 0.4)" stroke="rgba(251, 191, 36, 0.9)" stroke-width="3" class="transition-all lg:hover:brightness-150 cursor-pointer" onmouseenter="showMapTooltip('Pension Pokémon', event, 'amber')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()"></rect>
                </a>
                ${state.daycare.unlocked ? `
                <a href="#" onclick="event.preventDefault()">
                    <rect x="392" y="1293" width="82" height="91" fill="rgba(236, 72, 153, 0.3)" stroke="rgba(244, 114, 182, 0.9)" stroke-width="3" class="animate-pulse cursor-pointer lg:hover:fill-pink-400/50 transition-colors" onmouseenter="showMapTooltip('Pension Pokémon', event, 'pink')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="changeZone(-1)"></rect>
                </a>` : ''}
                <a href="#" onclick="event.preventDefault()">
                    <rect x="1327" y="836" width="96" height="96" fill="rgba(22, 163, 74, 0.4)" stroke="rgba(134, 239, 172, 0.9)" stroke-width="3" class="${labClass}" onmouseenter="showMapTooltip('Labo Pokémon du Prof. Chen', event, 'green')" onmousemove="moveMapTooltip(event)" onmouseleave="hideMapTooltip()" onclick="enterLab()"></rect>
                </a>
                <a href="#" onclick="event.preventDefault()">
                    ${boatRect}
                </a>
            `;
        };
    } else {
        bgDiv.classList.remove('hidden');
        bgImg.classList.add('hidden');
        bgSvg.classList.add('hidden');
        
        if(bg.includes("http") || bg.includes("img/kanto/")) {
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
            bgDiv.style.background = ""; 
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
        } else {
            bgDiv.style.backgroundImage = "url('" + encodeURI(bg) + "')";
            bgDiv.style.background = bg; 
        }
    }
}


function updateEnemyUI() {
    const img = document.getElementById('enemy-sprite');
    
    // Preload image to prevent ghosting
    const newSrc = getArtwork(enemy.id, enemy.isShiny);
    const tempImg = new Image();
    
    tempImg.onload = () => {
        img.src = newSrc;
        img.classList.remove('hidden'); // Show only when loaded
        
        if(enemy.isBoss) img.classList.add('scale-125'); else img.classList.remove('scale-125');
        
        if(enemy.isShiny) {
            img.classList.remove('shiny-filter'); 
            img.classList.add('shiny-glow');      
        } else {
            img.classList.remove('shiny-filter');
            img.classList.remove('shiny-glow');
        }
        updateTeamStats(); // Update stats once visual is ready
    };
    
    // Hide current sprite while loading new one (or keep previous if you prefer, but hiding prevents mismatch)
    img.classList.add('hidden');
    tempImg.src = newSrc;

    // Update text immediately
    document.getElementById('enemy-name').innerText = enemy.name;
    document.getElementById('enemy-level').innerText = "Lv. " + enemy.level;
    document.getElementById('boss-badge').style.display = enemy.isBoss ? 'block' : 'none';
    
    const types = getTypes(enemy.id);
    let typeHtml = types.map(t => 
        `<span style="background:${TYPE_COLORS[t]}" class="hidden lg:inline-block text-[9px] px-1.5 py-0.5 rounded text-white shadow-sm ml-1 uppercase">${t}</span>` +
        `<div class="w-3 h-3 rounded-full inline-block lg:hidden ml-1 shadow-sm border border-white/30" style="background:${TYPE_COLORS[t]}" title="${t}"></div>`
    ).join("");
    
    let genderHtml = '';
    if (enemy.gender === 'male') genderHtml = `<span class="text-blue-400 ml-1 font-bold text-sm">&#9794;</span>`;
    else if (enemy.gender === 'female') genderHtml = `<span class="text-pink-400 ml-1 font-bold text-sm">&#9792;</span>`;
    
    if(enemy.isShiny) typeHtml += `<span class="text-yellow-400 ml-1 font-bold text-sm">&#9733;</span>`;
    if(state.pokedex.includes(enemy.id)) typeHtml += `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" class="w-3 h-3 inline-block ml-1" title="Déjà capturé">`;
    
    document.getElementById('enemy-name').innerHTML = enemy.name + genderHtml + typeHtml;
    
    updateAutoClickerBtn();
    updateHp();
    updateZone();
}


function updateHp() {
    const pct = Math.max(0, (enemy.hp/enemy.maxHp)*100);
    const bar = document.getElementById('hp-bar');
    bar.style.width = pct + "%";
    bar.className = `h-full transition-all duration-100 ${pct<25?'bg-red-500':pct<50?'bg-yellow-500':'bg-green-500'}`;
    document.getElementById('hp-text').innerText = Math.ceil(Math.max(0, enemy.hp)) + "/" + enemy.maxHp;
    if(state.cheat && !document.getElementById('catch-tooltip').classList.contains('hidden')) showCatchTooltip();
}


function updateActiveEffects() {
    const container = document.getElementById('active-effects');
    if(!container) return;
    container.innerHTML = "";
    
    const now = Date.now();
    
    const addBadge = (endTime, label, colorClass) => {
        if(endTime > now) {
            const remaining = Math.ceil((endTime - now) / 1000);
            const div = document.createElement('div');
            div.className = `text-[8px] px-2 py-0.5 rounded-full font-bold text-white shadow-sm border ${colorClass} bg-opacity-80 backdrop-blur-sm`;
            div.innerText = `${label}: ${remaining}s`;
            container.appendChild(div);
        }
    };

    addBadge(state.attackBoostEndTime, "ATK +", "bg-red-900 border-red-500");
    addBadge(state.dpsBoostEndTime, "SPÉ +", "bg-blue-900 border-blue-500");
    addBadge(state.repelEndTime, "REPOUSSE", "bg-gray-700 border-gray-500");
    addBadge(state.superRepelEndTime, "SUPER REP.", "bg-slate-600 border-slate-400");
}



