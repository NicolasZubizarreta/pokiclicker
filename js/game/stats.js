// --- GAME MODULE ---

function getPower(id) {
    const atk = BASE_STATS[id] || 40;
    const hp = BASE_HP[id] || 40;
    return atk + hp;
}


function calcMaxXp(id, level) {
    const power = getPower(id);
    // Tier : Faible (0.8), Fort (1.2), Moyen (1.0)
    let tier = (power < 100) ? 0.8 : (power > 180) ? 1.2 : 1.0;
    return Math.floor(50 * Math.pow(level, 2.2) * tier);
}


function calculateGoldReward(enemy) {
    // Formule : Base linéaire + légère courbe.
    // Niv 5 = ~25$ | Niv 20 = ~120$ | Niv 50 = ~500$
    let baseReward = (enemy.level * 4) + Math.pow(enemy.level, 1.4);
    
    // Bonus de rareté
    if (enemy.isBoss) baseReward *= 10;
    else if (enemy.rarity === "Rare" || enemy.rarity === "Très Rare") baseReward *= 3;
    else if (enemy.rarity === "Légendaire") baseReward *= 20;

    // Bonus Item (Pièce Rune)
    if (state.upgrades.amuletCoin) baseReward *= 1.3;

    return Math.floor(baseReward);
}


function getTypes(id) {
    return PKMN_TYPES[id] || ["Normal"];
}


function getMultiplier(atkId, defId) {
    if(!defId) return 1;
    const atkTypes = getTypes(atkId); // Check all attack types
    const defTypes = getTypes(defId);
    
    // On prend le meilleur multiplicateur parmi les types de l'attaquant (Simule le choix de la meilleure attaque)
    let bestMult = 0;
    
    atkTypes.forEach(aType => {
        let currentMult = 1;
        defTypes.forEach(dType => {
            if(TYPE_CHART[aType] && TYPE_CHART[aType][dType] !== undefined) {
                currentMult *= TYPE_CHART[aType][dType];
            }
        });
        if(currentMult > bestMult) bestMult = currentMult;
    });
    return bestMult;
}


function hasBadge(name) { return state.badges.includes(name); }


function hasMilestone(c) { return state.milestones.includes(c); }


function getDPS(targetId) { 
    let dps = state.team.reduce((s,p) => {
        if (p.isEgg) return s;
        let m = targetId ? getMultiplier(p.id, targetId) : 1;
        
        // Easter Egg: Johnny
        if (targetId && p.name === "Johnny" && getTypes(targetId).includes("Dark")) {
            m *= 1.5;
        }

        let shinyBonus = p.isShiny ? 1.5 : 1; // Shiny deals x1.5 damage
        let happyMult = 1 + ((p.happiness || 0) * 0.001); // +0.1% per happiness
        let everstoneBonus = p.everstone ? 1.25 : 1;
        let baseStat = BASE_STATS[p.id] || 40; // Fallback if ID missing
        let rawDmg = (baseStat * p.level) / 5;
        return s + (rawDmg * m * shinyBonus * happyMult * everstoneBonus);
    }, 0); 
    
    if(hasMilestone(30)) dps *= 1.5;
    if(hasMilestone(90)) dps *= 1.5;
    if(hasBadge("Cascade")) dps *= 1.3;
    if(hasBadge("Foudre")) dps *= 1.2;
    if(hasBadge("Volcan")) dps *= 1.5;
    if(Date.now() < state.dpsBoostEndTime) dps *= 1.5;
    return dps;
}


function getClick() { 
    let dmg = 5 + Math.floor(getDPS(enemy.id)*0.002);
    if(hasMilestone(10)) dmg *= 2;
    if(hasMilestone(90)) dmg *= 1.5;
    if(state.upgrades.protein) dmg = Math.floor(dmg * 1.5);
    if(state.upgrades.hardStone) dmg = Math.floor(dmg * 1.3);
    if(hasBadge("Roche")) dmg = Math.floor(dmg * 1.5);
    if(hasBadge("Foudre")) dmg = Math.floor(dmg * 1.2);
    if(hasBadge("Volcan")) dmg *= 1.5;
    if(Date.now() < state.attackBoostEndTime) dmg *= 1.5;
    return state.cheat ? 999999 : dmg; 
}


function getEvolutionStage(id) {
    const findPreEvo = (targetId) => {
        for (const [k, v] of Object.entries(EVOLUTIONS)) {
            const keyId = parseInt(k);
            if (Array.isArray(v.id)) {
                if (v.id.includes(targetId)) return keyId;
            } else {
                if (v.id === targetId) return keyId;
            }
        }
        for (const [k, v] of Object.entries(STONE_EVOLUTIONS)) {
            const keyId = parseInt(k);
            if (Array.isArray(v)) {
                if (v.some(child => child.id === targetId)) return keyId;
            } else if (v.id === targetId) {
                return keyId;
            }
        }
        return null;
    };
    let preEvo = findPreEvo(id);
    if (preEvo) {
        if (findPreEvo(preEvo)) return 3;
        return 2;
    }
    return 1;
}


