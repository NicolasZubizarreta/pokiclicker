// Maquette jetable : écran de combat AE (icônes d'action) + AG (évolution, Sac). Rien ne touche au vrai jeu.
// Les classes (cadre, scene-limitee, combat-grille, h-76, etc.) viennent de jeu.css, copie du CSS compilé du jeu.
const V = document.body.dataset.v;               // 'a' | 'b' | 'c'
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const svgBrut = c => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${c}</svg>`;
const CAD = '<svg class="cad" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5z"/></svg>';

const ICONES = {
  attaque: svg('m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6'),
  clic: svg('M9 9l11 4-5 2-2 5zM9 3v3M3 9h3M5 5l2 2M13 5l-2 2M5 13l2-2'),
  arret: svg('M8 3h8l5 5v8l-5 5H8l-5-5V8zM8 12h8'),
  reglages: svgBrut('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  fauchage: svg('M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.1 8.1 20 20M8.1 15.9 20 4'),
  radar: svgBrut('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 6-6"/><circle cx="12" cy="12" r="1"/>'),
  sac: svg('M9 7V6a3 3 0 0 1 6 0v1M6 7h12v14H6zM6 12h12M10 15h4'),
  evo: svg('m6 14 6-6 6 6M6 20l6-6 6 6'),
};

// ---- Données de la maquette (Route 1, partie de Nicolas) ----
const S = { attaque: true, arret: true, clic: false, outils: false, rechargeS: 0 };
const ACTS = {
  attaque: { ic: 'attaque', nom: 'Auto-attaque' },
  clic: { ic: 'clic', nom: 'Auto-clic', verrou: "Nécessite l'objet Restes" },
  arret: { ic: 'arret', nom: 'Arrêt auto' },
  reglages: { ic: 'reglages', nom: "Réglages de l'arrêt" },
  fauchage: { ic: 'fauchage', nom: 'Fauchage', outil: true },
  radar: { ic: 'radar', nom: 'Poké-Radar', outil: true },
  sac: { ic: 'sac', nom: 'Sac' },
};
const SAC = [
  { nom: 'Pokéball', img: 'poke-ball.png', n: 5, cat: 'balles', u: false }, { nom: 'Superball', img: 'great-ball.png', n: 3, cat: 'balles', u: false },
  { nom: 'Hyperball', img: 'ultra-ball.png', n: 1, cat: 'balles', u: false }, { nom: 'Bonbon', img: 'rare-candy.png', n: 4, cat: 'soins', u: true },
  { nom: 'Repousse', img: 'repel.png', n: 2, cat: 'equipement', u: true }, { nom: 'Attaque +', img: 'x-attack.png', n: 1, cat: 'equipement', u: true },
  { nom: 'Pierre Foudre', img: 'thunder-stone.png', n: 1, cat: 'equipement', u: true }, { nom: 'Calcium', img: 'calcium.png', n: 1, cat: 'soins', u: true },
];
const EQUIPE = [
  { id: 'bulbi', n: 1, nom: 'Bulbizarre', niv: 16, dps: 12, xp: .7, evo: { type: 'niveau', vers: { n: 2, nom: 'Herbizarre' } } },
  { id: 'pika', n: 25, nom: 'Pikachu', niv: 14, dps: 9, xp: .4, evo: { type: 'pierre', pierre: 'Pierre Foudre', img: 'thunder-stone.png', vers: { n: 26, nom: 'Raichu' } } },
  { id: 'rou', n: 16, nom: 'Roucool', niv: 12, dps: 8, xp: .2 },
  { id: 'rat', n: 19, nom: 'Rattata', niv: 9, dps: 8, xp: .55 },
  null, null,
];
const BALLES = [['poke-ball.png', 'Pokéball', 5], ['great-ball.png', 'Superball', 3], ['ultra-ball.png', 'Hyperball', 1]];
const DPS = EQUIPE.reduce((t, m) => t + (m ? m.dps : 0), 0);
const evoLabel = m => m.evo.type === 'pierre' ? `Utiliser la ${m.evo.pierre}` : 'Peut évoluer';

// ---- Fragments ----
const btn = id => {
  const a = ACTS[id];
  const cache = a.outil && !S.outils ? ' hidden' : '';
  return `<button type="button" class="act" data-act="${id}"${cache}>${ICONES[a.ic]}${id === 'clic' ? CAD : ''}</button>`;
};
const boutons = ids => ids.map(btn).join('');
const capture = () => `<div class="capture" role="group" aria-label="Capture">${BALLES.map(([img, nom, n], i) =>
  `<button type="button" class="balle" aria-pressed="${i === 0}" aria-label="${nom} ×${n}" data-balle><img src="img/${img}" alt="" width="24" height="24"><span>×${n}</span></button>`).join('')}<button type="button" class="capturer" data-capturer>Capturer</button></div>`;

function carte(m) {
  if (!m) return '<div aria-label="Case libre" class="cadre relative grid h-14 min-w-0 place-items-center overflow-hidden bg-surface lg:h-26"><span>—</span></div>';
  const evo = m.evo ? { id: m.id } : null;
  const etiquette = `${m.nom}, niveau ${m.niv}, ${m.dps} DPS`;
  const corps = `<img class="absolute size-24 max-w-none lg:static lg:row-span-3 image-rendering-pixelated sprite" src="img/${m.n}.png" width="96" height="96" alt="">
    <span class="absolute bottom-1 left-0 bg-surface px-1 text-base tabular-nums lg:hidden">${m.niv}</span>
    <div class="hidden min-w-0 justify-self-start self-end lg:block"><strong class="block break-words">${m.nom}</strong><span>Niv. ${m.niv}</span></div>
    <span class="hidden justify-self-start self-start text-region-accent lg:block">${m.dps} DPS${m.evo && V !== 'b' ? `<span class="texte-evo">${evoLabel(m)}</span>` : ''}</span>
    <div class="absolute inset-x-0 bottom-0 lg:static lg:col-start-2 lg:w-full lg:self-start"><div role="progressbar" aria-label="XP de ${m.nom}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(m.xp * 100)}" class="relative h-1 overflow-hidden bg-fond"><span class="barre-pv absolute inset-0 origin-left bg-info-base" style="transform:scaleX(${m.xp})"></span></div></div>`;
  const base = 'cadre relative grid h-14 min-w-0 place-items-center overflow-hidden bg-surface lg:h-26 lg:grid-cols-[auto_minmax(0,1fr)] lg:pe-4';
  if (!evo) return `<div aria-label="${etiquette}" class="${base}">${corps}</div>`;
  const repere = V === 'a' ? `<span class="repere" aria-hidden="true">${m.evo.img ? `<img src="img/${m.evo.img}" alt="">` : ICONES.evo}</span>`
    : `<span class="pointe" aria-hidden="true"></span>`;
  return `<button type="button" class="${base} carte-evo alerte" data-evo="${m.id}" data-libelle="${m.nom}" data-etat="${evoLabel(m)}. Touche pour faire évoluer" aria-label="${etiquette}. ${evoLabel(m)}">${corps}${repere}</button>`;
}
const cartes = () => `<div class="grid grid-cols-6 gap-1 lg:grid-cols-1" data-cartes>${EQUIPE.map(carte).join('')}</div>`;
const evoLigne = () => `<div class="evo-ligne" data-evo-ligne>${EQUIPE.filter(m => m && m.evo).map(m =>
  `<button type="button" class="evo-bouton cadre-alerte alerte" data-evo="${m.id}" data-libelle="${m.nom}" data-etat="Touche pour faire évoluer">${m.evo.img ? `<img src="img/${m.evo.img}" alt="">` : ICONES.evo}<span>${m.evo.type === 'pierre' ? `${m.nom} : utiliser la ${m.evo.pierre}` : `${m.nom} peut évoluer`}</span></button>`).join('')}</div>`;

function equipe() {
  if (V === 'a') return `<section aria-label="Ton équipe" class="zone-equipe min-w-0"><div class="v1-barre"><div class="titre"><h2>Ton équipe</h2><span class="tabular-nums">${DPS} DPS</span></div><div class="rangee-actions" role="group" aria-label="Actions du combat">${boutons(['arret', 'reglages', 'attaque', 'clic', 'fauchage', 'sac'])}</div></div>${cartes()}</section>`;
  if (V === 'b') return `<section aria-label="Ton équipe" class="zone-equipe min-w-0"><div class="entete-b cadre"><div class="titre"><h2>Ton équipe</h2>${boutons(['sac'])}<span class="dps tabular-nums">${DPS} DPS</span></div><div class="rangee-actions" role="group" aria-label="Actions du combat">${boutons(['attaque', 'clic'])}<span class="sep" aria-hidden="true"></span>${boutons(['arret', 'reglages'])}<span class="sep" aria-hidden="true"></span>${boutons(['fauchage', 'radar'])}</div></div>${cartes()}${evoLigne()}</section>`;
  return `<section aria-label="Ton équipe" class="zone-equipe min-w-0"><h2 class="mb-2 flex justify-between gap-2 font-titre text-xl">Ton équipe <span>${DPS} DPS</span></h2>${cartes()}</section>`;
}

function scene() {
  const annonce = `<div id="annonce" role="status" aria-live="polite" class="${V === 'c' ? '' : 'pointer-events-none '}cadre absolute inset-x-4 top-4 z-20 bg-surface/82 p-2 text-center"></div>`;
  const dock = V === 'c' ? `<div class="dock cadre" role="group" aria-label="Actions du combat"><div class="rangee-actions">${boutons(['attaque', 'clic', 'arret', 'reglages', 'fauchage', 'radar', 'sac'])}</div>${capture()}</div>` : '';
  const radar = V === 'a' ? `<button type="button" class="act radar-rond" data-act="radar"${S.outils ? '' : ' hidden'}>${ICONES.radar}</button>` : '';
  return `<section aria-label="Combat contre Piafabec" class="scene-limitee relative isolate h-76 bg-surface-2 lg:col-span-3 lg:aspect-video lg:h-auto">
    <img src="img/route-1.webp" width="1920" height="1080" alt="" class="aspect-video object-cover absolute inset-0 -z-10 size-full">
    <div class="pointer-events-none cadre absolute top-4 left-4 z-10 w-3/5 bg-surface/82 p-3">
      <div class="flex flex-wrap items-center justify-between gap-1"><h2 class="font-titre text-xl">Piafabec</h2><span>Niv. 2</span></div>
      <div><div role="progressbar" aria-label="PV de Piafabec" aria-valuemin="0" aria-valuemax="16" aria-valuenow="11" class="relative my-1 h-3 overflow-hidden bg-fond"><span class="barre-pv barre-fantome absolute inset-0 origin-left bg-texte-doux" style="transform:scaleX(.69)"></span><span class="barre-pv absolute inset-0 origin-left bg-succes-base" style="transform:scaleX(.69)"></span></div><p>PV 11 / 16</p></div>
    </div>
    <div class="pointer-events-none absolute right-2 bottom-2 flex will-change-transform size-48 items-end justify-center lg:size-72">
      <div aria-hidden="true" class="socle absolute bottom-10 h-12 w-3/4 bg-region-socle lg:bottom-16 lg:h-16"></div>
      <div class="motion-safe:flottement"><span class="relative size-48 lg:size-72 block"><img src="img/21.png" width="192" height="192" alt="Piafabec" class="image-rendering-pixelated relative size-full max-w-none"></span></div>
    </div>
    ${annonce}
    <button type="button" aria-label="Attaquer Piafabec" class="cible-combat cadre absolute inset-0 z-10 touch-manipulation select-none" data-cible></button>
    <div aria-hidden="true" class="pointer-events-none absolute inset-0" data-degats></div>
    ${radar}${dock}
  </section>`;
}

function commandes() {
  if (V === 'a') return `<div class="zone-commandes bande"><div class="bande-simple cadre">${capture()}</div></div>`;
  if (V === 'b') return `<div class="zone-commandes bande"><div class="bande-ennemi cadre">${capture()}</div></div>`;
  return '';
}

const dialogue = () => `<aside aria-label="Dialogue" class="zone-dialogue cadre flex items-center gap-2 bg-surface p-4 lg:col-span-3">
  <div class="min-w-0 grow lg:flex lg:items-center lg:justify-between lg:gap-4"><div class="min-w-0"><h2 class="font-titre text-xl text-lien">Prof. Chen</h2><p>Les Rattata sont ici. Touche le Pokémon pour attaquer.</p></div>
  <div class="mt-2 grid grid-cols-2 gap-2 lg:mt-0 lg:w-3/5"><div class="min-w-0"><button type="button" class="cadre min-h-11 w-full px-2 py-1 text-base bg-surface text-texte">Zone précédente : Bourg Palette</button></div><div class="min-w-0"><button type="button" class="cadre min-h-11 w-full px-2 py-1 text-base bg-action text-action-texte shadow-md">Zone suivante : Forêt de Jade</button></div></div></div>
  <svg class="fleche-chen size-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg></aside>`;

const chemins = ['m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6', 'M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z', 'M3 4h18v12H3zM9 20h6M12 16v4', 'M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3', 'm2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17', 'M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z'];
const navigation = () => `<nav aria-label="Navigation principale" class="fixed inset-x-0 bottom-0 z-10 box-content h-14 rounded-cadre bg-surface pb-[env(safe-area-inset-bottom)] after:pointer-events-none after:absolute after:inset-0 after:rounded-cadre after:border after:border-bordure after:inset-ring after:inset-ring-region-argent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-24 lg:pb-0"><div class="flex h-full lg:flex-col">${
  ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Plus'].map((t, i) => `<button type="button" ${i === 0 ? 'aria-current="page"' : ''} class="relative flex h-14 min-h-11 min-w-11 flex-1 flex-col items-center justify-center text-sm lg:flex-none ${i === 0 ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}${t === 'PC' ? ' opacity-60' : ''}">${i === 0 ? '<span aria-hidden="true" class="absolute inset-x-0 top-0 h-1 bg-region-accent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-full lg:w-1"></span>' : ''}<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false" class="shrink-0"><path d="${chemins[i]}"/></svg><span>${t}</span></button>`).join('')}</div></nav>`;

const sacPanneau = () => `<dialog id="sac" class="sac-panneau fiche-pokemon cadre bg-surface p-0 text-base text-texte" aria-labelledby="sac-titre"><div class="sac-contenu">
  <div class="sac-entete"><h2 id="sac-titre">Ton Sac</h2><button type="button" class="act" data-fermer-sac aria-label="Fermer le Sac"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <div role="group" aria-label="Catégories" class="flex min-w-0 gap-2 overflow-x-auto">${[['tout', 'Tout'], ['balles', 'Balles'], ['soins', 'Soins'], ['equipement', 'Équipement']].map(([c, n], i) => `<button type="button" class="cadre min-h-11 min-w-11 shrink-0 bg-surface p-3" aria-pressed="${i === 0}" data-cat="${c}">${n}</button>`).join('')}</div>
  <ul role="list" aria-label="Objets du Sac" class="grid grid-cols-2 gap-2" data-sac-liste>${SAC.map(o => `<li class="min-w-0"><button type="button" class="sac-ligne cadre" data-cat-obj="${o.cat}" data-nom="${o.nom}" aria-label="${o.nom} ×${o.n}"${o.u ? '' : ' aria-disabled="true"'}><img src="img/${o.img}" alt="" width="32" height="32"><span class="min-w-0"><span class="nom">${o.nom}</span><span class="qte">×${o.n}${o.u ? '<em>UTILISER</em>' : ''}</span></span></button></li>`).join('')}</ul>
  <p role="status" data-sac-message class="t-doux"></p></div></dialog>`;

// ---- Montage ----
const autres = { a: ['a-v1.html', 'A · V1 reprise'], b: ['b-entete.html', 'B · Icônes dans l’en-tête'], c: ['c-flottante.html', 'C · Barre flottante'] };
document.querySelector('#racine').innerHTML = `<div data-region="kanto" data-theme="dark" class="min-h-dvh bg-fond font-texte text-texte pb-[env(safe-area-inset-bottom)] lg:pb-0">
  ${navigation()}
  <main id="contenu" tabindex="-1" class="mb-14 min-w-0 p-4 lg:mb-0 lg:ml-24 lg:p-8">
    <div class="maquette cadre" role="group" aria-label="Contrôles de la maquette"><h1>${autres[V][1]}</h1><p>${document.body.dataset.resume}</p>
      <div class="rangee"><button type="button" class="puce" data-m="outils" aria-pressed="false">Avec Fauchage et Radar</button><button type="button" class="puce" data-m="annonce">Rejouer l’annonce</button><a class="puce" href="index.html">Variantes</a></div></div>
    <header class="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h1 class="font-titre text-2xl font-semibold">Route 1</h1><p>Jadielle</p></div><span class="text-region-accent tabular-nums">1 250 pièces</span><div class="flex w-full items-center justify-between gap-4 lg:w-auto"><span>Étape 4 sur 10</span><ol aria-label="Étapes de la zone" class="flex items-center gap-2">${Array.from({ length: 10 }, (_, i) => `<li class="${i === 3 ? 'outline-2 outline-offset-2 outline-region-accent' : ''} ${i === 9 ? 'size-6 text-region-accent' : `size-2 ${i < 3 ? 'bg-region-socle' : 'bg-bordure'}`}">${i === 9 ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/></svg>' : ''}</li>`).join('')}</ol></div></header>
    <div class="combat-grille grid gap-2 lg:grid-cols-4 lg:gap-4">${scene()}${commandes()}${equipe()}${dialogue()}</div>
    <p role="status" class="sr-seulement" data-direct></p>
  </main>${sacPanneau()}<div id="bulle" class="bulle cadre" role="tooltip" hidden></div></div>`;

// ---- Mise à jour des boutons selon l'état ----
function majActs() {
  document.querySelectorAll('[data-act]').forEach(el => {
    const id = el.dataset.act, a = ACTS[id];
    let etat = '', desc = '';
    el.removeAttribute('aria-pressed'); el.removeAttribute('aria-disabled');
    el.querySelector('.recharge')?.remove(); el.querySelector('.nb')?.remove();
    if (a.outil) el.hidden = !S.outils;
    if (id === 'attaque' || id === 'arret') { el.setAttribute('aria-pressed', S[id]); etat = S[id] ? 'activée' : 'désactivée'; desc = S[id] ? 'Activée. Touche pour désactiver' : 'Désactivée. Touche pour activer'; }
    else if (id === 'clic') { el.setAttribute('aria-disabled', 'true'); etat = 'verrouillé'; desc = a.verrou; }
    else if (id === 'reglages') { desc = 'Choisis les raretés qui arrêtent le combat automatique'; }
    else if (id === 'fauchage') {
      if (S.rechargeS > 0) { el.setAttribute('aria-disabled', 'true'); etat = `en recharge, ${S.rechargeS} s`; desc = `En recharge : ${S.rechargeS} s`; el.insertAdjacentHTML('beforeend', `<span class="recharge" aria-hidden="true">${S.rechargeS}</span>`); }
      else { etat = 'prêt'; desc = 'Laisse l’ennemi à 1 PV. Prêt'; }
    }
    else if (id === 'radar') { desc = 'Liste les Pokémon de la zone'; etat = 'disponible'; }
    else if (id === 'sac') { etat = `${SAC.length} objets`; desc = `${SAC.length} objets. Touche pour ouvrir`; el.insertAdjacentHTML('beforeend', `<span class="nb" aria-hidden="true">${SAC.length}</span>`); }
    el.setAttribute('aria-label', `${a.nom}${etat ? `, ${etat}` : ''}`);
    el.dataset.libelle = a.nom; el.dataset.etat = desc;
  });
  const m = document.querySelector('[data-m="outils"]'); m.setAttribute('aria-pressed', S.outils);
}

// ---- Infobulle : survol, focus, toucher ----
const bulle = document.querySelector('#bulle'); let minuteurBulle;
function montrer(el) {
  if (!el.dataset.libelle) return;
  bulle.innerHTML = `<strong>${el.dataset.libelle}</strong><span>${el.dataset.etat || ''}</span>`;
  bulle.hidden = false;
  const r = el.getBoundingClientRect(), b = bulle.getBoundingClientRect();
  const x = Math.max(8, Math.min(innerWidth - b.width - 8, r.left + r.width / 2 - b.width / 2));
  const y = r.top - b.height - 8 >= 8 ? r.top - b.height - 8 : r.bottom + 8;
  bulle.style.left = `${x}px`; bulle.style.top = `${y}px`;
  clearTimeout(minuteurBulle); minuteurBulle = setTimeout(cacher, 3200);
}
const cacher = () => { bulle.hidden = true; };
document.addEventListener('pointerover', e => { const el = e.target.closest('[data-libelle]'); if (el && e.pointerType === 'mouse') montrer(el); });
document.addEventListener('pointerout', e => { if (e.target.closest('[data-libelle]') && e.pointerType === 'mouse') cacher(); });
document.addEventListener('focusin', e => { const el = e.target.closest('[data-libelle]'); if (el) montrer(el); });
document.addEventListener('focusout', cacher);
const direct = t => { document.querySelector('[data-direct]').textContent = t; };

// ---- Actions ----
let declencheurSac = null;
const sac = document.querySelector('#sac');
function ouvrirSac(el) { declencheurSac = el || document.querySelector('[data-act="sac"]'); cacher(); sac.showModal(); }
sac.addEventListener('close', () => { declencheurSac?.focus(); });
sac.addEventListener('cancel', () => cacher());
sac.querySelector('[data-fermer-sac]').addEventListener('click', () => sac.close());
sac.addEventListener('click', e => {
  if (e.target === sac) sac.close();
  const cat = e.target.closest('[data-cat]');
  if (cat) { sac.querySelectorAll('[data-cat]').forEach(b => b.setAttribute('aria-pressed', b === cat)); sac.querySelectorAll('[data-sac-liste] li').forEach(li => { li.hidden = cat.dataset.cat !== 'tout' && li.firstElementChild.dataset.catObj !== cat.dataset.cat; }); }
  const o = e.target.closest('[data-cat-obj]');
  if (o && o.getAttribute('aria-disabled') !== 'true') sac.querySelector('[data-sac-message]').textContent = o.dataset.nom === 'Pierre Foudre' ? 'Pierre Foudre : Pikachu peut évoluer, touche sa carte dans le combat.' : `${o.dataset.nom} : effet appliqué (maquette).`;
});
let timerFauchage;
document.addEventListener('click', e => {
  const act = e.target.closest('[data-act]');
  if (act) {
    const id = act.dataset.act; montrer(act);
    if (id === 'attaque' || id === 'arret') { S[id] = !S[id]; majActs(); montrer(act); direct(act.getAttribute('aria-label')); }
    else if (id === 'clic') direct(`Auto-clic : ${ACTS.clic.verrou}`);
    else if (id === 'sac') ouvrirSac(act);
    else if (id === 'fauchage' && S.rechargeS === 0) {
      S.rechargeS = 20; majActs(); clearInterval(timerFauchage);
      timerFauchage = setInterval(() => { S.rechargeS--; if (S.rechargeS <= 0) clearInterval(timerFauchage); majActs(); }, 1000);
    } else if (id === 'radar' || id === 'reglages') direct(`${ACTS[id].nom} : s’ouvre ici dans le vrai jeu.`);
    return;
  }
  const evo = e.target.closest('[data-evo]'); if (evo) { evoluer(evo.dataset.evo); return; }
  const m = e.target.closest('[data-m]');
  if (m) { if (m.dataset.m === 'outils') { S.outils = !S.outils; document.querySelectorAll('[data-act="radar"],[data-act="fauchage"]').forEach(x => x.hidden = !S.outils); majActs(); } if (m.dataset.m === 'annonce') annoncer(); return; }
  const b = e.target.closest('[data-balle]'); if (b) { document.querySelectorAll('[data-balle]').forEach(x => x.setAttribute('aria-pressed', x === b)); return; }
  if (e.target.closest('[data-capturer]')) { direct('Capture lancée (maquette).'); return; }
  const cible = e.target.closest('[data-cible]');
  if (cible) {
    if (reduit()) return;
    const c = document.createElement('span'); c.className = 'degat-flottant contour-texte absolute right-1/4 top-1/2 font-titre text-3xl text-neutre-50'; c.textContent = '−3';
    document.querySelector('[data-degats]').append(c); setTimeout(() => c.remove(), 500);
  }
});

// ---- Évolution (AG) ----
const fait = new Set();
function evoluer(id) {
  const m = EQUIPE.find(x => x && x.id === id); if (!m || fait.has(id)) return;
  fait.add(id);
  document.querySelectorAll(`[data-evo="${id}"]`).forEach(el => { if (el.matches('.evo-bouton')) el.remove(); });
  const el = document.querySelector(`.carte-evo[data-evo="${id}"]`);
  const fin = () => {
    m.nom = m.evo.vers.nom; m.n = m.evo.vers.n; const ancien = m.evo; delete m.evo;
    const nouveau = document.createElement('div'); nouveau.innerHTML = carte(m); el.replaceWith(nouveau.firstElementChild);
    direct(`${ancien.vers.nom} : l’évolution est terminée.`);
    if (!document.querySelector('[data-evo]')) document.querySelector('[data-evo-ligne]')?.remove();
  };
  if (reduit()) { fin(); return; }
  el.classList.add('evolue'); direct(`${m.nom} évolue…`); setTimeout(fin, 2400);
}
let timerAnnonce;
function annoncer() {
  const a = document.querySelector('#annonce'); clearTimeout(timerAnnonce);
  const m = EQUIPE.find(x => x && x.evo && x.evo.type === 'niveau' && !fait.has(x.id)); if (!m) { a.hidden = true; return; }
  a.hidden = false;
  a.innerHTML = V === 'c' ? `<div class="annonce-evo"><span>${m.nom} peut évoluer !</span><button type="button" data-evo="${m.id}" data-libelle="Évoluer ${m.nom}" data-etat="Lance l’évolution">Évoluer</button></div>` : `${m.nom} peut évoluer !`;
  timerAnnonce = setTimeout(() => { a.hidden = true; }, 6000);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { cacher(); } });

majActs(); annoncer();
if (location.hash.includes('avec')) { S.outils = true; majActs(); }
if (location.hash.includes('sac')) setTimeout(() => ouvrirSac(), 50);
