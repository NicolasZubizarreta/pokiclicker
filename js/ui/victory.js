// --- MODULE ---

function startVictoryAnimation() {
    const container = document.getElementById('confetti-container');
    if(!container) return;
    container.innerHTML = '';
    
    // Confetti
    victoryInterval = setInterval(() => {
        const c = document.createElement('div');
        c.className = 'absolute w-2 h-2 rounded-sm';
        c.style.left = Math.random() * 100 + '%';
        c.style.top = '-10px';
        c.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`;
        c.style.transform = `rotate(${Math.random()*360}deg)`;
        c.style.transition = `top ${Math.random()*2+2}s linear, transform ${Math.random()*2+2}s linear`;
        container.appendChild(c);
        
        requestAnimationFrame(() => {
            c.style.top = '110%';
            c.style.transform = `rotate(${Math.random()*720}deg)`;
        });
        
        setTimeout(() => c.remove(), 4000);
    }, 50);

    // Fireworks
    fireworkInterval = setInterval(() => {
        const f = document.createElement('div');
        f.className = 'absolute rounded-full border-2 opacity-0';
        f.style.width = '10px';
        f.style.height = '10px';
        f.style.left = Math.random() * 80 + 10 + '%';
        f.style.top = Math.random() * 60 + 10 + '%';
        const color = `hsl(${Math.random()*360}, 100%, 50%)`;
        f.style.borderColor = color;
        f.style.boxShadow = `0 0 20px ${color}, inset 0 0 20px ${color}`;
        f.style.transition = 'all 1s ease-out';
        container.appendChild(f);
        
        requestAnimationFrame(() => {
            f.style.transform = `scale(${Math.random()*15+10})`;
            f.style.opacity = '0';
            f.style.borderWidth = '0px';
        });
        
        setTimeout(() => f.remove(), 1000);
    }, 800);
}


function stopVictoryAnimation() {
    if(victoryInterval) clearInterval(victoryInterval);
    if(fireworkInterval) clearInterval(fireworkInterval);
    const container = document.getElementById('confetti-container');
    if(container) container.innerHTML = '';
}

