/* Casino, ticket C : comportement commun des trois maquettes (rouleaux, blackjack, pile ou face, boutique, jetons).
   Règles reprises de data/casino.json (ticket B). Maquette : rien n'est sauvegardé, tout est local à la page. */
(function () {
  'use strict';
  var IMG = '../../../public/img/';
  var PRIX_JETON = 20, LOT = 50, CADEAU = 100;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString('fr-FR'); };
  var rand = function (n) { return Math.floor(Math.random() * n); };
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var etat = { jetons: 240, argent: 84500, cadeau: false, acquis: {} };

  var SYMBOLES = [
    { id: '7', nom: '7', image: 'objets/master-ball.png', poids: 1, gain: 500 },
    { id: 'Pikachu', nom: 'Pikachu', image: 'pokemon/25', poids: 6, gain: 50 },
    { id: 'Staross', nom: 'Staross', image: 'pokemon/121', poids: 10, gain: 25 },
    { id: 'Baie', nom: 'Baie', image: 'objets/cheri-berry.png', poids: 18, gain: 15 },
    { id: 'Magicarpe', nom: 'Magicarpe', image: 'pokemon/129', poids: 65, gain: 2 }
  ];
  var BOUTIQUE = [
    { key: 'abra', nom: 'Abra', prix: 250, image: 'pokemon/63' },
    { key: 'candy', nom: 'Super Bonbon', prix: 500, image: 'objets/rare-candy.png', desc: 'Fait monter un Pokémon de niveau' },
    { key: 'scyther', nom: 'Insecateur', prix: 1000, image: 'pokemon/123' },
    { key: 'dratini', nom: 'Minidraco', prix: 4000, image: 'pokemon/147' },
    { key: 'porygon', nom: 'Porygon', prix: 5000, image: 'pokemon/137' },
    { key: 'ctJackpot', nom: 'CT Jackpot', prix: 10000, image: null, desc: "Gains d'argent +20 %", unique: true },
    { key: 'masterball', nom: 'Master Ball', prix: 40000, image: 'objets/master-ball.png', desc: 'Capture à coup sûr (100 %)' }
  ];
  function src(chemin) { return chemin.indexOf('pokemon/') === 0 ? IMG + 'sprites/' + chemin + '.png' : IMG + chemin; }
  function imgTag(chemin, alt) { var sp = chemin.indexOf('pokemon/') === 0; return '<img class="px ' + (sp ? 'sprite' : 'objet') + '" src="' + src(chemin) + '" alt="' + (alt || '') + '" width="' + (sp ? 96 : 30) + '" height="' + (sp ? 96 : 30) + '">'; }

  /* ---- sprite SVG (couleurs des cartes, icônes de navigation) ---- */
  var ICONES = {
    combat: '<path d="m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6"/>',
    equipe: '<path d="M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z"/>',
    pc: '<path d="M3 4h18v12H3zM8 20h8M12 16v4"/>',
    shop: '<path d="M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3"/>',
    carte: '<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17"/>',
    menu: '<path d="M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z"/>',
    salle: '<path d="M3 11 12 3l9 8M5 10v10h14V10M10 20v-6h4v6"/>',
    slots: '<path d="M4 3h16v15H4zM8 7v7M12 7v7M16 7v7M8 18v3M16 18v3M20 8h2v5h-2"/>',
    bj: '<path d="M6 4h9v14H6zM9 7h3M18 7l3 1-3 11-3-1"/>',
    pile: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h6M9 14h6"/>',
    roulette: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    plusmoins: '<path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4"/>',
    gratte: '<path d="M3 6h18v12H3zM9 6v12M15 6v12M3 12h18"/>',
    retour: '<path d="m15 5-7 7 7 7"/>'
  };
  function ic(nom) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nom] + '</svg>'; }
  function suitSprite() {
    var d = document.createElement('div');
    d.hidden = true;
    d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<symbol id="s-coeur" viewBox="0 0 24 24"><path d="M12 21 3.5 12.5A5.2 5.2 0 0 1 12 6.2a5.2 5.2 0 0 1 8.5 6.3Z"/></symbol>' +
      '<symbol id="s-pique" viewBox="0 0 24 24"><path d="M12 2c4 4.500 8 7 8 11a4.500 4.500 0 0 1-7.500 3.300L14 22H10l1.500-5.700A4.500 4.500 0 0 1 4 13c0-4 4-6.500 8-11Z"/></symbol>' +
      '<symbol id="s-carreau" viewBox="0 0 24 24"><path d="M12 2 20 12 12 22 4 12Z"/></symbol>' +
      '<symbol id="s-trefle" viewBox="0 0 24 24"><path d="M12 3a4 4 0 0 0-3.200 6.400A4.500 4.500 0 1 0 11 16.800L10 22h4l-1-5.200a4.500 4.500 0 1 0 2.200-7.400A4 4 0 0 0 12 3Z"/></symbol>' +
      '<symbol id="i-ok" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
      '<symbol id="i-non" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>' +
      '<symbol id="i-egal" viewBox="0 0 24 24"><path d="M5 9h14M5 15h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>' +
      '</defs></svg>';
    document.body.insertBefore(d, document.body.firstChild);
  }
  function suitUse(c) { return '<svg class="suit" viewBox="0 0 24 24" aria-hidden="true"><use href="#s-' + c + '"/></svg>'; }
  function icoIssue(t) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="width:1rem;height:1rem"><use href="#i-' + (t === 'gain' ? 'ok' : t === 'perte' ? 'non' : 'egal') + '"/></svg>'; }

  /* ---- coquille : bandeau et navigation ---- */
  function bandeau() {
    var h = $('[data-bandeau]'); if (!h) return;
    var avecJetons = h.getAttribute('data-bandeau') === 'jetons';
    var lieu = h.getAttribute('data-lieu') || 'Céladopole';
    h.className = 'bandeau'; h.setAttribute('role', 'banner');
    h.innerHTML = (avecJetons ? '<span class="lieu">Casino</span>' : '<span class="lieu">' + lieu + '</span>') +
      (avecJetons ? '<span class="chiffre"><span class="jeton" style="vertical-align:middle"></span> <span data-jetons></span></span>' : '<span class="doux">DPS <span class="chiffre">1 240</span></span>') +
      '<span class="chiffre"><span data-argent></span> ₽</span>';
  }
  function navPrincipale() {
    var n = $('[data-nav="principale"]'); if (!n) return;
    n.className = 'principale'; n.setAttribute('aria-label', 'Navigation principale');
    var e = [['combat', 'Combat'], ['equipe', 'Équipe'], ['shop', 'Shop'], ['carte', 'Carte'], ['menu', 'Menu']];
    var pc = window.matchMedia && matchMedia('(min-width: 64rem)').matches;
    var liste = pc ? [['combat', 'Combat'], ['equipe', 'Équipe'], ['pc', 'PC'], ['shop', 'Shop'], ['carte', 'Carte'], ['menu', 'Menu']] : e;
    n.innerHTML = '<span class="marque">PokiClicker</span>' + liste.map(function (x) {
      return '<button type="button"' + (x[0] === 'carte' ? ' aria-current="page"' : '') + '>' + ic(x[0]) + '<span>' + x[1] + '</span></button>';
    }).join('') + '<button type="button" class="menu-principal">' + ic('retour') + '<span>Menu principal</span></button>';
  }
  var navTimer;
  window.addEventListener('resize', function () { clearTimeout(navTimer); navTimer = setTimeout(navPrincipale, 150); });

  /* ---- vues (salle, jeux, boutique) ---- */
  function aller(nom) {
    $$('[data-vue]').forEach(function (v) { v.hidden = v.getAttribute('data-vue') !== nom; });
    $$('[data-va]').forEach(function (b) { var on = b.getAttribute('data-va') === nom; b.setAttribute('aria-current', on ? 'true' : 'false'); if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    document.body.setAttribute('data-vue', nom);
    $$('.barre-jeux [aria-current="true"]').forEach(function (b) { try { b.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* ancien navigateur */ } });
    try { if (location.hash !== '#' + nom) history.replaceState(null, '', location.pathname + location.search + '#' + nom); } catch (e) { /* file:// : on s'en passe */ }
    window.scrollTo(0, 0);
  }
  function depuisHash() { var h = (location.hash || '').replace('#', ''); return $('[data-vue="' + h + '"]') ? h : 'salle'; }

  /* ---- soldes ---- */
  function maj() {
    $$('[data-jetons]').forEach(function (e) { e.textContent = fmt(etat.jetons); });
    $$('[data-argent]').forEach(function (e) { e.textContent = fmt(etat.argent); });
    var nb = nbJetons();
    $$('[data-cout]').forEach(function (e) { e.textContent = fmt(nb * PRIX_JETON) + ' ₽'; });
    $$('[data-recu]').forEach(function (e) { e.textContent = fmt(nb * PRIX_JETON) + ' ₽'; });
    $$('[data-acheter]').forEach(function (b) { b.disabled = !(nb > 0 && nb * PRIX_JETON <= etat.argent); });
    $$('[data-racheter]').forEach(function (b) { b.disabled = !(nb > 0 && nb <= etat.jetons); });
    $$('[data-lot]').forEach(function (b) { b.disabled = LOT * PRIX_JETON > etat.argent; });
    var aide = '';
    if (nb > 0 && nb * PRIX_JETON > etat.argent) aide = 'Pas assez d’argent pour acheter ' + fmt(nb) + ' jetons (il te manque ' + fmt(nb * PRIX_JETON - etat.argent) + ' ₽).';
    else if (nb > etat.jetons) aide = 'Tu n’as que ' + fmt(etat.jetons) + ' jetons à racheter.';
    $$('[data-aide-echange]').forEach(function (e) { e.textContent = aide; });
    majBoutique();
    majBj();
  }
  function dire(zone, txt, ton) { $$('[data-verdict="' + zone + '"]').forEach(function (e) { e.textContent = txt; if (ton) e.setAttribute('data-ton', ton); else e.removeAttribute('data-ton'); }); }

  /* ---- gabarits ---- */
  function miseHTML(jeu) {
    return '<div class="mise" data-jeu="' + jeu + '"><div class="mise-label"><span>Mise en jetons</span><span>Tu as <span data-jetons></span></span></div>' +
      '<div class="stepper"><button type="button" class="plaque" data-mise-pas="-1" aria-label="Un jeton de moins">−</button>' +
      '<input class="champ" data-mise-champ inputmode="numeric" pattern="[0-9]*" value="10" aria-label="Mise en jetons"><button type="button" class="plaque" data-mise-pas="1" aria-label="Un jeton de plus">+</button></div>' +
      '<div class="rapides"><button type="button" class="plaque" data-mise-rapide="1">1</button><button type="button" class="plaque" data-mise-rapide="5">5</button><button type="button" class="plaque" data-mise-rapide="10">10</button><button type="button" class="plaque" data-mise-rapide="50">50</button><button type="button" class="plaque" data-mise-rapide="max">Max</button></div></div>';
  }
  var GABARITS = {
    caisse: function () {
      return '<section class="caisse cadre" aria-labelledby="t-caisse"><h2 id="t-caisse">Tes jetons</h2>' +
        '<dl class="soldes"><div><dt>Jetons</dt><dd><span class="jeton gros"></span><span data-jetons></span></dd></div><div><dt>Pokédollars</dt><dd><span><span data-argent></span> ₽</span></dd></div></dl>' +
        '<div class="echange"><label for="nb-jetons">Combien de jetons ?</label>' +
        '<div class="stepper"><button type="button" class="plaque" data-pas="-10" aria-label="10 jetons de moins">−</button><input id="nb-jetons" class="champ" data-nb-jetons inputmode="numeric" pattern="[0-9]*" value="50"><button type="button" class="plaque" data-pas="10" aria-label="10 jetons de plus">+</button></div>' +
        '<div class="rapides"><button type="button" class="plaque" data-rapide="10">10</button><button type="button" class="plaque" data-rapide="50">50</button><button type="button" class="plaque" data-rapide="100">100</button><button type="button" class="plaque" data-rapide="500">500</button><button type="button" class="plaque" data-rapide="max">Max</button></div>' +
        '<p class="prix"><span>' + PRIX_JETON + ' ₽ le jeton.</span> <span>Achat : <b data-cout></b></span> <span>Rachat : <b data-recu></b></span></p>' +
        '<div class="actions-echange"><button type="button" class="plaque" data-acheter>Acheter</button><button type="button" class="plaque" data-racheter>Racheter</button></div>' +
        '<button type="button" class="plaque" data-lot>Lot de ' + LOT + ' jetons · ' + fmt(LOT * PRIX_JETON) + ' ₽</button>' +
        '<p class="rappel" data-aide-echange></p><p class="verdict" data-verdict="caisse" aria-live="polite"></p></div>' +
        '<p class="rappel">Argent virtuel uniquement : aucun paiement réel.</p></section>';
    },
    cadeau: function () {
      return '<section class="cadeau cadre-alerte" data-cadeau aria-label="Cadeau de bienvenue"><p><b>Cadeau de bienvenue :</b> ' + CADEAU + ' jetons offerts pour ta première visite.</p><button type="button" class="plaque" data-cadeau-btn>Récupérer mes ' + CADEAU + ' jetons</button></section>';
    },
    slots: function () {
      var lignes = SYMBOLES.map(function (s) { return '<li>' + imgTag(s.image, '') + '<span>' + s.nom + ' ×3</span><span class="mult">×' + s.gain + '</span></li>'; }).join('') +
        '<li>' + imgTag('objets/cheri-berry.png', '') + '<span>Baie ×2</span><span class="mult">×3</span></li>';
      return '<div class="jeu jeu-slots"><div class="plateau" data-pluie><h2 class="jeu-titre">Machine à sous</h2><div class="reels" data-reels><div class="rouleau" data-reel></div><div class="rouleau" data-reel></div><div class="rouleau" data-reel></div></div>' +
        '<p class="verdict" data-verdict="slots" aria-live="polite">Choisis ta mise et lance.</p></div>' +
        '<div class="commandes">' + miseHTML('slots') + '<button type="button" class="plaque plaque-action grand" data-tirer>Lancer</button>' +
        '<details class="gains"><summary>Gains de la machine</summary><ul>' + lignes + '</ul></details></div></div>';
    },
    bj: function () {
      return '<div class="jeu jeu-bj"><div class="plateau tapis" data-pluie>' +
        '<div class="croupier"><div class="etiquette"><b>Croupier Rocket</b><span class="pastille" data-total-croupier hidden></span></div><div class="cartes" data-main-croupier aria-label="Cartes du croupier"></div></div>' +
        '<p class="verdict" data-verdict="bj" aria-live="polite">Choisis ta mise et distribue.</p>' +
        '<div class="mains" data-mains data-nb="1" aria-label="Tes mains"></div></div>' +
        '<div class="commandes"><div data-bloc-mise>' + miseHTML('bj') + '<button type="button" class="plaque plaque-action grand" data-donne style="margin-top:calc(var(--spacing) * 3)">Distribuer</button></div>' +
        '<div class="actions-bj" data-actions hidden>' +
        '<button type="button" class="plaque plaque-action" data-act="tirer">Tirer</button><button type="button" class="plaque" data-act="rester">Rester</button>' +
        '<button type="button" class="plaque" data-act="doubler">Doubler</button><button type="button" class="plaque" data-act="separer">Séparer</button>' +
        '<button type="button" class="plaque" data-act="assurance">Assurance</button><button type="button" class="plaque" data-act="abandon">Abandon</button>' +
        '<button type="button" class="plaque large" data-act="refuser">Sans assurance</button></div>' +
        '<p class="aide-bj" data-aide-bj></p>' +
        '<details class="outil-maquette"><summary>Maquette : choisir la main</summary><select data-demo aria-label="Main de départ"><option value="">Au hasard</option><option value="separer">Paire de 8 (séparer)</option><option value="assurance">As du croupier (assurance)</option><option value="naturel">Blackjack naturel</option><option value="doubler">11 contre 6 (doubler)</option></select></details></div></div>';
    },
    coin: function () {
      return '<div class="jeu jeu-coin"><div class="plateau" data-pluie><h2 class="jeu-titre">Pile ou face</h2><div class="piece-scene"><div class="piece" data-piece>' +
        '<div class="face f-face"><img class="px" src="' + IMG + 'sprites/pokemon/25.png" alt="Face : Pikachu" width="96" height="96"></div>' +
        '<div class="face f-pile"><img class="px" src="' + IMG + 'objets/poke-ball.png" alt="Pile : Poké Ball" width="30" height="30"></div></div></div>' +
        '<p class="verdict" data-verdict="coin" aria-live="polite">Choisis ton côté, puis lance.</p></div>' +
        '<div class="commandes">' + miseHTML('coin') + '<div class="choix" role="group" aria-label="Ton côté"><button type="button" class="plaque" data-choix="face" aria-pressed="true">Face<small>Pikachu</small></button><button type="button" class="plaque" data-choix="pile" aria-pressed="false">Pile<small>Poké Ball</small></button></div>' +
        '<button type="button" class="plaque plaque-action grand" data-lancer>Lancer la pièce</button><p class="rappel">Gain ×2 si tu trouves le bon côté.</p></div></div>';
    },
    roulette: function () {
      var poches = ORDRE.map(function (n, i) { return '<i class="poche" data-n="' + n + '" data-c="' + couleurN(n) + '" style="--a:' + (i * 360 / 37).toFixed(3) + 'deg"></i>'; }).join('');
      return '<div class="jeu jeu-roulette"><div class="plateau tapis" data-pluie><h2 class="jeu-titre">Roulette</h2>' +
        '<div class="roue" data-roue role="img" aria-label="Roue de roulette à 37 cases"><div class="poches">' + poches + '</div><div class="piste" data-piste><span class="bille"></span></div><div class="centre" data-c="vert"><b data-sortie>0</b></div></div>' +
        '<p class="verdict" data-verdict="roulette" aria-live="polite">Choisis ta mise sur la table, puis lance la bille.</p></div>' +
        '<div class="commandes">' + miseHTML('roulette') +
        '<div class="paris" role="group" aria-label="Ta mise sur la table">' +
        '<button type="button" class="plaque" data-pari="rouge" aria-pressed="true"><span class="puce" data-c="rouge"></span>Rouge<small>×2</small></button>' +
        '<button type="button" class="plaque" data-pari="noir" aria-pressed="false"><span class="puce" data-c="noir"></span>Noir<small>×2</small></button>' +
        '<button type="button" class="plaque" data-pari="pair" aria-pressed="false">Pair<small>×2</small></button>' +
        '<button type="button" class="plaque" data-pari="impair" aria-pressed="false">Impair<small>×2</small></button>' +
        '<button type="button" class="plaque large" data-pari="plein" aria-pressed="false">Numéro plein<small>×36</small></button></div>' +
        '<div class="numero" data-numero hidden><label for="num-plein">Ton numéro</label><div class="stepper"><button type="button" class="plaque" data-num-pas="-1" aria-label="Numéro précédent">−</button><input id="num-plein" class="champ" data-num-champ inputmode="numeric" pattern="[0-9]*" value="17"><button type="button" class="plaque" data-num-pas="1" aria-label="Numéro suivant">+</button></div></div>' +
        '<button type="button" class="plaque plaque-action grand" data-lancer-roulette>Lancer la bille</button>' +
        '<details class="gains"><summary>Gains de la roulette</summary><ul>' +
        '<li><span class="puce" data-c="rouge"></span><span class="puce" data-c="noir"></span><span>Rouge ou noir</span><span class="mult">×2</span></li>' +
        '<li><span>Pair ou impair</span><span class="mult">×2</span></li><li><span>Numéro plein (0 à 36)</span><span class="mult">×36</span></li>' +
        '<li><span class="puce" data-c="vert"></span><span>Le 0 perd les mises simples</span></li></ul></details></div></div>';
    },
    pm: function () {
      var fl = function (haut) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (haut ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7') + '"/></svg>'; };
      return '<div class="jeu jeu-pm"><div class="plateau tapis" data-pluie><h2 class="jeu-titre">Plus ou moins</h2>' +
        '<div class="pm-table"><div class="pm-colonne"><span class="etiquette-pm">Carte visible</span><div class="cartes" data-pm-visible></div></div>' +
        '<div class="pm-colonne"><span class="etiquette-pm">Carte suivante</span><div class="cartes" data-pm-suivante></div></div></div>' +
        '<p class="verdict" data-verdict="pm" aria-live="polite">La suivante sera-t-elle plus haute ou plus basse ?</p></div>' +
        '<div class="commandes">' + miseHTML('pm') +
        '<div class="pm-boutons"><button type="button" class="plaque" data-pm="haut"><span class="pm-lib">' + fl(true) + 'Plus haut</span><b class="gain" data-pm-gain="haut"></b><small data-pm-rend="haut"></small></button>' +
        '<button type="button" class="plaque" data-pm="bas"><span class="pm-lib">' + fl(false) + 'Plus bas</span><b class="gain" data-pm-gain="bas"></b><small data-pm-rend="bas"></small></button></div>' +
        '<p class="rappel" data-aide-pm></p><p class="rappel">As = 1, Roi = 13. Égalité : tu perds.</p>' +
        '<details class="outil-maquette"><summary>Maquette : choisir la carte</summary><select data-pm-depart aria-label="Carte visible au départ"><option value="">Au hasard</option><option value="A">As (plus bas impossible)</option><option value="7">7</option><option value="K">Roi (plus haut impossible)</option></select></details></div></div>';
    },
    gratte: function () {
      var lignes = SYMBOLES.map(function (s) { return '<li>' + imgTag(s.image, '') + '<span>3 ou plus : ' + s.nom + '</span><span class="mult">×' + s.gain + '</span></li>'; }).join('');
      return '<div class="jeu jeu-gratte"><div class="plateau" data-pluie><h2 class="jeu-titre">Carte à gratter</h2>' +
        '<div class="ticket"><div class="ticket-tete"><b>Carte à gratter</b><span>3 symboles identiques ou plus : tu gagnes</span></div><div class="cases" data-cases></div></div>' +
        '<p class="verdict" data-verdict="gratte" aria-live="polite">Achète une carte, puis gratte les 6 cases.</p></div>' +
        '<div class="commandes">' + miseHTML('gratte') +
        '<button type="button" class="plaque plaque-action grand" data-acheter-carte>Acheter une carte</button>' +
        '<button type="button" class="plaque" data-tout-gratter disabled>Tout gratter</button>' +
        '<div class="gains gains-ouvert"><h3>Tableau des gains</h3><ul>' + lignes + '</ul></div></div></div>';
    },
    boutique: function () {
      return '<div class="jeu jeu-boutique"><div class="plateau"><h2 class="jeu-titre">Boutique de jetons</h2><p class="doux">Tu as <b class="chiffre" data-jetons></b> jetons.</p><ul class="produits" data-boutique></ul><p class="verdict verdict-boutique" data-verdict="boutique" aria-live="polite"></p></div></div>';
    }
  };
  function gabarits() { $$('[data-gabarit]').forEach(function (e) { var g = GABARITS[e.getAttribute('data-gabarit')]; if (g) e.innerHTML = g(); }); }

  /* ---- jetons ---- */
  function nbJetons() { var c = $('[data-nb-jetons]'); return c ? Math.max(0, parseInt(c.value, 10) || 0) : 0; }
  function brancherJetons() {
    $$('[data-nb-jetons]').forEach(function (c) { c.addEventListener('input', maj); });
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var c = $('[data-nb-jetons]');
      if (b.hasAttribute('data-pas') && c) { c.value = Math.max(0, nbJetons() + parseInt(b.getAttribute('data-pas'), 10)); maj(); }
      else if (b.hasAttribute('data-rapide') && c) { var v = b.getAttribute('data-rapide'); c.value = v === 'max' ? Math.max(1, Math.floor(etat.argent / PRIX_JETON)) : v; maj(); }
      else if (b.hasAttribute('data-acheter')) { var n = nbJetons(); etat.argent -= n * PRIX_JETON; etat.jetons += n; maj(); dire('caisse', '+' + fmt(n) + ' jetons !', 'gain'); }
      else if (b.hasAttribute('data-racheter')) { var m = nbJetons(); etat.jetons -= m; etat.argent += m * PRIX_JETON; maj(); dire('caisse', '+' + fmt(m * PRIX_JETON) + ' ₽ !', 'gain'); }
      else if (b.hasAttribute('data-lot')) { etat.argent -= LOT * PRIX_JETON; etat.jetons += LOT; maj(); dire('caisse', '+' + LOT + ' jetons !', 'gain'); }
      else if (b.hasAttribute('data-cadeau-btn')) { etat.jetons += CADEAU; etat.cadeau = true; $$('[data-cadeau]').forEach(function (e) { e.hidden = true; }); maj(); dire('caisse', '+' + CADEAU + ' jetons offerts !', 'gain'); }
      else if (b.hasAttribute('data-mise-pas')) { var m1 = b.closest('.mise'); var ch = $('[data-mise-champ]', m1); ch.value = Math.max(1, (parseInt(ch.value, 10) || 0) + parseInt(b.getAttribute('data-mise-pas'), 10)); }
      else if (b.hasAttribute('data-mise-rapide')) { var m2 = b.closest('.mise'); var ch2 = $('[data-mise-champ]', m2); var r = b.getAttribute('data-mise-rapide'); ch2.value = r === 'max' ? Math.max(1, etat.jetons) : r; }
    });
  }
  function lireMise(jeu) { var ch = $('[data-jeu="' + jeu + '"] [data-mise-champ]'); return ch ? Math.max(0, parseInt(ch.value, 10) || 0) : 0; }
  function miseOk(jeu) {
    var m = lireMise(jeu);
    if (m < 1) { dire(jeu, 'Mise invalide.', 'perte'); return 0; }
    if (m > etat.jetons) { dire(jeu, 'Pas assez de jetons.', 'perte'); return 0; }
    return m;
  }

  /* ---- pièces qui tombent ---- */
  function pluie(zone, n) {
    if (reduit || !zone) return;
    var h = zone.offsetHeight || 300, w = zone.offsetWidth || 300;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span'); p.className = 'piece-chute'; p.style.left = rand(Math.max(10, w - 28)) + 'px'; zone.appendChild(p);
      var a = p.animate([{ transform: 'translateY(-30px)', opacity: 1 }, { transform: 'translateY(' + (h + 10) + 'px)', opacity: 1 }], { duration: 500 + rand(600), delay: rand(300), easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' });
      a.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }

  /* ---- machine à sous ---- */
  var enCours = false;
  function poserBande(reel, idx) {
    var cells = '';
    for (var t = 0; t < 2; t++) SYMBOLES.forEach(function (s) { cells += '<span class="cell">' + imgTag(s.image, '') + '</span>'; });
    reel.innerHTML = '<span class="bande">' + cells + '</span>';
    reel.setAttribute('aria-label', SYMBOLES[idx].nom);
    reel.firstChild.style.transform = 'translateY(' + (-idx * cellule(reel)) + 'px)';
  }
  function cellule(reel) { return reel.clientHeight || reel.offsetHeight; }
  function tirageSymbole() { var total = SYMBOLES.reduce(function (a, s) { return a + s.poids; }, 0), r = rand(total); for (var i = 0; i < SYMBOLES.length; i++) { r -= SYMBOLES[i].poids; if (r < 0) return i; } return 4; }
  function initSlots() {
    var reels = $$('[data-reel]'); if (!reels.length) return;
    var depart = [2, 1, 3];
    reels.forEach(function (r, i) { poserBande(r, depart[i]); });
    window.addEventListener('resize', function () { reels.forEach(function (r) { var idx = parseInt(r.getAttribute('data-idx') || depart[reels.indexOf(r)], 10); r.firstChild.style.transform = 'translateY(' + (-idx * cellule(r)) + 'px)'; }); });
    reels.forEach(function (r, i) { r.setAttribute('data-idx', depart[i]); });
    var btn = $('[data-tirer]'); if (!btn) return;
    btn.addEventListener('click', function () {
      if (enCours) return;
      var mise = miseOk('slots'); if (!mise) return;
      enCours = true; etat.jetons -= mise; maj(); dire('slots', '…', null); btn.disabled = true;
      reels.forEach(function (r) { r.removeAttribute('data-gagnant'); });
      var res = [tirageSymbole(), tirageSymbole(), tirageSymbole()];
      var arrets = [700, 950, 1200], finis = 0;
      reels.forEach(function (r, i) {
        var bande = r.firstChild, c = cellule(r), boucle = null;
        if (!reduit) boucle = bande.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(' + (-SYMBOLES.length * c) + 'px)' }], { duration: 80 * SYMBOLES.length, iterations: Infinity });
        setTimeout(function () {
          var courant = 0;
          if (boucle) { var m = getComputedStyle(bande).transform; if (m && m !== 'none') courant = -new DOMMatrix(m).m42; boucle.cancel(); }
          var cible = res[i] * c; if (cible <= courant) cible += SYMBOLES.length * c;
          var fin = function () { bande.style.transform = 'translateY(' + (-res[i] * c) + 'px)'; r.setAttribute('data-idx', res[i]); r.setAttribute('aria-label', SYMBOLES[res[i]].nom); finis++; if (finis === 3) conclure(); };
          if (reduit) { fin(); return; }
          var a = bande.animate([{ transform: 'translateY(' + (-courant) + 'px)' }, { transform: 'translateY(' + (-cible) + 'px)' }], { duration: 350, easing: 'cubic-bezier(0, 0, 0, 1)', fill: 'forwards' });
          a.onfinish = function () { a.cancel(); fin(); };
        }, arrets[i]);
      });
      function conclure() {
        var gain = 0, baies = res.filter(function (x) { return SYMBOLES[x].id === 'Baie'; }).length;
        if (res[0] === res[1] && res[1] === res[2]) gain = SYMBOLES[res[0]].gain; else if (baies === 2) gain = 3;
        if (gain) { reels.forEach(function (r) { r.setAttribute('data-gagnant', 'true'); }); etat.jetons += gain * mise; maj(); dire('slots', (baies === 2 && gain === 3 ? 'Baie ×2 ! ' : '') + 'Gagné ×' + gain + ' ! +' + fmt(gain * mise) + ' jetons', 'gain'); pluie($('.jeu-slots [data-pluie]'), gain >= 25 ? 24 : 10); }
        else dire('slots', 'Perdu…', 'perte');
        enCours = false; btn.disabled = false;
      }
    });
  }

  /* ---- pile ou face ---- */
  function initCoin() {
    var piece = $('[data-piece]'); if (!piece) return;
    var choix = 'face', rot = 0, occupe = false;
    $$('[data-choix]').forEach(function (b) { b.addEventListener('click', function () { choix = b.getAttribute('data-choix'); $$('[data-choix]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }); });
    $('[data-lancer]').addEventListener('click', function () {
      if (occupe) return;
      var mise = miseOk('coin'); if (!mise) return;
      occupe = true; etat.jetons -= mise; maj(); dire('coin', '…', null);
      var sortie = Math.random() < 0.5 ? 'face' : 'pile';
      var cible = rot - (rot % 360) + 1440 + (sortie === 'face' ? 0 : 180);
      var fin = function () { rot = cible; piece.style.transform = 'rotateY(' + rot + 'deg)'; occupe = false;
        if (sortie === choix) { etat.jetons += mise * 2; maj(); dire('coin', 'Gagné ×2 ! +' + fmt(mise * 2) + ' jetons', 'gain'); pluie($('.jeu-coin [data-pluie]'), 14); } else dire('coin', 'Perdu… c’était ' + (sortie === 'face' ? 'face' : 'pile') + '.', 'perte'); };
      if (reduit) { fin(); return; }
      var a = piece.animate([{ transform: 'rotateY(' + rot + 'deg) translateY(0)' }, { transform: 'rotateY(' + (rot + (cible - rot) * 0.5) + 'deg) translateY(-' + 'calc(var(--spacing) * 12)' + ')' }, { transform: 'rotateY(' + cible + 'deg) translateY(0)' }].map(function (k, i) { if (i === 1) k.transform = 'rotateY(' + (rot + (cible - rot) * 0.5) + 'deg) translateY(-48px)'; return k; }), { duration: 900, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
      a.onfinish = fin;
    });
  }

  /* ---- blackjack ---- */
  var RANGS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], COULEURS = ['pique', 'coeur', 'carreau', 'trefle'];
  var bj = { phase: 'mise', mains: [], croupier: [], actif: 0, assurance: 0, forcer: [], revele: false };
  function carte(r, c) { return { r: r, c: c || COULEURS[rand(4)] }; }
  function pioche() { return bj.forcer.length ? bj.forcer.shift() : carte(RANGS[rand(13)]); }
  function val(c) { return c.r === 'A' ? 11 : (c.r === 'J' || c.r === 'Q' || c.r === 'K') ? 10 : parseInt(c.r, 10); }
  function total(cs) { var t = 0, as = 0; cs.forEach(function (c) { t += val(c); if (c.r === 'A') as++; }); while (t > 21 && as) { t -= 10; as--; } return { t: t, souple: as > 0 && t <= 21 }; }
  var DEMOS = {
    separer: [carte('8', 'coeur'), carte('6', 'pique'), carte('8', 'trefle'), carte('10', 'carreau')],
    assurance: [carte('10', 'pique'), carte('A', 'coeur'), carte('7', 'carreau'), carte('5', 'trefle')],
    naturel: [carte('A', 'pique'), carte('7', 'coeur'), carte('K', 'carreau'), carte('9', 'trefle')],
    doubler: [carte('6', 'coeur'), carte('6', 'pique'), carte('5', 'trefle'), carte('10', 'carreau')]
  };
  function cartesHTML(cs, cacheLaDeuxieme) {
    return cs.map(function (c, i) {
      if (cacheLaDeuxieme && i === 1) return '<span class="carte dos" aria-label="Carte cachée"></span>';
      var rouge = c.c === 'coeur' || c.c === 'carreau';
      return '<span class="carte' + (rouge ? ' rouge' : '') + '" aria-label="' + c.r + ' de ' + c.c + '"><span class="rang">' + c.r + '</span>' + suitUse(c.c) + '</span>';
    }).join('');
  }
  function majBj() {
    var zone = $('[data-mains]'); if (!zone) return;
    $('[data-main-croupier]').innerHTML = bj.croupier.length ? cartesHTML(bj.croupier, !bj.revele) : '';
    var tc = $('[data-total-croupier]');
    if (bj.croupier.length) { tc.hidden = false; tc.innerHTML = bj.revele ? 'Total <b>' + total(bj.croupier).t + '</b>' : 'Montre <b>' + val(bj.croupier[0]) + '</b>'; } else tc.hidden = true;
    zone.setAttribute('data-nb', Math.max(1, bj.mains.length));
    zone.innerHTML = bj.mains.map(function (m, i) {
      var t = total(m.cartes);
      return '<div class="main" data-actif="' + (bj.phase === 'jeu' && i === bj.actif ? 'true' : 'false') + '"><div class="entete"><span class="pastille">Mise <b>' + fmt(m.mise) + '</b></span><span class="pastille">Total <b>' + t.t + (t.souple && t.t < 21 ? ' souple' : '') + '</b></span></div><div class="cartes">' + cartesHTML(m.cartes) + '</div>' +
        (m.issue ? '<span class="issue" data-ton="' + m.issue.ton + '">' + icoIssue(m.issue.ton) + m.issue.txt + '</span>' : '') + '</div>';
    }).join('');
    var enMise = bj.phase === 'mise' || bj.phase === 'fin';
    $('[data-bloc-mise]').hidden = !enMise; $('[data-actions]').hidden = enMise;
    var d = $('[data-donne]'); if (d) { d.textContent = bj.phase === 'fin' ? 'Nouvelle main' : 'Distribuer'; d.disabled = false; }
    var main = bj.mains[bj.actif], aide = [];
    var ass = bj.phase === 'assurance';
    function etatBouton(nom, ok, raison) { var b = $('[data-act="' + nom + '"]'); if (!b) return; b.disabled = !ok; if (!ok && raison && bj.phase === 'jeu') aide.push(raison); }
    if (ass) {
      $$('[data-act]').forEach(function (b) { var n = b.getAttribute('data-act'); b.hidden = !(n === 'assurance' || n === 'refuser'); b.disabled = false; });
      var cout = Math.max(1, Math.floor(bj.mains[0].mise * 0.5)); $('[data-act="assurance"]').textContent = 'Assurance · ' + fmt(cout) + ' jetons'; if (etat.jetons < cout) { $('[data-act="assurance"]').disabled = true; aide.push('Assurance : il te manque ' + fmt(cout - etat.jetons) + ' jetons.'); }
    } else if (bj.phase === 'jeu' && main) {
      $$('[data-act]').forEach(function (b) { var n = b.getAttribute('data-act'); b.hidden = (n === 'refuser' || n === 'assurance'); });
      var deux = main.cartes.length === 2;
      etatBouton('tirer', true); etatBouton('rester', true);
      etatBouton('doubler', deux && etat.jetons >= main.mise, deux ? 'Doubler : il te manque ' + fmt(main.mise - etat.jetons) + ' jetons.' : 'Doubler : seulement avec tes deux premières cartes.');
      var paire = deux && val(main.cartes[0]) === val(main.cartes[1]);
      etatBouton('separer', paire && bj.mains.length < 4 && etat.jetons >= main.mise, !deux ? 'Séparer : seulement avec deux cartes.' : !paire ? 'Séparer : il faut deux cartes de même valeur.' : bj.mains.length >= 4 ? 'Séparer : quatre mains au plus.' : 'Séparer : il te manque ' + fmt(main.mise - etat.jetons) + ' jetons.');
      var premiere = deux && bj.mains.length === 1;
      etatBouton('abandon', premiere, 'Abandon : seulement avant ta première carte, sans séparation.');
      var bAbd = $('[data-act="abandon"]'); if (bAbd) bAbd.hidden = false;
    }
    var a = $('[data-aide-bj]'); if (a) a.textContent = bj.phase === 'jeu' ? aide.join(' ') : (bj.phase === 'assurance' ? aide.join(' ') : '');
  }
  function bilan(net) { return 'Bilan : ' + (net > 0 ? '+' : net < 0 ? '−' : '') + fmt(Math.abs(net)) + ' jetons.'; }
  function finir() {
    bj.phase = 'fin'; bj.revele = true;
    var ct = total(bj.croupier), net = 0, mises = 0;
    var vivant = bj.mains.some(function (m) { return !m.issue; });
    if (vivant) { while (total(bj.croupier).t < 17) bj.croupier.push(pioche()); ct = total(bj.croupier); }
    bj.mains.forEach(function (m) {
      mises += m.mise;
      if (m.issue) { if (m.issue.paye !== undefined) { etat.jetons += m.issue.paye; net += m.issue.paye - m.mise; } return; }
      var t = total(m.cartes).t, paye = 0;
      if (ct.t > 21 || t > ct.t) { paye = m.mise * 2; m.issue = { ton: 'gain', txt: 'Gagné ×2 !' }; }
      else if (t === ct.t) { paye = m.mise; m.issue = { ton: 'nul', txt: 'Égalité. Mise rendue.' }; }
      else m.issue = { ton: 'perte', txt: 'Perdu…' };
      etat.jetons += paye; net += paye - m.mise;
    });
    net -= bj.assurance; net += bj.assurancePaye || 0;
    var msg = vivant ? (ct.t > 21 ? 'Le croupier dépasse 21. ' : 'Le croupier reste à ' + ct.t + '. ') : '';
    dire('bj', msg + bilan(net), net > 0 ? 'gain' : net < 0 ? 'perte' : 'info');
    if (net > 0) pluie($('.jeu-bj [data-pluie]'), 16);
    maj();
  }
  function suivante() {
    while (bj.actif < bj.mains.length && bj.mains[bj.actif].fini) bj.actif++;
    if (bj.actif >= bj.mains.length) { finir(); } else { dire('bj', bj.mains.length > 1 ? 'Main ' + (bj.actif + 1) + ' sur ' + bj.mains.length + '. À toi de jouer.' : 'À toi de jouer.', null); majBj(); }
  }
  function distribuer() {
    var mise = miseOk('bj'); if (!mise) return;
    var demo = $('[data-demo]') ? $('[data-demo]').value : '';
    bj.forcer = demo && DEMOS[demo] ? DEMOS[demo].slice() : [];
    etat.jetons -= mise; bj.assurance = 0; bj.assurancePaye = 0; bj.revele = false; bj.actif = 0;
    var p1 = pioche(), c1 = pioche(), p2 = pioche(), c2 = pioche();
    bj.mains = [{ cartes: [p1, p2], mise: mise, fini: false, double: false }]; bj.croupier = [c1, c2];
    maj();
    if (c1.r === 'A') { bj.phase = 'assurance'; dire('bj', 'Le croupier montre un As. Assurance ?', 'alerte'); majBj(); return; }
    apresAssurance();
  }
  function apresAssurance() {
    var m = bj.mains[0], tc = total(bj.croupier).t === 21 && bj.croupier.length === 2, tp = total(m.cartes).t === 21;
    var peek = val(bj.croupier[0]) >= 10;
    if (peek && tc) {
      bj.revele = true; bj.phase = 'fin';
      if (bj.assurance) { bj.assurancePaye = bj.assurance * 3; etat.jetons += bj.assurancePaye; }
      if (tp) { m.issue = { ton: 'nul', txt: 'Deux blackjacks. Égalité.', paye: m.mise }; dire('bj', 'Deux blackjacks. Égalité, mise rendue.', 'info'); }
      else { m.issue = { ton: 'perte', txt: 'Blackjack du croupier.', paye: 0 }; dire('bj', 'Le croupier a un blackjack. Perdu.' + (bj.assurance ? ' Assurance payée ×2.' : ''), 'perte'); }
      m.fini = true; maj(); return;
    }
    if (bj.assurance) { dire('bj', 'Assurance perdue.', 'alerte'); }
    if (tp) { bj.phase = 'jeu'; m.fini = true; m.issue = { ton: 'gain', txt: 'Blackjack ! ×2,5', paye: m.mise * 2.5 }; bj.revele = true; bj.phase = 'fin'; etat.jetons += m.mise * 2.5; dire('bj', 'Blackjack ! ×2,5 · +' + fmt(m.mise * 1.5) + ' jetons', 'gain'); pluie($('.jeu-bj [data-pluie]'), 20); maj(); return; }
    bj.phase = 'jeu'; if (!bj.assurance) dire('bj', 'À toi de jouer.', null); maj();
  }
  function agir(nom) {
    var m = bj.mains[bj.actif];
    if (bj.phase === 'assurance') {
      if (nom === 'assurance') { var cout = Math.max(1, Math.floor(bj.mains[0].mise * 0.5)); if (etat.jetons < cout) { dire('bj', 'Pas assez de jetons.', 'perte'); return; } bj.assurance = cout; etat.jetons -= cout; }
      if (nom === 'assurance' || nom === 'refuser') { apresAssurance(); } return;
    }
    if (bj.phase !== 'jeu' || !m) return;
    if (nom === 'tirer') { m.cartes.push(pioche()); var t = total(m.cartes).t; if (t > 21) { m.fini = true; m.issue = { ton: 'perte', txt: 'Dépassé ! Perdu.', paye: 0 }; } else if (t === 21) m.fini = true; suivante(); }
    else if (nom === 'rester') { m.fini = true; suivante(); }
    else if (nom === 'doubler') { if (m.cartes.length !== 2 || etat.jetons < m.mise) return; etat.jetons -= m.mise; m.mise *= 2; m.cartes.push(pioche()); m.fini = true; if (total(m.cartes).t > 21) m.issue = { ton: 'perte', txt: 'Dépassé ! Perdu.', paye: 0 }; maj(); suivante(); }
    else if (nom === 'separer') { if (m.cartes.length !== 2 || val(m.cartes[0]) !== val(m.cartes[1]) || bj.mains.length >= 4 || etat.jetons < m.mise) return; etat.jetons -= m.mise; var autre = { cartes: [m.cartes.pop()], mise: m.mise, fini: false }; m.cartes.push(pioche()); autre.cartes.push(pioche()); bj.mains.splice(bj.actif + 1, 0, autre); [m, autre].forEach(function (x) { if (total(x.cartes).t === 21) x.fini = true; }); maj(); suivante(); }
    else if (nom === 'abandon') { if (m.cartes.length !== 2 || bj.mains.length > 1) return; var rendu = Math.floor(m.mise * 0.5); etat.jetons += rendu; m.fini = true; m.issue = { ton: 'nul', txt: 'Abandon : moitié rendue.', paye: rendu }; bj.revele = true; bj.phase = 'fin'; dire('bj', 'Abandon. Moitié de la mise rendue.', 'info'); maj(); }
  }
  function initBj() {
    if (!$('[data-mains]')) return;
    $('[data-donne]').addEventListener('click', function () { bj.mains = []; bj.croupier = []; distribuer(); });
    $$('[data-act]').forEach(function (b) { b.addEventListener('click', function () { agir(b.getAttribute('data-act')); }); });
    var p = new URLSearchParams(location.search), d = p.get('demo'), auto = p.get('auto');
    if (d && $('[data-demo]')) $('[data-demo]').value = d;
    if (auto) { setTimeout(function () { $('[data-donne]').click(); if (auto === 'separer') agir('separer'); if (auto === 'separer2') { agir('separer'); agir('rester'); } if (auto === 'assurance') agir('assurance'); }, 50); }
    majBj();
  }

  /* ---- roulette : 37 cases, 0 vert, bille qui tombe sur la case tirée ---- */
  var ROUGES = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var ORDRE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  function couleurN(n) { return n === 0 ? 'vert' : ROUGES.indexOf(n) >= 0 ? 'rouge' : 'noir'; }
  function initRoulette() {
    var roue = $('[data-roue]'); if (!roue) return;
    var piste = $('[data-piste]', roue), bille = $('.bille', roue), sortie = $('[data-sortie]', roue), centre = $('.centre', roue);
    var btn = $('[data-lancer-roulette]'), champ = $('[data-num-champ]'), pari = 'rouge', angle = 0, occupe = false;
    function numero() { var n = parseInt(champ.value, 10); return isNaN(n) ? 0 : Math.min(36, Math.max(0, n)); }
    function choisir(p) { pari = p; $$('[data-pari]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pari') === p ? 'true' : 'false'); }); $('[data-numero]').hidden = p !== 'plein'; }
    $$('[data-pari]').forEach(function (b) { b.addEventListener('click', function () { choisir(b.getAttribute('data-pari')); }); });
    $$('[data-num-pas]').forEach(function (b) { b.addEventListener('click', function () { champ.value = (numero() + parseInt(b.getAttribute('data-num-pas'), 10) + 37) % 37; }); });
    champ.addEventListener('change', function () { champ.value = numero(); });
    var pEnv = new URLSearchParams(location.search).get('pari'); if (pEnv) choisir(pEnv);
    btn.addEventListener('click', function () {
      if (occupe) return;
      var mise = miseOk('roulette'); if (!mise) return;
      occupe = true; etat.jetons -= mise; maj(); dire('roulette', '…', null); btn.disabled = true; sortie.textContent = '…';
      $$('.poche', roue).forEach(function (p) { p.removeAttribute('data-gagnant'); });
      var n = rand(37), i = ORDRE.indexOf(n), a = i * 360 / 37, choisi = numero();
      function fin() {
        piste.style.transform = 'rotate(' + a + 'deg)'; angle = a;
        sortie.textContent = n; centre.setAttribute('data-c', couleurN(n)); $('.poche[data-n="' + n + '"]', roue).setAttribute('data-gagnant', 'true');
        var c = couleurN(n), gain = 0;
        if (pari === 'plein') { if (n === choisi) gain = 36; }
        else if (n !== 0 && ((pari === 'rouge' && c === 'rouge') || (pari === 'noir' && c === 'noir') || (pari === 'pair' && n % 2 === 0) || (pari === 'impair' && n % 2 === 1))) gain = 2;
        var txt = 'La bille tombe sur le ' + n + ' (' + c + '). ';
        if (gain) { etat.jetons += gain * mise; maj(); dire('roulette', txt + 'Gagné ×' + gain + ' ! +' + fmt(gain * mise) + ' jetons', 'gain'); pluie($('.jeu-roulette [data-pluie]'), gain === 36 ? 24 : 10); }
        else dire('roulette', txt + (n === 0 && pari !== 'plein' ? 'Le 0 perd les mises simples.' : 'Perdu…'), 'perte');
        occupe = false; btn.disabled = false;
      }
      if (reduit) { fin(); return; }
      var rr = roue.getBoundingClientRect(), pr = $('.poche', roue).getBoundingClientRect();
      var R = (rr.top + rr.height / 2) - (pr.top + pr.height / 2), dehors = R + pr.width * 1.4;
      var duree = 3200, an = piste.animate([{ transform: 'rotate(' + angle + 'deg)' }, { transform: 'rotate(' + (a - 1440) + 'deg)' }], { duration: duree, easing: 'cubic-bezier(0.15, 0.6, 0.2, 1)', fill: 'forwards' });
      bille.animate([{ transform: 'translateY(-' + dehors + 'px)' }, { transform: 'translateY(-' + dehors + 'px)', offset: 0.6 }, { transform: 'translateY(-' + R + 'px)' }], { duration: duree, easing: 'ease-in-out' });
      an.onfinish = function () { fin(); an.cancel(); };
    });
  }

  /* ---- plus ou moins ---- */
  function initPlusMoins() {
    var vis = $('[data-pm-visible]'); if (!vis) return;
    var suiv = $('[data-pm-suivante]'), pm = { carte: null, occupe: false };
    var idx = function (c) { return RANGS.indexOf(c.r) + 1; };
    var mult = function (i, dir) { var k = dir === 'haut' ? 13 - i : i - 1; return k > 0 ? Math.round(0.96 * 13 / k * 100) / 100 : 0; };
    var fm = function (m) { return '×' + m.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var dos = '<span class="carte dos" aria-label="Carte cachée"></span>';
    function depart() { var d = $('[data-pm-depart]'), q = new URLSearchParams(location.search).get('pm'), v = q || (d ? d.value : ''); return v ? carte(v) : carte(RANGS[rand(13)]); }
    function aff() {
      vis.innerHTML = cartesHTML([pm.carte]); suiv.innerHTML = dos;
      var i = idx(pm.carte), mise = Math.max(0, lireMise('pm')), aide = [];
      ['haut', 'bas'].forEach(function (d) {
        var m = mult(i, d), b = $('[data-pm="' + d + '"]');
        $('[data-pm-gain="' + d + '"]').textContent = m ? fm(m) : 'Impossible';
        $('[data-pm-rend="' + d + '"]').textContent = m ? 'rend ' + fmt(Math.floor(mise * m)) + ' jetons' : (d === 'haut' ? 'Roi : rien au-dessus' : 'As : rien en dessous');
        b.disabled = pm.occupe || !m;
        if (!m) aide.push(d === 'haut' ? 'Plus haut est impossible sur un Roi.' : 'Plus bas est impossible sur un As.');
      });
      $('[data-aide-pm]').textContent = aide.join(' ');
    }
    pm.carte = depart(); aff();
    var d = $('[data-pm-depart]'); if (d) { d.addEventListener('change', function () { if (!pm.occupe) { pm.carte = depart(); aff(); dire('pm', 'La suivante sera-t-elle plus haute ou plus basse ?', null); } }); }
    document.addEventListener('click', function () { setTimeout(function () { if (!pm.occupe) aff(); }, 0); });
    document.addEventListener('input', function () { if (!pm.occupe) aff(); });
    $$('[data-pm]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (pm.occupe) return;
        var dir = b.getAttribute('data-pm'), i = idx(pm.carte), m = mult(i, dir); if (!m) return;
        var mise = miseOk('pm'); if (!mise) return;
        pm.occupe = true; etat.jetons -= mise; maj(); dire('pm', '…', null); aff();
        var nouvelle = carte(RANGS[rand(13)]), j = idx(nouvelle);
        suiv.innerHTML = cartesHTML([nouvelle]);
        var cc = $('.carte', suiv); if (cc && !reduit) cc.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
        var gagne = dir === 'haut' ? j > i : j < i;
        if (gagne) { var paye = Math.floor(mise * m); etat.jetons += paye; maj(); dire('pm', nouvelle.r + ' : bien vu ! ' + fm(m) + ' · +' + fmt(paye) + ' jetons', 'gain'); pluie($('.jeu-pm [data-pluie]'), 10); }
        else dire('pm', j === i ? 'Même valeur (' + nouvelle.r + ') : égalité, tu perds.' : nouvelle.r + ' : perdu…', 'perte');
        setTimeout(function () { pm.carte = nouvelle; pm.occupe = false; aff(); }, reduit ? 50 : 1500);
      });
    });
  }

  /* ---- carte à gratter : 6 cases, 3 identiques ou plus gagnent (gains de la machine à sous) ---- */
  function initGratte() {
    var zone = $('[data-cases]'); if (!zone) return;
    var g = { sym: [], revele: [], actif: false, mise: 0 }, achat = $('[data-acheter-carte]'), tout = $('[data-tout-gratter]');
    function tirage(force) {
      var gagne = force === 'gagne' ? true : force === 'perdu' ? false : Math.random() < 0.45, a = [], s = -1;
      if (gagne) { s = tirageSymbole(); var k = [3, 3, 3, 3, 4, 4, 5][rand(7)]; for (var q = 0; q < k; q++) a.push(s); }
      while (a.length < 6) { var t = tirageSymbole(); if (gagne && t === s) continue; if (a.filter(function (x) { return x === t; }).length < 2) a.push(t); }
      for (var z = a.length - 1; z > 0; z--) { var r = rand(z + 1), tmp = a[z]; a[z] = a[r]; a[r] = tmp; }
      return a;
    }
    function dessiner() {
      zone.innerHTML = [0, 1, 2, 3, 4, 5].map(function (i) {
        var vu = g.revele[i];
        return '<button type="button" class="case" data-case="' + i + '" data-etat="' + (vu ? 'gratte' : 'couvert') + '"' + (g.actif && !vu ? '' : ' disabled') + ' aria-label="Case ' + (i + 1) + (vu ? ' : ' + SYMBOLES[g.sym[i]].nom : ', à gratter') + '">' +
          '<span class="dessous">' + (g.sym.length ? imgTag(SYMBOLES[g.sym[i]].image, '') : '') + '</span><span class="couvercle hachure"><b>Gratte</b></span></button>';
      }).join('');
    }
    function revele(i) {
      if (!g.actif || g.revele[i]) return;
      g.revele[i] = true;
      var b = $('[data-case="' + i + '"]', zone); b.setAttribute('data-etat', 'gratte'); b.disabled = true; b.setAttribute('aria-label', 'Case ' + (i + 1) + ' : ' + SYMBOLES[g.sym[i]].nom);
      if (g.revele.filter(Boolean).length === 6) conclure();
    }
    function conclure() {
      g.actif = false; tout.disabled = true; achat.disabled = false; achat.textContent = 'Nouvelle carte';
      var gagnant = -1;
      SYMBOLES.forEach(function (s, k) { if (g.sym.filter(function (x) { return x === k; }).length >= 3) gagnant = k; });
      if (gagnant >= 0) {
        var nb = g.sym.filter(function (x) { return x === gagnant; }).length, gain = SYMBOLES[gagnant].gain;
        $$('.case', zone).forEach(function (c, i) { if (g.sym[i] === gagnant) c.setAttribute('data-gagnant', 'true'); });
        etat.jetons += gain * g.mise; maj();
        dire('gratte', nb + ' × ' + SYMBOLES[gagnant].nom + ' : gagné ×' + gain + ' ! +' + fmt(gain * g.mise) + ' jetons', 'gain'); pluie($('.jeu-gratte [data-pluie]'), gain >= 25 ? 24 : 10);
      } else dire('gratte', 'Pas trois symboles identiques. Perdu…', 'perte');
    }
    zone.addEventListener('click', function (ev) { var b = ev.target.closest('[data-case]'); if (b) revele(parseInt(b.getAttribute('data-case'), 10)); });
    function acheter() {
      var mise = miseOk('gratte'); if (!mise) return false;
      var q = new URLSearchParams(location.search).get('gratte');
      etat.jetons -= mise; maj(); g.mise = mise; g.sym = tirage(q); g.revele = []; g.actif = true; dessiner();
      achat.disabled = true; achat.textContent = 'Gratte les 6 cases'; tout.disabled = false; dire('gratte', 'Gratte chaque case avec ton doigt ou ta souris.', null);
      return true;
    }
    achat.addEventListener('click', acheter);
    tout.addEventListener('click', function () { [0, 1, 2, 3, 4, 5].forEach(function (i) { setTimeout(function () { revele(i); }, reduit ? 0 : i * 140); }); tout.disabled = true; });
    dessiner();
    var auto = new URLSearchParams(location.search).get('auto');
    if (auto === 'gratter') setTimeout(function () { if (acheter()) tout.click(); }, 80);
  }

  /* ---- boutique ---- */
  function boutique() {
    var ul = $('[data-boutique]'); if (!ul) return;
    ul.innerHTML = BOUTIQUE.map(function (p) {
      var image = p.image ? imgTag(p.image, '') : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.500"><circle cx="12" cy="12" r="10"/><path d="M8 9h8M12 9v7M9 16h6" stroke-linecap="round"/></svg>';
      return '<li class="produit" data-key="' + p.key + '"><span class="produit-image">' + image + '</span><span class="produit-texte"><span class="produit-nom">' + p.nom + '</span>' + (p.desc ? '<span class="produit-desc">' + p.desc + '</span>' : '') +
        '<span class="produit-prix"><span class="jeton"></span>' + fmt(p.prix) + ' jetons</span></span><button type="button" class="plaque" data-acheter-objet="' + p.key + '">Acheter</button><span class="manque" data-manque></span></li>';
    }).join('');
    ul.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-acheter-objet]'); if (!b) return;
      var p = BOUTIQUE.filter(function (x) { return x.key === b.getAttribute('data-acheter-objet'); })[0];
      if (p.unique && etat.acquis[p.key]) { dire('boutique', 'Déjà acquis !', 'alerte'); return; }
      if (etat.jetons < p.prix) { dire('boutique', 'Pas assez de jetons.', 'perte'); return; }
      etat.jetons -= p.prix; if (p.unique) etat.acquis[p.key] = true; maj(); dire('boutique', '+' + p.nom + ' !', 'gain');
    });
  }
  function majBoutique() {
    $$('.produit').forEach(function (li) {
      var p = BOUTIQUE.filter(function (x) { return x.key === li.getAttribute('data-key'); })[0], b = $('button', li), m = $('[data-manque]', li);
      var deja = p.unique && etat.acquis[p.key];
      li.setAttribute('data-acquis', deja ? 'true' : 'false');
      b.disabled = deja || etat.jetons < p.prix; b.textContent = deja ? 'Acquis' : 'Acheter ' + p.nom;
      m.textContent = deja ? 'Déjà acquis.' : etat.jetons < p.prix ? 'Il te manque ' + fmt(p.prix - etat.jetons) + ' jetons.' : '';
    });
  }

  /* ---- ampoules des enseignes (variante C) ---- */
  function ampoules() { $$('[data-ampoules]').forEach(function (e) { var n = parseInt(e.getAttribute('data-ampoules'), 10) || 12, h = ''; for (var i = 0; i < n; i++) h += '<i style="--i:' + i + '"></i>'; e.innerHTML = h; e.setAttribute('aria-hidden', 'true'); }); }

  function demarrer() {
    suitSprite(); bandeau(); navPrincipale(); gabarits(); ampoules();
    initSlots(); initCoin(); initBj(); initRoulette(); initPlusMoins(); initGratte(); boutique(); brancherJetons();
    $$('[data-va]').forEach(function (b) { b.addEventListener('click', function () { aller(b.getAttribute('data-va')); }); });
    window.addEventListener('hashchange', function () { aller(depuisHash()); });
    maj(); aller(depuisHash());
    if (/[?&]cadeau=0/.test(location.search)) { $$('[data-cadeau]').forEach(function (e) { e.hidden = true; }); }
    var q = new URLSearchParams(location.search).get('argent'); if (q) { etat.argent = parseInt(q, 10); maj(); }
    var j = new URLSearchParams(location.search).get('jetons'); if (j) { etat.jetons = parseInt(j, 10); maj(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
