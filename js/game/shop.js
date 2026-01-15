// --- MODULE ---

function getPrice(base) {
    if(state.cheat) return 1;
    if(hasMilestone(70)) return Math.floor(base * 0.85);
    return base;
}


function getItemPrice(id) {
    const item = ITEMS[id];
    if(!item) return 0;
    let base = item.price;
    if(item.type === 'consumable') {
        base = Math.floor(base * (1 + state.badges.length * 0.05));
    }
    return base;
}


function buyItem(id) {
    const item = ITEMS[id];
    if(!item) return;
    
    let p = getPrice(getItemPrice(id));
    
    if(state.money >= p) {
        if(item.type === 'upgrade' && state.upgrades[id]) return; // Already owned
        
        state.money -= p;
        
        if(item.type === 'consumable') {
            state.inv[item.invKey]++;
        } else {
            state.upgrades[id] = true;
        }
        
        updateUI(); renderBag(); renderShop();
        if (state.zoneIdx === -6) renderMallPanel();
    }
}

