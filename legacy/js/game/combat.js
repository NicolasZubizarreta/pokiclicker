// --- GAME MODULE ---

function getChenStarterId() {
    if (state.starterId === 1) return 9;
    if (state.starterId === 4) return 3;
    if (state.starterId === 7) return 6;
    return 3;
}

function getChenStarterName(id) {
    if (id === 3) return "Florizarre";
    if (id === 6) return "Dracaufeu";
    if (id === 9) return "Tortank";
    return "Florizarre";
}

function getChenChallengeRoster() {
    const starterId = getChenStarterId();
    return [
        { name: "Tauros", id: 128, level: 100 },
        { name: "Noadkoko", id: 103, level: 100 },
        { name: "Arcanin", id: 59, level: 100 },
        { name: "Léviator", id: 130, level: 100 },
        { name: getChenStarterName(starterId), id: starterId, level: 100 },
        { name: "Dracolosse", id: 149, level: 100 }
    ];
}

function startBossTimer() {
    const w = document.getElementById('boss-timer-wrapper');
    const b = document.getElementById('boss-timer-bar');
    w.classList.remove('hidden');
    b.style.width = "100%";
    
    let t = 30;
    bossTimer = setInterval(() => {
        t--;
        b.style.width = (t/30*100)+"%";
        if(t<=0) {
            stopBossTimer();
            showFeedback("TEMPS ÉCOULÉ !", "red");
            if (state.zoneIdx === 20) { // League penalty: reset to start
                state.subStage = 1;
            } else if (state.zoneIdx === -2 && state.chenChallengeActive) {
                failChenChallenge();
                return;
            } else {
                state.subStage = 9;
            }
            updateZone();
            spawnEnemy();
        }
    }, 1000);
}


function stopBossTimer() {
    if(bossTimer) clearInterval(bossTimer);
    bossTimer = null;
    const w = document.getElementById('boss-timer-wrapper');
    if(w) w.classList.add('hidden');
}


function spawnEnemy() {
    stopBossTimer();
    document.getElementById('searching-msg').classList.add('hidden');
    // Don't unhide immediately, wait for image load in updateEnemyUI
    // document.getElementById('enemy-sprite').classList.remove('hidden');

    enemy.dead = false;
    enemy.isCatching = false;
    enemy.isFalseSwiped = false;
    enemy.uid = Date.now(); // Unique ID to prevent race conditions
    const z = getActiveRegion().zones[state.zoneIdx];
    const isChenChallenge = state.zoneIdx === -2 && state.chenChallengeActive && state.chenChallengeIntroSeen;

    if (isChenChallenge) {
        enemy.isBoss = true;
        const roster = getChenChallengeRoster();
        const stage = state.chenChallengeStage || 1;
        const sel = roster[Math.min(stage, roster.length) - 1];

        enemy.name = sel.name;
        enemy.rarity = "Boss";
        enemy.id = sel.id;
        enemy.catchRate = 0;
        enemy.level = sel.level;
        enemy.isShiny = false;
        startBossTimer();
        document.getElementById('enemy-info-panel').classList.remove('hidden');
    } else if (z.pokemons.length === 0) {
        // Zone Pacifique (Bourg Palette)
        document.getElementById('enemy-sprite').classList.add('hidden');
        document.getElementById('enemy-info-panel').classList.add('hidden');
        document.getElementById('boss-badge').style.display = 'none';
        enemy.dead = true;
        updateZone();
        updateUI();
        return;
    } else {
        document.getElementById('enemy-info-panel').classList.remove('hidden');
    }

    // --- LEAGUE REWORK: All encounters are bosses ---
    if (!isChenChallenge && state.zoneIdx === 21) {
        enemy.isBoss = true;
        const leaguePokemons = z.pokemons;
        let sel;

        if (state.subStage <= 9) {
            sel = leaguePokemons[state.subStage - 1];
        } else { // subStage 10 is the final boss
            sel = { ...z.boss }; // Clone to avoid modifying the constant
            if (state.starterId === 1) { sel.id = 6; sel.name = "Maître Blue (Dracaufeu)"; }
            else if (state.starterId === 4) { sel.id = 9; sel.name = "Maître Blue (Tortank)"; }
            else if (state.starterId === 7) { sel.id = 3; sel.name = "Maître Blue (Florizarre)"; }
        }
        
        enemy.name = sel.name;
        enemy.rarity = "Boss";
        enemy.id = sel.id;
        enemy.catchRate = 0;
        enemy.level = sel.level;
        enemy.isShiny = false;
        startBossTimer();

    } else if (!isChenChallenge) {
        enemy.isBoss = (state.subStage === 10);
        
        let shinyChance = 1/256;
        if(state.upgrades.shinyCharm) shinyChance *= 3;
        else if(hasMilestone(151)) shinyChance *= 2;
        if(state.cheat) shinyChance = 1;
        enemy.isShiny = !enemy.isBoss && Math.random() < shinyChance; 
        
        if(enemy.isBoss) {
            enemy.name = z.boss.name; 
            enemy.level = z.boss.level; 
            enemy.catchRate = z.boss.catchRate;
            enemy.id = z.boss.id;
            enemy.rarity = "Boss";
            startBossTimer();
        } else {
            const r = Math.random(); 
            let acc = 0; 
            
            // Repel Logic
            let pool = z.pokemons;
            if(Date.now() < state.superRepelEndTime) {
                const filtered = pool.filter(p => p.rarity !== "Commun" && p.rarity !== "Peu Commun");
                if(filtered.length > 0) pool = filtered;
            } else if(Date.now() < state.repelEndTime) {
                const filtered = pool.filter(p => p.rarity !== "Commun");
                if(filtered.length > 0) pool = filtered;
            }

            let sel = pool[0];
            for(let p of pool) { 
                acc += p.spawnRate; 
                if(r <= acc) { sel = p; break; } 
            }
            enemy.name = sel.name; 
            enemy.rarity = sel.rarity;
            enemy.id = sel.id || 25; 
            enemy.catchRate = sel.catchRate;
            enemy.level = Math.floor(Math.random()*(z.maxLevel-z.minLevel+1))+z.minLevel;
        }
    }

    // Stop auto battle for rares
    const isNew = !state.pokedex.includes(enemy.id);
    const shouldStop = state.stopOnRare && (state.autoStopSettings[enemy.rarity] || (enemy.isShiny && state.autoStopSettings.Shiny) || (isNew && !enemy.isBoss && state.autoStopSettings.Nouveau));

    if(shouldStop && (state.auto || state.autoClicker)) {
        state.interruptedState = { auto: state.auto, autoClicker: state.autoClicker };
        state.auto = false; 
        state.autoClicker = false;
        updateAutoBtn(); updateAutoClickerBtn();
        const a = document.getElementById('rare-alert'); 
        
        let msg = `${enemy.rarity.toUpperCase()} APPARU ! AUTO STOPPÉ !`;
        if (enemy.isShiny) msg = "SHINY APPARU ! AUTO STOPPÉ !";
        else if (isNew && state.autoStopSettings.Nouveau) msg = "NOUVEAU POKÉMON ! AUTO STOPPÉ !";
        
        a.firstElementChild.innerHTML = `<span class="material-symbols-outlined">warning</span> ${msg}`;
        a.classList.remove('hidden');
        setTimeout(()=>a.classList.add('hidden'), 3000);
    }

    // Gender assignment with exceptions
    if (GENDERLESS_IDS.includes(enemy.id)) {
        enemy.gender = 'genderless';
    } else if (ALWAYS_MALE_IDS.includes(enemy.id)) {
        enemy.gender = 'male';
    } else if (ALWAYS_FEMALE_IDS.includes(enemy.id)) {
        enemy.gender = 'female';
    } else {
        enemy.gender = Math.random() < 0.5 ? 'male' : 'female';
    }
    if (state.zoneIdx === 21) {
        enemy.gender = 'genderless';
    }
    // HP Scaling
    const baseHp = BASE_HP[enemy.id] || 40;
    const zoneMult = ZONE_MULT[state.zoneIdx] !== undefined ? ZONE_MULT[state.zoneIdx] : 1;
    enemy.maxHp = Math.floor((baseHp * enemy.level * 2) * zoneMult);
    if(enemy.isBoss) enemy.maxHp *= 4;
    enemy.hp = enemy.maxHp;
    updateUI();
    updateEnemyUI();
}


function damageEnemy(amt) {
    if(enemy.dead) return;
    enemy.hp -= amt;
    if(enemy.isFalseSwiped && enemy.hp < 1) enemy.hp = 1;
    if(enemy.hp <= 0) {
        enemy.hp = 0;
        killEnemy();
    }
    updateHp();
}


function killEnemy() {
    if(enemy.dead) return; 
    stopBossTimer();
    enemy.dead = true;
    state.stats.kills++;
    
    let gold = calculateGoldReward(enemy);

    if(hasBadge("Prisme")) gold = Math.floor(gold * 1.2);
    if(enemy.isShiny) {
        gold *= 5;
        state.inv.candy += 5;
        showFeedback("SHINY! +5 BONBONS", "purple");
    }

    state.money += gold;
    if(!state.stats.totalMoney) state.stats.totalMoney = 0;
    state.stats.totalMoney += gold;
    
    // XP Logic
    const baseHp = BASE_HP[enemy.id] || 40;
    // MODIFICATION : Équilibrage (* 2.2)
    let xpGain = Math.floor((baseHp * enemy.level) * 2.2);
    
    // Bonus Boss (x5) pour motiver à finir la zone
    if (enemy.isBoss) xpGain *= 5;

    if (xpGain < 1) xpGain = 1;
    if (state.upgrades.expShare) xpGain = Math.floor(xpGain * 1.5);
    if (state.upgrades.luckyEgg) xpGain = Math.floor(xpGain * 1.5);
    if (state.inv.omniExp > 0) xpGain = Math.floor(xpGain * 2);
    if(hasBadge("Âme")) xpGain = Math.floor(xpGain * 1.5);
    
    let levelUpOccurred = false;
    state.team.forEach(p => {
        if(p.level < 100 && !p.isEgg) {
            p.xp += xpGain;
            if(p.xp >= p.maxXp) {
                p.level++;
                levelUpOccurred = true;
                p.xp -= p.maxXp;
                p.maxXp = calcMaxXp(p.id, p.level);
                playTone('up');
                if(p.level >= 100) { p.level = 100; p.xp = 0; p.maxXp = 0; }
            }
        }
        
        // Happiness Gain
        if (p.happiness === undefined) p.happiness = 0;
        if (p.happiness < 255 && (p.level - enemy.level <= 25)) p.happiness++;

        // Egg Hatching Logic
        if (p.isEgg) {
            p.hatchSteps = (p.hatchSteps || 0) + 1;
            if (p.hatchSteps >= p.maxSteps) {
                p.isEgg = false;
                // Restore real name if it was "Oeuf"
                if (p.name === "Oeuf") {
                     // Try to find name in getActiveRegion().zones or EVOLUTIONS
                     let realName = "Pokémon";
                     for(const z of getActiveRegion().zones) { const f = z.pokemons.find(pk => pk.id === p.id); if(f) { realName = f.name; break; } }
                     p.name = realName;
                }
                p.img = getSprite(p.id, p.isShiny);
                p.happiness = 125; // Base happiness
                showFeedback(`${p.name} ÉCLOS !`, "green");
                playTone('up');
                addToPokedex(p.id);
            }
        }
    });

    // Daycare Tick
    processDaycare();

    playTone('coin');

    if (levelUpOccurred) {
        renderTeam();
    } else {
        // updateTeamStats(); // Removed to prevent jitter, renderTeam handles it or UI update loop
    }

    if(enemy.isBoss) {
        checkBadges();
        if (state.zoneIdx === 21) {
            // Logique Spéciale Ligue : On avance de stade en stade (tous des Boss)
            if (state.subStage < 10) {
                state.subStage++;
            } else {
                const hadLeagueWin = (state.leagueWins || 0) >= 1;
                state.leagueWins = (state.leagueWins || 0) + 1;
                state.chenChallengePending = hadLeagueWin && canTriggerChenChallenge();
                enterHallOfFame();
                state.subStage = 1;
            }
        } else if (state.zoneIdx === -2 && state.chenChallengeActive && state.chenChallengeIntroSeen) {
            const roster = getChenChallengeRoster();
            if ((state.chenChallengeStage || 1) < roster.length) {
                state.chenChallengeStage = (state.chenChallengeStage || 1) + 1;
            } else {
                startChenVictorySequence();
            }
        } else {
            // Logique Boss Classique (Fin de zone)
            if(state.zoneIdx === state.unlockedZone && state.zoneIdx < getActiveRegion().zones.length-1) {
                state.unlockedZone++;
                showFeedback("ZONE DÉBLOQUÉE !", "yellow", 2500);
                
                let delay = 2500;

                if(state.unlockedZone === 2) {
                    setTimeout(() => showFeedback("POKÉSHOP DÉBLOQUÉ !", "blue", 3000), delay);
                    delay += 3000;
                }
                if(state.unlockedZone === 3) {
                    setTimeout(() => showFeedback("PC DE LÉO DÉBLOQUÉ !", "green", 3000), delay);
                    delay += 3000;
                }
                if(state.unlockedZone === 11) { // Celadon Gym
                    setTimeout(() => showFeedback("PENSION DÉBLOQUÉE (BOURG PALETTE) !", "pink", 4000), delay);
                    state.daycare.unlocked = true;
                    delay += 3000;
                }

                for(const key in ITEMS) {
                    if(ITEMS[key].shop === 'mall') continue;
                    if(ITEMS[key].zone === state.unlockedZone) {
                        const iName = ITEMS[key].name;
                        setTimeout(() => {
                            showFeedback(`<span class="text-xs md:text-xl">Vous avez débloqué ${iName} dans le PokéShop !</span>`, "blue", 3000);
                        }, delay);
                        delay += 3000;
                    }
                }

                renderShop(); 
                renderPC();
                state.subStage = 1; 
            } else {
                 state.subStage = 1;
            }
        }
    } else {
        if(state.subStage < 10) state.subStage++;
    }
    
    updateUI(); 
    updateZone();
    
    resumeAutoBattle();
    // Gestion du délai de réapparition (sans animation 3D)
    // document.getElementById('enemy-sprite').classList.add('hidden'); // Handled by spawn logic
    document.getElementById('searching-msg').classList.remove('hidden');

    let totalDelay = 2000; // Base (Pied)
    if(state.upgrades.bicycle) totalDelay = 500;
    else if(state.upgrades.runningShoes) totalDelay = 1000;

    // Bonus
    if(hasBadge("Terre")) totalDelay = Math.floor(totalDelay / 1.2);
    if(hasMilestone(50)) totalDelay = Math.floor(totalDelay * 0.9);

    setTimeout(spawnEnemy, totalDelay);
}


