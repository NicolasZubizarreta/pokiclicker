// --- MODULE ---

function showPokemonSummary(location, index, event) {
    if(event) event.preventDefault();
    const p = state[location][index];
    if (!p) return;

    state.summaryPokemon = { location, index };

    const sprite = document.getElementById('summary-sprite');
    if (p.isEgg) {
        sprite.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png";
        sprite.className = "h-32 w-32 md:h-64 md:w-64 object-contain pokemon-float drop-shadow-2xl";
    } else {
        sprite.src = getArtwork(p.id, p.isShiny);
        sprite.classList.remove('rainbow-anim', 'upside-down', 'caca-filter');
        const pNameLower = p.name.toLowerCase();
        if (pNameLower === "dinnerbone" || pNameLower === "grumm") sprite.classList.add('upside-down');
        if (pNameLower === "jeb_") sprite.classList.add('rainbow-anim');
        if (pNameLower === "caca") sprite.classList.add('caca-filter');
        if (pNameLower === "daran") sprite.src = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;
    }

    document.getElementById('summary-name').innerText = p.isEgg ? "Oeuf" : p.name;
    document.getElementById('summary-shiny-icon').classList.toggle('hidden', !p.isShiny || p.isEgg);
    
    const pTypes = getTypes(p.id);
    let genderSymbol = '';
    if (p.gender === 'male') genderSymbol = '<span class="text-blue-400 text-lg ml-1 font-bold">♂</span>';
    else if (p.gender === 'female') genderSymbol = '<span class="text-pink-400 text-lg ml-1 font-bold">♀</span>';
    
    let favIcon = p.isFavorite ? 'star' : 'star_border';
    let favClass = p.isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-white';
    let favHtml = `<span class="material-symbols-outlined cursor-pointer ml-2 text-lg ${favClass}" onclick="toggleSummaryFavorite()" title="Favori">${favIcon}</span>`;

    if (p.isEgg) {
        document.getElementById('summary-types').innerHTML = `<span class="text-xs px-2 py-1 rounded bg-gray-500 text-white shadow-sm uppercase">NORMAL</span>` + favHtml;
        document.getElementById('summary-level').innerText = "Eclosion";
        const pct = (p.hatchSteps / p.maxSteps) * 100;
        document.getElementById('summary-xp-bar').style.width = `${pct}%`;
        document.getElementById('summary-xp-text').innerText = `${p.hatchSteps}/${p.maxSteps}`;
    } else {
        document.getElementById('summary-types').innerHTML = pTypes.map(t => `<span style="background:${TYPE_COLORS[t]}" class="text-xs px-2 py-1 rounded text-white shadow-sm uppercase">${t}</span>`).join("") + genderSymbol + favHtml;
        document.getElementById('summary-level').innerText = `Lv.${p.level}`;
        const xpPct = p.level >= 100 ? 100 : Math.min(100, (p.xp / p.maxXp) * 100);
        document.getElementById('summary-xp-bar').style.width = `${xpPct}%`;
        document.getElementById('summary-xp-text').innerText = p.level >= 100 ? "MAX" : `${Math.floor(p.xp)}/${p.maxXp}`;
    }

    const dps = getPokemonDps(p, enemy.dead ? null : enemy.id);
    document.getElementById('summary-dps').innerText = dps.toFixed(1);

    // Happiness Ring Update
    const happyVal = p.happiness || 0;
    const happyPct = (happyVal / 255) * 100;
    document.getElementById('summary-happy-progress').style.background = `conic-gradient(#fbbf24 ${happyPct}%, #334155 ${happyPct}%)`;
    document.getElementById('summary-happy-val').innerText = `${happyVal}/255`;
    document.getElementById('summary-happy-bonus').innerText = `+${(happyVal * 0.1).toFixed(1)}% Dégâts`;

    const moveBtn = document.getElementById('summary-move-btn');
    const releaseBtn = document.getElementById('summary-release-btn');

    if (location === 'team') {
        moveBtn.innerText = "Envoyer au PC";
        moveBtn.disabled = state.team.length <= 1;
    } else {
        moveBtn.innerText = "Placer dans l'équipe";
        moveBtn.disabled = false;
    }
    releaseBtn.disabled = (location === 'team' && state.team.length <= 1);

    moveBtn.onclick = () => movePokemonFromSummary();
    releaseBtn.onclick = () => releasePokemonFromSummary();

    document.getElementById('pokemon-summary-modal').classList.remove('hidden');
}


function toggleSummaryFavorite() {
    if (!state.summaryPokemon) return;
    const { location, index } = state.summaryPokemon;
    const p = state[location][index];
    p.isFavorite = !p.isFavorite;
    
    // Refresh just the types/gender/fav line
    const pTypes = getTypes(p.id);
    let genderSymbol = p.gender === 'male' ? '<span class="text-blue-400 text-lg ml-1 font-bold">♂</span>' : (p.gender === 'female' ? '<span class="text-pink-400 text-lg ml-1 font-bold">♀</span>' : '');
    let favIcon = p.isFavorite ? 'star' : 'star_border';
    let favClass = p.isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-white';
    let favHtml = `<span class="material-symbols-outlined cursor-pointer ml-2 text-lg ${favClass}" onclick="toggleSummaryFavorite()" title="Favori">${favIcon}</span>`;
    document.getElementById('summary-types').innerHTML = pTypes.map(t => `<span style="background:${TYPE_COLORS[t]}" class="text-xs px-2 py-1 rounded text-white shadow-sm uppercase">${t}</span>`).join("") + genderSymbol + favHtml;

    renderTeam();
    renderPC();
}


function hidePokemonSummary() {
    document.getElementById('pokemon-summary-modal').classList.add('hidden');
    cancelSummaryRename();
    state.summaryPokemon = null;
}


function openContextMenu(loc, idx, e) {
    e.preventDefault();
    e.stopPropagation();
    state.contextTarget = { location: loc, index: idx };
    const menu = document.getElementById('custom-context-menu');
    
    // Position logic
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust if close to edge (basic)
    if (x + 150 > window.innerWidth) x -= 130;
    if (y + 100 > window.innerHeight) y -= 100;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
    menu.classList.add('flex');
}


function onSummaryClick() {
    if(state.contextTarget) {
        showPokemonSummary(state.contextTarget.location, state.contextTarget.index);
        document.getElementById('custom-context-menu').classList.add('hidden');
    }
}


function movePokemonFromSummary() {
    if (!state.summaryPokemon) return;
    const { location, index } = state.summaryPokemon;

    if (location === 'team') {
        if (state.team.length <= 1) { showFeedback("DERNIER POKÉMON !", "red"); return; }
        if (countActivePokemon() <= 1 && !state.team[index].isEgg) { showFeedback("IL FAUT 1 POKÉMON ACTIF !", "red"); return; }
        const p = state.team.splice(index, 1)[0];
        state.pc.push(p);
        playTone('pc');
    } else {
        if (state.team.length < 6) {
            const p = state.pc.splice(index, 1)[0];
            state.team.push(p);
            playTone('pc');
        } else { initSwap(index); }
    }
    hidePokemonSummary();
    renderTeam();
    renderPC();
}


function releasePokemonFromSummary() {
    if (!state.summaryPokemon) return;
    const { location, index } = state.summaryPokemon;
    const p = state[location][index];

    if (location === 'team' && state.team.length <= 1) { showFeedback("IMPOSSIBLE !", "red"); return; }
    if (location === 'team' && countActivePokemon() <= 1 && !state.team[index].isEgg) { showFeedback("IL FAUT 1 POKÉMON ACTIF !", "red"); return; }

    if (confirm(`Voulez-vous vraiment relâcher ${p.name} ?`)) {
        state[location].splice(index, 1);
        hidePokemonSummary();
        renderTeam();
        renderPC();
    }
}


function startSummaryRename() {
    document.getElementById('summary-name-display').classList.add('hidden');
    const inputContainer = document.getElementById('summary-rename-input-container');
    inputContainer.classList.remove('hidden');
    inputContainer.classList.add('flex');
    const input = document.getElementById('summary-rename-input');
    const { location, index } = state.summaryPokemon;
    input.value = state[location][index].name;
    input.focus();
    input.select();
}


function confirmSummaryRename() {
    if (!state.summaryPokemon) return;
    const { location, index } = state.summaryPokemon;
    const input = document.getElementById('summary-rename-input');
    const newName = input.value.trim();

    if (newName && newName.length > 0 && newName.length <= 12) {
        const p = state[location][index];
        p.name = newName;
        p.isRenamed = true;
        document.getElementById('summary-name').innerText = newName;
        
        const sprite = document.getElementById('summary-sprite');
        sprite.className = "h-32 w-32 md:h-64 md:w-64 object-contain pokemon-float drop-shadow-2xl"; // Reset classes
        sprite.src = getArtwork(p.id, p.isShiny); // Reset src
        if (newName.toLowerCase() === "dinnerbone" || newName.toLowerCase() === "grumm") sprite.classList.add('upside-down');
        if (newName.toLowerCase() === "jeb_") sprite.classList.add('rainbow-anim');
        if (newName.toLowerCase() === "caca") sprite.classList.add('caca-filter');
        if (newName.toLowerCase() === "daran") sprite.src = `img/kanto/EasterEgg/DaranStade${getEvolutionStage(p.id)}.png`;
        
        renderTeam();
        renderPC();
    }
    cancelSummaryRename();
}


function cancelSummaryRename() {
    document.getElementById('summary-name-display').classList.remove('hidden');
    const inputContainer = document.getElementById('summary-rename-input-container');
    inputContainer.classList.add('hidden');
    inputContainer.classList.remove('flex');
}



