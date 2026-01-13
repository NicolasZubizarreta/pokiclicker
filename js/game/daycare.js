// --- DAYCARE SYSTEM ---

function exitDaycare() {
    state.daycareMode = { active: false, slotIdx: null };
    renderTeam(); renderPC();
    changeZone(1); // Go back to Zone 0 (Pallet Town)
}

function selectDaycareParent(slotIdx) {
    if (state.daycare.parents[slotIdx]) {
        // Withdraw
        if (state.team.length < 6) {
            state.team.push(state.daycare.parents[slotIdx]);
            state.daycare.parents[slotIdx] = null;
            playTone('pc');
            renderDaycare();
            renderTeam();
        } else {
            state.pc.push(state.daycare.parents[slotIdx]);
            state.daycare.parents[slotIdx] = null;
            playTone('pc');
            showFeedback("RENVOYÉ AU PC", "blue");
            renderDaycare();
        }
    } else {
        // Activate Selection Mode
        if (state.daycareMode.active && state.daycareMode.slotIdx === slotIdx) {
            // Cancel if clicking same slot
            state.daycareMode = { active: false, slotIdx: null };
            renderTeam(); renderPC();
        } else {
            state.daycareMode = { active: true, slotIdx: slotIdx };
            state.candyMode = false;
            state.shinyTokenMode = false;
            state.swapIdx = null;
            showFeedback("SÉLECTIONNEZ UN POKÉMON (ÉQUIPE OU PC)", "blue");
            renderTeam();
            renderPC();
        }
    }
}

function depositToDaycare(source, index) {
    if (!state.daycareMode || !state.daycareMode.active) return;
    
    const slot = state.daycareMode.slotIdx;
    let p;
    
    if (source === 'team') {
        if (state.team.length <= 1) { showFeedback("IMPOSSIBLE (DERNIER POKÉMON)", "red"); return; }
        if (countActivePokemon() <= 1 && !state.team[index].isEgg) { showFeedback("IL FAUT 1 POKÉMON ACTIF !", "red"); return; }
        p = state.team.splice(index, 1)[0];
    } else {
        p = state.pc.splice(index, 1)[0];
    }
    
    state.daycare.parents[slot] = p;
    state.daycareMode = { active: false, slotIdx: null };
    
    playTone('pc');
    renderDaycare();
    renderTeam();
    renderPC();
    updateUI();
}

function checkDaycareCompatibility() {
    const [p1, p2] = state.daycare.parents;
    if (!p1 || !p2) return 0;

    const isDitto1 = p1.id === 132;
    const isDitto2 = p2.id === 132;

    // Case: Ditto + Ditto
    if (isDitto1 && isDitto2) return 0.04;

    // Case: One Ditto
    if (isDitto1 || isDitto2) return 0.04;

    // Case: Standard (M+F)
    if (p1.gender !== 'genderless' && p2.gender !== 'genderless' && p1.gender !== p2.gender) {
        const base1 = getBaseForm(p1.id);
        const base2 = getBaseForm(p2.id);
        
        if (base1 === base2) return 0.04; // Same Species
        
        // Check Types
        const t1 = getTypes(p1.id);
        const t2 = getTypes(p2.id);
        const shareType = t1.some(t => t2.includes(t));
        
        if (shareType) return 0.02;
    }

    return 0;
}

function processDaycare() {
    if (!state.daycare.unlocked) return;
    
    // Egg Laying
    if (state.daycare.eggs.length < state.daycare.slots) {
        const chance = checkDaycareCompatibility();
        if (chance > 0 && Math.random() < chance) {
            // Generate Egg
            const [p1, p2] = state.daycare.parents;
            let speciesId;
            
            if (p1.id === 132 && p2.id === 132) {
                // Random Base
                let rndId = Math.floor(Math.random() * 151) + 1;
                speciesId = getBaseForm(rndId);
            } else if (p1.id === 132) {
                speciesId = getBaseForm(p2.id);
            } else if (p2.id === 132) {
                speciesId = getBaseForm(p1.id);
            } else {
                // Mother's species
                speciesId = p1.gender === 'female' ? getBaseForm(p1.id) : getBaseForm(p2.id);
            }

            const isShiny = Math.random() < 0.125; // 1/8
            state.daycare.eggs.push({
                speciesId: speciesId,
                isShiny: isShiny,
                ticks: 0,
                maxTicks: 25,
                hatched: false
            });
            if (state.zoneIdx === -1) renderDaycare();
        }
    }
}

function withdrawEgg(idx) {
    const egg = state.daycare.eggs[idx];
    if (!egg) return;

    // Gender
    let gender = Math.random() < 0.5 ? 'male' : 'female';
    if (GENDERLESS_IDS.includes(egg.speciesId)) gender = 'genderless';
    else if (ALWAYS_MALE_IDS.includes(egg.speciesId)) gender = 'male';
    else if (ALWAYS_FEMALE_IDS.includes(egg.speciesId)) gender = 'female';
    
    // Create Egg Object for Team
    const eggObj = {
        id: egg.speciesId,
        name: "Oeuf",
        level: 1,
        isShiny: egg.isShiny,
        gender: gender,
        happiness: 0,
        xp: 0,
        maxXp: calcMaxXp(egg.speciesId, 1),
        uid: Date.now() + Math.random(),
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png",
        isFavorite: false,
        isEgg: true,
        hatchSteps: 0,
        maxSteps: 25
    };

    if (state.team.length < 6) {
        state.team.push(eggObj);
        showFeedback("OEUF RÉCUPÉRÉ !", "green");
    } else {
        state.pc.push(eggObj);
        showFeedback("OEUF -> PC", "blue");
    }
    
    playTone('up');
    state.daycare.eggs.splice(idx, 1);
    addToPokedex(egg.speciesId);
    renderDaycare();
}

function buyEggSlot() {
    if (state.daycare.slots >= 5) return;
    const cost = (state.daycare.slots) * 5000; // 1->2 (5k), 2->3 (10k)...
    if (state.money >= cost) {
        state.money -= cost;
        state.daycare.slots++;
        playTone('coin');
        renderDaycare();
        updateUI();
    } else {
        showFeedback("PAS ASSEZ D'ARGENT", "red");
    }
}

function renderDaycare() {
    // Parents
    [0, 1].forEach(i => {
        const p = state.daycare.parents[i];
        const el = document.getElementById(`daycare-parent-${i}`);
        if (p) {
            let displayImg = p.img;
            let specialClass = "";
            const pNameLower = p.name.toLowerCase();
            if (pNameLower === "dinnerbone" || pNameLower === "grumm") specialClass = "upside-down";
            if (pNameLower === "jeb_") specialClass = "rainbow-anim";
            if (pNameLower === "caca") specialClass = "caca-filter";
            if (pNameLower === "daran") displayImg = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;

            el.innerHTML = `<img src="${displayImg}" class="w-16 h-16 md:w-32 md:h-32 object-contain pokemon-float ${specialClass}"><div class="text-[10px] md:text-base font-bold text-white mt-1 text-center break-all px-1">${p.name}</div><div class="absolute top-1 right-1 text-red-500 font-bold text-lg md:text-2xl cursor-pointer hover:scale-125 transition" title="Reprendre">✕</div>`;
            el.classList.add('border-green-500', 'bg-slate-800/90');
            el.classList.remove('border-dashed', 'border-slate-500');
        } else {
            el.innerHTML = `<span class="text-[10px] md:text-base text-gray-500 mb-1">Déposer</span><span class="material-symbols-outlined text-gray-500 text-2xl md:text-5xl">add_circle</span>`;
            el.classList.remove('border-green-500', 'bg-slate-700');
            el.classList.add('border-dashed', 'border-slate-500', 'bg-slate-800/80');
        }
    });

    // Chance
    const chance = checkDaycareCompatibility();
    const chanceEl = document.getElementById('daycare-chance');
    chanceEl.innerText = `Chance de ponte: ${(chance * 100).toFixed(0)}%`;
    chanceEl.className = `text-center text-sm md:text-xl font-bold mb-4 md:mb-8 bg-black/50 px-4 py-1 rounded shrink-0 pointer-events-auto ${chance > 0 ? 'text-green-400' : 'text-red-400'}`;

    // Heart
    const heart = document.getElementById('daycare-heart');
    if (state.daycare.parents[0] && state.daycare.parents[1]) heart.classList.remove('hidden');
    else heart.classList.add('hidden');

    // Eggs
    const list = document.getElementById('daycare-eggs-list');
    list.innerHTML = '';
    
    // Render existing eggs
    state.daycare.eggs.forEach((egg, i) => {        
        list.innerHTML += `
        <div class="w-16 h-16 md:w-24 md:h-24 bg-slate-800/90 rounded-lg md:rounded-xl flex items-center justify-center border-2 md:border-4 border-yellow-500 cursor-pointer hover:scale-110 transition shadow-lg relative group" onclick="withdrawEgg(${i})" title="Récupérer l'œuf">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png" class="w-8 h-8 md:w-12 md:h-12 animate-bounce">
            <div class="absolute -bottom-2 bg-green-600 text-white text-[8px] md:text-[10px] font-bold px-1 py-0.5 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">PRENDRE</div>
        </div>`;
    });

    // Render empty/buyable slots
    for (let i = state.daycare.eggs.length; i < 5; i++) {
        if (i < state.daycare.slots) {
            list.innerHTML += `
            <div class="w-16 h-16 md:w-24 md:h-24 bg-slate-800/50 rounded-lg md:rounded-xl flex items-center justify-center border-2 md:border-4 border-dashed border-slate-600">
                <span class="text-[8px] md:text-[10px] text-gray-600">Vide</span>
            </div>`;
        } else {
            const cost = (i) * 5000;
            const canBuy = state.money >= cost;
            list.innerHTML += `
            <div class="w-16 h-16 md:w-24 md:h-24 bg-slate-900/80 rounded-lg md:rounded-xl flex flex-col items-center justify-center border-2 md:border-4 border-slate-700 opacity-70 hover:opacity-100 cursor-pointer transition" onclick="buyEggSlot()">
                <span class="material-symbols-outlined text-gray-500 text-lg md:text-2xl">lock</span>
                <div class="text-[8px] md:text-[10px] text-yellow-500 font-bold mt-1">${cost/1000}k$</div>
            </div>`;
        }
    }
}



