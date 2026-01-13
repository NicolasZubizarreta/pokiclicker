const REGIONS = {
    kanto: { badges: BADGES, mapData: MAP_DATA, zones: ZONES },
    johto: JOHTO_REGION
};
const ACTIVE_REGION_KEY = "kanto";

function getActiveRegion() {
    const key = state && state.currentRegion ? state.currentRegion : ACTIVE_REGION_KEY;
    return REGIONS[key] || REGIONS[ACTIVE_REGION_KEY];
}

function setActiveRegion(key) {
    if (REGIONS[key]) {
        state.currentRegion = key;
    }
}


let state = {
    money: 0, 
    inv: { balls: 0, superballs: 0, hyperballs: 0, candy: 0, omniExp: 0, shinyToken: 0, masterball: 0, repel: 0, xAttack: 0, xSpecial: 0, superRepel: 0, pokeDoll: 0, everstone: 0 },
    upgrades: { runningShoes: false, amuletCoin: false, protein: false, expShare: false, hardStone: false, bicycle: false, luckyEgg: false, leftovers: false, pokeradar: false, falseSwipe: false, shinyCharm: false, diploma: false },
    team: [],
    currentRegion: "kanto",
johtoUnlocked: false,
    boatClicked: false,
    introBagUnlocked: false,
    introMapUnlocked: false,
    hasExitedLab: false,
    hasVisitedRoute1: false,
    pc: [],
    pokedex: [],
    pokedexBackup: null,
    hasSeenPantheonIntro: false,
    hasSeenEnding: false,
    badges: [],
    milestones: [],
    repelEndTime: 0,
    attackBoostEndTime: 0,
    dpsBoostEndTime: 0,
    superRepelEndTime: 0,
    falseSwipeCooldown: 0,
    zoneIdx: -4, 
    subStage: 1, 
    unlockedZone: 0,
    auto: true, 
    autoClicker: false,
    starterId: null,
    cheat: false,
    stats: { kills: 0, totalMoney: 0 },
    stopOnRare: true,
    autoStopSettings: { 'Commun': false, 'Peu Commun': false, 'Rare': true, 'Très Rare': true, 'Légendaire': true, 'Shiny': true, 'Nouveau': true },
    interruptedState: null,
    swapIdx: null,
    candyMode: false,
    candyTargetIdx: null,
    candyAmount: 1,
    shinyTokenMode: false,
    everstoneMode: false,
    summaryPokemon: null,
    contextTarget: null,
    visitedLab: false,
    daycare: { unlocked: false, parents: [null, null], eggs: [], slots: 1 },
    daycareMode: { active: false, slotIdx: null }
};

// Runtime variables (not saved)
let enemy = { hp: 10, maxHp: 10, id: 0, level: 1, isBoss: false, isShiny: false, catchRate: 1, name: "", rarity: "Commun", dead: false, isFalseSwiped: false };
let audioCtx = false, synth = null;
let bossTimer = null;
let autoSaveInterval = null;
let autoClickerInterval = null;
let evolvingPokemon = { uid: null, endTime: 0, oldId: null, newId: null };
let evolutionInterval = null;
let feedbackTimer = null;
let victoryInterval = null;
let fireworkInterval = null;
let pantheonTimeouts = [];


let activeDialogs = INTRO_DIALOGS;
let introIndex = 0;
let introTyping = false;
let selectedStarterId = null;
let isEndingSequence = false;

// --- INIT ---
function init() {
    // Check for save
    if (localStorage.getItem('pokiClickerSave')) {
        document.getElementById('starter-modal').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        document.getElementById('game-ui').classList.remove('opacity-0');
        loadGame();
    } else {
        document.getElementById('starter-modal').classList.remove('hidden');
    }
}

function startGame() {
    document.getElementById('starter-modal').classList.add('hidden');
    launchGameLoop();
}

function startIntro() {
    // Reset state
    activeDialogs = INTRO_DIALOGS;
    isEndingSequence = false;
    introIndex = 0;
    introTyping = false;
    selectedStarterId = null;

    // Déterminer le statut shiny des starters
    const shinyChance = state.cheat ? 1 : 1/256;
    window.starterShinyStatus = {
        1: Math.random() < shinyChance,
        4: Math.random() < shinyChance,
        7: Math.random() < shinyChance
    };
    [1, 4, 7].forEach(id => {
        const pokeImg = document.getElementById(`poke-${id}`);
        const isShiny = window.starterShinyStatus[id];
        pokeImg.src = getArtwork(id, isShiny);
        pokeImg.classList.toggle('shiny-glow', isShiny);
    });

    const overlay = document.getElementById('intro-overlay');
    const prof = document.getElementById('intro-prof');
    const box = document.getElementById('intro-dialog-box');
    const selection = document.getElementById('intro-selection');
    const itemDisplay = document.getElementById('intro-item-display');
    
    overlay.classList.remove('hidden');
    
    // Reset DOM
    prof.style.transition = 'none';
    prof.style.right = "auto";
    prof.style.left = "50%";
    prof.style.transform = "translateX(100vw)"; // Start way off screen right
    prof.src = "img/kanto/sprites/SpriteChen1.png";
    prof.classList.remove('opacity-0');
    box.classList.add('hidden');
    selection.classList.add('hidden');
    selection.classList.remove('flex');
    itemDisplay.classList.add('hidden');

    // Force Reflow
    void prof.offsetWidth;
    
    // Phase 1: Enter Professor (Animated)
    requestAnimationFrame(() => {
        prof.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
        prof.style.transform = "translateX(50%)"; // Center (since right is auto and left is 50%, translate 50% moves it to visual center relative to itself if origin is correct, but here we want to center it. Let's adjust.)
        // Correction for centering absolute element with left 50%:
        prof.style.transform = "translateX(50%)"; 
        
        setTimeout(() => {
            box.classList.remove('hidden');
            box.classList.add('flex');
            nextDialog();
        }, 1600);
    });
}

function nextDialog() {
    const currentIndex = introIndex; // Capture l'index actuel pour éviter le bug du saut
    if (currentIndex >= activeDialogs.length) {
        // NEW: End of Pantheon dialog
        if (activeDialogs === PANTHEON_DIALOGS) {
            const prof = document.getElementById('intro-prof');
            prof.style.transition = 'transform 1s ease-in';
            prof.style.transform = 'translateX(-150%)'; // Exit left

            setTimeout(() => {
                document.getElementById('intro-overlay').classList.add('hidden');
                // Reset prof for next time
                prof.style.transition = 'transform 1.5s ease-out';
                prof.style.opacity = '1';
                prof.style.left = 'auto';
                prof.style.right = '0';
                prof.style.transform = '';
                
                // Petit délai avant de lancer l'animation pour ne pas couper le début
                setTimeout(animateHallOfFame, 1000);
            }, 1000);
            return;
        }
        if (activeDialogs === JOHTO_INTRO_DIALOGS) {
             document.getElementById('intro-overlay').classList.add('hidden');
             state.johtoUnlocked = true;
             updateBg(); // Refresh map to show flashing boat
             showFeedback("ACCÈS JOHTO DÉBLOQUÉ !", "yellow");
             playTone('up');
             return;
        }
        // Phase 4: Selection
        if (isEndingSequence) {
             document.getElementById('intro-overlay').classList.add('hidden');
             isEndingSequence = false;
             activeDialogs = INTRO_DIALOGS;
             return;
        }
        document.getElementById('intro-prof').classList.add('opacity-0');
        document.getElementById('intro-dialog-box').classList.add('hidden');
        setTimeout(() => {
            document.getElementById('intro-selection').classList.remove('hidden');
            document.getElementById('intro-selection').classList.add('flex');
        }, 500);
        return;
    }

    if (isEndingSequence) {
        const itemDisplay = document.getElementById('intro-item-display');
        
        // Reset classes
        itemDisplay.classList.remove('hidden');
        itemDisplay.style.animation = 'none';
        itemDisplay.offsetHeight; /* trigger reflow */
        
        if (currentIndex === 4) { // Show Diploma
             itemDisplay.src = "img/kanto/icones/Diplôme.png";
             itemDisplay.style.animation = "diploma-entrance 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards";
             if(!state.upgrades.diploma) {
                 state.upgrades.diploma = true;
                 renderBag();
             }
        }
        else if (currentIndex === 5) { // Hide Diploma (Fly to bag)
             itemDisplay.src = "img/kanto/icones/Diplôme.png";
             itemDisplay.style.animation = "fly-to-bag 0.8s forwards";
        }
        else if (currentIndex === 6) { // Show Charm
             itemDisplay.src = ITEMS.shinyCharm.img;
             itemDisplay.style.animation = "zoom-in-entrance 0.8s forwards";
             if(!state.upgrades.shinyCharm) {
                 state.upgrades.shinyCharm = true;
                 renderBag();
                 showFeedback("CHARME CHROMA OBTENU !", "purple");
             }
        }
        else if (currentIndex === 7) { // Hide Charm (Fly to bag)
             itemDisplay.src = ITEMS.shinyCharm.img;
             itemDisplay.style.animation = "fly-to-bag 0.8s forwards";
        } else {
             itemDisplay.classList.add('hidden');
        }
    } else {
        // Intro Logic
        const prof = document.getElementById('intro-prof');
        if ((activeDialogs === INTRO_DIALOGS || activeDialogs === PANTHEON_DIALOGS) && currentIndex === 2) {
            prof.classList.remove('duration-[1500ms]');
            prof.classList.add('duration-500');
            prof.classList.add('opacity-0');
            setTimeout(() => {
                prof.src = "img/kanto/sprites/SpriteChen2.png";
                prof.classList.remove('duration-500');
                prof.classList.add('duration-1000');
                requestAnimationFrame(() => prof.classList.remove('opacity-0'));
                setTimeout(() => {
                    prof.classList.remove('duration-1000');
                    prof.classList.add('duration-[1500ms]');
                }, 1000);
            }, 500);
        }
        if (activeDialogs === INTRO_DIALOGS && currentIndex === 4) {
            prof.classList.remove('duration-[1500ms]');
            prof.classList.add('duration-500');
            prof.classList.add('opacity-0');
            setTimeout(() => {
                prof.src = "img/kanto/sprites/SpriteChen3.png";
                prof.classList.remove('duration-500');
                prof.classList.add('duration-1000');
                requestAnimationFrame(() => prof.classList.remove('opacity-0'));
                setTimeout(() => {
                    prof.classList.remove('duration-1000');
                    prof.classList.add('duration-[1500ms]');
                }, 1000);
            }, 500);
        }
        
        // Unlocks
        if (currentIndex === 3 && !state.introBagUnlocked) {
            state.introBagUnlocked = true;
            state.inv.balls += 5;
            const lock = document.getElementById('bag-locked');
        if(lock) lock.classList.add('breaking-lock');
        setTimeout(() => {
            if(lock) lock.classList.remove('breaking-lock');
            renderBag();
        }, 500);
        showFeedback("+5 POKÉBALLS !", "blue");
    }
    
    if (currentIndex === 5 && !state.introMapUnlocked) {
        state.introMapUnlocked = true;
        updateMapButton();
        const btn = document.getElementById('map-btn');
        if(btn) {
            btn.classList.add('animate-bounce');
            setTimeout(() => btn.classList.remove('animate-bounce'), 1000);
        }
        showFeedback("CARTE DÉBLOQUÉE !", "yellow");
    }
    }

    // Phase 2: Typewriter
    const text = activeDialogs[currentIndex];
    const el = document.getElementById('intro-text');
    const arrow = document.getElementById('intro-arrow');
    
    el.textContent = "";
    arrow.classList.add('hidden');
    introTyping = true;
    
    let i = 0;
    const speed = 30; 
    
    function type() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            introTyping = false;
            arrow.classList.remove('hidden');
        }
    }
    type();
    introIndex++;
}

function advanceIntro() {
    if (!introTyping) {
        nextDialog();
    }
}

function selectStarter(id) {
    selectedStarterId = id;
    const btn = document.getElementById('intro-confirm-btn');
    const name = id===1?"BULBIZARRE":id===4?"SALAMÈCHE":"CARAPUCE";
    
    // Reset visuals
    [1,4,7].forEach(i => {
        document.getElementById(`ball-${i}`).style.opacity = i===id ? '0' : '1';
        document.getElementById(`poke-${i}`).style.opacity = i===id ? '1' : '0';
        document.getElementById(`poke-${i}`).style.transform = i===id ? 'scale(1.5)' : 'scale(0)';
    });

    btn.innerText = `CHOISIR ${name}`;
    btn.classList.remove('hidden');
}

function confirmStarter() {
    if(!selectedStarterId) return;
    let name = selectedStarterId===1?"Bulbizarre":selectedStarterId===4?"Salamèche":"Carapuce";
    state.starterId = selectedStarterId;
    const isShiny = window.starterShinyStatus[selectedStarterId];
    addToTeam(selectedStarterId, name, 5, isShiny, Math.random() < 0.5 ? 'male' : 'female');
    addToPokedex(selectedStarterId);
    
    if(state.unlockedZone < 1) state.unlockedZone = 1;
    
    document.getElementById('intro-overlay').classList.add('hidden');
    state.visitedLab = true;
    renderBag();
    updateZone();
    updateUI();
    updateBg();
}

function launchGameLoop() {
    document.getElementById('game-ui').classList.remove('hidden');
    
    // Fade in
    setTimeout(()=>document.getElementById('game-ui').classList.remove('opacity-0'), 100);
    
    initAudio();
    spawnEnemy();
    updateBg(); 
    updateUI(); 
    renderShop(); 
    renderPC();
    renderBag();
    startAutoClicker();
    startAutoSave();
}

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        localStorage.setItem('pokiClickerSave', JSON.stringify(state));
    }, 10000); // Save every 10s
}

function initAudio() { 
    if(!audioCtx) { 
        audioCtx=true; 
        try {
            synth=new Tone.PolySynth(Tone.Synth).toDestination(); 
            synth.volume.value=-12; 
        } catch(e) { console.log("Audio disabled"); }
    } 
}

function playTone(t) {
    if(!audioCtx || !synth) return;
    try {
        const now = Tone.now();
        if(t==='hit') synth.triggerAttackRelease("C2","32n",now);
        if(t==='coin') synth.triggerAttackRelease("B4","16n",now);
        if(t==='catch') synth.triggerAttackRelease(["C4","E4","G4"],"16n",now);
        if(t==='up') synth.triggerAttackRelease(["G3","C4"],"16n",now);
        if(t==='pc') synth.triggerAttackRelease(["E5","C5"],"16n",now);
    } catch(e){}
}





