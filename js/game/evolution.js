// --- MODULE ---

function applyEvolution(p, uid, newId, newName) {
    const oldId = p.id;
    p.id = newId;
    if (!p.isRenamed) p.name = newName;
    p.img = getSprite(p.id, p.isShiny);
    addToPokedex(p.id);

    evolvingPokemon = { uid: uid, endTime: Date.now() + 3000, oldId: oldId, newId: newId };

    if (evolutionInterval) clearInterval(evolutionInterval);
    evolutionInterval = setInterval(() => {
        if (Date.now() > evolvingPokemon.endTime) {
            clearInterval(evolutionInterval);
            evolutionInterval = null;
            renderTeam();
        } else {
            renderTeam();
        }
    }, 50);

    renderTeam();
    playTone('up');
    showFeedback("ÉVOLUTION !", "purple");
}

function evolve(uid) {
    let p = state.team.find(x => x.uid === uid);
    let ed = EVOLUTIONS[p.id];
    if (p && p.everstone) { showFeedback("EVOLUTION BLOQUEE !", "red"); return; }
    if (p && ed && p.level >= ed.lvl) {
        let newId, newName;
        if (Array.isArray(ed.id)) {
            // Eevee Easter Egg (Renaming)
            if (p.id === 133) {
                const n = p.name.trim().toLowerCase();
                if (n === "jolteon") { newId = 135; newName = "Voltali"; }
                else if (n === "vaporeon") { newId = 134; newName = "Aquali"; }
                else if (n === "flareon") { newId = 136; newName = "Pyroli"; }
                else {
                    const r = Math.floor(Math.random() * ed.id.length);
                    newId = ed.id[r]; newName = ed.name[r];
                }
            } else {
                const r = Math.floor(Math.random() * ed.id.length);
                newId = ed.id[r]; newName = ed.name[r];
            }
        } else {
            newId = ed.id;
            newName = ed.name;
        }
        applyEvolution(p, uid, newId, newName);
    }
}

function evolveWithStone(p, evo) {
    if (!p || !evo) return;
    applyEvolution(p, p.uid, evo.id, evo.name);
}


