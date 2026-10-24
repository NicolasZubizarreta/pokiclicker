const svg = path => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
const icons = {
 balle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0m0 0h6m6 0h6m-12 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
 bonbon:'m8 8 8 0 0 8-8 0zM8 9 3 6v12l5-3m8-6 5-3v12l-5-3',
 flacon:'M9 3h6v5l3 3v10H6V11l3-3zM9 15h6m-3-3v6',
 pierre:'m8 3 8 0 5 9-9 9-9-9zM8 3l4 18 4-18',
 chaussure:'M4 4h6v8l10 4v5H3V10zM11 12l-2 3m6-1-2 3',
 piece:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0m6-4h6v8H9z',
 info:'M12 8v5m0 3v1M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
 coche:'m5 12 4 4L19 6'
};
const fmt = n => n.toLocaleString('fr-FR');
function message(texte) { const el=document.querySelector('#message'); el.innerHTML=svg(icons.coche)+'<span>'+texte+'</span><button type="button" aria-label="Fermer la notification">Fermer</button>'; el.hidden=false; el.querySelector('button').onclick=()=>el.hidden=true; }
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{ if(b.dataset.href) location.href=b.dataset.href; else message('Écran hors de ce lot de maquettes.'); });
const objets = [
 ['Pokéball',8,'Capture des Pokémon (faible chance).','Balles','balle','Pas de combat en cours.'],
 ['Superball',3,'Capture des Pokémon (moyenne chance ×2).','Balles','balle','Ce Pokémon ne peut pas être capturé.'],
 ['Bonbon',2,'Fait monter un Pokémon de niveau.','Consommables','bonbon'],
 ['Repousse',1,'Empêche les Pokémon communs d’apparaître pendant 30 s.','Consommables','flacon','Pas de combat en cours.'],
 ['Calcium',4,'Bonus de DPS permanent +2 % (max. 10 par Pokémon).','Consommables','flacon'],
 ['Pierre Feu',1,'Pierre d’évolution (fonction à venir).','Consommables','pierre'],
 ['Chaussures',1,'Divise le temps d’apparition des ennemis par 1,5.','Permanents','chaussure','Effet permanent actif.'],
 ['Pièce Rune',1,'Gains d’argent +30 %.','Permanents','piece','Effet permanent actif.']
];
const equipe = [
 [1,'Bulbizarre','Niv. 15 · mâle · Favori · DPS 9 · XP 120 / 11 250'],
 [4,'Salamèche','Niv. 14 · mâle · DPS 8'],
 [25,'Éclair (Pikachu)','Niv. 12 · femelle · Shiny · DPS 6']
];
const categories=['Balles','Consommables','Permanents'];
const variante=document.body.className.slice(-1);
let selection=2, categorie='Consommables';
const root=document.querySelector('#contenu');
root.innerHTML='<div class="toolbar"><a class="link" href="../plus/a-lignes.html">Plus</a><button id="vide" type="button" aria-pressed="false">Voir le sac vide</button></div><div id="inventaire" class="layout"><section id="objets" class="stack" aria-label="Objets du sac"></section><aside class="stack"><section id="detail" class="panel cadre"></section><section id="cible" class="panel cadre stack" aria-label="Choix du Pokémon"></section></aside></div><section id="sac-vide" class="panel cadre" hidden><h2>Ton sac est vide.</h2><p>Achète des objets au Shop pour commencer.</p><a class="link" href="../shop/a-etageres.html">Ouvre le Shop</a></section>';
function fiche(i) {
 const o=objets[i], raison=o[1]===0?'Tu n’en as plus.':o[5];
 return '<article class="item panel cadre"><div class="row">'+svg(icons[o[4]])+'<h3>'+o[0]+' ×'+o[1]+'</h3></div><p>'+o[2]+'</p><button type="button" data-objet="'+i+'" '+(raison?'disabled':'')+' aria-describedby="raison-'+i+'">'+(o[3]==='Permanents'?'Actif':'Utiliser')+'</button><p id="raison-'+i+'" class="muted">'+(raison||'Choisis un Pokémon cible.')+'</p></article>';
}
function afficher() {
 const zone=document.querySelector('#objets');
 if(variante==='b') {
 zone.innerHTML='<h2>Choisis un objet</h2><div class="grille-objets">'+objets.map((o,i)=>'<button class="cadre item" type="button" data-objet="'+i+'" aria-pressed="'+(i===selection)+'">'+svg(icons[o[4]])+'<strong>'+o[0]+'</strong><span>×'+o[1]+'</span></button>').join('')+'</div>';
 } else if(variante==='c') {
 zone.innerHTML='<div class="toolbar" role="tablist" aria-label="Catégories">'+categories.map(c=>'<button type="button" role="tab" aria-selected="'+(c===categorie)+'" aria-controls="categorie" data-categorie="'+c+'">'+c+'</button>').join('')+'</div><div id="categorie" role="tabpanel" aria-label="'+categorie+'" class="stack">'+objets.map((o,i)=>o[3]===categorie?fiche(i):'').join('')+'</div>';
 } else zone.innerHTML=categories.map(c=>'<section class="stack"><h2>'+c+'</h2>'+objets.map((o,i)=>o[3]===c?fiche(i):'').join('')+'</section>').join('');
 const o=objets[selection];
 const detail=document.querySelector('#detail');
 detail.hidden=variante!=='b';
 detail.innerHTML='<h2>'+o[0]+' ×'+o[1]+'</h2><p>'+o[2]+'</p>'+(o[5]?'<p>'+o[5]+'</p><button disabled>Utiliser</button>':'<button type="button" id="ouvrir-cible">Utiliser</button>');
 const ciblable=[2,4,5].includes(selection);
 document.querySelector('#cible').innerHTML='<h2>'+ (ciblable?o[0]+' : choisis ta cible':'Sélection du Pokémon')+'</h2><p>'+(!ciblable?'Choisis Bonbon, Calcium ou Pierre Feu.':selection===5?'Fonction à venir : aucun Pokémon ne peut recevoir cette pierre.':'Touche un Pokémon pour utiliser un objet.')+'</p><div class="targets">'+equipe.map((p,i)=>'<div class="stack"><img class="sprite" src="../../specimens/assets/pokemon/'+p[0]+'.png" width="192" height="192" alt="'+p[1]+'"><strong>'+p[1]+'</strong><p>'+p[2]+'</p><button type="button" data-cible="'+i+'" '+(!ciblable||selection===5||!o[1]?'disabled':'')+'>Choisis '+p[1]+'</button></div>').join('')+'</div><p class="muted">3 emplacements vides · Ajoute des Pokémon depuis le PC.</p>';
 zone.querySelectorAll('[data-objet]').forEach(b=>b.onclick=()=>{selection=Number(b.dataset.objet);afficher();document.querySelector(variante==='b'?'#detail':'#cible').scrollIntoView({block:'start'});});
 zone.querySelectorAll('[data-categorie]').forEach(b=>b.onclick=()=>{categorie=b.dataset.categorie;afficher();document.querySelector('[data-categorie="'+categorie+'"]').focus();});
 document.querySelector('#ouvrir-cible')?.addEventListener('click',()=>document.querySelector('#cible').scrollIntoView({block:'start'}));
 document.querySelectorAll('[data-cible]').forEach(b=>b.onclick=()=>{objets[selection][1]--;message(o[0]+' utilisé sur '+equipe[Number(b.dataset.cible)][1]+'. Simulation de maquette.');afficher();});
}
document.querySelector('#vide').onclick=e=>{
 const vide=e.currentTarget.getAttribute('aria-pressed')!=='true';
 e.currentTarget.setAttribute('aria-pressed',String(vide));
 e.currentTarget.textContent=vide?'Retrouve les objets':'Voir le sac vide';
 document.querySelector('#inventaire').hidden=vide;document.querySelector('#sac-vide').hidden=!vide;
};
afficher();

