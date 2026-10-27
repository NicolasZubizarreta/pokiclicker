(() => {
  'use strict';
  const donnees = [
    ['Bourg Palette', 'ville', null, null, 0],
    ['Route 1', 'route', '2–5', 'Rattata (Géant)', 10],
    ['Forêt de Jade', 'donjon', '5–8', 'Papilusion', 10],
    ["Arène d’Argenta", 'arène', '9–12', 'Pierre (Onix)', 10],
    ['Mont Sélénite', 'donjon', '12–15', 'Mélodelfe', 10],
    ["Arène d’Azuria", 'arène', '15–18', 'Ondine (Staross)', 10],
    ['Pont Pépite', 'route', '17–20', 'Rival (Roucarnage)', 10],
    ['Arène de Carmin', 'arène', '20–25', 'Major Bob (Raichu)', 10],
    ['Cave Taupiqueur', 'donjon', '23–27', 'Triopikeur', 10],
    ['Tunnel Rocheux', 'donjon', '25–30', 'Grolem', 10],
    ['Tour Pokémon', 'donjon', '28–33', 'Ectoplasma', 10],
    ['Céladopole', 'arène', '30–35', 'Erika (Empiflor)', 10],
    ['Centrale', 'donjon', '32–38', 'Électhor', 10],
    ['Arène de Parmanie', 'arène', '35–40', 'Koga (Smogogo)', 10],
    ['Sylphe SARL', 'donjon', '38–43', 'Giovanni (Persian)', 10],
    ['Arène de Safrania', 'arène', '40–45', 'Sabrina (Alakazam)', 10],
    ['Îles Écume', 'donjon', '43–48', 'Artikodin', 10],
    ["Arène de Cramois’Île", 'arène', '45–50', 'Blaine (Arcanin)', 10],
    ['Arène de Jadielle', 'arène', '50–58', 'Giovanni (Rhinoféros)', 10],
    ['Caverne Azurée', 'donjon', '55–65', 'Mewtwo', 10],
    ['Route Victoire', 'donjon', '60–70', 'Sulfura', 10],
    ['Ligue Pokémon', 'ligue', '70–90', 'Maître Blue', 10],
  ];
  const zones = donnees.map(([nom, type, niveaux, boss, etapes], n) => ({ n, nom, type, niveaux, boss, etapes }));
  const points = [[.172,.751],[.172,.674],[.172,.472],[.172,.362],[.328,.306],[.485,.306],[.485,.248],[.485,.639],[.516,.638],[.609,.306],[.618,.486],[.391,.472],[.609,.361],[.422,.806],[.493,.487],[.485,.471],[.297,.917],[.172,.919],[.172,.583],[.490,.151],[.109,.361],[.109,.306]];
  const positions = Object.fromEntries(points.map(([x, y], n) => [n, { x, y }]));
  let etat = { ouvertes: new Set([0, 1, 2]), terminees: new Set([0]), actuelle: 1, badges: 0 };
  let selection = null, hote, fiche, origine, main;
  const raison = n => n === 21 ? 'Il te faut les 8 badges.' : `Bats le boss de ${zones[n - 1]?.nom}.`;
  const statut = n => etat.terminees.has(n) ? 'terminee' : etat.ouvertes.has(n) ? 'ouverte' : 'verrouillee';
  const annoncer = texte => { main.querySelector('[role="status"]').textContent = texte; };

  function actualiser() {
    main.querySelectorAll('[data-zone]').forEach(element => {
      const n = Number(element.dataset.zone);
      element.dataset.etat = statut(n);
      element.toggleAttribute('data-actuelle', n === etat.actuelle);
      element.toggleAttribute('data-selectionnee', n === selection);
      if (n === etat.actuelle) element.dataset.actuelle = 'true';
      if (n === selection) element.dataset.selectionnee = 'true';
      element.setAttribute('aria-pressed', String(n === selection));
      element.setAttribute('aria-label', `Zone ${n}, ${zones[n].nom}, ${statut(n) === 'verrouillee' ? 'verrouillée. ' + raison(n) : etat.terminees.has(n) ? 'terminée' : 'ouverte'}${n === etat.actuelle ? ', zone actuelle' : ''}`);
      const detail = element.querySelector('.raison');
      if (detail) detail.textContent = statut(n) === 'verrouillee' ? raison(n) : n === etat.actuelle ? 'En cours' : etat.terminees.has(n) ? 'Terminée' : 'Ouverte';
    });
    main.querySelector('#voyage').textContent = `${etat.badges} badges sur 8 · ${zones[etat.actuelle].nom} en cours`;
    main.querySelector('progress').value = etat.badges;
  }

  function placer() {
    if (selection === null || fiche.hidden) return;
    const cadre = hote.getBoundingClientRect();
    const repere = hote.querySelector(`[data-zone="${selection}"]`).getBoundingClientRect();
    const x = repere.left + repere.width / 2 - cadre.left;
    const y = repere.top + repere.height / 2 - cadre.top;
    const marge = parseFloat(getComputedStyle(fiche).paddingTop);
    const largeur = fiche.offsetWidth, hauteur = fiche.offsetHeight;
    const dessus = y > cadre.height / 2;
    const left = Math.max(marge, Math.min(x - largeur / 2, cadre.width - largeur - marge));
    const top = Math.max(marge, Math.min(dessus ? y - repere.height / 2 - hauteur - marge : y + repere.height / 2 + marge, cadre.height - hauteur - marge));
    fiche.style.left = `${left}px`;
    fiche.style.top = `${top}px`;
    fiche.style.setProperty('--pointe-x', `${Math.max(marge, Math.min(x - left, largeur - marge))}px`);
    fiche.dataset.direction = dessus ? 'bas' : 'haut';
  }

  function fermer() {
    if (!fiche || fiche.hidden) return;
    const rendreFocus = fiche.contains(document.activeElement);
    fiche.hidden = true;
    selection = null;
    actualiser();
    if (rendreFocus) origine?.focus({ preventScroll: true });
  }

  function choisir(n) {
    if (!zones[n] || !hote) return;
    if (!fiche.contains(document.activeElement)) origine = document.activeElement;
    selection = n;
    const zone = zones[n], verrouillee = !etat.ouvertes.has(n);
    fiche.innerHTML = `<div class="contenu-fiche"><div class="entete-fiche"><div><small>Zone ${n}</small><h2 id="nom-zone">${zone.nom}</h2></div><button type="button" data-fermer aria-label="Fermer la fiche">×</button></div>
      <p>${zone.niveaux ? `Niveaux ${zone.niveaux} · ${zone.etapes} étapes<br>Boss : ${zone.boss}` : 'Ville · sans combat'}</p>
      <p id="etat-zone">${verrouillee ? `Verrouillée · ${raison(n)}` : etat.terminees.has(n) ? 'Terminée' : n === etat.actuelle ? 'En cours' : 'Ouverte'}</p>
      <div class="actions"><button type="button" class="action" data-vol aria-describedby="etat-zone" ${verrouillee ? 'disabled' : ''}>Y aller</button>${n === 11 ? `<button type="button" data-service="Centre commercial" ${verrouillee ? 'disabled' : ''}>Centre commercial</button><button type="button" data-service="Casino" ${verrouillee ? 'disabled' : ''}>Casino</button>` : ''}</div></div>`;
    fiche.querySelector('[data-fermer]').onclick = fermer;
    fiche.querySelector('[data-vol]').onclick = () => annoncer(`Vol vers ${zone.nom}…`);
    fiche.querySelectorAll('[data-service]').forEach(bouton => { bouton.onclick = () => annoncer(`${bouton.dataset.service} · démonstration à Céladopole.`); });
    fiche.hidden = false;
    actualiser();
    placer();
    fiche.focus({ preventScroll: true });
  }

  function demo(nom) {
    fermer();
    const [limite, actuelle, badges] = { debut: [2, 1, 0], milieu: [12, 10, 6], fin: [21, 21, 8] }[nom];
    etat = { ouvertes: new Set(zones.filter(z => z.n <= limite).map(z => z.n)), terminees: new Set(zones.filter(z => z.n < actuelle).map(z => z.n)), actuelle, badges };
    main.querySelectorAll('[data-demo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.demo === nom)));
    actualiser();
  }

  function demarrer(variante) {
    main = document.querySelector('main');
    main.innerHTML = `<a href="../index.html">← Toutes les maquettes</a><h1>Carte v2 · ${variante.nom}</h1>
      <div class="demos" role="group" aria-label="États de démonstration"><button type="button" data-demo="debut">Début</button><button type="button" data-demo="milieu">Milieu</button><button type="button" data-demo="fin">Fin</button><button type="button" data-mouvement aria-pressed="false">Mouvement réduit</button></div>
      <section class="voyage" aria-labelledby="titre-voyage"><h2 id="titre-voyage">Ton voyage</h2><p id="voyage"></p><progress max="8" value="0" aria-labelledby="titre-voyage voyage"></progress></section>
      <div class="disposition"><section class="atlas" aria-label="Carte de Kanto"><div data-carte></div><p class="legende">✓ Terminée · 🔒 Verrouillée · ◎ Position actuelle · Cadre vert : sélection</p></section><section class="liste" aria-labelledby="titre-zones"><h2 id="titre-zones">Les 22 zones</h2><ol></ol></section></div><p role="status" aria-live="polite" aria-atomic="true"></p>`;
    hote = main.querySelector('[data-carte]');
    const [l, h] = variante.ratio || [16, 9];
    hote.style.aspectRatio = `${l} / ${h}`;
    variante.dessiner(hote);
    fiche = document.createElement('div');
    fiche.className = 'fiche';
    fiche.setAttribute('role', 'dialog');
    fiche.setAttribute('aria-labelledby', 'nom-zone');
    fiche.tabIndex = -1;
    fiche.hidden = true;
    hote.append(fiche);
    const liste = main.querySelector('ol');
    zones.forEach(zone => {
      const ligne = document.createElement('li');
      ligne.innerHTML = `<button type="button" data-zone="${zone.n}"><strong class="numero">${zone.n}</strong><span>${zone.nom}<small class="raison"></small></span><span class="symbole" aria-hidden="true"></span></button>`;
      ligne.firstElementChild.onclick = () => choisir(zone.n);
      liste.append(ligne);
    });
    liste.onkeydown = event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const boutons = [...liste.querySelectorAll('button')], index = boutons.indexOf(document.activeElement);
      event.preventDefault();
      boutons[event.key === 'Home' ? 0 : event.key === 'End' ? boutons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + boutons.length) % boutons.length].focus();
    };
    main.querySelectorAll('[data-demo]').forEach(b => { b.onclick = () => demo(b.dataset.demo); });
    main.querySelector('[data-mouvement]').onclick = event => {
      const reduit = main.toggleAttribute('data-mouvement-reduit');
      event.currentTarget.setAttribute('aria-pressed', String(reduit));
    };
    document.addEventListener('click', event => {
      if (!fiche.contains(event.target) && !event.target.closest('[data-zone]')) fermer();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') fermer(); });
    new ResizeObserver(placer).observe(hote);
    demo('debut');
  }
  window.CarteV2 = { zones, positions, etat: () => etat, demarrer, choisir, fermer };
})();
