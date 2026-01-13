// --- GAME MODULE ---

function attemptCatch(type) {
    if(enemy.dead || enemy.catchRate === 0) { showFeedback("IMPOSSIBLE !", "red"); return; }
    if(enemy.isCatching) return;

    if(type === 'poke' && state.inv.balls <= 0) { showFeedback("PLUS DE BALLS !", "red"); return; }
    if(type === 'super' && state.inv.superballs <= 0) { showFeedback("PLUS DE SUPERBALLS !", "red"); return; }
    if(type === 'hyper' && state.inv.hyperballs <= 0) { showFeedback("PLUS D'HYPERBALLS !", "red"); return; }
    if(type === 'master' && state.inv.masterball <= 0) { showFeedback("PLUS DE MASTERBALLS !", "red"); return; }

    const captureUid = enemy.uid;
    enemy.isCatching = true;

    if(type === 'poke') state.inv.balls--; 
    else if(type === 'super') state.inv.superballs--;
    else if(type === 'hyper') state.inv.hyperballs--;
    else if(type === 'master') state.inv.masterball--;
    updateUI(); renderBag();

    let ballMult = type === 'super' ? 2 : 1;
    if(type === 'hyper') ballMult = 4;
    if(type === 'master') ballMult = 255;

    // 1. Base (Taux officiel 0-255)
    let baseChance = enemy.catchRate / 255;

    // 2. Bonus de Santé (Formule Gen 3)
    let hpFactor = ((3 * enemy.maxHp) - (2 * enemy.hp)) / (3 * enemy.maxHp);

    // 3. Pénalité de Niveau
    let levelPenalty = 1 + (enemy.level / 25);

    // 4. Calcul Final
    let chance = (baseChance * hpFactor * ballMult) / levelPenalty;

    if(hasBadge("Marais")) chance *= 1.3;

    // 5. Vérification Masterball
    if (ballMult >= 255) chance = 1;

    const img = document.getElementById('enemy-sprite');
    img.classList.remove('pokemon-float'); 
    img.classList.add('catching');

    setTimeout(() => {
        enemy.isCatching = false;
        if(enemy.uid !== captureUid) return; // Timer killed enemy during animation
        if(Math.random() < chance) {
            stopBossTimer();
            resumeAutoBattle();
            enemy.dead = true;
            playTone('catch');
            let cleanName = enemy.name.replace(/\s*\(.*\)/,""); // Remove (Géant) etc
            addToPokedex(enemy.id);
            
            if(state.team.length < 6) { 
                addToTeam(enemy.id, cleanName, enemy.level, enemy.isShiny, enemy.gender); 
                showFeedback("CAPTURÉ !", "yellow"); 
            } else { 
                addToPC(enemy.id, cleanName, enemy.level, enemy.isShiny, enemy.gender); 
                showFeedback("ENVOYÉ AU PC", "blue"); 
            }
            
            let gold = calculateGoldReward(enemy);
            if(hasBadge("Prisme")) gold = Math.floor(gold * 1.2);
            if(enemy.isShiny) gold *= 5;
            state.money += gold * 2;

            if(enemy.isShiny) {
                state.inv.candy += 5;
                showFeedback("SHINY! +5 BONBONS", "purple");
            }
            
            if(enemy.isBoss) {
                checkBadges();
                if(state.zoneIdx===state.unlockedZone && state.zoneIdx<getActiveRegion().zones.length-1) { 
                    state.unlockedZone++; renderShop(); renderPC(); 
                }
                state.subStage = 1;
            } else { 
                if(state.subStage < 10) state.subStage++; 
            }
            
            updateUI(); updateZone();
            img.style.opacity = '0';
            setTimeout(() => { 
                spawnEnemy(); 
                img.style.opacity='1'; 
                img.classList.remove('catching'); 
                img.classList.add('pokemon-float'); 
            }, 1000);
        } else {
            img.classList.remove('catching'); 
            img.classList.add('pokemon-float');
            showFeedback("ÉCHAPPÉ !", "red");
        }
    }, 1000);
}


function getCatchChance(ballType) {
    if (enemy.dead || enemy.catchRate === 0) return 0;
    let ballMult = ballType === 'super' ? 2 : ballType === 'hyper' ? 4 : 1;
    if(ballType === 'master') ballMult = 255;

    let baseChance = enemy.catchRate / 255;
    let hpFactor = ((3 * enemy.maxHp) - (2 * enemy.hp)) / (3 * enemy.maxHp);
    let levelPenalty = 1 + (enemy.level / 25);
    let chance = (baseChance * hpFactor * ballMult) / levelPenalty;

    if(hasBadge("Marais")) chance *= 1.3;
    if (ballMult >= 255) chance = 1;
    return Math.min(chance, 1) * 100;
}


function showCatchTooltip() {
    if(!state.cheat) return;
    const t = document.getElementById('catch-tooltip');
    t.innerHTML = `
        <div class="text-[10px] font-bold text-gray-400 border-b border-gray-600 mb-1 pb-1">TAUX DE CAPTURE</div>
        <div class="flex justify-between gap-3"><span class="text-red-400 font-bold">Poké</span> <span class="font-mono">${getCatchChance('poke').toFixed(1)}%</span></div>
        <div class="flex justify-between gap-3"><span class="text-blue-400 font-bold">Super</span> <span class="font-mono">${getCatchChance('super').toFixed(1)}%</span></div>
        <div class="flex justify-between gap-3"><span class="text-yellow-400 font-bold">Hyper</span> <span class="font-mono">${getCatchChance('hyper').toFixed(1)}%</span></div>
    `;
    t.classList.remove('hidden');
}


function hideCatchTooltip() {
    document.getElementById('catch-tooltip').classList.add('hidden');
}




