// --- UI MODULE ---

function startJohtoIntro() {
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

    // Reset professor sprite
    prof.src = "img/kanto/sprites/SpriteChen1.png";
    prof.classList.remove('opacity-0', 'translate-x-full');
    prof.style.transition = 'transform 1.5s ease-out';
    prof.style.right = 'auto';
    prof.style.left = '0';
    prof.style.transform = 'translateX(-100%)';

    // Force reflow
    void prof.offsetWidth;

    // Animate to center
    prof.style.left = '50%';
    prof.style.transform = 'translateX(-50%)';

    setTimeout(() => {
        box.classList.remove('hidden');
        box.classList.add('flex');
        
        activeDialogs = JOHTO_INTRO_DIALOGS;
        introIndex = 0;
        isEndingSequence = false;
        nextDialog();
    }, 1600);
}


function showJohtoModal() {
    document.getElementById('johto-modal').classList.remove('hidden');
    if(!state.boatClicked) {
        state.boatClicked = true;
        updateBg();
    }
}


