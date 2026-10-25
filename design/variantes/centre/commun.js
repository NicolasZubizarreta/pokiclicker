// Simulation isolée : 3 badges, aucun palier de remise, 50 000 pièces.
// Noms, descriptions et prix de base V1 ; ordre de renderMallPanel.
const objets = [
  ['xAttack', 'Attaque +', 7500, 'x-attack.png', 'Dégâts du clic ×1,5 pendant 30 s.'],
  ['xSpecial', 'Attaque Spé +', 10000, 'x-sp-atk.png', "DPS de l'équipe ×1,5 pendant 30 s."],
  ['pokeDoll', 'Poké Poupée', 5000, 'poke-doll.png', 'Invoque le Boss (Si déjà vaincu)'],
  ['everstone', 'Pierre Stase', 10000, 'everstone.png', "Bloque l'évolution. Dégâts +25% (Base & Évolutif uniquement)"],
  ['calcium', 'Calcium', 50000, 'calcium.png', 'Boost DPS permanent +2% (max 10 par Pokémon)'],
  ['fireStone', 'Pierre Feu', 10000, 'fire-stone.png', 'Fait évoluer certains Pokémon.'],
  ['waterStone', 'Pierre Eau', 10000, 'water-stone.png', 'Fait évoluer certains Pokémon.'],
  ['leafStone', 'Pierre Plante', 10000, 'leaf-stone.png', 'Fait évoluer certains Pokémon.'],
  ['thunderStone', 'Pierre Foudre', 10000, 'thunder-stone.png', 'Fait évoluer certains Pokémon.'],
  ['moonStone', 'Pierre Lune', 10000, 'moon-stone.png', 'Fait évoluer certains Pokémon.'],
  ['shinyToken', 'Jeton Shiny', 250000, 'JetonShiny.png', 'Rend chromatique un Pokémon de ton équipe.'],
].map(([id, nom, base, image, description]) => ({
  id, nom, image, description,
  prix: ['calcium', 'shinyToken'].includes(id) ? base : Math.floor(base * (1 + 3 * 0.05)),
}));
const $ = selecteur => document.querySelector(selecteur);
const nombre = valeur => valeur.toLocaleString('fr-FR');
let argent = 50000;
let selection = objets[0];
const stocks = Object.fromEntries(objets.map(objet => [objet.id, 0]));
$('.catalogue').innerHTML = objets.map(objet => `<button type="button" class="objet cadre" data-objet="${objet.id}" aria-pressed="false"><img src="../../../public/img/objets/${objet.image}" width="32" height="32" alt=""><strong class="nom">${objet.nom}</strong><span class="description">${objet.description}</span><span class="prix">${nombre(objet.prix)} pièces</span><span class="stock" aria-label="En sac : 0">×0</span></button>`).join('');
function actualiser() {
  const quantite = Number($('#quantite').value);
  const valide = Number.isInteger(quantite) && quantite >= 1 && quantite <= 99;
  $('#argent').textContent = `${nombre(argent)} pièces`;
  $('#choix').textContent = selection.nom;
  $('#description').textContent = selection.description;
  $('#acheter').textContent = valide ? `Acheter ×${quantite} · ${nombre(selection.prix * quantite)} pièces` : 'Acheter';
  $('#acheter').disabled = !valide || argent < selection.prix * quantite;
  $('#raison').textContent = !valide ? 'Choisis une quantité de 1 à 99.' : argent < selection.prix * quantite ? "Pas assez d'argent. Choisis un autre objet ou une quantité plus petite." : 'Les objets achetés rejoignent ton Sac.';
  document.querySelectorAll('[data-objet]').forEach(bouton => {
    bouton.setAttribute('aria-pressed', String(bouton.dataset.objet === selection.id));
    bouton.querySelector('.stock').textContent = `×${stocks[bouton.dataset.objet]}`;
    bouton.querySelector('.stock').setAttribute('aria-label', `En sac : ${stocks[bouton.dataset.objet]}`);
  });
}
$('.catalogue').addEventListener('click', evenement => {
  const bouton = evenement.target.closest('[data-objet]');
  if (!bouton) return;
  selection = objets.find(objet => objet.id === bouton.dataset.objet);
  actualiser();
  $('#statut').textContent = `${selection.nom} sélectionné. ${selection.description}`;
});
$('#quantite').addEventListener('input', actualiser);
$('#acheter').addEventListener('click', () => {
  actualiser();
  if ($('#acheter').disabled) return;
  const quantite = Number($('#quantite').value);
  argent -= selection.prix * quantite;
  stocks[selection.id] += quantite;
  $('#statut').textContent = `${selection.nom} ×${quantite} acheté. Retrouve cet objet dans ton Sac.`;
  actualiser();
});
actualiser();
