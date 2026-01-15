// --- UI MODULE ---

function renderTeam() {
    const desktopList = document.getElementById('team-list');
    const mobileList = document.getElementById('mobile-team-list');
    if (!desktopList && !mobileList) return;

    if (desktopList) desktopList.innerHTML = "";
    if (mobileList) mobileList.innerHTML = "";

    let html = "";
    state.team.forEach((p,i) => {
        const evo = !p.everstone && EVOLUTIONS[p.id] && p.level >= EVOLUTIONS[p.id].lvl;
        const swapMode = state.swapIdx!==null;
        const candyMode = state.candyMode;
        const isCandyTarget = candyMode && state.candyTargetIdx === i;
        const isInteractive = swapMode || candyMode || state.shinyTokenMode || state.everstoneMode || state.stoneMode;
        const isEgg = p.isEgg;
        const isDaycareSelect = state.daycareMode && state.daycareMode.active;
        
        let borderClass = (isInteractive || isDaycareSelect) ? 'border-blue-400 bg-blue-900/30 cursor-pointer animate-pulse' : 'border-slate-600 bg-slate-700/40';
        
        if (state.everstoneMode) {
             const stage = getEvolutionStage(p.id);
             const canEvolve = canEvolveAny(p.id);
             if (p.everstone) {
                 borderClass = 'border-red-400 bg-red-900/30 cursor-pointer'; // Retrait possible
             } else if (stage === 1 && canEvolve) {
                 borderClass = 'border-green-400 bg-green-900/30 cursor-pointer animate-pulse'; // Compatible
             } else {
                 borderClass = 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'; // Incompatible
             }
        } else if (state.stoneMode) {
             const stoneId = state.stoneType;
             const canStone = !!stoneId && !p.isEgg && !p.everstone && getStoneEvolution(p.id, stoneId);
             if (canStone) {
                 borderClass = 'border-green-400 bg-green-900/30 cursor-pointer animate-pulse'; // Compatible
             } else {
                 borderClass = 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'; // Incompatible
             }
        }

        const mult = !enemy.dead ? getMultiplier(p.id, enemy.id) : 1;
        const multColor = mult > 1 ? "text-green-400" : mult < 1 ? "text-red-400" : "text-gray-400";
        const pTypes = getTypes(p.id);
        const typeIcon = pTypes.map(t => `<div class="w-2 h-2 rounded-full inline-block mr-1" style="background:${TYPE_COLORS[t]}" title="${t}"></div>`).join("");
        const shinyClass = p.isShiny ? "shiny-glow" : "";
        const shinyIcon = p.isShiny ? "<span class='text-yellow-400 ml-1'>✦</span>" : "";
        const shinyDpsMult = p.isShiny ? 1.5 : 1;
        const happyMult = isEgg ? 1 : 1 + ((p.happiness || 0) * 0.001);
        const everstoneBonus = p.everstone ? 1.25 : 1;
        const everstoneIcon = p.everstone ? "<span class='text-gray-400 ml-1' title='Pierre Stase'>⏳</span>" : "";
        let baseStat = BASE_STATS[p.id] || 40;
        let rawDmg = (baseStat * p.level) / 5;
        const xpPct = isEgg ? Math.min(100, (p.hatchSteps / p.maxSteps) * 100) : (p.level >= 100 ? 100 : Math.min(100, (p.xp / p.maxXp) * 100));
        
        const isEvolving = p.uid === evolvingPokemon.uid && Date.now() < evolvingPokemon.endTime;
        const animClass = isEvolving ? "evolving" : "";
        
        let displayImg = p.img;
        if(isEvolving) {
            const timeLeft = evolvingPokemon.endTime - Date.now();
            // Swap every 150ms (sync with CSS 5% steps of 3000ms)
            if (Math.floor(timeLeft / 150) % 2 === 0) {
                displayImg = getSprite(evolvingPokemon.oldId, p.isShiny);
            }
        }

        // Easter Eggs Visuals
        let specialClass = "";
        const pNameLower = p.name.toLowerCase();
        if (pNameLower === "dinnerbone" || pNameLower === "grumm") specialClass = "upside-down";
        if (pNameLower === "jeb_") specialClass = "rainbow-anim";
        if (pNameLower === "caca") specialClass = "caca-filter";
        
        if (pNameLower === "daran") {
            if (isEvolving) {
                 const timeLeft = evolvingPokemon.endTime - Date.now();
                 const newStage = getEvolutionStage(p.id);
                 const oldStage = getEvolutionStage(evolvingPokemon.oldId);
                 if (Math.floor(timeLeft / 150) % 2 === 0) {
                     displayImg = `img/kanto/EasterEgg/DaranStade${oldStage}.png`;
                 } else {
                     displayImg = `img/kanto/EasterEgg/DaranStade${newStage}.png`;
                 }
            } else {
                displayImg = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;
            }
        }

        if (isEgg) {
            displayImg = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png";
        }

        const genderSymbol = p.gender === 'male' ? '<span class="text-blue-400 text-[10px] ml-1 font-bold">♂</span>' : (p.gender === 'female' ? '<span class="text-pink-400 text-[10px] ml-1 font-bold">♀</span>' : '');

        const nameDisplay = `
        <div class="flex items-center gap-1 min-w-0 relative z-10">
            <div class="text-xs font-bold text-gray-200 truncate">${isEgg ? '' : typeIcon}${p.name}${!isEgg ? shinyIcon : ''}${everstoneIcon}${p.isFavorite?"<span class='text-yellow-400 text-[10px] ml-1'>★</span>":""}</div>
        </div>`

        html += `
        <div data-uid="${p.uid}" oncontextmenu="openContextMenu('team', ${i}, event)" onclick="${(isInteractive || isDaycareSelect) ? `handleTeamClick(${i})` : `openContextMenu('team', ${i}, event)`}" class="flex items-center p-2 rounded border ${borderClass} hover:bg-slate-700 transition group">
            <img src="${displayImg}" class="w-10 h-10 mr-3 ${!isEgg ? shinyClass : ''} ${animClass} ${specialClass}">
            <div class="flex-1 min-w-0">
                ${nameDisplay}
                <div class="team-dps-text text-[10px] text-yellow-500">${isEgg ? `<span class="text-gray-400">Éclosion: ${p.hatchSteps}/${p.maxSteps}</span>` : `DPS: ${(rawDmg*mult*shinyDpsMult*happyMult*everstoneBonus).toFixed(1)} <span class="${multColor} text-[8px]">x${mult}</span>${genderSymbol}`}</div>
            </div>
            ${!swapMode ? `
            ${isCandyTarget ? `
            <div class="flex items-center gap-1 bg-slate-800 rounded p-1 border border-blue-500" onclick="event.stopPropagation()">
                <button onclick="adjustCandyAmount(-1)" class="w-5 h-5 bg-slate-600 hover:bg-slate-500 rounded flex items-center justify-center"><span class="material-symbols-outlined text-[14px]">remove</span></button>
                <span class="text-xs font-bold w-6 text-center text-white">${state.candyAmount}</span>
                <button onclick="adjustCandyAmount(1)" class="w-5 h-5 bg-slate-600 hover:bg-slate-500 rounded flex items-center justify-center"><span class="material-symbols-outlined text-[14px]">add</span></button>
                <button onclick="confirmCandyUse()" class="ml-1 text-green-400 hover:text-green-300 material-symbols-outlined text-[16px]" title="Confirmer">check</button>
                <button onclick="cancelCandyUse()" class="text-red-400 hover:text-red-300 material-symbols-outlined text-[16px]" title="Annuler">close</button>
            </div>
            ` : `
            <div class="flex items-center gap-1">
                <div class="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden relative border border-slate-600 mr-1" title="${isEgg ? 'Pas' : 'XP'}">
                    <div class="team-xp-bar h-full ${isEgg ? 'bg-yellow-500' : 'bg-blue-500'} transition-all duration-300" style="width:${xpPct}%"></div>
                </div>
                <span class="team-level-text text-[10px] text-blue-300 mr-1">${isEgg ? '' : `Lv.${p.level}`}</span>
                ${evo ? `<button onclick="evolve(${p.uid}); event.stopPropagation();" class="bg-purple-600 text-white text-[9px] px-2 py-1 rounded animate-pulse">EVO</button>` : ''}
            </div>`}
            ` : `<div class="text-[9px] text-blue-300 font-bold">REMPLACER</div>`}
        </div>`;
    });

    if (desktopList) desktopList.innerHTML = html;
    if (mobileList) mobileList.innerHTML = html;
}


const PC_PAGE_SIZE = 20;

function setPcPage(page) {
    const totalPages = Math.max(1, Math.ceil(state.pc.length / PC_PAGE_SIZE));
    const next = Math.min(Math.max(1, page), totalPages);
    if (state.pcPage !== next) state.pcPage = next;
    renderPC();
}

function nextPcPage() {
    setPcPage((state.pcPage || 1) + 1);
}

function prevPcPage() {
    setPcPage((state.pcPage || 1) - 1);
}
function renderPC() {
    const desktopContent = document.getElementById('pc-content');
    const mobileContent = document.getElementById('mobile-pc-content');
    const isDaycareSelect = state.daycareMode && state.daycareMode.active;

    if(state.unlockedZone<3 && state.zoneIdx<3) { 
        document.getElementById('pc-locked').classList.remove('hidden'); 
        return; 
    }
    document.getElementById('pc-locked').classList.add('hidden');

    let html = state.pc.length===0 ? `<div class="text-center text-green-500 text-xs mt-10">VIDE</div>` : "";
    state.pc.forEach((p,i) => {
        const shinyClass = p.isShiny ? "shiny-glow" : "";
        const genderSymbol = p.gender === 'male' ? '<span class="text-blue-400 text-[8px] ml-1 font-bold">♂</span>' : (p.gender === 'female' ? '<span class="text-pink-400 text-[8px] ml-1 font-bold">♀</span>' : '');
        const nameDisplay = `<div class="text-[10px] text-green-400 truncate max-w-[100px]">${p.name}${p.isShiny?"✦":""}${p.isFavorite?"<span class='text-yellow-400 text-[8px] ml-1'>★</span>":""}</div>`;

        // Easter Eggs Visuals
        let specialClass = "";
        const pNameLower = p.name.toLowerCase();
        if (pNameLower === "dinnerbone" || pNameLower === "grumm") specialClass = "upside-down";
        if (pNameLower === "jeb_") specialClass = "rainbow-anim";
        if (pNameLower === "caca") specialClass = "caca-filter";
        
        let pcImg = p.img;
        if (pNameLower === "daran") pcImg = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;

        html += `
        <div oncontextmenu="openContextMenu('pc', ${i}, event)" onclick="${isDaycareSelect ? `depositToDaycare('pc', ${i})` : `openContextMenu('pc', ${i}, event)`}" class="flex justify-between items-center bg-gray-900/80 p-2 mb-1 border-b border-green-900 cursor-pointer hover:bg-gray-800/80 ${isDaycareSelect ? 'border-l-4 border-l-blue-500 bg-blue-900/20' : ''}">
            <div class="flex items-center gap-2">
                <img src="${pcImg}" class="w-8 h-8 ${shinyClass} ${specialClass}">
                <div>
                    ${nameDisplay}
                    <div class="text-[8px] text-green-600">Lv.${p.level}${genderSymbol}</div>
                </div>
            </div>
        </div>`;
    });

    if(desktopContent) desktopContent.innerHTML = html;
    if(mobileContent) mobileContent.innerHTML = html;
}


function sortPC(method) {
    if (method === 'id') {
        state.pc.sort((a, b) => a.id - b.id || b.level - a.level);
    } else if (method === 'name') {
        state.pc.sort((a, b) => a.name.localeCompare(b.name) || b.level - a.level);
    } else if (method === 'level') {
        state.pc.sort((a, b) => b.level - a.level || a.id - b.id);
    } else if (method === 'favorite') {
        state.pc.sort((a, b) => (b.isFavorite === a.isFavorite) ? (a.id - b.id) : (b.isFavorite ? 1 : -1));
    }
    state.pcPage = 1;
    renderPC();
}


function renderBag() {
    const desktopBag = document.getElementById('bag-content');
    const mobileBag = document.getElementById('mobile-bag-content');
    const bagLocked = document.getElementById('bag-locked');

    if((state.unlockedZone < 1 && state.zoneIdx < 1) && !state.introBagUnlocked) { 
        if(bagLocked) bagLocked.classList.remove('hidden'); 
        if(desktopBag) desktopBag.classList.add('locked-blur'); 
    } else { 
        if(bagLocked && !bagLocked.classList.contains('breaking-lock')) bagLocked.classList.add('hidden'); 
        if(desktopBag) desktopBag.classList.remove('locked-blur'); 
    }

    let consumables = `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="attemptCatch('poke')" title="${ITEMS.pokeball.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pokéball</div><div class="text-sm font-bold">x${state.inv.balls} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>
    ${state.inv.superballs>0 || state.unlockedZone>=4 || state.zoneIdx>=4 ? `
    <div class="bg-blue-900/40 p-2 rounded flex items-center gap-2 border border-blue-500 cursor-pointer hover:bg-blue-800/40" onclick="attemptCatch('super')" title="${ITEMS.superball.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png" class="w-6 h-6">
        <div><div class="text-xs text-blue-300">Superball</div><div class="text-sm font-bold">x${state.inv.superballs} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`:''}
    ${state.inv.hyperballs>0 || state.unlockedZone>=9 || state.zoneIdx>=9 ? `
    <div class="bg-yellow-900/40 p-2 rounded flex items-center gap-2 border border-yellow-500 cursor-pointer hover:bg-yellow-800/40" onclick="attemptCatch('hyper')" title="${ITEMS.hyperball.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png" class="w-6 h-6">
        <div><div class="text-xs text-yellow-300">Hyperball</div><div class="text-sm font-bold">x${state.inv.hyperballs} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`:''}
    ${state.inv.masterball>0 ? `
    <div class="bg-purple-900/40 p-2 rounded flex items-center gap-2 border border-purple-500 cursor-pointer hover:bg-purple-800/40" onclick="attemptCatch('master')" title="${ITEMS.masterball.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png" class="w-6 h-6">
        <div><div class="text-xs text-purple-300">Masterball</div><div class="text-sm font-bold">x${state.inv.masterball} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`:''}
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 ${state.inv.candy>0?'cursor-pointer hover:bg-slate-600':''}" ${state.inv.candy>0?'onclick="initCandyUse()"':''} title="${ITEMS.candy.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Super Bonbon</div><div class="text-sm font-bold">x${state.inv.candy} ${state.inv.candy>0?'<span class="text-[8px] text-yellow-500">UTILISER</span>':''}</div></div>
    </div>`;

    if(state.inv.repel>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="useRepel()" title="${ITEMS.repel.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/repel.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Repousse</div><div class="text-sm font-bold">x${state.inv.repel} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.superRepel>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="useSuperRepel()" title="${ITEMS.superRepel.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-repel.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Superepousse</div><div class="text-sm font-bold">x${state.inv.superRepel} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.xAttack>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="useXAttack()" title="${ITEMS.xAttack.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-attack.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Attaque +</div><div class="text-sm font-bold">x${state.inv.xAttack} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.xSpecial>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="useXSpecial()" title="${ITEMS.xSpecial.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-sp-atk.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Attaque Spé +</div><div class="text-sm font-bold">x${state.inv.xSpecial} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.pokeDoll>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="usePokeDoll()" title="${ITEMS.pokeDoll.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-doll.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Poké Poupée</div><div class="text-sm font-bold">x${state.inv.pokeDoll} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.everstone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initEverstoneUse()" title="${ITEMS.everstone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/everstone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Stase</div><div class="text-sm font-bold">x${state.inv.everstone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.fireStone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initStoneUse('fireStone')" title="${ITEMS.fireStone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/fire-stone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Feu</div><div class="text-sm font-bold">x${state.inv.fireStone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.waterStone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initStoneUse('waterStone')" title="${ITEMS.waterStone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/water-stone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Eau</div><div class="text-sm font-bold">x${state.inv.waterStone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.leafStone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initStoneUse('leafStone')" title="${ITEMS.leafStone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/leaf-stone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Plante</div><div class="text-sm font-bold">x${state.inv.leafStone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.thunderStone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initStoneUse('thunderStone')" title="${ITEMS.thunderStone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/thunder-stone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Foudre</div><div class="text-sm font-bold">x${state.inv.thunderStone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }
    if(state.inv.moonStone>0) {
        consumables += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initStoneUse('moonStone')" title="${ITEMS.moonStone.desc}">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/moon-stone.png" class="w-6 h-6">
        <div><div class="text-xs text-gray-400">Pierre Lune</div><div class="text-sm font-bold">x${state.inv.moonStone} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }

    let rareItems = "";
    for (const [key, val] of Object.entries(state.upgrades)) {
        if (val) {
            const item = ITEMS[key];
            if (item) {
                const isDiploma = key === 'diploma';
                let iconHtml = "";
                if (item.img) iconHtml = `<img src="${item.img}" class="w-6 h-6 object-contain">`;
                else if (item.icon) iconHtml = `<span class="material-symbols-outlined ${item.iconColor || 'text-white'}">${item.icon}</span>`;
                
                rareItems += `
                <div class="bg-slate-800 p-2 rounded flex items-center gap-2 border border-slate-700 ${isDiploma ? 'cursor-pointer hover:bg-slate-700' : ''}" title="${item.desc}" ${isDiploma ? `onclick="showDiplomaModal()"` : ''}>
                    ${iconHtml}
                    <div>
                        <div class="text-xs text-gray-300">${item.name}</div>
                        ${!isDiploma ? `<div class="text-[9px] text-green-400 font-bold">ACTIF</div>` : '<div class="text-[9px] text-blue-400 font-bold">VOIR</div>'}
                    </div>
                </div>`;
            }
        }
    }

    if(state.inv.shinyToken>0) {
        rareItems += `
    <div class="bg-slate-700 p-2 rounded flex items-center gap-2 border border-slate-600 cursor-pointer hover:bg-slate-600" onclick="initShinyTokenUse()" title="Transforme un Pokémon de l'équipe en Shiny">
        <img src="img/kanto/icones/JetonShiny.png" class="w-6 h-6 object-contain">
        <div><div class="text-xs text-yellow-300">Jeton Shiny</div><div class="text-sm font-bold">x${state.inv.shinyToken} <span class="text-[8px] text-yellow-500">UTILISER</span></div></div>
    </div>`;
    }

    if(state.inv.omniExp>0) {
        rareItems += `
    <div class="bg-indigo-900/40 p-2 rounded flex items-center gap-2 border border-indigo-500" title="XP gagnée +100% (Passif)">
        <img src="img/kanto/icones/OmniExp.png" class="w-6 h-6 object-contain">
        <div><div class="text-xs text-indigo-300">Omni Exp</div><div class="text-sm font-bold">x${state.inv.omniExp}</div></div>
    </div>`;
    }

    let html = "";
    if (consumables) {
        html += `<div class="col-span-2 text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider border-b border-gray-700 pb-1">Consommables</div>`;
        html += consumables;
    }
    if (rareItems) {
        html += `<div class="col-span-2 text-xs font-bold text-yellow-400 mb-1 mt-2 uppercase tracking-wider border-b border-yellow-700/50 pb-1">Objets Rares</div>`;
        html += rareItems;
    }

    if(desktopBag) desktopBag.innerHTML = html;
    if(mobileBag) mobileBag.innerHTML = html;
}


function renderShop() {
    const desktopShop = document.getElementById('shop-content');
    const mobileShop = document.getElementById('mobile-shop-content');

    if(state.unlockedZone<2 && state.zoneIdx<2) { 
        document.getElementById('shop-locked').classList.remove('hidden'); 
        if(desktopShop) desktopShop.classList.add('locked-blur'); 
    } else { 
        document.getElementById('shop-locked').classList.add('hidden'); 
        if(desktopShop) desktopShop.classList.remove('locked-blur'); 
    }

    let html = `<div class="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider border-b border-gray-700 pb-1">Consommables</div>`;
    
    // Consumables
    for (const [id, item] of Object.entries(ITEMS)) {
        if (item.type !== 'consumable') continue;
        if (item.shop === 'mall') continue;
        if (state.unlockedZone < item.zone && state.zoneIdx < item.zone) continue;

        let stockDisplay = "";
        if (item.invKey) {
            stockDisplay = `<div class="text-[8px] text-blue-300">x<span id="shop-stock-${id}">${state.inv[item.invKey]}</span></div>`;
        }

        let iconHtml = "";
        if (item.img) iconHtml = `<img class="w-6 h-6" src="${item.img}">`;
        else if (item.icon) iconHtml = `<span class="material-symbols-outlined ${item.iconColor || 'text-gray-400'}">${item.icon}</span>`;

        const finalPrice = getPrice(getItemPrice(id));
        const priceColor = state.money >= finalPrice ? "text-yellow-400" : "text-red-500";

        html += `
        <div class="bg-slate-800 p-2 rounded border ${id==='superball'?'border-blue-600 bg-blue-900/30':'border-slate-700'} hover:border-blue-500 cursor-pointer flex items-center gap-2 relative group" onclick="buyItem('${id}')" title="${item.desc}">
            ${iconHtml}
            <div class="flex-1 text-xs ${id==='superball'?'text-blue-200':''}">${item.name}</div>
            <div class="shop-price-text ${priceColor} text-xs" data-id="${id}">${finalPrice.toLocaleString('de-DE')}$</div>
            ${stockDisplay}
            <button onclick="showItemInfo('${id}', event)" class="w-4 h-4 rounded-full bg-slate-600 hover:bg-slate-500 text-white text-[8px] flex items-center justify-center border border-slate-500 shrink-0 z-10 ml-1" title="Info">i</button>
        </div>`;
    }

    // Upgrades
    html += `<div class="text-xs font-bold text-gray-400 mb-1 mt-3 uppercase tracking-wider border-b border-gray-700 pb-1">Améliorations</div>`;
    
    for (const [id, item] of Object.entries(ITEMS)) {
        if (item.type !== 'upgrade') continue;
        if (state.unlockedZone < item.zone && state.zoneIdx < item.zone) continue;

        const owned = state.upgrades[id];
        let iconHtml = "";
        if (item.img) iconHtml = `<img class="w-6 h-6" src="${item.img}">`;
        else if (item.icon) iconHtml = `<span class="material-symbols-outlined ${item.iconColor || 'text-white'}">${item.icon}</span>`;

        const finalPrice = getPrice(getItemPrice(id));
        const priceColor = state.money >= finalPrice ? "text-yellow-400" : "text-red-500";

        html += `
        <div class="bg-slate-800 p-2 rounded border ${owned?'border-green-600 opacity-50':'border-slate-700 hover:border-blue-500 cursor-pointer'} flex items-center gap-2 relative group" ${!owned?`onclick="buyItem('${id}')"`:''} title="${item.desc}">
            ${iconHtml}
            <div class="flex-1 text-xs">${item.name}</div>
            ${owned ? `<div class="text-xs text-green-400 font-bold">ACQUIS</div>` : `<div class="shop-price-text ${priceColor} text-xs" data-id="${id}">${finalPrice.toLocaleString('de-DE')}$</div>`}
            <button onclick="showItemInfo('${id}', event)" class="w-4 h-4 rounded-full bg-slate-600 hover:bg-slate-500 text-white text-[8px] flex items-center justify-center border border-slate-500 shrink-0 z-10 ml-1" title="Info">i</button>
        </div>`;
    }

    if(desktopShop) desktopShop.innerHTML = html;
    if(mobileShop) mobileShop.innerHTML = html;
}

function renderMallPanel() {
    const mallContent = document.getElementById('mall-shop-content');
    if (!mallContent) return;

    const mallItems = ['xAttack', 'xSpecial', 'pokeDoll', 'everstone', 'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone'];
    let html = "";

    mallItems.forEach((id) => {
        const item = ITEMS[id];
        if (!item) return;

        let stockDisplay = "";
        if (item.invKey) {
            stockDisplay = `<div class="text-[8px] text-blue-300">x<span id="shop-stock-${id}">${state.inv[item.invKey]}</span></div>`;
        }

        let iconHtml = "";
        if (item.img) iconHtml = `<img class="w-6 h-6" src="${item.img}">`;
        else if (item.icon) iconHtml = `<span class="material-symbols-outlined ${item.iconColor || 'text-gray-400'}">${item.icon}</span>`;

        const finalPrice = getPrice(getItemPrice(id));
        const priceColor = state.money >= finalPrice ? "text-yellow-400" : "text-red-500";

        html += `
        <div class="bg-slate-800 p-2 rounded border border-slate-700 hover:border-yellow-500 cursor-pointer flex items-center gap-2 relative group" onclick="buyItem('${id}')" title="${item.desc}">
            ${iconHtml}
            <div class="flex-1 text-xs">${item.name}</div>
            <div class="shop-price-text ${priceColor} text-xs" data-id="${id}">${finalPrice.toLocaleString('de-DE')}$</div>
            ${stockDisplay}
            <button onclick="showItemInfo('${id}', event)" class="w-4 h-4 rounded-full bg-slate-600 hover:bg-slate-500 text-white text-[8px] flex items-center justify-center border border-slate-500 shrink-0 z-10 ml-1" title="Info">i</button>
        </div>`;
    });

    mallContent.innerHTML = html;
}


function renderPokedex() {
    const g = document.getElementById('pokedex-grid');
    g.innerHTML = "";
    document.getElementById('pokedex-count').innerText = state.pokedex.length;
    
    // Find next milestone
    let nextM = MILESTONES.find(m => m.count > state.pokedex.length);
    document.getElementById('next-milestone-text').innerText = nextM ? `Prochain: ${nextM.count} (${nextM.title})` : "COMPLET !";

    for(let i=1; i<=151; i++) {
        const caught = state.pokedex.includes(i);
        const div = document.createElement('div');
        div.className = `aspect-square rounded border flex items-center justify-center relative ${caught ? 'bg-slate-700 border-slate-500' : 'bg-slate-900 border-slate-800'}`;
        
        if(caught) {
            div.innerHTML = `<img src="${getSprite(i)}" class="w-full h-full object-contain"><div class="absolute bottom-0 right-1 text-[8px] text-white font-mono">#${i}</div>`;
        } else {
            div.innerHTML = `<div class="text-slate-700 font-bold text-xl">#${i}</div>`;
        }
        g.appendChild(div);
    }
}







