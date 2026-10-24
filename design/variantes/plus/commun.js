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

const variante=document.body.className.slice(-1);
const connus={1:'Bulbizarre',2:'Herbizarre',3:'Florizarre',4:'Salamèche',5:'Reptincel',6:'Dracaufeu',7:'Carapuce',8:'Carabaffe',9:'Tortank',10:'Chenipan',11:'Chrysacier',12:'Papilusion',13:'Aspicot',14:'Coconfort',15:'Dardargnan',16:'Roucool',17:'Roucoups',18:'Roucarnage',19:'Rattata',20:'Rattatac',21:'Piafabec',22:'Rapasdepic',25:'Pikachu',95:'Onix'};
const sprites=[1,4,7,16,19,25,95];
const entrees=[
 ['Pokédex','24 / 151 · 24 espèces capturées',icons.balle],
 ['Badges','2 / 8 · Roche et Cascade',icons.piece],
 ['Profil','Kanto · Route 1',icons.info],
 ['Stats','23 DPS · 3 Pokémon dans l’équipe',icons.flacon],
 ['Aide','Touche la scène pour attaquer.',icons.info]
];
document.querySelector('#contenu').innerHTML=(variante==='c'?'<section class="dashboard panel cadre"><div><h2>Ton aventure</h2><p>Kanto · Route 1</p></div><p><strong>24 / 151</strong><br>Pokédex</p><p><strong>2 / 8</strong><br>Badges</p><p><strong>23 DPS</strong><br>Ton équipe</p></section>':'')+'<div class="layout"><section class="stack"><div class="menu" aria-label="Menu Plus">'+entrees.map(([nom,resume,icone])=>'<button type="button" class="panel cadre" data-ecran="'+nom+'" aria-controls="ecran" aria-pressed="'+(nom==='Pokédex')+'">'+svg(icone)+'<span><strong>'+nom+'</strong><span>'+resume+'</span></span></button>').join('')+'</div><a class="link" href="../sac/a-liste-groupee.html">Ouvre ton sac</a></section><section id="ecran" class="panel cadre stack" tabindex="-1" aria-label="Écran ouvert"></section></div>';
function pokedex(){
 document.querySelector('#ecran').innerHTML='<header><div><h2>Pokédex de Kanto</h2><p>24 / 151 espèces capturées</p></div><button type="button" id="fermer">Reviens au menu</button></header><p class="status">'+svg(icons.info)+'<strong>30 espèces : DPS ×1,5</strong></p><p>Encore 6 espèces pour le prochain palier.</p><button type="button" disabled>Réclame la récompense</button><p class="muted">Capture 30 espèces pour débloquer cette récompense.</p><label class="row">Affiche <select id="filtre"><option value="tout">Les 151 espèces</option><option value="capture">Les 24 capturées</option><option value="inconnu">Les 127 à découvrir</option><option value="shiny">Les Pokémon shiny</option></select></label><p class="muted">Maquette : les visuels absents sont représentés par un repère neutre.</p><div class="dex" role="list"></div>';
 const dessiner=()=>{
 const filtre=document.querySelector('#filtre').value;
 const ids=Array.from({length:151},(_,i)=>i+1).filter(id=>filtre==='capture'?connus[id]:filtre==='inconnu'?!connus[id]:filtre==='shiny'?id===25:true);
 document.querySelector('.dex').innerHTML=ids.map(id=>'<article role="listitem" class="dex-case cadre '+(connus[id]?'capture':'inconnu')+'"><strong>N° '+String(id).padStart(3,'0')+'</strong>'+(sprites.includes(id)?'<img class="sprite" src="../../specimens/assets/pokemon/'+id+'.png" width="192" height="192" alt="'+connus[id]+'">':'<div class="silhouette" aria-label="Visuel indisponible">'+svg(icons.balle)+'</div>')+'<strong>'+(connus[id]||'Inconnu')+'</strong><span>'+(connus[id]?'Capturé'+(id===25?' · Shiny':''):'À découvrir')+'</span></article>').join('');
 };
 document.querySelector('#filtre').onchange=dessiner;
 document.querySelector('#fermer').onclick=()=>{document.querySelector('#ecran').hidden=true;document.querySelector('[data-ecran="Pokédex"]').focus();document.querySelectorAll('[data-ecran]').forEach(b=>b.setAttribute('aria-pressed','false'));};
 dessiner();
}
const autres={
 Badges:'<h2>Tes badges</h2><p>2 / 8 · Roche et Cascade</p><p>6 badges restent à gagner.</p>',
 Profil:'<h2>Ton profil</h2><p>Kanto · Route 1</p><p>Équipe : Bulbizarre, Salamèche et Éclair (Pikachu shiny).</p>',
 Stats:'<h2>Tes statistiques</h2><p>DPS de l’équipe : 23</p><p>6 300 pièces · 24 espèces capturées · 2 badges</p>',
 Aide:'<h2>Besoin d’aide ?</h2><p>Touche la scène de combat pour attaquer. Au clavier, utilise Entrée ou Espace.</p><p>Choisis un objet dans le sac pour l’utiliser.</p>'
};
document.querySelectorAll('[data-ecran]').forEach(b=>b.onclick=()=>{
 document.querySelector('#ecran').hidden=false;
 document.querySelectorAll('[data-ecran]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 if(b.dataset.ecran==='Pokédex')pokedex();else document.querySelector('#ecran').innerHTML=autres[b.dataset.ecran]+'<p class="muted">Aperçu léger de maquette.</p>';
 document.querySelector('#ecran').focus();
});
pokedex();

