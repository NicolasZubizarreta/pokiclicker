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
const produits=[
 {nom:'Pokéball',prix:220,rayon:'Balles',icone:'balle',effet:'Capture des Pokémon (faible chance).',quantite:true},
 {nom:'Superball',zone:6,rayon:'Balles',icone:'balle',effet:'Capture des Pokémon (moyenne chance ×2).'},
 {nom:'Bonbon',prix:5500,rayon:'Soins',icone:'bonbon',effet:'Fait monter un Pokémon de niveau.',quantite:true},
 {nom:'Repousse',zone:4,rayon:'Soins',icone:'flacon',effet:'Empêche les Pokémon communs d’apparaître pendant 30 s.'},
 {nom:'Protéine',prix:8250,rayon:'Équipement',icone:'flacon',effet:'Dégâts par clic +50 %.'},
 {nom:'Multi Exp',prix:13200,rayon:'Équipement',icone:'piece',effet:'Gain d’XP +50 %.'},
 {nom:'Chaussures',possede:true,rayon:'Équipement',icone:'chaussure',effet:'Divise le temps d’apparition des ennemis par 1,5.'},
 {nom:'Pièce Rune',possede:true,rayon:'Équipement',icone:'piece',effet:'Gains d’argent +30 %.'}
];
const variante=document.body.className.slice(-1), rayons=['Balles','Soins','Équipement'];
let argent=6300, rayon='Balles', panier={}, quantites={};
const root=document.querySelector('#contenu');
root.innerHTML='<p class="toolbar">Prix avec 2 badges · Objets permanents : un seul achat.</p><div class="layout"><section id="catalogue" class="stack" aria-label="Produits"></section><aside id="panier" class="panel cadre stack"></aside></div><details class="notice"><summary>Essaie la confirmation d’achat</summary><p>La confirmation flotte au-dessus de la page, sans déplacer les produits. Cet exemple ne débite pas ton argent.</p><button id="exemple" type="button">Montre la confirmation</button></details>';
function carte(p,i) {
 const q=quantites[i]||1, manque=p.prix*q-argent;
 const raison=p.possede?'Possédé':p.zone?'Débloqué à la zone '+p.zone:manque>0?'Il te manque '+fmt(manque)+' pièces.':'';
 return '<article class="item panel cadre"><div class="row">'+svg(icons[p.icone])+'<h2>'+p.nom+'</h2></div><p>'+p.effet+'</p><strong>'+(p.possede?'Possédé':p.zone?'Bientôt':fmt(p.prix)+' pièces')+'</strong>'+(p.quantite?'<label class="row">Quantité <input aria-label="Quantité de '+p.nom+'" type="number" min="1" max="99" step="1" value="'+q+'" data-quantite="'+i+'"></label>':'')+'<button type="button" data-achat="'+i+'" '+(raison?'disabled':'')+' aria-describedby="raison-'+i+'">'+(p.possede?'Possédé':p.zone?'Bientôt':manque>0?raison:variante==='c'?'Ajoute au panier':'Acheter ×'+q)+'</button><p id="raison-'+i+'" class="muted">'+(raison||'Total : '+fmt(p.prix*q)+' pièces.')+'</p></article>';
}
function afficher() {
 document.querySelector('.monnaie').textContent=fmt(argent)+' pièces';
 const catalogue=document.querySelector('#catalogue');
 if(variante==='b') catalogue.innerHTML='<div class="products">'+produits.map(carte).join('')+'</div>';
 else if(variante==='c') catalogue.innerHTML='<div class="toolbar" aria-label="Rayons">'+rayons.map(r=>'<button type="button" data-rayon="'+r+'" aria-pressed="'+(r===rayon)+'">'+r+'</button>').join('')+'</div><h2>'+rayon+'</h2><div class="products">'+produits.map((p,i)=>p.rayon===rayon?carte(p,i):'').join('')+'</div>';
 else catalogue.innerHTML=rayons.map(r=>'<section class="stack"><h2>'+r+'</h2>'+produits.map((p,i)=>p.rayon===r?carte(p,i):'').join('')+'</section>').join('');
 const total=Object.entries(panier).reduce((s,[i,q])=>s+produits[i].prix*q,0);
 const aside=document.querySelector('#panier');
 aside.innerHTML=variante==='c'?'<h2>Ton panier</h2>'+(total?Object.entries(panier).map(([i,q])=>'<p>'+produits[i].nom+' ×'+q+' · '+fmt(produits[i].prix*q)+' pièces</p>').join(''):'<p>Ton panier est vide.</p>')+'<strong>Total : '+fmt(total)+' pièces</strong><p>'+(total>argent?'Il te manque '+fmt(total-argent)+' pièces.':!total?'Ajoute un objet pour acheter.':'Après achat : '+fmt(argent-total)+' pièces.')+'</p><button type="button" id="payer" class="action" '+(!total||total>argent?'disabled':'')+'>Acheter le panier</button><button type="button" id="vider" '+(!total?'disabled':'')+'>Vide le panier</button>':'<h2>Prépare ta route</h2><p>Tu possèdes 8 Pokéballs et 3 Superballs au départ.</p><p>Chaussures et Pièce Rune sont déjà actives.</p><a class="link" href="../sac/a-liste-groupee.html">Ouvre ton sac</a>';
 catalogue.querySelectorAll('[data-quantite]').forEach(input=>input.onchange=()=>{quantites[input.dataset.quantite]=Math.max(1,Math.min(99,Math.floor(Number(input.value)||1)));afficher();document.querySelector('[data-quantite="'+input.dataset.quantite+'"]').focus();});
 catalogue.querySelectorAll('[data-rayon]').forEach(b=>b.onclick=()=>{rayon=b.dataset.rayon;afficher();document.querySelector('[data-rayon="'+rayon+'"]').focus();});
 catalogue.querySelectorAll('[data-achat]').forEach(b=>b.onclick=()=>{
 const i=Number(b.dataset.achat), p=produits[i],q=quantites[i]||1;
 if(variante==='c') panier[i]=p.quantite?(panier[i]||0)+q:1;
 else {argent-=p.prix*q;if(!p.quantite)p.possede=true;message(p.nom+' ×'+q+' acheté. '+fmt(p.prix*q)+' pièces dépensées.');}
 afficher();
 });
 document.querySelector('#vider')?.addEventListener('click',()=>{panier={};afficher();});
 document.querySelector('#payer')?.addEventListener('click',()=>{argent-=total;Object.keys(panier).forEach(i=>{if(!produits[i].quantite)produits[i].possede=true;});panier={};message('Achat confirmé : '+fmt(total)+' pièces dépensées.');afficher();});
}
document.querySelector('#exemple').onclick=()=>message('Exemple : Pokéball ×1 achetée pour 220 pièces.');
afficher();

