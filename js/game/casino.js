// --- CASINO MODULE ---

const CASINO_TOKEN_BUNDLE = { cost: 1000, tokens: 50 };
const CASINO_CASHOUT_RATE = { tokens: 50, money: 1000 };

const SLOT_SYMBOLS = ['7', 'Pikachu', 'Staross', 'Baie', 'Magicarpe'];
const SLOT_WEIGHTS = [1, 6, 10, 18, 65];
const SLOT_SPRITES = {
    '7': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
    'Pikachu': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    'Staross': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/121.png',
    'Baie': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cheri-berry.png',
    'Magicarpe': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png'
};
const CASINO_SHOP_ITEMS = [
    { key: 'abra', name: 'Abra', price: 250, type: 'pokemon', id: 63 },
    { key: 'candy', name: 'Super Bonbon', price: 500, type: 'item', itemKey: 'candy' },
    { key: 'scyther', name: 'Insecateur', price: 1000, type: 'pokemon', id: 123 },
    { key: 'dratini', name: 'Minidraco', price: 4000, type: 'pokemon', id: 147 },
    { key: 'porygon', name: 'Porygon', price: 5000, type: 'pokemon', id: 137 },
    { key: 'ctJackpot', name: 'CT Jackpot', price: 10000, type: 'upgrade', itemKey: 'ctJackpot' },
    { key: 'masterball', name: 'Master Ball', price: 40000, type: 'item', itemKey: 'masterball' }
];

let casinoTab = 'slots';
let slotsSpinning = false;
let casinoView = 'games';
const COIN_FACES = {
    face: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    pile: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
};

const blackjackState = {
    deck: [],
    player: [],
    dealer: [],
    active: false,
    bet: 0
};

function formatCasinoMoney(value) {
    if (typeof formatMoney === 'function') return formatMoney(value) + '$';
    const n = Number(value) || 0;
    return n.toLocaleString('fr-FR') + '$';
}

function updateCasinoUI() {
    const tokensEl = document.getElementById('casino-tokens');
    const buyBtn = document.getElementById('casino-buy-btn');
    const cashoutBtn = document.getElementById('casino-cashout-btn');
    if (tokensEl) tokensEl.innerText = state.casinoTokens || 0;
    if (buyBtn) {
        const canBuy = state.money >= CASINO_TOKEN_BUNDLE.cost;
        buyBtn.disabled = !canBuy;
        buyBtn.classList.toggle('opacity-60', !canBuy);
        buyBtn.classList.toggle('cursor-not-allowed', !canBuy);
    }
    if (cashoutBtn) {
        const canCashout = (state.casinoTokens || 0) >= CASINO_CASHOUT_RATE.tokens;
        cashoutBtn.disabled = !canCashout;
        cashoutBtn.classList.toggle('opacity-60', !canCashout);
        cashoutBtn.classList.toggle('cursor-not-allowed', !canCashout);
    }
    initSlotsReels();
    renderCasinoShop();
}

function buyCasinoTokens() {
    if (state.money < CASINO_TOKEN_BUNDLE.cost) {
        showFeedback("PAS ASSEZ D'ARGENT !", "red");
        return;
    }
    state.money -= CASINO_TOKEN_BUNDLE.cost;
    state.casinoTokens += CASINO_TOKEN_BUNDLE.tokens;
    showFeedback("+50 JETONS !", "green");
    updateUI();
    updateCasinoUI();
}

function cashOutCasinoTokens() {
    if ((state.casinoTokens || 0) < CASINO_CASHOUT_RATE.tokens) {
        showFeedback("PAS ASSEZ DE JETONS !", "red");
        return;
    }
    state.casinoTokens -= CASINO_CASHOUT_RATE.tokens;
    state.money += CASINO_CASHOUT_RATE.money;
    showFeedback("+1 000$ !", "green");
    updateUI();
    updateCasinoUI();
}

function showCasinoTab(tab) {
    casinoTab = tab;
    const tabs = ['slots', 'blackjack', 'coin'];
    tabs.forEach((t) => {
        const panel = document.getElementById(`casino-tab-${t}`);
        const btn = document.getElementById(`casino-tab-btn-${t}`);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        if (btn) {
            const active = t === tab;
            btn.classList.toggle('bg-emerald-700', active);
            btn.classList.toggle('border-emerald-500', active);
            btn.classList.toggle('text-white', active);
            if (active) {
                btn.classList.remove('bg-slate-800', 'border-slate-600');
            } else {
                btn.classList.add('bg-slate-800', 'border-slate-600');
            }
        }
    });
}

function showCasinoView(view) {
    casinoView = view;
    const gamesPanel = document.getElementById('casino-view-games');
    const shopPanel = document.getElementById('casino-view-shop');
    const gamesBtn = document.getElementById('casino-view-btn-games');
    const shopBtn = document.getElementById('casino-view-btn-shop');
    const isGames = view === 'games';

    if (gamesPanel) gamesPanel.classList.toggle('hidden', !isGames);
    if (shopPanel) shopPanel.classList.toggle('hidden', isGames);
    if (gamesBtn) {
        gamesBtn.classList.toggle('bg-emerald-700', isGames);
        gamesBtn.classList.toggle('border-emerald-500', isGames);
        if (isGames) {
            gamesBtn.classList.remove('bg-slate-800', 'border-slate-600');
        } else {
            gamesBtn.classList.add('bg-slate-800', 'border-slate-600');
        }
    }
    if (shopBtn) {
        shopBtn.classList.toggle('bg-emerald-700', !isGames);
        shopBtn.classList.toggle('border-emerald-500', !isGames);
        if (!isGames) {
            shopBtn.classList.remove('bg-slate-800', 'border-slate-600');
        } else {
            shopBtn.classList.add('bg-slate-800', 'border-slate-600');
        }
    }
    if (!isGames) renderCasinoShop();
}

function getBetFromInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return 0;
    const bet = parseInt(input.value, 10);
    if (!Number.isFinite(bet) || bet < 1) {
        showFeedback("MISE INVALIDE !", "red");
        return 0;
    }
    return bet;
}

function spendCasinoTokens(bet) {
    if (state.casinoTokens < bet) {
        showFeedback("PAS ASSEZ DE JETONS !", "red");
        return false;
    }
    state.casinoTokens -= bet;
    updateCasinoUI();
    return true;
}

function awardCasinoTokens(amount) {
    if (amount <= 0) return;
    state.casinoTokens += amount;
    updateCasinoUI();
}

function pickSlotSymbol() {
    const total = SLOT_WEIGHTS.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
        r -= SLOT_WEIGHTS[i];
        if (r <= 0) return SLOT_SYMBOLS[i];
    }
    return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

function spinSlotsFromUI() {
    const bet = getBetFromInput('slots-bet');
    if (!bet) return;
    spinSlots(bet);
}

function setSlotReelImage(index, symbol) {
    const img = document.getElementById(`slot-reel-img-${index}`);
    if (!img) return;
    img.src = SLOT_SPRITES[symbol] || "";
    img.alt = symbol;
    img.dataset.symbol = symbol;
}

function initSlotsReels() {
    if (document.getElementById('slot-reel-img-1')) {
        setSlotReelImage(1, 'Baie');
        setSlotReelImage(2, 'Magicarpe');
        setSlotReelImage(3, 'Pikachu');
    }
    const coinImg = document.getElementById('coin-img');
    if (coinImg && !coinImg.src) {
        coinImg.src = COIN_FACES.face;
        coinImg.alt = 'face';
    }
}

function getCasinoPokemonGender(id) {
    if (GENDERLESS_IDS && GENDERLESS_IDS.includes(id)) return 'genderless';
    if (ALWAYS_MALE_IDS && ALWAYS_MALE_IDS.includes(id)) return 'male';
    if (ALWAYS_FEMALE_IDS && ALWAYS_FEMALE_IDS.includes(id)) return 'female';
    return Math.random() < 0.5 ? 'male' : 'female';
}

function buyCasinoShopItem(key) {
    const item = CASINO_SHOP_ITEMS.find((entry) => entry.key === key);
    if (!item) return;
    if ((state.casinoTokens || 0) < item.price) {
        showFeedback("PAS ASSEZ DE JETONS !", "red");
        return;
    }
    if (item.type === 'upgrade' && state.upgrades[item.itemKey]) {
        showFeedback("DÉJÀ ACQUIS !", "red");
        return;
    }

    state.casinoTokens -= item.price;
    if (item.type === 'pokemon') {
        const gender = getCasinoPokemonGender(item.id);
        const name = item.name;
        if (state.team.length < 6) {
            addToTeam(item.id, name, 25, false, gender);
        } else {
            addToPC(item.id, name, 25, false, gender);
        }
        if (typeof addToPokedex === 'function') addToPokedex(item.id);
        showFeedback(`+${name} !`, "green");
    } else if (item.type === 'item') {
        const invKey = ITEMS[item.itemKey].invKey;
        state.inv[invKey] = (state.inv[invKey] || 0) + 1;
        showFeedback(`+1 ${ITEMS[item.itemKey].name} !`, "green");
        renderBag();
    } else if (item.type === 'upgrade') {
        state.upgrades[item.itemKey] = true;
        showFeedback("CT JACKPOT OBTENUE !", "green");
        renderBag();
    }

    updateUI();
    updateCasinoUI();
    renderCasinoShop();
}

function renderCasinoShop() {
    const list = document.getElementById('casino-shop-list');
    if (!list) return;

    let html = "";
    CASINO_SHOP_ITEMS.forEach((entry) => {
        const isUpgradeOwned = entry.type === 'upgrade' && state.upgrades[entry.itemKey];
        const canAfford = (state.casinoTokens || 0) >= entry.price;
        let iconHtml = "";

        if (entry.type === 'pokemon') {
            iconHtml = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png" class="w-8 h-8">`;
        } else if (entry.type === 'item' || entry.type === 'upgrade') {
            const item = ITEMS[entry.itemKey];
            if (item && item.img) iconHtml = `<img src="${item.img}" class="w-8 h-8">`;
            else if (item && item.icon) iconHtml = `<span class="material-symbols-outlined ${item.iconColor || 'text-white'}">${item.icon}</span>`;
        }

        const priceClass = canAfford ? "text-emerald-400" : "text-red-400";
        const btnClasses = isUpgradeOwned ? "bg-slate-700 text-gray-500 border-slate-600 cursor-not-allowed opacity-60" :
            canAfford ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500" :
            "bg-slate-700 text-gray-400 border-slate-600 cursor-not-allowed opacity-60";

        const btnText = isUpgradeOwned ? "ACQUIS" : "ACHETER";

        html += `
        <div class="bg-slate-800/70 border border-slate-700 rounded p-2 flex items-center gap-3">
            ${iconHtml}
            <div class="flex-1 min-w-0">
                <div class="text-xs text-white font-bold truncate">${entry.name}</div>
                <div class="text-[9px] text-gray-400">${entry.type === 'pokemon' ? 'Pokémon niv. 25' : entry.type === 'item' ? 'Objet' : 'Amélioration'}</div>
            </div>
            <div class="text-[9px] font-bold ${priceClass}">${entry.price} jetons</div>
            <button class="text-[9px] font-bold px-2 py-1 rounded border ${btnClasses}" onclick="buyCasinoShopItem('${entry.key}')">${btnText}</button>
        </div>`;
    });

    list.innerHTML = html;
}

function spinSlots(bet) {
    if (slotsSpinning) return;
    if (!spendCasinoTokens(bet)) return;
    slotsSpinning = true;

    const results = [pickSlotSymbol(), pickSlotSymbol(), pickSlotSymbol()];
    const intervals = [];
    const stopDelays = [700, 950, 1200];

    for (let i = 1; i <= 3; i++) {
        intervals[i] = setInterval(() => {
            setSlotReelImage(i, pickSlotSymbol());
        }, 80);
    }

    let stopped = 0;
    const finishSpin = () => {
        const finalSymbols = [1, 2, 3].map((i) => {
            const img = document.getElementById(`slot-reel-img-${i}`);
            return img && img.dataset.symbol ? img.dataset.symbol : results[i - 1];
        });
        let payoutMult = 0;
        let resultText = "Perdu...";
        if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
            const sym = finalSymbols[0];
            if (sym === '7') payoutMult = 500;
            else if (sym === 'Pikachu') payoutMult = 50;
            else if (sym === 'Staross') payoutMult = 20;
            else if (sym === 'Baie') payoutMult = 10;
            else if (sym === 'Magicarpe') payoutMult = 5;
            resultText = `Gagne x${payoutMult} !`;
        } else {
            const berryCount = finalSymbols.filter((s) => s === 'Baie').length;
            if (berryCount === 2) {
                payoutMult = 2;
                resultText = "Baie x2 !";
            }
        }

        if (payoutMult > 0) {
            awardCasinoTokens(bet * payoutMult);
        }

        const resultEl = document.getElementById('slots-result');
        if (resultEl) resultEl.innerText = resultText;
        slotsSpinning = false;
    };

    results.forEach((symbol, idx) => {
        setTimeout(() => {
            clearInterval(intervals[idx + 1]);
            setSlotReelImage(idx + 1, symbol);
            stopped += 1;
            if (stopped === 3) finishSpin();
        }, stopDelays[idx]);
    });
}

function buildBlackjackDeck() {
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    ranks.forEach((rank) => {
        suits.forEach((suit) => {
            let value = parseInt(rank, 10);
            if (rank === 'A') value = 11;
            else if (['J', 'Q', 'K'].includes(rank)) value = 10;
            deck.push({ rank, suit, value, label: `${rank}-${suit}` });
        });
    });
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function drawBlackjackCard() {
    if (blackjackState.deck.length === 0) {
        blackjackState.deck = buildBlackjackDeck();
    }
    return blackjackState.deck.pop();
}

function getHandValue(hand) {
    let total = 0;
    let aces = 0;
    hand.forEach((card) => {
        total += card.value;
        if (card.rank === 'A') aces += 1;
    });
    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }
    return total;
}

function renderBlackjackHands() {
    const playerEl = document.getElementById('blackjack-player-cards');
    const dealerEl = document.getElementById('blackjack-dealer-cards');
    const playerTotalEl = document.getElementById('blackjack-player-total');
    const dealerTotalEl = document.getElementById('blackjack-dealer-total');

    if (playerEl) {
        playerEl.innerHTML = blackjackState.player.map((c) => `<span class="px-1 py-0.5 bg-slate-900 border border-slate-600 rounded">${c.label}</span>`).join("");
    }
    if (dealerEl) {
        dealerEl.innerHTML = blackjackState.dealer.map((c) => `<span class="px-1 py-0.5 bg-slate-900 border border-slate-600 rounded">${c.label}</span>`).join("");
    }
    if (playerTotalEl) playerTotalEl.innerText = getHandValue(blackjackState.player);
    if (dealerTotalEl) dealerTotalEl.innerText = getHandValue(blackjackState.dealer);
}

function setBlackjackButtons(active) {
    const hitBtn = document.getElementById('blackjack-hit-btn');
    const standBtn = document.getElementById('blackjack-stand-btn');
    const startBtn = document.getElementById('blackjack-start-btn');
    if (hitBtn) {
        hitBtn.disabled = !active;
        hitBtn.classList.toggle('opacity-60', !active);
    }
    if (standBtn) {
        standBtn.disabled = !active;
        standBtn.classList.toggle('opacity-60', !active);
    }
    if (startBtn) {
        startBtn.disabled = active;
        startBtn.classList.toggle('opacity-60', active);
    }
}

function startBlackjackFromUI() {
    const bet = getBetFromInput('blackjack-bet');
    if (!bet) return;
    startBlackjack(bet);
}

function startBlackjack(bet) {
    if (blackjackState.active) return;
    if (!spendCasinoTokens(bet)) return;

    blackjackState.bet = bet;
    blackjackState.active = true;
    blackjackState.deck = buildBlackjackDeck();
    blackjackState.player = [drawBlackjackCard(), drawBlackjackCard()];
    blackjackState.dealer = [drawBlackjackCard()];
    renderBlackjackHands();
    setBlackjackButtons(true);

    const playerTotal = getHandValue(blackjackState.player);
    if (playerTotal === 21 && blackjackState.player.length === 2) {
        endBlackjackRound("Blackjack ! x2.5", 2.5);
    } else {
        const resultEl = document.getElementById('blackjack-result');
        if (resultEl) resultEl.innerText = "A toi de jouer.";
    }
}

function blackjackHit() {
    if (!blackjackState.active) return;
    blackjackState.player.push(drawBlackjackCard());
    renderBlackjackHands();
    const total = getHandValue(blackjackState.player);
    if (total > 21) {
        endBlackjackRound("Bust ! Perdu.", 0);
    }
}

function blackjackStand() {
    if (!blackjackState.active) return;
    while (getHandValue(blackjackState.dealer) < 17) {
        blackjackState.dealer.push(drawBlackjackCard());
    }
    renderBlackjackHands();
    const playerTotal = getHandValue(blackjackState.player);
    const dealerTotal = getHandValue(blackjackState.dealer);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        endBlackjackRound("Gagne x2 !", 2);
    } else if (playerTotal === dealerTotal) {
        endBlackjackRound("Egalite. Mise rendue.", 1);
    } else {
        endBlackjackRound("Perdu.", 0);
    }
}

function endBlackjackRound(message, payoutMult) {
    if (payoutMult > 0) {
        awardCasinoTokens(blackjackState.bet * payoutMult);
    }
    blackjackState.active = false;
    blackjackState.bet = 0;
    setBlackjackButtons(false);
    const resultEl = document.getElementById('blackjack-result');
    if (resultEl) resultEl.innerText = message;
}

function playCoinFlipFromUI(choice) {
    const bet = getBetFromInput('coin-bet');
    if (!bet) return;
    playCoinFlip(bet, choice);
}

function playCoinFlip(bet, choice) {
    if (!spendCasinoTokens(bet)) return;
    const coinEl = document.getElementById('coin-display');
    const resultEl = document.getElementById('coin-result');
    if (coinEl) {
        coinEl.classList.remove('coin-blink', 'coin-spin');
        void coinEl.offsetWidth;
        coinEl.classList.add('coin-spin');
    }

    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'face' : 'pile';
        const coinImg = document.getElementById('coin-img');
        if (coinImg) {
            coinImg.src = COIN_FACES[result];
            coinImg.alt = result;
        }
        if (result === choice) {
            awardCasinoTokens(bet * 2);
            if (resultEl) resultEl.innerText = "Gagne x2 !";
        } else {
            if (resultEl) resultEl.innerText = "Perdu.";
        }
    }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    showCasinoView(casinoView);
    showCasinoTab(casinoTab);
    updateCasinoUI();
    setBlackjackButtons(false);
    renderCasinoShop();
});
