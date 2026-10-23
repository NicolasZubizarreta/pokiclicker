// Fragments communs : les trois pages ne décrivent que leur disposition.
const svg = contenu => `<svg viewBox="0 0 24 24" aria-hidden="true">${contenu}</svg>`;
const balle = svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/>');
const chemins = ['m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6','M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z','M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3','m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17','M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z'];
const noms = ['Bulbizarre', 'Salamèche', 'Carapuce'];
const etapes = `<div class="progression"><span class="numero">Étape 4 sur 10</span><div class="marques" aria-hidden="true">${Array.from({length:10}, (_,i) => `<span class="marque ${i < 3 ? 'faite' : ''} ${i === 3 ? 'actuelle' : ''} ${i === 9 ? 'boss' : ''}">${i === 9 ? balle : ''}</span>`).join('')}</div></div>`;
const fragments = {
  entete: `<div><h1>Route 1</h1><p>Jadielle</p></div><span class="monnaie">${svg('<circle cx="12" cy="12" r="9"/><path d="M10 7h3a3 3 0 0 1 0 6h-3m0-6v11m-2-3h7"/>')}1 250 pièces</span>${document.body.classList.contains('variante-b') ? '' : etapes}`,
  etapes,
  decor: '<div class="decor"><img src="../../specimens/assets/v1/zone-1.jpg" width="1920" height="1080" alt=""></div><div class="ground" aria-hidden="true"></div>',
  ennemi: '<div class="ennemi"><div class="pedestal" aria-hidden="true"></div><img class="sprite" src="../../specimens/assets/pokemon/19.png" width="96" height="96" alt="Rattata"></div>',
  carte: '<div class="carte cadre"><div class="titre-ennemi"><h2>Rattata</h2><span>Niv. 3</span></div><div class="pv" role="progressbar" aria-label="PV de Rattata" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62"><span class="fantome"></span><span class="remplissage"></span></div><p class="pv-texte">PV 62 / 100</p></div>',
  action: '<button class="action cadre" type="button" aria-describedby="fin">Attaque</button><p class="fin" id="fin" role="status" hidden>La suite arrive bientôt.</p>',
  equipe: `<h2>Ton équipe <span>12 DPS</span></h2><div class="cases">${Array.from({length:6}, (_,i) => `<div class="case cadre" aria-label="${noms[i] ? `${noms[i]}, niveau 5, 4 DPS${i === 0 ? ', partenaire choisi' : ''}` : 'Case libre'}">${i < 3 ? `<img src="../../specimens/assets/pokemon/${[1,4,7][i]}.png" width="96" height="96" alt=""><div class="case-info"><strong>${noms[i]}</strong><span>Niv. 5</span></div><span class="case-dps">4 DPS</span>` : '<span class="vide">—</span>'}</div>`).join('')}</div>`,
  dialogue: `<img src="../../specimens/assets/v1/SpriteChen1.png" width="64" height="80" alt=""><div><h2>Prof. Chen</h2><p>Les Rattata sont ici.<br>Continue d'attaquer.</p><span class="fleche">${svg('<path d="m6 9 6 6 6-6"/>')}</span></div>`,
  navigation: ['Combat','Équipe','Shop','Carte','Plus'].map((nom,i) => `<button type="button" ${i === 0 ? 'aria-current="page"' : ''}>${svg(`<path d="${chemins[i]}"/>`)}${nom}</button>`).join(''),
};
document.querySelectorAll('[data-piece]').forEach(el => { el.innerHTML = fragments[el.dataset.piece]; });
const bouton = document.querySelector('.action'), scene = document.querySelector('.scene');
const barre = document.querySelector('.pv'), sprite = document.querySelector('.ennemi img');
const reduit = matchMedia('(prefers-reduced-motion: reduce)');
let pv = 62, etape = 4, attente = false;
function afficher() {
  document.querySelectorAll('.pv span').forEach(el => { el.style.transform = `scaleX(${pv / 100})`; });
  document.querySelector('.remplissage').className = `remplissage ${pv <= 20 ? 'bas' : pv <= 50 ? 'moyen' : ''}`;
  barre.setAttribute('aria-valuenow', pv);
  document.querySelector('.pv-texte').textContent = `PV ${pv} / 100`;
  document.querySelector('.numero').textContent = etape > 10 ? 'Route terminée' : `Étape ${etape} sur 10`;
  document.querySelectorAll('.marque').forEach((el,i) => { el.classList.toggle('faite', i < etape - 1); el.classList.toggle('actuelle', i === etape - 1); });
}
function attaquer() {
  if (attente || etape > 10) return;
  pv = Math.max(0, pv - 10); afficher();
  const chiffre = document.createElement('span'); chiffre.className = 'degats'; chiffre.textContent = '−10'; chiffre.setAttribute('aria-hidden', 'true'); scene.append(chiffre);
  if (!reduit.matches) { sprite.classList.remove('touche'); void sprite.offsetWidth; sprite.classList.add('touche'); }
  setTimeout(() => chiffre.remove(), 500);
  if (pv > 0) return;
  attente = true;
  setTimeout(() => {
    etape++; attente = false;
    if (etape <= 10) pv = 100;
    else { bouton.disabled = true; bouton.textContent = 'Zone terminée'; document.querySelector('.fin').hidden = false; scene.setAttribute('aria-disabled','true'); }
    afficher();
  }, reduit.matches ? 0 : 500);
}
bouton.addEventListener('click', attaquer);
if (scene.hasAttribute('data-tactile')) {
  scene.addEventListener('click', attaquer);
  scene.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); attaquer(); } });
}
const message = document.createElement('p'); message.className = 'message'; message.setAttribute('role','status'); document.querySelector('main').append(message);
document.querySelectorAll('nav button').forEach((el,i) => el.addEventListener('click', () => { message.textContent = i === 0 ? 'Tu es sur la Route 1.' : `${el.textContent} : cet écran arrivera plus tard.`; }));
