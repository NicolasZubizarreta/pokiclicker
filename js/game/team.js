// --- MODULE ---

function addToTeam(id,n,l,s,g) { 
    const maxXp = calcMaxXp(id, l);
    state.team.push({id:id, name:n, level:l, isShiny:s, gender:g, happiness:0, xp:0, maxXp:maxXp, uid:Date.now() + Math.random(), img:getSprite(id, s), isFavorite:false, calciumBoosts:0}); 
    renderTeam(); 
}

function addToPC(id,n,l,s,g) { 
    const maxXp = calcMaxXp(id, l);
    state.pc.push({id:id, name:n, level:l, isShiny:s, gender:g, happiness:0, xp:0, maxXp:maxXp, uid:Date.now() + Math.random(), img:getSprite(id, s), isFavorite:false, calciumBoosts:0}); 
    renderPC(); 
}


function addToPokedex(id) {
    if(!state.pokedex.includes(id)) {
        state.pokedex.push(id);
        checkMilestones();
    }
}

function canEvolveAny(id) {
    return EVOLUTIONS[id] !== undefined || STONE_EVOLUTIONS[id] !== undefined;
}

function getBaseForm(id) {
    // Build reverse map lazily
    if (!window.PRE_EVO_MAP) {
        window.PRE_EVO_MAP = {};
        for (const [k, v] of Object.entries(EVOLUTIONS)) {
            const parent = parseInt(k);
            if (Array.isArray(v.id)) {
                v.id.forEach(child => window.PRE_EVO_MAP[child] = parent);
            } else {
                window.PRE_EVO_MAP[v.id] = parent;
            }
        }
        for (const [k, v] of Object.entries(STONE_EVOLUTIONS)) {
            const parent = parseInt(k);
            if (Array.isArray(v)) {
                v.forEach(child => window.PRE_EVO_MAP[child.id] = parent);
            } else {
                window.PRE_EVO_MAP[v.id] = parent;
            }
        }
    }
    let current = id;
    while (window.PRE_EVO_MAP[current]) {
        current = window.PRE_EVO_MAP[current];
    }
    return current;
}


function countActivePokemon() {
    return state.team.filter(p => !p.isEgg).length;
}


function getPokemonDps(p, targetId) {
    if (!p) return 0;
    if (p.isEgg) return 0; // Eggs deal no damage
    let m = targetId ? getMultiplier(p.id, targetId) : 1;
    
    if (targetId && p.name === "Johnny" && getTypes(targetId).includes("Dark")) {
        m *= 1.5;
    }

    let shinyBonus = p.isShiny ? 1.5 : 1;
    let happyMult = 1 + ((p.happiness || 0) * 0.001);
    let everstoneBonus = p.everstone ? 1.25 : 1;
    let baseStat = BASE_STATS[p.id] || 40;
    let rawDmg = (baseStat * p.level) / 5;
    let calciumMult = 1 + ((p.calciumBoosts || 0) * 0.02);
    return rawDmg * m * shinyBonus * happyMult * everstoneBonus * calciumMult;
}


function updateTeamStats() {
    state.team.forEach(p => {
        const elements = document.querySelectorAll(`[data-uid='${p.uid}']`);
        if (elements.length === 0) return;

        const isEgg = p.isEgg;
        const xpPct = isEgg ? Math.min(100, (p.hatchSteps / p.maxSteps) * 100) : (p.level >= 100 ? 100 : Math.min(100, (p.xp / p.maxXp) * 100));
        
        const mult = !enemy.dead ? getMultiplier(p.id, enemy.id) : 1;
        const multColor = mult > 1 ? "text-green-400" : mult < 1 ? "text-red-400" : "text-gray-400";
        const shinyDpsMult = p.isShiny ? 1.5 : 1;
        const happyMult = isEgg ? 1 : 1 + ((p.happiness || 0) * 0.001);
        const everstoneBonus = p.everstone ? 1.25 : 1;
        let baseStat = BASE_STATS[p.id] || 40;
        let rawDmg = (baseStat * p.level) / 5;
        let calciumMult = 1 + ((p.calciumBoosts || 0) * 0.02);
        const dpsValue = (rawDmg * mult * shinyDpsMult * happyMult * everstoneBonus * calciumMult).toFixed(1);
        const genderSymbol = p.gender === 'male' ? '<span class="text-blue-400 text-[10px] ml-1 font-bold">♂</span>' : (p.gender === 'female' ? '<span class="text-pink-400 text-[10px] ml-1 font-bold">♀</span>' : '');

        elements.forEach(el => {
            const xpBar = el.querySelector('.team-xp-bar');
            const dpsText = el.querySelector('.team-dps-text');
            const levelText = el.querySelector('.team-level-text');
            
            if (xpBar) {
                xpBar.style.width = xpPct + '%';
            }
            if (dpsText) {
                if (isEgg) {
                    dpsText.innerHTML = `<span class="text-gray-400">Éclosion: ${p.hatchSteps}/${p.maxSteps}</span>`;
                } else {
                    dpsText.innerHTML = `DPS: ${dpsValue} <span class="${multColor} text-[8px]">x${mult}</span>${genderSymbol}`;
                }
            }
            if (levelText) {
                if (isEgg) levelText.innerText = '';
                else levelText.innerText = `Lv.${p.level}`;
            }
        });
    });
}


