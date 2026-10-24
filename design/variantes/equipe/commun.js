const $ = s => document.querySelector(s);
const svg = path => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + path + '"/></svg>';
const star = svg('m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z');
const spark = svg('m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z');
const info = svg('M12 8v5m0 3v1M12 3 2 21h20z');
const species = {1:'Bulbizarre',4:'Salamèche',7:'Carapuce',16:'Roucool',19:'Rattata',25:'Pikachu',95:'Onix'};
const team = [
 {key:'t1',id:1,name:'Bulbizarre',level:15,sex:'m',fav:true,dps:9,xp:120,max:11250},
 {key:'t2',id:4,name:'Salamèche',level:14,sex:'m',fav:false,dps:8,xp:80,max:9800},
 {key:'t3',id:25,name:'Éclair',level:12,sex:'f',fav:false,shiny:true,dps:6,xp:60,max:7200}
];
const pc = Array.from({length:18},(_,i) => { const id=[1,4,7,16,19,25,95][i%7]; return {key:'p'+i,id,name:species[id],level:[3,8,12,16,21,25,31,7,14,19,23,11,27,5,18,24,9,30][i],sex:i%2?'f':'m',fav:i%5===0,shiny:i===5,dps:3+i,xp:0,max:1000}; });
const escapeHtml = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sprite = (p,large=false) => '<div class="portrait"><img class="sprite'+(large?' grand':'')+'" src="../../specimens/assets/pokemon/'+p.id+'.png" width="'+(large?288:192)+'" height="'+(large?288:192)+'" alt="'+species[p.id]+'"></div>';
const marks = p => '<span aria-label="'+(p.sex==='f'?'Femelle':'Mâle')+'">'+(p.sex==='f'?'♀':'♂')+'</span>'+(p.fav?'<span class="marque">'+star+'Favori</span>':'')+(p.shiny?'<span class="marque">'+spark+'Shiny</span>':'');
const stats = p => '<div class="identite"><strong>'+escapeHtml(p.name)+'</strong>'+marks(p)+'</div><p>'+species[p.id]+' · N° '+p.id+' · Niveau '+p.level+'</p><p class="numero">'+p.dps+' DPS</p><label>XP '+p.xp.toLocaleString('fr-FR')+' / '+p.max.toLocaleString('fr-FR')+'<progress class="xp" value="'+p.xp+'" max="'+p.max+'"></progress></label>';
const fiche = p => '../fiche-pokemon/a-resume.html?pokemon='+encodeURIComponent(JSON.stringify(p));
function status(text) { $('#statut').textContent=text; }
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click',() => {
 if (b.dataset.page==='Combat') location.href='../combat/b-scene-tactile.html';
 else if(b.dataset.page==='Équipe') location.href='../equipe/a-liste.html';
 else status(b.dataset.page+' : cette maquette couvre seulement Équipe, Fiche Pokémon et PC.');
}));

const variant=document.body.dataset.variante;
let selected=0, ordering=true;
function details() {
 const p=team[selected];
 return '<aside id="detail" class="panneau cadre"><h2>'+escapeHtml(p.name)+'</h2>'+sprite(p)+stats(p)+'<a class="lien" href="'+fiche(p)+'">Ouvre la fiche</a></aside>';
}
function render() {
 const cards=Array.from({length:6},(_,i)=>{
  const p=team[i];
  if(!p) return '<article class="vide cadre"><h2>Emplacement libre</h2><p>Capture des Pokémon pour agrandir ton équipe.</p><a class="lien" href="../combat/b-scene-tactile.html">Pars capturer</a></article>';
  return '<article class="carte-pokemon cadre"><a class="ouvrir" href="'+fiche(p)+'" aria-label="Ouvre la fiche de '+escapeHtml(p.name)+'">'+sprite(p)+'<div>'+stats(p)+'</div></a>'+
  (variant==='a'?'<button data-detail="'+i+'" aria-pressed="'+(selected===i)+'">Examine '+escapeHtml(p.name)+'</button>':'')+
  (ordering?'<div class="actions"><button data-move="'+i+'" data-delta="-1" '+(i===0?'disabled aria-describedby="premier"':'')+'>Monte</button><button data-move="'+i+'" data-delta="1" '+(i===team.length-1?'disabled aria-describedby="dernier"':'')+'>Descends</button></div>'+(i===0?'<p id="premier">Déjà en tête de l’équipe.</p>':'')+(i===team.length-1?'<p id="dernier">Dernier emplacement occupé.</p>':''):'')+'</article>';
 }).join('');
 if(variant==='c') {
  $('#equipe').innerHTML='<div class="cases">'+Array.from({length:6},(_,i)=>'<button class="cadre '+(!team[i]?'libre':'')+'" data-slot="'+i+'" aria-expanded="'+(selected===i)+'">'+(team[i]?escapeHtml(team[i].name)+'<br>Niv. '+team[i].level:'Emplacement libre')+'</button>').join('')+
  '</div>'+details()+(ordering?'<div class="actions"><button id="left" '+(selected===0?'disabled':'')+'>Monte</button><button id="right" '+(selected===team.length-1?'disabled':'')+'>Descends</button><p>Choisis une case occupée. La première ne peut pas monter ; la dernière ne peut pas descendre.</p></div>':'');
 } else $('#equipe').innerHTML='<section class="collection '+(variant==='b'?'grille':'')+'" aria-label="Les six emplacements">'+cards+'</section>'+(variant==='a'?details():'');
}
function move(i,delta) { const j=i+delta; if(j<0||j>=team.length)return; [team[i],team[j]]=[team[j],team[i]]; selected=j; render(); status(team[j].name+' est maintenant en position '+(j+1)+'.'); }
$('#ordre').onclick=()=>{ordering=!ordering; $('#ordre').setAttribute('aria-pressed',ordering); $('#mode').textContent=ordering?'Mode échange sélectionné : utilise Monte et Descends.':'Mode fiche : touche un Pokémon.'; render();};
$('#equipe').onclick=e=>{
 const b=e.target.closest('button'); if(!b)return;
 if(b.dataset.detail!==undefined) {selected=+b.dataset.detail;render();}
 if(b.dataset.slot!==undefined) { if(team[+b.dataset.slot]){selected=+b.dataset.slot;render();}else status('Emplacement libre. Capture des Pokémon pour agrandir ton équipe.');}
 if(b.dataset.move!==undefined)move(+b.dataset.move,+b.dataset.delta);
 if(b.id==='left')move(selected,-1);
 if(b.id==='right')move(selected,1);
};
render();

