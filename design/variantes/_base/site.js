// Relie les maquettes d'une même variante en un « site » à tester (A, B ou C) et recueille ton avis page par page.
// Chargé par chaque maquette, après fichiers.js (correspondance dossier -> fichier de chaque variante).
(() => {
  const NOMS = [['combat', 'Combat'], ['equipe', 'Équipe'], ['fiche-pokemon', 'Fiche Pokémon'], ['pc', 'PC'], ['sac', 'Sac'],
    ['shop', 'Shop'], ['plus', 'Plus et Pokédex'], ['carte', 'Carte'], ['evenement', 'Chen et choix du starter']];
  const NAV = { Combat: 'combat', 'Équipe': 'equipe', Shop: 'shop', Carte: 'carte', Plus: 'plus' };
  const segments = location.pathname.split('/');
  const fichier = segments.pop();
  const dossier = segments.pop();
  const racine = `${segments.join('/')}/`;
  let lettre = dossier !== 'combat' && /^[abc]-/.test(fichier) ? fichier[0] : null;
  try {
    if (lettre) sessionStorage.setItem('site-lettre', lettre);
    else lettre = sessionStorage.getItem('site-lettre') || 'a';
  } catch { lettre = lettre || 'a'; }
  const FICHIERS = window.FICHIERS;
  const adresse = dir => `${racine}${dir}/${FICHIERS[dir][lettre]}`;

  // Navigation et liens : on reste dans la même variante, quel que soit le lien écrit dans la maquette.
  document.addEventListener('click', e => {
    const cible = e.target instanceof Element ? e.target : null;
    if (!cible) return;
    const bouton = cible.closest('nav button, nav a');
    if (bouton) {
      const nom = Object.keys(NAV).find(n => bouton.textContent.includes(n));
      if (nom) { e.preventDefault(); e.stopImmediatePropagation(); location.href = adresse(NAV[nom]); return; }
    }
    const lien = cible.closest('a[href]');
    if (!lien) return;
    const href = lien.getAttribute('href') || '';
    const m = /(combat|equipe|fiche-pokemon|pc|sac|shop|plus|carte|evenement)\/[abc]-[^/?#]*\.html/.exec(href);
    if (m && FICHIERS[m[1]]) {
      e.preventDefault(); e.stopImmediatePropagation();
      location.href = new URL(href.replace(/[abc]-[^/?#]*\.html/, FICHIERS[m[1]][lettre]), location.href).href;
    }
  }, true);

  // Avis conservé dans le navigateur de cet appareil.
  const cle = `avis:${dossier}:${lettre}`;
  const lire = () => { try { return JSON.parse(localStorage.getItem(cle) || '{}'); } catch { return {}; } };
  const ecrire = valeur => { try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ } };

  const style = document.createElement('style');
  style.textContent = `
    .site-panneau { margin-bottom:calc(var(--spacing) * 4); background:var(--surface); border:calc(var(--spacing) / 2) solid var(--region-accent); }
    .site-panneau summary { padding-inline:calc(var(--spacing) * 4); font-weight:700; color:var(--region-accent); }
    .site-corps { display:grid; gap:calc(var(--spacing) * 4); padding:calc(var(--spacing) * 4); }
    .site-corps ul { display:flex; flex-wrap:wrap; gap:calc(var(--spacing) * 2); margin:0; padding:0; list-style:none; }
    .site-corps a,.site-corps button { display:inline-flex; align-items:center; min-height:calc(var(--spacing) * 11); padding:calc(var(--spacing) * 2) calc(var(--spacing) * 4); background:var(--surface-2); color:var(--lien); border:0; font:inherit; text-decoration:none; cursor:pointer; }
    .site-corps a[aria-current="page"] { background:var(--selection); color:var(--region-accent); font-weight:700; }
    .site-corps button { color:var(--texte); }
    .site-corps button[aria-pressed="true"] { background:var(--selection); color:var(--region-accent); font-weight:700; box-shadow:inset 0 calc(var(--spacing) * -1) var(--region-accent); }
    .site-corps textarea { width:100%; min-height:calc(var(--spacing) * 20); background:var(--fond); color:var(--texte); border:calc(var(--spacing) / 2) solid var(--bordure); padding:calc(var(--spacing) * 2); font:inherit; }
    .site-corps h2 { font-size:var(--text-lg); }
  `;
  document.head.append(style);

  const panneau = document.createElement('details');
  panneau.className = 'site-panneau';
  const resume = document.createElement('summary');
  resume.textContent = `Site ${lettre.toUpperCase()} · autres écrans${dossier === 'combat' ? '' : ' et ton avis'}`;
  const corps = document.createElement('div');
  corps.className = 'site-corps';

  const liste = document.createElement('ul');
  for (const [dir, nom] of NOMS) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = adresse(dir);
    a.textContent = nom;
    if (dir === dossier) a.setAttribute('aria-current', 'page');
    li.append(a);
    liste.append(li);
  }
  corps.append(liste);

  if (dossier !== 'combat') {
    const titre = document.createElement('h2');
    titre.textContent = `Cette page, dans le site ${lettre.toUpperCase()}`;
    const choix = document.createElement('ul');
    const etat = lire();
    const boutons = [['garde', 'Je garde'], ['bof', 'Bof'], ['jette', 'Je jette']].map(([valeur, texte]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = texte;
      b.setAttribute('aria-pressed', String(etat.v === valeur));
      b.addEventListener('click', () => {
        const suite = { ...lire(), v: valeur };
        ecrire(suite);
        boutons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      });
      const li = document.createElement('li');
      li.append(b);
      choix.append(li);
      return b;
    });
    const note = document.createElement('textarea');
    note.placeholder = 'Ce que tu gardes ou changes sur cette page (facultatif)';
    note.setAttribute('aria-label', 'Ta remarque sur cette page');
    note.value = etat.n || '';
    note.addEventListener('input', () => ecrire({ ...lire(), n: note.value }));
    corps.append(titre, choix, note);
  }

  const liens = document.createElement('ul');
  for (const [href, texte] of [[`${racine}bilan.html`, 'Voir mon bilan'], [`${racine}index.html`, 'Changer de site']]) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = texte;
    a.dataset.hors = 'site';
    li.append(a);
    liens.append(li);
  }
  corps.append(liens);
  panneau.append(resume, corps);
  document.body.prepend(panneau);
})();
