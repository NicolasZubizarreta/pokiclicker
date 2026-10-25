const contenu = document.querySelector('#contenu');
const statut = document.querySelector('#statut');
const variante = document.body.dataset.variante;
const parents = [{ nom: 'Bulbizarre', numero: 1, sexe: 'Femelle', present: true }, { nom: 'Bulbizarre', numero: 1, sexe: 'Mâle', present: true }];
let argent = 12500, emplacements = 2, oeufs = 1, pleine = false, onglet = 'oeufs';
const nombre = valeur => valeur.toLocaleString('fr-FR');
const coeur = '<svg class="coeur" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12C-3 3 7-2 12 5c5-7 15-2 9 7Z"/></svg>';
const verrou = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4"/></svg>';
function rendre(focus) {
  const chance = parents.every(parent => parent.present) ? 4 : 0;
  document.querySelector('#argent').textContent = nombre(argent) + ' pièces';
  const couple = '<section class="couple panneau cadre" aria-label="Parents"><h2>Les parents</h2><div class="parents">' + parents.map((parent, index) => '<article class="parent">' + (parent.present ? '<div class="portrait"><img class="sprite" src="../../specimens/assets/pokemon/' + parent.numero + '.png" width="192" height="192" alt=""></div><div><h2>' + parent.nom + '</h2><p>' + parent.sexe + ' · Niveau 15</p></div>' : '<h2>Place libre</h2><p>Choisis un parent dans ton équipe ou ton PC.</p>') + '<button id="parent-' + index + '" data-parent="' + index + '">' + (parent.present ? 'Retirer' : 'Déposer') + ' ' + parent.nom + '</button></article>').join('') + '</div></section>';
  const nurserie = '<section class="nurserie panneau cadre" aria-label="Œufs"><h2>Les œufs · ' + oeufs + ' / ' + emplacements + '</h2><div class="rangee">' + Array.from({ length: 5 }, (_, index) => '<div class="place">' + (index < oeufs ? '<img src="../../../public/img/objets/lucky-egg.png" width="32" height="32" alt="Œuf">' : index < emplacements ? '<span>Libre</span>' : verrou + '<span>Fermé</span>') + '<span>' + (index + 1) + '</span></div>').join('') + '</div><p>Espèce inconnue jusqu’à l’éclosion. Prends un œuf, puis remporte 25 combats avec lui dans ton équipe.</p><button class="principal" id="prendre"' + (oeufs ? '' : ' disabled') + '>Prendre l’œuf</button><p>' + (oeufs ? 'Destination : ' + (pleine ? 'PC (équipe pleine).' : 'ton équipe.') : 'Aucun œuf : continue les combats avec deux parents compatibles.') + '</p><div class="achats">' + Array.from({ length: 5 - emplacements }, (_, index) => { const place = emplacements + index; return '<button id="achat-' + place + '" data-achat="' + place + '"' + (index || argent < place * 5000 ? ' disabled' : '') + '>Ouvrir · ' + nombre(place * 5000) + ' pièces</button>' + (index ? '<p>Ouvre d’abord l’emplacement précédent.</p>' : argent < place * 5000 ? '<p>Pas assez d’argent.</p>' : ''); }).join('') + '</div></section>';
  const chanceBloc = '<div class="chance">' + coeur + '<div><strong>' + chance + ' % par élimination</strong><p>' + (oeufs >= emplacements ? 'Pension pleine : prends un œuf.' : chance ? 'Deux parents compatibles.' : 'Dépose deux parents compatibles.') + '</p></div></div>';
  contenu.innerHTML = variante === 'c' ? '<div class="disposition"><aside class="resume panneau cadre"><h2>Ton suivi</h2>' + chanceBloc + '<p>' + parents.filter(parent => parent.present).length + ' parents · ' + oeufs + ' œuf</p><p>Les œufs restent au repos ici.</p></aside><div><div class="onglets" role="group" aria-label="Gestion de la pension"><button id="onglet-parents" data-onglet="parents" aria-pressed="' + (onglet === 'parents') + '">Parents</button><button id="onglet-oeufs" data-onglet="oeufs" aria-pressed="' + (onglet === 'oeufs') + '">Œufs</button></div><div' + (onglet !== 'parents' ? ' hidden' : '') + '>' + couple + '</div><div' + (onglet !== 'oeufs' ? ' hidden' : '') + '>' + nurserie + '</div>' + (onglet === 'parents' ? '<button class="principal" id="voir-oeufs" data-onglet="oeufs">Voir les œufs</button>' : '') + '</div></div>' : chanceBloc + '<div class="disposition">' + couple + nurserie + '</div>';
  if (focus) document.getElementById(focus)?.focus();
}
contenu.addEventListener('click', event => {
  const bouton = event.target.closest('button');
  if (!bouton) return;
  if (bouton.dataset.parent !== undefined) {
    const parent = parents[Number(bouton.dataset.parent)];
    parent.present = !parent.present;
    statut.textContent = parent.present ? parent.nom + ' rejoint la pension.' : parent.nom + (pleine ? ' est envoyé au PC.' : ' rejoint ton équipe.');
  }
  if (bouton.id === 'prendre' && oeufs) { oeufs--; statut.textContent = pleine ? 'L’œuf est envoyé au PC.' : 'L’œuf rejoint ton équipe.'; }
  if (bouton.dataset.achat !== undefined && argent >= emplacements * 5000) { argent -= emplacements * 5000; emplacements++; statut.textContent = 'Emplacement ouvert. Tu peux accueillir un œuf de plus.'; }
  if (bouton.dataset.onglet) onglet = bouton.dataset.onglet;
  rendre(bouton.dataset.achat !== undefined ? 'prendre' : bouton.id === 'voir-oeufs' ? 'onglet-oeufs' : bouton.id);
});
document.querySelector('#simuler').onclick = () => {
  if (parents.every(parent => parent.present) && oeufs < emplacements) { oeufs++; statut.textContent = 'Un œuf apparaît !'; }
  else statut.textContent = 'Ponte impossible : vérifie les parents et les places libres.';
  rendre();
};
document.querySelector('#equipe').onclick = event => { pleine = !pleine; event.target.setAttribute('aria-pressed', pleine); rendre(); statut.textContent = pleine ? 'Équipe pleine : les retraits iront au PC.' : 'Il reste de la place dans ton équipe.'; };
rendre();
