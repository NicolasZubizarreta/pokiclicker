// --- MODULE ---

function showItemInfo(id, e) {
    e.stopPropagation();
    const item = ITEMS[id];
    if(!item) return;
    
    document.getElementById('info-title').innerText = item.name.toUpperCase();
    document.getElementById('info-desc').innerText = item.desc;
    
    let iconHtml = item.img ? `<img src="${item.img}" class="w-12 h-12 object-contain">` : 
                   item.icon ? `<span class="material-symbols-outlined text-4xl ${item.iconColor || 'text-white'}">${item.icon}</span>` : '';
    document.getElementById('info-icon-container').innerHTML = iconHtml;
    
    document.getElementById('item-info-modal').classList.remove('hidden');
}

