// --- UI MODULE ---

function updateMobileMenuButtons() {
    const shopBtn = document.getElementById('mobile-btn-shop');
    const pcBtn = document.getElementById('mobile-btn-pc');
    
    if (shopBtn) {
        const shopUnlocked = state.unlockedZone >= 2 || state.zoneIdx >= 2;
        shopBtn.disabled = !shopUnlocked;
        if (!shopUnlocked) {
            shopBtn.classList.add('opacity-50', 'cursor-not-allowed');
            shopBtn.classList.remove('active:bg-slate-700');
            shopBtn.querySelector('span').innerText = 'lock';
        } else {
            shopBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            shopBtn.classList.add('active:bg-slate-700');
            shopBtn.querySelector('span').innerText = 'storefront';
        }
    }

    if (pcBtn) {
        const pcUnlocked = state.unlockedZone >= 3 || state.zoneIdx >= 3;
        pcBtn.disabled = !pcUnlocked;
        if (!pcUnlocked) {
            pcBtn.classList.add('opacity-50', 'cursor-not-allowed');
            pcBtn.classList.remove('active:bg-slate-700');
            pcBtn.querySelector('span').innerText = 'lock';
        } else {
            pcBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            pcBtn.classList.add('active:bg-slate-700');
            pcBtn.querySelector('span').innerText = 'computer';
        }
    }
}


function openMobileSubView(viewId) {
    document.getElementById('mobile-main-menu').classList.add('hidden');
    document.getElementById('mobile-subview-container').classList.remove('hidden');
    const views = ['mobile-team-view', 'mobile-bag-view', 'mobile-shop-view', 'mobile-pc-view'];
    views.forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById(viewId).classList.add('flex');
}


function closeMobileSubViews() {
    document.getElementById('mobile-main-menu').classList.remove('hidden');
    document.getElementById('mobile-subview-container').classList.add('hidden');
}



