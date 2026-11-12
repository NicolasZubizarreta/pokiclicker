/* Tutoriel (ticket E) : appli de démonstration (Combat, Équipe, Menu, Pension, Guide) + moteur de bulles partagé.
   Chaque variante pose sur <body> : data-variante, data-mode ("ancre" ou "fixe"), data-focus ("cadre", "voile" ou "reperes"),
   data-avatar ("chen" ou rien), data-frappe ("1" pour le texte qui s'écrit). Le CSS de la variante fait l'apparence.
   Le fragment d'URL choisit le scénario : #route1, #route1/3 (étape 4), #pension, #fauchage, #guide. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const jeu = $('.jeu'), contenu = $('#contenu'), couche = $('.tuto-couche'), annonce = $('#annonce');
  const cfg = { mode: document.body.dataset.mode || 'ancre', focus: document.body.dataset.focus || 'cadre', avatar: document.body.dataset.avatar || '', frappe: document.body.dataset.frappe === '1' };
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = '../../specimens/assets/pokemon/', OBJ = '../navigation-pc/img/objets/';
  const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  const ICO = {
    combat: ico('m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6'),
    equipe: ico('M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z'),
    pc: ico('M3 4h18v12H3zM9 20h6M12 16v4'),
    shop: ico('M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3'),
    carte: ico('m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17'),
    menu: ico('M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z'),
    auto: ico('m13 2-9 12h7l-1 8 10-13h-7z'),
    arret: ico('M8 3h8l5 5v8l-5 5H8l-5-5V8zM9 8v8M15 8v8'),
    reglage: ico('M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6'),
    sac: ico('M8 6V3h8v3M6 6h12l3 15H3zM7 13h10v5H7z'),
    capturer: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/></svg>',
    fauchage: ico('M12 20.5C6 16.5 3 13 3 9a4.5 4.5 0 0 1 9-1.2A4.5 4.5 0 0 1 21 9c0 4-3 7.5-9 11.5zM10.5 11l1.7-1.3v5.8M10.5 15.5h3.4'),
    sortie: ico('M9 4H5v16h4M16 8l4 4-4 4M20 12H9'),
    cadenas: ico('M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5z'),
  };
  const coeur = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12C-3 3 7-2 12 5c5-7 15-2 9 7Z"/></svg>';

  /* ---------- Les tutoriels (un tableau, comme data/tutoriels.json) ---------- */
  const TUTOS = {
    route1: { titre: 'Route 1', etapes: [
      { cible: 'ennemi', texte: 'Touche le Pokémon pour l’attaquer.', attend: 'attaque', ecran: 'combat', geste: 'Touche le Pokémon' },
      { cible: 'pv', evite: 'ennemi', texte: 'Sa barre de PV baisse. À zéro, il est vaincu.', attend: 'attaque', ecran: 'combat', geste: 'Touche encore le Pokémon' },
      { cible: 'capturer', texte: 'Capture-le avec une Poké Ball avant qu’il parte.', attend: 'capture', ecran: 'combat', geste: 'Touche Capturer' },
      { cible: 'equipe', texte: 'Tes Pokémon attaquent seuls : regarde ton équipe.', attend: 'equipe', geste: 'Ouvre l’équipe' },
      { cible: 'sac', texte: 'Les objets sont dans le Sac.', attend: 'sac', ecran: 'combat', geste: 'Ouvre le Sac' },
      { cible: null, texte: 'Bats les champions pour avancer vers la Ligue.', attend: 'ok', ecran: 'combat' },
    ] },
    pension: { titre: 'Pension', etapes: [
      { cible: 'parents', texte: 'Dépose deux parents compatibles.', attend: 'parents', ecran: 'pension', geste: 'Dépose les deux parents' },
      { cible: 'oeufs', texte: 'Éclosion après 25 combats : le Pokémon né fait +5 % de dégâts.', attend: 'ok', ecran: 'pension' },
    ] },
    fauchage: { titre: 'Fauchage', etapes: [
      { cible: 'fauchage', texte: 'Fauchage laisse l’ennemi à 1 PV : idéal pour capturer.', attend: 'fauchage', ecran: 'combat', geste: 'Touche Fauchage' },
    ] },
  };
  window.TUTOS = TUTOS;
  const mots = t => t.split(/\s+/).filter(m => /[\p{L}\p{N}]/u.test(m)).length;

  /* ---------- État du jeu de démonstration ---------- */
  let e, vus, tuto = null, dernierCible = null, frappeMinuteur = null;
  const neuf = () => ({ ecran: 'combat', pv: 100, balles: 5, fauchage: false, parents: [false, false], sac: false, argent: 0 });
  const nomEcran = { combat: 'Combat', equipe: 'Équipe', menu: 'Menu', pension: 'Pension', guide: 'Guide', pc: 'PC', shop: 'Shop', carte: 'Carte' };

  /* ---------- Écrans ---------- */
  const equipe = [{ n: 1, nom: 'Bulbizarre', niv: 5, dps: 79 }, { n: 4, nom: 'Salamèche', niv: 5, dps: 77 }, { n: 7, nom: 'Carapuce', niv: 5, dps: 78 }];
  const vueCombat = () => {
    const eq = Array.from({ length: 6 }, (_, i) => equipe[i] ? `<div class="case"><img src="${IMG}${equipe[i].n}.png" width="96" height="96" alt="${equipe[i].nom}, niveau ${equipe[i].niv}"><b>${equipe[i].niv}</b></div>` : '<div class="vide" aria-hidden="true">–</div>');
    const rangs = Array.from({ length: 6 }, (_, i) => equipe[i] ? `<div class="rang"><img src="${IMG}${equipe[i].n}.png" width="96" height="96" alt=""><div><p class="l1">${equipe[i].nom}<span>Niv. ${equipe[i].niv}</span></p><p class="dps">${equipe[i].dps} DPS</p></div></div>` : '<div class="rang vide">–</div>');
    const balle = e.balles > 0 ? `<button class="plaque balle" type="button" aria-label="Balle choisie : Poké Ball, ×${e.balles}"><img src="${OBJ}poke-ball.png" width="32" height="32" alt=""><span>Poké Ball<small>×${e.balles}</small></span><kbd class="touche-pc" aria-hidden="true">B</kbd></button>` : '<p class="sans-balle">Tu n’as aucune balle.</p>';
    return `<section class="combat" aria-label="Combat"><div class="combat-gauche">
      <div class="zone-ligne"><button class="plaque neutre" type="button" disabled>‹ <span>Précédent</span></button><span class="lieu">Route 1</span>
        <div class="etapes" aria-label="Étape 1 sur 10"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="boss"></i><span>1/10</span></div>
        <button class="plaque neutre" type="button" disabled><span>Suivant</span> ›</button></div>
      <button class="scene" type="button" data-scene aria-label="Attaquer Roucool">
        <span class="carte-ennemi" data-tuto="pv"><span class="ligne"><span class="nom">Roucool</span><span class="niv">Niv. 2</span></span><span class="pv" aria-hidden="true"><i></i></span></span>
        <span class="message-scene" aria-hidden="true"></span>
        <span class="ennemi" data-tuto="ennemi"><span class="socle"></span><img src="${IMG}16.png" width="96" height="96" alt=""></span>
      </button>
      <div class="capture">${balle}<button class="plaque action" type="button" data-act="capturer" data-tuto="capturer" ${e.balles ? '' : 'disabled'}>${ICO.capturer}Capturer<kbd class="touche-pc" aria-hidden="true">C</kbd></button>
        ${e.fauchage ? `<button class="plaque carre" type="button" data-act="fauchage" data-tuto="fauchage" aria-label="Fauchage" aria-pressed="false">${ICO.fauchage}<span class="reste"></span></button>` : ''}</div>
      <div class="boutons4"><button class="plaque vertical" type="button" aria-pressed="true">${ICO.auto}Attaque auto<kbd class="touche-pc" aria-hidden="true">A</kbd></button>
        <button class="plaque vertical" type="button" aria-pressed="false">${ICO.arret}Arrêt auto<kbd class="touche-pc" aria-hidden="true">T</kbd></button>
        <button class="plaque vertical" type="button">${ICO.reglage}Réglage<kbd class="touche-pc" aria-hidden="true">R</kbd></button>
        <button class="plaque vertical" type="button" data-act="sac" data-tuto="sac">${ICO.sac}Sac<kbd class="touche-pc" aria-hidden="true">S</kbd></button></div>
      <div class="equipe-ligne">${eq.join('')}</div></div>
      <aside class="combat-droite"><section class="cadre panneau" aria-label="Ton équipe"><h2>Ton équipe <span class="doux">3 / 6</span></h2>${rangs.join('')}</section>
        <section class="cadre panneau" aria-label="Effets actifs"><h2>Effets actifs</h2><p class="doux" style="padding-inline:var(--spacing)">Aucun effet actif.</p></section></aside></section>`;
  };
  const vueEquipe = () => `<section class="page" aria-label="Équipe"><h1>Équipe</h1><div class="cartes-equipe">${equipe.map(p => `<article class="cadre carte-pk"><img src="${IMG}${p.n}.png" width="96" height="96" alt=""><div><h2>${p.nom}</h2><p class="doux">Niv. ${p.niv}</p><p class="dps">${p.dps} DPS</p></div></article>`).join('')}</div><p class="doux">Tes Pokémon attaquent seuls : leur DPS s’additionne.</p></section>`;
  const vueMenu = () => `<section class="page" aria-label="Menu"><h1>Menu</h1><div class="tuiles">${['Sauvegarder', 'Monde', 'Pokédex', 'Badges', 'Statistiques'].map(t => `<button class="plaque neutre" type="button" disabled>${t}</button>`).join('')}<button class="plaque" type="button" data-aller="guide">Guide</button><button class="plaque" type="button" data-aller="pension">Pension</button><button class="plaque neutre" type="button" disabled>Réglages</button></div><p class="doux">Maquette : Guide et Pension sont les seuls écrans ouverts ici.</p></section>`;
  const vuePension = () => {
    const p = e.parents, deux = p[0] && p[1];
    const parent = i => p[i] ? `<article class="cadre parent"><div class="portrait"><img src="${IMG}1.png" width="96" height="96" alt=""></div><div><h2>Bulbizarre</h2><p class="doux">${i ? 'Mâle' : 'Femelle'} · Niv. 15</p></div><button class="plaque neutre" type="button" data-parent="${i}">Retirer</button></article>`
      : `<article class="cadre parent libre"><h2>Place libre</h2><p>Choisis un parent.</p><button class="plaque" type="button" data-parent="${i}">Déposer</button></article>`;
    return `<section class="pension" aria-label="Pension"><h1>Pension</h1>
      <div class="chance">${coeur}<div><strong>${deux ? 4 : 0} % par élimination</strong><p class="doux">${deux ? 'Deux parents compatibles.' : 'Il faut deux parents.'}</p></div></div>
      <div class="parents" data-tuto="parents" aria-label="Parents">${parent(0)}${parent(1)}</div>
      <section class="cadre oeufs" data-tuto="oeufs" aria-label="Œufs"><h2>Les œufs · 0 / 2</h2><div class="rangee-oeufs">${Array.from({ length: 5 }, (_, i) => `<div class="place">${i < 2 ? 'Libre' : ICO.cadenas + 'Fermé'}<span>${i + 1}</span></div>`).join('')}</div><p class="doux">Espèce inconnue jusqu’à l’éclosion.</p></section></section>`;
  };
  const vueGuide = () => `<section class="guide" aria-label="Guide"><h1 style="font-size:var(--text-2xl)">Guide</h1>
    <details class="cadre" open><summary>Tutoriels</summary><div class="corps">${Object.entries(TUTOS).map(([id, t]) => `<div class="ligne-tuto"><div><p><strong>${t.titre}</strong></p><p class="vu">${vus[id] === 'passe' ? 'Passé' : vus[id] === 'vu' ? 'Vu' : 'Pas encore vu'}</p></div><button class="plaque" type="button" data-rejouer="${id}">Rejouer le tuto</button></div>`).join('')}</div></details>
    ${['Combat', 'Capture', 'Équipe', 'Centre Commercial', 'CT Fauchage'].map(t => `<details class="cadre"><summary>${t}</summary></details>`).join('')}</section>`;
  const vuePlaceholder = n => `<section class="page"><h1>${n}</h1><p class="doux">Écran non maquetté ici.</p></section>`;
  const vueSac = () => `<div class="fenetre-fond"><div class="fenetre cadre" role="dialog" aria-modal="true" aria-label="Sac"><h2>Sac</h2><div class="grille-sac">${[['poke-ball', 'Poké Ball', 5], ['great-ball', 'Super Ball', 2], ['rare-candy', 'Super Bonbon', 3], ['repel', 'Repousse', 1]].map(([i, n, q]) => `<div class="ligne-sac"><img src="${OBJ}${i}.png" width="32" height="32" alt=""><span>${n}</span><span>×${q}</span></div>`).join('')}</div><button class="plaque neutre" type="button" data-fermer>Fermer</button></div></div>`;

  const NAV = [['combat', 'Combat', 1], ['equipe', 'Équipe', 2], ['pc', 'PC', 3], ['shop', 'Shop', 4], ['carte', 'Carte', 5], ['menu', 'Menu', 6]];
  const ecranActif = () => e.ecran === 'pension' || e.ecran === 'guide' ? 'menu' : e.ecran;
  function dessinerNav() {
    const act = ecranActif();
    $('.barre-nav').innerHTML = NAV.filter(n => n[0] !== 'pc').map(([id, nom]) => `<button type="button" data-aller="${id}" data-tuto="${id}" ${act === id ? 'aria-current="page"' : ''}>${ICO[id]}<span>${nom}</span></button>`).join('');
    $('.barre-laterale nav').innerHTML = NAV.map(([id, nom, k]) => `<button type="button" data-aller="${id}" data-tuto="${id}" data-tuto-cote="droite" ${act === id ? 'aria-current="page"' : ''}>${ICO[id]}${nom}<kbd aria-hidden="true">${k}</kbd></button>`).join('');
    $('.legende').innerHTML = ['Espace|Attaquer', 'C|Capturer', 'B|Balle', 'A|Auto', 'T|Arrêt', 'S|Sac', '1–6|Onglets', '?|Tous'].map(l => { const [k, t] = l.split('|'); return `<span><kbd>${k}</kbd> ${t}</span>`; }).join('');
  }
  function aller(id) {
    e.ecran = id; e.sac = false;
    contenu.innerHTML = ({ combat: vueCombat, equipe: vueEquipe, menu: vueMenu, pension: vuePension, guide: vueGuide }[id] || (() => vuePlaceholder(nomEcran[id])))();
    $('.fenetre-fond', jeu)?.remove();
    dessinerNav();
    if (id === 'combat') majCombat();
    placer();
  }

  /* ---------- Jeu : actions ---------- */
  let respawn = 0;
  function majCombat() {
    const barre = $('.pv'); if (!barre) return;
    barre.style.setProperty('--p', e.pv / 100);
    barre.classList.toggle('moyen', e.pv <= 50 && e.pv > 20);
    barre.classList.toggle('bas', e.pv <= 20);
  }
  function message(t) {
    const m = $('.message-scene'); if (m) { m.textContent = t; m.classList.add('visible'); clearTimeout(m._t); m._t = setTimeout(() => m.classList.remove('visible'), 2200); }
    annonce.textContent = t;
  }
  function reapparait() { e.pv = 100; majCombat(); }
  function attaquer() {
    if (e.pv <= 0) return;
    e.pv = Math.max(0, e.pv - 20); e.argent += 3; majCombat();
    const en = $('.ennemi'); en.classList.remove('coup'); void en.offsetWidth; en.classList.add('coup');
    const d = document.createElement('span'); d.className = 'degat'; d.textContent = '−20'; d.setAttribute('aria-hidden', 'true'); $('.scene').append(d); setTimeout(() => d.remove(), 600);
    $('#argent').textContent = e.argent + ' ₽';
    if (e.pv === 0) { message('Roucool est vaincu !'); setTimeout(() => { if (e.ecran === 'combat') reapparait(); }, 700); }
    evt('attaque');
  }
  function capturer() {
    if (!e.balles) return; e.balles--; aller('combat'); reapparait(); message('Roucool est capturé !'); evt('capture');
  }
  function faucher() { e.pv = Math.min(e.pv, 1); majCombat(); message('Fauchage : Roucool reste à 1 PV.'); const b = $('[data-act="fauchage"]'); if (b) { b.setAttribute('aria-pressed', 'true'); b.querySelector('.reste').textContent = '20 s'; } evt('fauchage'); }
  function ouvrirSac() { e.sac = true; jeu.insertAdjacentHTML('beforeend', vueSac()); $('.fenetre-fond').style.zIndex = 25; $('[data-fermer]').focus(); evt('sac'); placer(); }
  function fermerSac() { $('.fenetre-fond')?.remove(); e.sac = false; $('[data-act="sac"]')?.focus(); placer(); }

  /* ---------- Moteur de bulles ---------- */
  const etape = () => tuto && TUTOS[tuto.id].etapes[tuto.i];
  function lancer(id, i = 0) {
    tuto = { id, i }; dernierCible = null; construire(); placer();
  }
  function evt(nom) {
    const s = etape(); if (!s || s.attend !== nom || (s.ecran && s.ecran !== e.ecran && nom !== 'equipe')) return;
    if (s.attend === 'parents' && !(e.parents[0] && e.parents[1])) return;
    suivante();
  }
  function suivante() {
    const n = TUTOS[tuto.id].etapes.length;
    if (tuto.i + 1 >= n) { vus[tuto.id] = 'vu'; fin(); annonce.textContent = 'Tutoriel terminé.'; return; }
    tuto.i++; dernierCible = null; construire(); placer();
  }
  function passer() { vus[tuto.id] = 'passe'; fin(); toast('Tuto passé. Rejoue-le depuis Menu › Guide.'); }
  function fin() { tuto = null; couche.innerHTML = ''; $$('[aria-describedby="tuto-texte"]').forEach(x => x.removeAttribute('aria-describedby')); }
  function toast(t) { $('.pop')?.remove(); jeu.insertAdjacentHTML('beforeend', `<p class="pop" role="presentation">${t}</p>`); annonce.textContent = t; setTimeout(() => $('.pop')?.remove(), 2600); }
  function trouver(id) { return $$(`[data-tuto="${id}"]`, jeu).find(x => x.getClientRects().length); }
  function construire() {
    const s = etape(); const n = TUTOS[tuto.id].etapes.length;
    const absent = !!(s.ecran && s.ecran !== e.ecran);
    const texte = absent ? `Reviens au ${nomEcran[s.ecran]} pour continuer.` : s.texte;
    const ok = !absent && s.attend === 'ok';
    const compteur = n > 1 ? `${tuto.i + 1}/${n}` : '';
    const segs = n > 1 ? `<span class="segs" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${k < tuto.i ? 'fait' : k === tuto.i ? 'ici' : ''}"></i>`).join('')}</span>` : '';
    const avatar = cfg.avatar ? '<img class="avatar" src="../navigation-pc/img/chen/SpriteChen1.png" width="114" height="120" alt="">' : '';
    const geste = !absent && s.geste && cfg.focus === 'voile' ? `<p class="geste"><span>À faire</span> ${s.geste}</p>` : '';
    couche.innerHTML = `<div class="repere" hidden></div>
      <div class="tuto" role="region" aria-label="Tutoriel ${TUTOS[tuto.id].titre}${compteur ? ', étape ' + compteur : ''}" data-etape="${tuto.i}">
        <span class="fleche" aria-hidden="true"></span>${avatar}
        <div class="tuto-corps">
          <p class="tuto-entete">${cfg.avatar ? '<span class="qui">Prof. Chen</span>' : ''}${compteur ? `<span class="compteur">${compteur}</span>` : ''}${segs}</p>
          <p class="tuto-texte" id="tuto-texte" aria-live="polite"><span class="lu">${texte}</span></p>
          ${geste}
          <div class="tuto-actions">${ok ? '<button class="plaque action tuto-ok" type="button">Compris</button>' : ''}<button class="tuto-passer" type="button">Passer le tuto</button></div>
        </div></div>`;
    $('.tuto-passer').onclick = passer;
    if ($('.tuto-ok')) $('.tuto-ok').onclick = suivante;
    if (cfg.frappe && !reduit()) ecrire($('.tuto-texte .lu'), texte);
    s._absent = absent;
    if (cfg.focus === 'voile') couche.insertAdjacentHTML('afterbegin', '<i class="voile v1"></i><i class="voile v2"></i><i class="voile v3"></i><i class="voile v4"></i>');
    if (cfg.focus === 'reperes') $('.repere').innerHTML = '<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><b class="num"></b>';
  }
  function ecrire(el, t) {
    clearInterval(frappeMinuteur); el.textContent = ''; let k = 0;
    const vitesse = 30;
    el.setAttribute('aria-hidden', 'true'); const lu = document.createElement('span'); lu.className = 'sr-only'; lu.textContent = t; el.after(lu);
    frappeMinuteur = setInterval(() => { el.textContent = t.slice(0, ++k); if (k >= t.length) clearInterval(frappeMinuteur); }, vitesse);
    el.closest('.tuto').addEventListener('click', ev => { if (!ev.target.closest('button')) { clearInterval(frappeMinuteur); el.textContent = t; } });
  }
  const R = el => { const r = el.getBoundingClientRect(), j = jeu.getBoundingClientRect(); return { x: r.left - j.left, y: r.top - j.top, w: r.width, h: r.height }; };
  const croise = (a, b, m = 0) => a.x < b.x + b.w + m && a.x + a.w > b.x - m && a.y < b.y + b.h + m && a.y + a.h > b.y - m;
  function placer() {
    if (!tuto) return;
    const s = etape(); const bulle = $('.tuto'); if (!bulle) return;
    if (s._absent !== !!(s.ecran && s.ecran !== e.ecran)) { construire(); return placer(); }
    const id = s._absent ? s.ecran : s.cible;
    const cible = id ? trouver(id) : null;
    $$('[aria-describedby="tuto-texte"]').forEach(x => x.removeAttribute('aria-describedby'));
    if (cible) { cible.setAttribute('aria-describedby', 'tuto-texte'); if (cible !== dernierCible && !cible.closest('.barre-nav, .barre-laterale')) { cible.scrollIntoView({ block: 'nearest' }); } dernierCible = cible; }
    const J = { w: jeu.clientWidth, h: jeu.clientHeight };
    const t = cible ? R(cible) : null;
    const u = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.25, marge = u * 4, g = u * 3;
    const rep = $('.repere');
    if (t) { const pad = u * 1.5; Object.assign(rep.style, { left: t.x - pad + 'px', top: t.y - pad + 'px', width: t.w + 2 * pad + 'px', height: t.h + 2 * pad + 'px' }); rep.hidden = false; rep._r = { x: t.x - pad, y: t.y - pad, w: t.w + 2 * pad, h: t.h + 2 * pad }; }
    else rep.hidden = true;
    const num = $('.repere .num'); if (num) num.textContent = tuto.i + 1;
    bulle.style.left = bulle.style.top = '0px'; bulle.style.removeProperty('--fl');
    if (cfg.mode === 'ancre') bulle.style.removeProperty('width');
    let bw = bulle.offsetWidth, bh = bulle.offsetHeight;
    const ev = s.evite && !s._absent ? trouver(s.evite) : null; let E = ev ? R(ev.querySelector('img') || ev) : null;
    if (E) E = { x: E.x + E.w * 0.25, y: E.y, w: E.w * 0.5, h: E.h }; /* le sprite occupe le milieu de son image */
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const zone = R(contenu);
    let x, y, cote = 'centre';
    if (cfg.mode === 'ancre' && t) {
      const bas = cl(t.x + t.w / 2 - bw / 2, g, J.w - bw - g), mil = cl(t.y + t.h / 2 - bh / 2, g, J.h - bh - g);
      const essais = { haut: { x: bas, y: t.y - g * 1.6 - bh }, bas: { x: bas, y: t.y + t.h + g * 1.6 }, droite: { x: t.x + t.w + g * 1.6, y: mil }, gauche: { x: t.x - g * 1.6 - bw, y: mil } };
      const prefs = cible.dataset.tutoCote === 'droite' ? ['droite', 'bas', 'haut', 'gauche'] : (t.y + t.h / 2 > J.h / 2 ? ['haut', 'bas', 'gauche', 'droite'] : ['bas', 'haut', 'droite', 'gauche']);
      const tmoy = { x: t.x, y: t.y, w: t.w, h: t.h };
      cote = prefs.find(c => { const p = essais[c]; const b = { x: p.x, y: p.y, w: bw, h: bh }; return p.x >= g && p.y >= g && p.x + bw <= J.w - g && p.y + bh <= J.h - g && !croise(b, tmoy, g * 0.5); }) || prefs[0];
      ({ x, y } = essais[cote]);
      /* Élément à garder libre (celui qu'on doit toucher pour valider l'étape) : la bulle se rétrécit d'un seul côté. */
      if (E && croise({ x: cl(x, g, J.w - bw - g), y, w: bw, h: bh }, E, g * 0.5)) {
        const gauche = E.x - g * 2.5, droite = J.w - (E.x + E.w) - g * 2.5, larg = Math.max(gauche, droite);
        if (larg >= u * 44) {
          bulle.style.width = larg + 'px'; bw = bulle.offsetWidth; bh = bulle.offsetHeight;
          x = gauche >= droite ? g : E.x + E.w + g * 1.5;
          if (cote === 'haut') y = t.y - g * 1.6 - bh; else if (cote === 'bas') y = t.y + t.h + g * 1.6;
        }
      }
      x = cl(x, g, J.w - bw - g); y = cl(y, g, J.h - bh - g);
      const fl = (cote === 'haut' || cote === 'bas') ? cl(t.x + t.w / 2 - x, g * 2, bw - g * 2) : cl(t.y + t.h / 2 - y, g * 2, bh - g * 2);
      bulle.style.setProperty('--fl', fl + 'px');
    } else if (cfg.mode === 'ancre') { x = (J.w - bw) / 2; y = zone.y + (zone.h - bh) / 2; }
    else {
      bulle.style.width = zone.w - 2 * marge + 'px';
      const bh2 = bulle.offsetHeight; x = matchMedia('(min-width: 64rem)').matches ? zone.x + zone.w - marge - bulle.offsetWidth : zone.x + marge + (zone.w - 2 * marge - bulle.offsetWidth) / 2;
      const choix = { bas: zone.y + zone.h - bh2 - g, haut: zone.y + g };
      cote = 'bas';
      if (t) {
        const ordre = t.y + t.h / 2 < zone.y + zone.h / 2 ? ['bas', 'haut'] : ['haut', 'bas'];
        cote = ordre.find(c => !croise({ x, y: choix[c], w: bulle.offsetWidth, h: bh2 }, t, g)) || ordre[0];
      }
      y = choix[cote];
    }
    bulle.style.left = x + 'px'; bulle.style.top = y + 'px'; bulle.dataset.cote = cote;
    if (cfg.focus === 'voile') {
      const v = $$('.voile', couche); const r = t ? rep._r : null;
      const set = (el, a, b, c, d) => Object.assign(el.style, { left: a + 'px', top: b + 'px', width: Math.max(0, c) + 'px', height: Math.max(0, d) + 'px' });
      if (r) { set(v[0], 0, 0, J.w, r.y); set(v[1], 0, r.y + r.h, J.w, J.h - r.y - r.h); set(v[2], 0, r.y, r.x, r.h); set(v[3], r.x + r.w, r.y, J.w - r.x - r.w, r.h); }
      else { set(v[0], 0, 0, J.w, J.h); v.slice(1).forEach(el => set(el, 0, 0, 0, 0)); }
    }
  }

  /* ---------- Événements ---------- */
  jeu.addEventListener('click', ev => {
    const b = ev.target.closest('button'); const sc = ev.target.closest('[data-scene]');
    if (b?.dataset.aller) { aller(b.dataset.aller); if (b.dataset.aller === 'equipe') evt('equipe'); return; }
    if (b?.dataset.act === 'capturer') return capturer();
    if (b?.dataset.act === 'fauchage') return faucher();
    if (b?.dataset.act === 'sac') return ouvrirSac();
    if (b && 'fermer' in b.dataset) return fermerSac();
    if (b?.dataset.rejouer) { const id = b.dataset.rejouer; e = neuf(); e.fauchage = id === 'fauchage'; e.ecran = id === 'pension' ? 'pension' : 'combat'; vus[id] = 'non'; aller(e.ecran); lancer(id); return; }
    if (b?.dataset.parent !== undefined) { const i = +b.dataset.parent; e.parents[i] = !e.parents[i]; aller('pension'); $(`[data-parent="${i}"]`)?.focus(); evt('parents'); return; }
    if (sc) attaquer();
  });
  addEventListener('keydown', ev => { if (ev.key === 'Escape' && e.sac) fermerSac(); });
  new ResizeObserver(() => placer()).observe(jeu);
  addEventListener('resize', placer);
  contenu.addEventListener('scroll', () => placer(), { passive: true });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => tuto && (construire(), placer()));

  /* ---------- Bandeau de la maquette ---------- */
  const ouvrir = $('.maq-ouvrir'), panneau = $('#maq-panneau');
  ouvrir.addEventListener('click', () => { const o = panneau.hidden; panneau.hidden = !o; ouvrir.setAttribute('aria-expanded', String(o)); });
  const choix = $('#scenario');
  function demarrer(spec) {
    const [id, n] = (spec || 'route1').replace('#', '').split('/'); const i = Number(n || 0);
    e = neuf(); vus = { route1: 'vu', pension: 'passe', fauchage: 'vu' }; if (tuto) fin();
    if (id === 'guide') { aller('guide'); } else {
      if (id === 'fauchage') e.fauchage = true;
      if (id === 'pension') e.ecran = 'pension';
      if (id === 'route1') { if (i >= 1) e.pv = 80; if (i >= 2) e.pv = 60; if (i >= 3) e.balles = 4; }
      aller(e.ecran);
      if (TUTOS[id]) { vus[id] = 'non'; lancer(id, i); }
    }
    choix.value = id; majBilan();
  }
  function majBilan() { $('#bilan').textContent = Object.entries(TUTOS).map(([id, t]) => `${t.titre} : ${t.etapes.map(s => mots(s.texte)).join(', ')} mots`).join(' · '); }
  choix.addEventListener('change', () => { location.hash = choix.value; demarrer(choix.value); panneau.hidden = true; ouvrir.setAttribute('aria-expanded', 'false'); });
  $('#relancer').addEventListener('click', () => { demarrer(choix.value); panneau.hidden = true; ouvrir.setAttribute('aria-expanded', 'false'); });
  addEventListener('hashchange', () => demarrer(location.hash));
  window.__tuto = { demarrer, mots, TUTOS, etat: () => ({ e, tuto }) };
  demarrer(location.hash);
})();
