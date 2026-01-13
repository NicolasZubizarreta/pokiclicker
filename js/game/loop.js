// --- GAME LOOP & START ---
setInterval(() => {
    const isEvolving = Date.now() < evolvingPokemon.endTime;
    if(state.auto && state.team.length>0 && !enemy.dead && !isEvolving) {
        damageEnemy(getDPS(enemy.id)/10);
    }
    updateActiveEffects();
    if(state.upgrades.falseSwipe) updateFalseSwipeBtn();
}, 100);

// Global click to close context menu
window.addEventListener('click', () => {
    const menu = document.getElementById('custom-context-menu');
    if(menu) menu.classList.add('hidden');
});

// Resize handler for responsive map
window.addEventListener('resize', () => {
    updateBg();
});

// Launch
window.onload = init;

