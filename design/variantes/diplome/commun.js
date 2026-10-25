const exemple = { nom: 'Nicolas', date: '25 octobre 2026', iso: '2026-10-25', captures: 151 };
const image = '<img class="diplome" src="../../../legacy/img/kanto/icones/Diplôme.png" width="1280" height="698" alt="Diplôme officiel de Kanto : le Professeur Chen certifie que tu as complété le Pokédex.">';
const identite = `<div class="bandeau"><strong>${exemple.nom}</strong><span>Obtenu le <time datetime="${exemple.iso}">${exemple.date}</time></span></div>`;
const commandes = '<div class="commandes"><button class="action" id="imprimer">Imprimer</button><a class="retour" href="../credits/a-noir.html">Voir les crédits</a></div>';
const contenu = document.querySelector('#contenu');
const variante = document.body.dataset.variante;
if (variante === 'a') contenu.innerHTML = `<section class="cadre fenetre" aria-labelledby="titre"><div class="entete"><h1 id="titre">Ton diplôme</h1><button id="fermer">Fermer</button></div>${image}${identite}${commandes}</section>`;
if (variante === 'b') contenu.innerHTML = `<section class="cadre celebration"><p class="doux">Kanto · Pokédex ${exemple.captures} / 151</p><h1>Dresseur de légende</h1><p>Le Professeur Chen te remet ton diplôme.</p>${identite}${image}${commandes}</section>`;
if (variante === 'c') contenu.innerHTML = `<div class="entete"><h1>Ton diplôme</h1><span class="doux">Aperçu d’impression</span></div><div class="atelier"><aside class="reglages"><h2>Prêt à imprimer</h2><p>A4 · Paysage</p><p>Le nom et la date d’obtention restent sur ta feuille.</p><p class="doux">Choisis aussi A4 paysage dans la fenêtre d’impression.</p>${commandes}</aside><article class="feuille" data-theme="light" aria-label="Feuille A4 paysage">${image}${identite}</article></div>`;
document.querySelector('#imprimer').onclick = () => window.print();
document.querySelector('#fermer')?.addEventListener('click', fermer);
function fermer() {
  contenu.innerHTML = '<section class="cadre fenetre"><h1>Ton diplôme</h1><p>Retrouve ton diplôme quand tu veux.</p><div class="commandes"><button class="action" id="voir">Voir le diplôme</button></div></section>';
  document.querySelector('#voir').onclick = () => location.reload();
  document.querySelector('#voir').focus();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && variante === 'a') fermer(); });
