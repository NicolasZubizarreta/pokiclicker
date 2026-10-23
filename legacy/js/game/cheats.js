// --- GAME MODULE ---

function toggleCheat() {
    if (!state.cheat) {
        const pwd = prompt("Mot de passe requis pour activer la triche :");
        if (pwd !== "peter2005") {
            alert("Mot de passe incorrect !");
            return;
        }
    }
    state.cheat = !state.cheat;

    if(state.cheat) {
        state.inv.shinyToken++;
        // Cheat Pokedex: 150/151 (No Rattata)
        state.pokedexBackup = [...state.pokedex];
        state.pokedex = [];
        for(let i=1; i<=151; i++) {
            if(i !== 19) state.pokedex.push(i);
        }
        checkMilestones();
    } else {
        if(state.pokedexBackup) {
            state.pokedex = state.pokedexBackup;
            state.pokedexBackup = null;
        }
    }
    const updateBtn = (id, baseClass) => {
        const b = document.getElementById(id);
        if(!b) return;
        b.className = state.cheat ? 
            `${baseClass} bg-red-600 text-white border-red-400 cheat-active` : 
            `${baseClass} bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 opacity-50 hover:opacity-100`;
        b.innerText = state.cheat ? "CHEAT: ON" : "CHEAT: OFF";
    };
    updateBtn('cheat-btn', "px-2 py-1 rounded text-[10px] font-bold transition-all");
    renderShop();
    renderPokedex();
    updateZone();
}

