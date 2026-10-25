const equipe = [
  { numero: 1, nom: 'Bulbizarre', niveau: 62 },
  { numero: 4, nom: 'Salamèche', niveau: 61 },
  { numero: 25, nom: 'Pikachu', niveau: 64, shiny: true },
  { numero: 7, nom: 'Carapuce', niveau: 60 },
  { numero: 16, nom: 'Roucool', niveau: 59 },
  { numero: 95, nom: 'Onix', niveau: 63 },
];
const dialogues = [
  'Splendide ! Simplement splendide !',
  'Tu as vaincu le Conseil des 4 et le Maître actuel. Tu es le nouveau Maître de la Ligue de Kanto !',
  "Mais tu n'as pas gagné seul. Viens avec moi, allons enregistrer tes partenaires au Panthéon.",
];
const variante = document.body.dataset.variante;
const noms = { a: 'A · Cérémonie', b: 'B · Honneur', c: 'C · Chen' };
const etoile = '<span class="etoile" aria-label="Chromatique">★</span>';
const identite = p => `<strong>${p.nom}${p.shiny ? ' ' + etoile : ''}</strong><span>Niv. ${p.niveau}</span>`;
document.querySelector('main').innerHTML = `
  <div class="variantes" role="navigation" aria-label="Variantes du Panthéon">
    <a href="../index.html">Galerie</a>
    ${['a-fidele', 'b-honneur', 'c-chen'].map(p => `<a href="${p}.html" ${p[0] === variante ? 'aria-current="page"' : ''}>${noms[p[0]]}</a>`).join('')}
  </div>
  <div class="outils" role="group" aria-label="États de démonstration">
    <button data-etat="dialogue">Dialogue</button><button data-etat="chute">Chute</button><button data-etat="final">Final</button>
    <button id="reduit" aria-pressed="false">Mouvement réduit</button>
  </div>
  <section class="ceremonie" aria-label="Panthéon">
    <h1>Maître de la<br>Ligue de Kanto</h1>
    <div class="scene cadre">
      <div class="socles">${equipe.map((p, i) => `<div class="place" data-place="${i}"><div class="pokemon${p.shiny ? ' shiny' : ''}"><img class="sprite" src="${p.spriteShiny || `../../specimens/assets/pokemon/${p.numero}.png`}" width="96" height="96" alt="${p.nom}${p.shiny ? ', chromatique' : ''}"></div><div class="identite">${identite(p)}</div></div>`).join('')}</div>
    </div>
    <div class="honneur" aria-label="Équipe honorée">${equipe.map(p => `<div>${identite(p)}</div>`).join('')}</div>
    <div class="dialogue cadre"><img class="chen sprite" src="../../specimens/assets/v1/SpriteChen2.png" width="120" height="120" alt="Professeur Chen"><div><strong>Professeur Chen</strong><p id="parole"></p><button id="suite" class="action">Continuer</button></div></div>
    <p id="statut" role="status"></p>
    <button id="sortir">Sortir</button>
  </section>
  <p class="note">Étude du Panthéon · Décor provisoire en jetons.</p>`;
if (variante === 'c') document.querySelector('.scene').append(document.querySelector('.dialogue'));
let ligne = 0;
let minuteur;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let reduit = media.matches;
function mouvement() {
  document.body.dataset.reduit = String(reduit);
  document.querySelector('#reduit').setAttribute('aria-pressed', String(reduit));
}
function etat(nom) {
  clearInterval(minuteur);
  document.body.dataset.etat = nom;
  document.querySelectorAll('button[data-etat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.etat === nom)));
  document.querySelector('#sortir').classList.toggle('action', nom !== 'dialogue');
  document.querySelector('#parole').textContent = dialogues[ligne];
  document.querySelector('#statut').textContent = nom === 'final' ? 'Tes partenaires entrent dans la légende.' : nom === 'chute' ? 'Enregistrement des partenaires…' : '';
  let actif = 0;
  const eclairer = () => document.querySelectorAll('.place').forEach((p, i) => p.classList.toggle('eclaire', reduit || nom === 'final' || i === actif));
  eclairer();
  if (nom === 'chute' && !reduit) minuteur = setInterval(() => { actif = (actif + 1) % equipe.length; eclairer(); }, 2000);
}
document.querySelectorAll('button[data-etat]').forEach(b => b.onclick = () => { ligne = 0; etat(b.dataset.etat); });
document.querySelector('#suite').onclick = () => {
  if (++ligne === dialogues.length) { etat('chute'); document.querySelector('#sortir').focus(); }
  else document.querySelector('#parole').textContent = dialogues[ligne];
};
document.querySelector('#reduit').onclick = () => { reduit = !reduit; mouvement(); etat(document.body.dataset.etat); };
media.onchange = e => { reduit = e.matches; mouvement(); etat(document.body.dataset.etat); };
document.querySelector('#sortir').onclick = () => {
  clearInterval(minuteur);
  document.body.dataset.reduit = 'true';
  document.querySelector('#statut').textContent = 'Retour à Bourg Palette · Johto arrive bientôt !';
};
addEventListener('pagehide', () => clearInterval(minuteur));
mouvement();
etat('dialogue');
