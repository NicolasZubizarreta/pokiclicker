// Maquette jetable : scène de Ronflex (ticket AJ). Rien ne touche au vrai jeu.
// Les classes (cadre, bg-surface, font-titre, etc.) viennent de jeu.css, copie du CSS compilé du jeu.
const V = document.body.dataset.v;               // 'a' | 'b' | 'c'
const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Durées lues dans les jetons (design/tokens.css), jamais écrites ici.
const jeton = (nom, secours) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  const n = parseFloat(v); return Number.isFinite(n) ? n * (v.endsWith('ms') ? 1 : 1000) : secours;
};
const CARACTERE_MS = 30;                          // data/reglages.json : intro.caractereMs

const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="8" cy="18" r="3"/><path fill="none" d="M11 18V5l8 3"/></svg>';
const FLUTE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v6H3z"/><path d="M7 12h.01M11 12h.01M15 12h.01"/></svg>';
const TOTAL = V === 'c' ? 3 : 4;
const S = { etat: 'avant', notes: 0, joue: false, gele: false, run: false };

const TEXTE_AVANT = 'Un Ronflex endormi bloque la route de Parmanie. Une Pokéflûte pourrait le réveiller.';
const TEXTE_REVEIL = 'La mélodie de la Pokéflûte réveille Ronflex ! Il se lève et se prépare au combat.';
const INSTR = {
  a: 'Touche le bouton pour jouer quatre notes.',
  b: 'Fais glisser la flûte sur le tapis, de gauche à droite.',
  c: 'Touche Jouer quand une note s’allume. Trois notes à jouer.',
};
const AUTRES = { a: 'A · Toucher la Pokéflûte', b: 'B · Glisser sur le tapis', c: 'C · Rythme en trois notes' };

// ---- Fragments ----
const notesHtml = Array.from({ length: TOTAL }, (_, i) => `<span class="note" data-i="${i}" aria-hidden="true">${NOTE}</span>`).join('');
function commande() {
  if (V === 'a') return `<div class="commande-scene"><button type="button" class="flute cadre" data-flute><span class="flute-icone">${FLUTE}</span><strong>Jouer la Pokéflûte</strong></button></div>`;
  if (V === 'b') return `<div class="commande-scene"><div class="tapis cadre" data-tapis role="slider" tabindex="0" aria-label="Mélodie de la Pokéflûte" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0" aria-valuetext="0 note sur 4">
    <div class="piste" data-piste><div class="remplie"></div>${[0, 1, 2, 3].map(i => `<span class="marque" data-marque="${i}" style="left:${(i + .5) * 25}%">${NOTE}</span>`).join('')}</div><div class="curseur" data-curseur>${FLUTE}</div></div></div>`;
  return `<div class="commande-scene"><div class="rythme"><div class="pads" aria-hidden="true">${[0, 1, 2].map(() => `<div class="pad">${NOTE}</div>`).join('')}</div><button type="button" class="flute cadre" data-flute><strong>Jouer</strong></button></div></div>`;
}
const points = () => `<div class="points" aria-hidden="true" data-points>${Array.from({ length: TOTAL }, () => '<span></span>').join('')}</div>`;

const chemins = ['m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6', 'M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z', 'M3 4h18v12H3zM9 20h6M12 16v4', 'M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3', 'm2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17', 'M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z'];
const navigation = () => `<nav aria-label="Navigation principale" class="fixed inset-x-0 bottom-0 z-10 box-content h-14 rounded-cadre bg-surface pb-[env(safe-area-inset-bottom)] after:pointer-events-none after:absolute after:inset-0 after:rounded-cadre after:border after:border-bordure after:inset-ring after:inset-ring-region-argent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-24 lg:pb-0"><div class="flex h-full lg:flex-col">${
  ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Plus'].map((t, i) => `<button type="button" ${i === 4 ? 'aria-current="page"' : ''} class="relative flex h-14 min-h-11 min-w-11 flex-1 flex-col items-center justify-center text-sm lg:flex-none ${i === 4 ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}${t === 'PC' ? ' opacity-60' : ''}">${i === 4 ? '<span aria-hidden="true" class="absolute inset-x-0 top-0 h-1 bg-region-accent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-full lg:w-1"></span>' : ''}<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false" class="shrink-0"><path d="${chemins[i]}"/></svg><span>${t}</span></button>`).join('')}</div></nav>`;

// ---- Montage ----
document.querySelector('#racine').innerHTML = `<div data-region="kanto" data-theme="dark" class="min-h-dvh bg-fond font-texte text-texte pb-[env(safe-area-inset-bottom)] lg:pb-0">
  ${navigation()}
  <main id="contenu" tabindex="-1" class="mb-14 min-w-0 p-4 lg:mb-0 lg:ml-24 lg:p-8">
    <div class="maquette cadre" role="group" aria-label="Contrôles de la maquette"><h1>${AUTRES[V]}</h1><p>${document.body.dataset.resume}</p>
      <div class="rangee"><button type="button" class="puce" data-m="avant">Dialogue d’avant</button><button type="button" class="puce" data-m="jeu">Rejouer la scène</button><button type="button" class="puce" data-m="reveil">Voir le réveil</button><button type="button" class="puce" data-m="sac">Pokéflûte depuis le Sac</button><a class="puce" href="index.html">Variantes</a></div></div>
    <header class="mb-4"><h1 class="font-titre text-2xl font-semibold">Route de Parmanie</h1><p>Entre la Centrale et Parmanie</p></header>
    <div class="cadre-scene grid gap-2">
      <section aria-label="Scène de Ronflex" class="scene-ronflex">
        <img class="decor" src="img/pont-pepite.webp" width="1920" height="1080" alt="">
        <div class="carte-ronflex cadre bg-surface/82"><div class="ligne"><h2>Ronflex</h2><span>Niv. 45</span></div><span class="etat-ronflex" data-etat-texte>Endormi</span></div>
        <div class="ronflex" aria-hidden="false"><div aria-hidden="true" class="socle absolute bottom-10 h-12 w-3/4 bg-region-socle lg:bottom-16 lg:h-16"></div><img class="sprite-r image-rendering-pixelated" src="img/143.png" width="96" height="96" alt="Ronflex" data-alt><span class="zzz" aria-hidden="true">Zzz</span><span class="alerte-r" aria-hidden="true">!</span></div>
        ${notesHtml}
        ${commande()}
      </section>
      <section class="indicateur cadre" aria-label="Comment jouer la Pokéflûte" data-indicateur>
        <div class="ligne-i"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v6H3z"/><path d="M7 12h.01M11 12h.01M15 12h.01"/></svg><div class="min-w-0"><p class="nom">Pokéflûte</p><p data-instr></p></div></div>
        ${points()}
        <p role="status" aria-live="polite" class="t-doux" data-info></p>
      </section>
      <section class="indicateur cadre" aria-label="Message du Sac" data-sac hidden><div class="ligne-i"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 7V6a3 3 0 0 1 6 0v1M6 7h12v14H6zM6 12h12M10 15h4"/></svg><div class="min-w-0"><p class="nom">Sac · Pokéflûte</p><p role="status">À utiliser devant Ronflex.</p></div></div></section>
    </div>
    <p role="status" class="sr-seulement" data-direct></p>
  </main></div>`;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const direct = t => { $('[data-direct]').textContent = t; };
const racine = $('#racine');

// ---- Dialogue de scène : mêmes classes que DialogueScene et BoiteDialogue du jeu ----
function dire(locuteur, texte, suite) {
  const d = document.createElement('dialog');
  d.className = 'dial-scene fixed inset-0 m-auto max-h-full w-full max-w-xl overflow-y-auto bg-transparent p-4 text-texte';
  d.setAttribute('aria-label', 'Dialogue de scène');
  d.innerHTML = `<button type="button" aria-label="${locuteur} : ${texte}" class="cadre relative min-h-24 w-full bg-surface p-4 pr-10 text-left"><span aria-hidden="true" class="block font-titre text-lien">${locuteur}</span><span aria-hidden="true" class="block break-words leading-loose" data-texte></span><span aria-hidden="true" class="absolute bottom-2 right-2 text-alerte-base motion-safe:animate-bounce" hidden>▼</span></button>`;
  racine.append(d);
  const zone = d.querySelector('[data-texte]'), fleche = d.querySelector('span[hidden]'), bouton = d.querySelector('button');
  let n = reduit() ? texte.length : 0, minuteur;
  const ecrire = () => { zone.textContent = texte.slice(0, n); if (n >= texte.length) { fleche.hidden = false; clearInterval(minuteur); } };
  ecrire();
  if (n < texte.length) minuteur = setInterval(() => { n++; ecrire(); }, CARACTERE_MS);
  d.addEventListener('cancel', e => e.preventDefault());
  bouton.addEventListener('click', () => {
    if (n < texte.length) { n = texte.length; ecrire(); return; }
    d.close(); d.remove(); suite?.();
  });
  d.showModal(); bouton.focus();
}

// ---- État de la scène ----
const commandeFocus = () => ($('[data-flute]') || $('[data-tapis]'))?.focus();
function majPoints() { $$('[data-points] span').forEach((p, i) => p.classList.toggle('plein', i < S.notes)); }
function majScene() {
  document.body.dataset.etat = S.etat;
  $('[data-etat-texte]').textContent = S.etat === 'reveil' ? 'Réveillé' : 'Endormi';
  $('[data-alt]').alt = S.etat === 'reveil' ? 'Ronflex, réveillé' : 'Ronflex, endormi';
  const ind = $('[data-indicateur]'); ind.classList.toggle('reveil', S.etat === 'reveil');
  $('[data-instr]').textContent = S.etat === 'reveil'
    ? 'Ronflex est réveillé. Le combat commence (déjà dans le jeu). Une fois battu : « Ronflex s’écarte. La route de Parmanie est libre ! »'
    : INSTR[V];
  $('[data-points]').hidden = S.etat === 'reveil';
  const fini = S.etat === 'reveil';
  const f = $('[data-flute]'); if (f) f.setAttribute('aria-disabled', String(fini || S.joue));
  const t = $('[data-tapis]'); if (t) t.setAttribute('aria-disabled', String(fini));
  $$('.note').forEach((n, i) => n.classList.toggle('visible', i < S.notes));
  majPoints();
  if (V === 'b') majTapis();
}
function retablir(etat, notes = 0) {
  S.etat = etat; S.notes = notes; S.joue = false; S.run = false; S.gele = false;
  clearInterval(minuteurRythme); clearTimeout(minuteurSuite);
  $$('.pad').forEach(p => p.className = 'pad');
  S.attendue = 0; S.actif = -1; S.p = notes / 4;
  $('[data-info]').textContent = '';
  majScene();
}
let minuteurRythme, minuteurSuite;

function noter(i) {
  S.notes = Math.max(S.notes, i + 1);
  majScene();
  direct(`Note ${S.notes} sur ${TOTAL}`);
}
function reveil() {
  clearInterval(minuteurRythme);
  S.joue = false; S.etat = 'reveil'; majScene();
  dire('Narration', TEXTE_REVEIL, () => { commandeFocus(); });
}

// ---- Variante A : toucher la Pokéflûte, quatre notes ----
function jouerA() {
  if (S.etat !== 'jeu' || S.joue) return;
  S.joue = true; majScene();
  const pas = reduit() ? 0 : jeton('--duration-lent', 300) * 1.5;
  for (let i = 0; i < TOTAL; i++) setTimeout(() => noter(i), i * pas);
  minuteurSuite = setTimeout(reveil, TOTAL * pas + jeton('--duration-lent', 300));
}

// ---- Variante B : glisser sur le tapis ----
S.p = 0;
function majTapis() {
  const t = $('[data-tapis]'); if (!t) return;
  t.style.setProperty('--p', S.p);
  t.setAttribute('aria-valuenow', S.notes); t.setAttribute('aria-valuetext', `${S.notes} ${S.notes > 1 ? 'notes' : 'note'} sur 4`);
  $$('[data-marque]').forEach((m, i) => m.classList.toggle('jouee', i < S.notes));
}
function suivre(e) {
  const piste = $('[data-piste]').getBoundingClientRect(), tw = $('[data-curseur]').getBoundingClientRect().width;
  const frac = Math.min(1, Math.max(0, (e.clientX - piste.left - tw / 2) / (piste.width - tw)));
  const centre = tw / 2 + frac * (piste.width - tw);
  const n = [0, 1, 2, 3].filter(i => piste.width * (i + .5) / 4 <= centre).length;
  S.p = frac;
  if (n !== S.notes) { S.notes = n; direct(`Note ${n} sur 4`); majScene(); } else majTapis();
  if (S.notes === 4) { S.p = 1; majTapis(); finGlisse(); minuteurSuite = setTimeout(reveil, jeton('--duration-lent', 300)); }
}
let glisse = false;
function finGlisse() { glisse = false; $('[data-tapis]').classList.remove('glisse'); }
function initB() {
  const t = $('[data-tapis]');
  t.addEventListener('pointerdown', e => { if (S.etat !== 'jeu' || S.notes === 4) return; glisse = true; t.classList.add('glisse'); t.setPointerCapture(e.pointerId); suivre(e); });
  t.addEventListener('pointermove', e => { if (glisse) suivre(e); });
  const relache = () => { if (!glisse) return; finGlisse(); S.p = S.notes / 4; majTapis(); };
  t.addEventListener('pointerup', relache); t.addEventListener('pointercancel', relache);
  t.addEventListener('keydown', e => {
    if (S.etat !== 'jeu') return;
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.notes = Math.min(4, S.notes + 1); }
    else if (d) { e.preventDefault(); S.notes = Math.max(0, Math.min(4, S.notes + d)); }
    else if (e.key === 'End') { e.preventDefault(); S.notes = 4; }
    else if (e.key === 'Home') { e.preventDefault(); S.notes = 0; }
    else return;
    S.p = S.notes / 4; majScene(); direct(`Note ${S.notes} sur 4`);
    if (S.notes === 4) minuteurSuite = setTimeout(reveil, jeton('--duration-lent', 300));
  });
}

// ---- Variante C : rythme en trois notes ----
function majPads() { $$('.pad').forEach((p, i) => { p.classList.toggle('actif', i === S.actif); p.classList.toggle('reussi', i < S.attendue); }); }
function jouerC() {
  if (S.etat !== 'jeu') return;
  if (!S.run) {
    S.run = true; S.actif = 0; S.attendue = 0; majPads();
    $('[data-info]').textContent = 'Le rythme commence. Touche Jouer quand une note s’allume.';
    if (!S.gele) minuteurRythme = setInterval(() => { S.actif = (S.actif + 1) % 3; majPads(); }, jeton('--duree-signal', 1000));
    return;
  }
  if (S.actif === S.attendue) {
    S.attendue++; majPads(); noter(S.actif);
    $('[data-info]').textContent = S.attendue < 3 ? `Bien joué. Prochaine note : la ${S.attendue + 1}.` : 'Mélodie jouée.';
    if (S.attendue === 3) { clearInterval(minuteurRythme); S.actif = -1; majPads(); minuteurSuite = setTimeout(reveil, jeton('--duration-lent', 300)); }
  } else {
    const m = `Pas sur le temps. Attends la note ${S.attendue + 1}.`; $('[data-info]').textContent = m; direct(m);
  }
}

// ---- Interactions communes ----
document.addEventListener('click', e => {
  if (e.target.closest('[data-flute]')) {
    if (e.target.closest('[data-flute]').getAttribute('aria-disabled') === 'true') return;
    if (V === 'a') jouerA(); else jouerC();
    return;
  }
  const m = e.target.closest('[data-m]'); if (!m) return;
  const quoi = m.dataset.m;
  $('[data-sac]').hidden = quoi !== 'sac';
  if (quoi === 'avant') { retablir('avant'); dire('Narration', TEXTE_AVANT, () => { retablir('jeu'); commandeFocus(); }); }
  else if (quoi === 'jeu') { retablir('jeu'); commandeFocus(); }
  else if (quoi === 'reveil') retablir('reveil');
  else if (quoi === 'sac') { retablir('jeu'); direct('À utiliser devant Ronflex.'); }
});
if (V === 'b') initB();

// ---- Départ ----
const h = location.hash;
$('[data-sac]').hidden = !h.includes('sac');
if (h.includes('reveil-dialogue')) { retablir('reveil'); dire('Narration', TEXTE_REVEIL); }
else if (h.includes('reveil')) retablir('reveil');
else if (h.includes('notes')) {
  retablir('jeu', V === 'c' ? 1 : 2); S.gele = true;
  if (V === 'c') { S.run = true; S.attendue = 1; S.actif = 1; majPads(); $('[data-info]').textContent = 'Bien joué. Prochaine note : la 2.'; }
}
else if (h.includes('jeu') || h.includes('sac')) retablir('jeu');
else { retablir('avant'); dire('Narration', TEXTE_AVANT, () => { retablir('jeu'); commandeFocus(); }); }
