// --- UI MODULE ---

function initSwap(idx) {
    if(state.team.length < 6) {
        let p = state.pc.splice(idx,1)[0]; 
        state.team.push(p);
        playTone('pc'); 
        renderTeam(); renderPC();
    } else {
        state.swapIdx = idx;
        document.getElementById('swap-alert').classList.remove('hidden');
        renderTeam();
    }
}


function confirmSwap(tIdx) {
    if(state.swapIdx === null) return;
    
    const teamMon = state.team[tIdx];
    const pcMon = state.pc[state.swapIdx];
    if (!teamMon.isEgg && pcMon.isEgg && countActivePokemon() <= 1) {
        showFeedback("IL FAUT 1 POKÉMON ACTIF !", "red"); return;
    }

    let temp = state.team[tIdx];
    state.team[tIdx] = state.pc[state.swapIdx];
    state.pc[state.swapIdx] = temp;
    state.swapIdx = null;
    document.getElementById('swap-alert').classList.add('hidden');
    playTone('pc'); renderTeam(); renderPC();
}


function releasePokemon(idx) { 
    if(confirm("Relâcher ce Pokémon ?")) { 
        state.pc.splice(idx,1); 
        renderPC(); 
    } 
}


function enterHallOfFame() {
    const overlay = document.getElementById('glitch-overlay');
    overlay.className = "absolute inset-0 z-[60] bg-black transition-opacity duration-1000 opacity-0 pointer-events-none";
    overlay.classList.remove('hidden');
    
    // Fade Out
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
    });

    setTimeout(() => {
        state.zoneIdx = -5; // Panthéon
        updateBg();
        updateZone();
        renderShop(); renderBag(); renderPC();
        spawnEnemy(); // Will handle empty zone logic
        
        // Fade In
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
            if (!state.hasSeenPantheonIntro) {
                startPantheonSequence();
            } else {
                animateHallOfFame();
            }
        }, 1000);
    }, 1000);
}


function startPantheonSequence() {
    state.hasSeenPantheonIntro = true;
    const overlay = document.getElementById('intro-overlay');
    const prof = document.getElementById('intro-prof');
    const box = document.getElementById('intro-dialog-box');
    const selection = document.getElementById('intro-selection');
    const itemDisplay = document.getElementById('intro-item-display');

    overlay.classList.remove('hidden');
    box.classList.add('hidden');
    selection.classList.add('hidden');
    selection.classList.remove('flex');
    itemDisplay.classList.add('hidden');

    // Reset professor sprite for new animation
    prof.src = "img/kanto/sprites/SpriteChen1.png";
    prof.classList.remove('opacity-0', 'translate-x-full');
    prof.style.transition = 'transform 1.5s ease-out';
    prof.style.right = 'auto';
    prof.style.left = '0';
    prof.style.transform = 'translateX(-100%)'; // Start off-screen left

    // Force reflow
    void prof.offsetWidth;

    // Animate to center.
    prof.style.left = '50%';
    prof.style.transform = 'translateX(-50%)';

    setTimeout(() => {
        box.classList.remove('hidden');
        box.classList.add('flex');
        
        activeDialogs = PANTHEON_DIALOGS;
        introIndex = 0;
        isEndingSequence = false;
        nextDialog();
    }, 1600);
}


function animateHallOfFame() {
    // Clear previous timeouts to prevent duplication
    pantheonTimeouts.forEach(id => clearTimeout(id));
    pantheonTimeouts = [];

    const svg = document.getElementById('bg-overlay-svg');
    svg.innerHTML = ''; // Clear previous
    
    // Coordonnées des centres des socles (calculées d'après votre mapping)
    const positions = [
        {x: 126, y: 652}, // Socle 1
        {x: 268, y: 590}, // Socle 2
        {x: 422, y: 564}, // Socle 3
        {x: 602, y: 564}, // Socle 4
        {x: 756, y: 590}, // Socle 5
        {x: 905, y: 650}  // Socle 6
    ];

    state.team.forEach((p, i) => {
        if (i >= positions.length) return;
        const tId = setTimeout(() => {
            const pos = positions[i];
            const size = 160; // Taille du sprite
            const finalY = pos.y - size + 20;

            // Easter eggs
            let transformRotate = '';
            let specialClass = '';
            const pNameLower = p.name.toLowerCase();
            if (pNameLower === "dinnerbone" || pNameLower === "grumm") {
                transformRotate = 'rotate(180deg)';
            }
            if (pNameLower === "jeb_") {
                specialClass = 'rainbow-anim';
            }
            
            // Handle Caca filter manually to combine with drop-shadow
            let filterStyle = "drop-shadow(0 10px 10px rgba(0,0,0,0.5))";
            if (pNameLower === "caca") {
                filterStyle = "sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.7) " + filterStyle;
            }

            let imgSrc = getArtwork(p.id, p.isShiny);
            if (pNameLower === "daran") imgSrc = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;

            const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgSrc);
            img.setAttribute('x', pos.x - size/2);
            img.setAttribute('y', finalY);
            img.setAttribute('width', size);
            img.setAttribute('height', size);
            img.setAttribute('class', `opacity-0 ${specialClass}`);
            img.style.transform = `translateY(-300px) ${transformRotate}`;
            img.style.transition = 'transform 1s ease-out, opacity 0.5s ease-in';
            img.style.transformOrigin = 'center';
            img.style.transformBox = 'fill-box';
            img.style.filter = filterStyle;
            svg.appendChild(img);
            
            requestAnimationFrame(() => {
                img.getBoundingClientRect(); // Force le navigateur à calculer la position de départ
                img.style.transform = `translateY(0) ${transformRotate}`;
                img.classList.remove('opacity-0');
            });
            
            playTone('catch');

            // After landing, show level
            const tId2 = setTimeout(() => {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', pos.x);
                text.setAttribute('y', pos.y + 35);
                text.setAttribute('fill', 'white');
                text.setAttribute('font-size', '24');
                text.setAttribute('font-family', "'Press Start 2P', cursive");
                text.setAttribute('text-anchor', 'middle');
                text.style.filter = "drop-shadow(2px 2px 2px rgba(0,0,0,0.7))";
                text.textContent = `Lv. ${p.level}`;
                text.setAttribute('class', 'opacity-0');
                text.style.transition = 'opacity 0.5s ease-in';
                svg.appendChild(text);

                requestAnimationFrame(() => {
                    text.classList.remove('opacity-0');
                });
            }, 1000);
            pantheonTimeouts.push(tId2);

        }, i * 2000); // Délai de 2s entre chaque Pokémon
        pantheonTimeouts.push(tId);
    });

    // Déclenchement du feu d'artifice à la fin
    const tIdFinal = setTimeout(() => {
        startVictoryAnimation();
        showHallOfFameTitle();
    }, state.team.length * 2000 + 500);
    pantheonTimeouts.push(tIdFinal);
}


function showHallOfFameTitle() {
    const t = document.getElementById('hof-title-container');
    t.classList.remove('hidden');
    
    const btn = document.getElementById('pantheon-exit-btn');
    btn.classList.remove('bg-red-600', 'hover:bg-red-500');
    btn.classList.add('bg-green-600', 'hover:bg-green-500', 'animate-pulse');
    
    t.firstElementChild.classList.add('title-slam');
}


function exitPantheon() {
    stopVictoryAnimation();
    pantheonTimeouts.forEach(id => clearTimeout(id));
    pantheonTimeouts = [];
    const t = document.getElementById('hof-title-container');
    t.classList.add('hidden');
    t.firstElementChild.classList.remove('title-slam');
    
    // Reset button style
    const btn = document.getElementById('pantheon-exit-btn');
    btn.classList.add('bg-red-600', 'hover:bg-red-500');
    btn.classList.remove('bg-green-600', 'hover:bg-green-500', 'animate-pulse');

    const triggerJohto = !state.johtoUnlocked || state.cheat;

    changeZone(0); // Retour Bourg Palette (via logique standard ou custom si besoin)
    // Force reset to Zone 0 if changeZone logic is relative
    if(state.zoneIdx !== 0) {
        state.zoneIdx = 0;
        updateBg(); updateZone(); spawnEnemy();
    }
    state.hasExitedLab = true; // Ensure we are outside

    if (triggerJohto) {
        setTimeout(startJohtoIntro, 500);
    }
}



