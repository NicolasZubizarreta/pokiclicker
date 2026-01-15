// --- MODULE ---

function initShinyTokenUse() {
    if(state.inv.shinyToken <= 0) return;
    state.shinyTokenMode = true;
    state.candyMode = false;
    state.stoneMode = false;
    state.stoneType = null;
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.swapIdx = null;
    showFeedback("SÉLECTIONNEZ UN POKÉMON", "yellow");
    renderTeam();
}


function useShinyTokenOn(i) {
    const p = state.team[i];
    if (p.isShiny) { showFeedback("DÉJÀ SHINY !", "red"); return; }
    if(confirm(`Utiliser un Jeton Shiny sur ${p.name} ?`)) {
        state.inv.shinyToken--;
        p.isShiny = true;
        p.img = getSprite(p.id, true);
        state.shinyTokenMode = false;
        playTone('up'); showFeedback("SHINY !!!", "purple");
        renderTeam(); renderBag(); updateUI();
    }
}


function useRepel() {
    if(state.inv.repel > 0) {
        state.inv.repel--;
        const now = Date.now();
        state.repelEndTime = (state.repelEndTime > now ? state.repelEndTime : now) + 30000;
        showFeedback("REPOUSSE ACTIF !", "gray");
        renderBag();
        updateActiveEffects();
    }
}


function useXAttack() {
    if(state.inv.xAttack > 0) {
        state.inv.xAttack--;
        const now = Date.now();
        state.attackBoostEndTime = (state.attackBoostEndTime > now ? state.attackBoostEndTime : now) + 30000;
        showFeedback("ATTAQUE + ACTIF !", "red");
        renderBag();
        updateActiveEffects();
    }
}


function useXSpecial() {
    if(state.inv.xSpecial > 0) {
        state.inv.xSpecial--;
        const now = Date.now();
        state.dpsBoostEndTime = (state.dpsBoostEndTime > now ? state.dpsBoostEndTime : now) + 30000;
        showFeedback("DPS x2 ACTIF !", "blue");
        renderBag();
        updateActiveEffects();
    }
}


function useSuperRepel() {
    if(state.inv.superRepel > 0) {
        state.inv.superRepel--;
        const now = Date.now();
        state.superRepelEndTime = (state.superRepelEndTime > now ? state.superRepelEndTime : now) + 30000;
        showFeedback("SUPER REPOUSSE !", "gray");
        renderBag();
        updateActiveEffects();
    }
}


function usePokeDoll() {
    if(state.inv.pokeDoll > 0) {
        if(state.unlockedZone > state.zoneIdx) {
            state.inv.pokeDoll--;
            state.subStage = 10;
            spawnEnemy();
            showFeedback("BOSS INVOQUÉ !", "purple");
            renderBag();
        } else {
            showFeedback("BOSS NON VAINCU !", "red");
        }
    }
}


function useFalseSwipe() {
    if (!state.upgrades.falseSwipe) return;
    const now = Date.now();
    if (enemy.isBoss) {
        showFeedback("INUTILE SUR UN BOSS !", "red");
        return;
    }
    if (state.falseSwipeCooldown > now) return;
    
    enemy.isFalseSwiped = true;
    state.falseSwipeCooldown = now + 30000; // 30s cooldown
    
    showFeedback("FAUCHAGE ACTIF !", "red");
    updateFalseSwipeBtn();
}


function initCandyUse() {
    if(state.inv.candy <= 0) return;
    state.candyMode = true;
    state.shinyTokenMode = false;
    state.calciumMode = false;
    state.stoneMode = false;
    state.stoneType = null;
    state.candyTargetIdx = null;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    showFeedback("SÉLECTIONNEZ UN POKÉMON", "blue");
    renderTeam();
}


function onTeamClick(i, event) {
    if (state.daycareMode && state.daycareMode.active) {
        depositToDaycare('team', i);
        return;
    }
    if (state.swapIdx !== null) {
        confirmSwap(i);
        return;
    }
    if (state.candyMode || state.calciumMode || state.shinyTokenMode || state.everstoneMode || state.stoneMode) {
        handleTeamClick(i);
        return;
    }
    openContextMenu('team', i, event);
}

function handleTeamClick(i) {
    if (state.daycareMode && state.daycareMode.active) {
        depositToDaycare('team', i);
    } else if(state.swapIdx !== null) {
        confirmSwap(i);
    } else if (state.candyMode) {
        if(state.team[i].level >= 100) {
            showFeedback("NIVEAU MAX !", "red");
            return;
        }
        state.candyTargetIdx = i;
        state.candyAmount = 1;
        renderTeam();
        } else if (state.calciumMode) {
        const p = state.team[i];
        if (!p || p.isEgg) { showFeedback("POKÉMON INVALIDE !", "red"); return; }
        if ((p.calciumBoosts || 0) >= 10) { showFeedback("LIMITE ATTEINTE !", "red"); return; }
        state.calciumTargetIdx = i;
        state.calciumAmount = 1;
        renderTeam();
        return;
    } else if (state.shinyTokenMode) {
        useShinyTokenOn(i);
    } else if (state.everstoneMode) {
        useEverstoneOn(i);
    } else if (state.stoneMode) {
        useStoneOn(i);
    }
}


function adjustCandyAmount(delta) {
    if (state.candyTargetIdx === null) return;
    const p = state.team[state.candyTargetIdx];
    const maxUse = Math.min(state.inv.candy, 100 - p.level);
    
    let newAmt = state.candyAmount + delta;
    if (newAmt < 1) newAmt = 1;
    if (newAmt > maxUse) newAmt = maxUse;
    
    state.candyAmount = newAmt;
    renderTeam();
}


function confirmCandyUse() {
    if (state.candyTargetIdx === null) return;
    const i = state.candyTargetIdx;
    const p = state.team[i];
    const count = state.candyAmount;

    if(count > 0 && state.inv.candy >= count) {
        state.inv.candy -= count;
        p.level += count;
        p.maxXp = calcMaxXp(p.id, p.level);
        playTone('up');
        showFeedback(`+${count} NIVEAUX !`, "green");

        state.candyMode = false;
        state.candyTargetIdx = null;
        updateUI(); renderBag(); renderTeam();
    }
}

function cancelCandyUse() {
    state.candyMode = false;
    state.candyTargetIdx = null;
    renderTeam();
}
function adjustCalciumAmount(delta) {
    if (state.calciumTargetIdx === null) return;
    const p = state.team[state.calciumTargetIdx];
    const maxUse = Math.min(state.inv.calcium, 10 - (p.calciumBoosts || 0));

    let newAmt = state.calciumAmount + delta;
    if (newAmt < 1) newAmt = 1;
    if (newAmt > maxUse) newAmt = maxUse;

    state.calciumAmount = newAmt;
    renderTeam();
}

function confirmCalciumUse() {
    if (state.calciumTargetIdx === null) return;
    const i = state.calciumTargetIdx;
    const p = state.team[i];
    const maxUse = Math.min(state.inv.calcium, 10 - (p.calciumBoosts || 0));
    const count = Math.min(state.calciumAmount, maxUse);

    if (count <= 0) return;

    state.inv.calcium -= count;
    p.calciumBoosts = (p.calciumBoosts || 0) + count;
    showFeedback(`+${count * 2}% DPS PERMANENT`, "green");

    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;

    renderTeam(); renderBag(); updateUI();
    if (state.summaryPokemon && state.summaryPokemon.location === "team" && state.summaryPokemon.index === i) {
        showPokemonSummary('team', i);
    }
}

function cancelCalciumUse() {
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    renderTeam();
}


function initEverstoneUse() {
    const hasEquippedEverstone = state.team.some(p => p.everstone);
    if (state.inv.everstone <= 0 && !hasEquippedEverstone) return;
    state.everstoneMode = true;
    state.candyMode = false;
    state.shinyTokenMode = false;
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.stoneMode = false;
    state.stoneType = null;
    state.swapIdx = null;
    showFeedback("SÉLECTIONNEZ UN POKÉMON", "gray");
    renderTeam();
}

function cancelItemModes() {
    if (!state) return;
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
    renderTeam();
}


function useEverstoneOn(i) {
    const p = state.team[i];
    if (!p || p.isEgg) { showFeedback("POKÉMON INVALIDE !", "red"); return; }

    if (p.everstone) {
        showFeedback("RETIREZ VIA LE MENU !", "red");
        state.everstoneMode = false;
        renderTeam();
        return;
    }

    if (state.inv.everstone <= 0) { showFeedback("PLUS DE PIERRE STASE !", "red"); return; }

    const stage = getEvolutionStage(p.id);
    const canEvolve = canEvolveAny(p.id);
    if (stage !== 1 || !canEvolve) { showFeedback("POKÉMON INCOMPATIBLE !", "red"); return; }

    state.inv.everstone--;
    p.everstone = true;
    state.everstoneMode = false;
    showFeedback("PIERRE STASE ÉQUIPÉE !", "gray");
    renderTeam(); renderBag(); updateUI();
}

function getStoneEvolution(pokeId, stoneId) {
    const evo = STONE_EVOLUTIONS[pokeId];
    if (!evo) return null;
    if (Array.isArray(evo)) return evo.find(entry => entry.stone === stoneId) || null;
    return evo.stone === stoneId ? evo : null;
}

function initStoneUse(stoneId) {
    const item = ITEMS[stoneId];
    if (!item) return;
    if (state.inv[item.invKey] <= 0) return;
    state.stoneMode = true;
    state.stoneType = stoneId;
    state.candyMode = false;
    state.shinyTokenMode = false;
    state.everstoneMode = false;
    state.calciumMode = false;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.swapIdx = null;
    showFeedback("SÉLECTIONNEZ UN POKÉMON", "yellow");
    renderTeam();
}

function initCalciumUse() {
    if (state.inv.calcium <= 0) return;
    state.calciumMode = true;
    state.candyMode = false;
    state.shinyTokenMode = false;
    state.everstoneMode = false;
    state.stoneMode = false;
    state.stoneType = null;
    state.calciumTargetIdx = null;
    state.calciumAmount = 1;
    state.swapIdx = null;
    showFeedback("SÉLECTIONNEZ UN POKÉMON", "yellow");
    renderTeam();
}


function useStoneOn(i) {
    const p = state.team[i];
    if (!p || p.isEgg) { showFeedback("POKÉMON INVALIDE !", "red"); return; }
    if (p.everstone) { showFeedback("PIERRE STASE ÉQUIPÉE !", "red"); return; }

    const stoneId = state.stoneType;
    const item = ITEMS[stoneId];
    if (!item || state.inv[item.invKey] <= 0) { showFeedback("PLUS DE PIERRE !", "red"); return; }

    const evo = getStoneEvolution(p.id, stoneId);
    if (!evo) { showFeedback("POKÉMON INCOMPATIBLE !", "red"); return; }

    if (confirm(`Utiliser ${item.name} sur ${p.name} ?`)) {
        state.inv[item.invKey]--;
        state.stoneMode = false;
        state.stoneType = null;
        evolveWithStone(p, evo);
        renderBag(); updateUI();
    }
}

document.addEventListener('click', (e) => {
    if (typeof state === 'undefined') return;
    if (!state.candyMode && !state.calciumMode && !state.shinyTokenMode && !state.everstoneMode && !state.stoneMode) return;
    if (e.target.closest('#team-container') || e.target.closest('#bag-container') ||
        e.target.closest('#mobile-team-view') || e.target.closest('#mobile-bag-view')) {
        return;
    }
    cancelItemModes();
});







