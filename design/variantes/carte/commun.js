const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const paths = ['m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6','M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z','M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3','m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17','M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z'];
document.querySelector('nav').innerHTML = ['Combat','Équipe','Shop','Carte','Plus'].map((name,i) => `<button type="button" ${i === 3 ? 'aria-current="page"' : ''}>${svg(`<path d="${paths[i]}"/>`)}${name}</button>`).join('');
document.querySelectorAll('nav button').forEach(button => button.onclick = () => { document.querySelector('#retour').textContent = button.textContent + ' : navigation hors de cette maquette.'; });

const icons = {
 termine:svg('<path d="m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z"/>'),
 actuel:svg('<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'),
 verrouille:svg('<rect x="5" y="10" width="14" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>')
};
const labels = {termine:'Terminée',actuel:'Actuelle',verrouille:'Verrouillée'};
// Positions d'illustration dans le recadrage est, pas des coordonnées de la carte V1.
const zones = [
 ['Bourg Palette', 'termine', 'Aucun', 42,80],
 ['Route 1', 'actuel', 'Rattata (Géant), niv. 6', 42,65],
 ['Jadielle', 'termine', 'Aucun', 42,50],
 ['Forêt de Jade', 'verrouille', 'Papilusion, niv. 10', 27,35],
 ['Argenta', 'verrouille', 'Pierre (Onix), niv. 14', 29,20],
 ['Mont Sélénite', 'verrouille', 'Mélodelfe, niv. 16', 50,12],
 ['Azuria', 'verrouille', 'Ondine (Staross), niv. 21', 72,22],
 ['Pont Pépite', 'verrouille', 'Rival (Roucarnage), niv. 23', 86,35],
 ['Carmin sur Mer', 'verrouille', 'Major Bob (Raichu), niv. 26', 72,68]
];
const raison = 'Bats le boss de la Route 1 pour débloquer cette zone.';
document.querySelector('#pins').innerHTML = zones.map(([name,state,,x,y],i) => `<button class="pin ${state}" style="--x:${x}%;--y:${y}%" data-zone="${i}" aria-label="${name} · ${labels[state]}" aria-controls="fiche" aria-pressed="false">${icons[state]}</button>`).join('');
document.querySelector('#zones').innerHTML = zones.map(([name,state],i) => `<button data-zone="${i}" aria-controls="fiche" aria-pressed="false">${icons[state]} ${name}<span>${labels[state]}</span></button>`).join('');
document.querySelector('.legende').innerHTML = Object.keys(icons).map(s => `<span>${icons[s]}${labels[s]}</span>`).join('');
if (document.body.classList.contains('variante-c')) {
 document.querySelector('.carte').insertAdjacentHTML('beforeend', `<svg class="chemin" aria-hidden="true">${zones.slice(1).map((z,i) => `<line x1="${zones[i][3]}%" y1="${zones[i][4]}%" x2="${z[3]}%" y2="${z[4]}%"/>`).join('')}</svg>`);
}
let selected = 1;
function choose(i) {
 selected = i;
 const [name,state,boss] = zones[i];
 document.querySelectorAll('[data-zone]').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.zone)===i)));
 document.querySelector('#fiche').innerHTML = `<h2>${name}</h2><p>${labels[state]} · Boss : ${boss}</p><button class="action cadre" ${state==='verrouille'?'disabled aria-describedby="raison"':''}>Aller ici</button><p id="raison">${state==='verrouille'?raison:'Zone accessible. Tu peux y retourner.'}</p>`;
 document.querySelector('.fiche button').onclick = () => document.querySelector('#retour').textContent = `Destination choisie : ${zones[selected][0]}. Déplacement simulé.`;
}
document.querySelectorAll('[data-zone]').forEach(b => b.onclick = () => choose(Number(b.dataset.zone)));
choose(1);

