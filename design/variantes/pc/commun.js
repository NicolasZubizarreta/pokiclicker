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
let selected=pc[0].key, sort='id', empty=false, fullDemo=false, exchanging=false;
const referenceTeam=team.map(p=>({...p}));
document.body.dataset.colonne='pc';
function sorted() {return [...pc].sort((a,b)=>sort==='id'?a.id-b.id||b.level-a.level:sort==='name'?a.name.localeCompare(b.name,'fr')||b.level-a.level:sort==='level'?b.level-a.level||a.id-b.id:Number(b.fav)-Number(a.fav)||a.id-b.id);}
function current() { return pc.find(p=>p.key===selected)||pc[0]; }
function slots() {return '<div class="equipe-places">'+Array.from({length:6},(_,i)=>'<button data-place="'+i+'" '+(!team[i]&&empty?'disabled':'')+'>'+(team[i]?escapeHtml(team[i].name)+' · Niv. '+team[i].level+'<br>'+team[i].dps+' DPS':'Emplacement libre · Place ici')+'</button>').join('')+'</div>';}
function detail() {
 const p=current();
 if(empty||!p)return '<aside id="detail" class="panneau cadre"><h2>Aucune sélection</h2><button disabled>Mettre dans l’équipe</button><p>Capture un Pokémon pour pouvoir l’ajouter.</p></aside>';
 return '<aside id="detail" class="panneau cadre"><h2>'+escapeHtml(p.name)+'</h2>'+sprite(p)+stats(p)+'<div class="actions"><a class="lien" href="'+fiche(p)+'">Ouvre la fiche</a><button data-favorite="'+p.key+'" aria-pressed="'+p.fav+'">'+star+(p.fav?'Retire des favoris':'Ajoute aux favoris')+'</button></div><button id="ajouter">Mettre dans l’équipe</button>'+
 (team.length===6?'<p class="info">'+info+'Équipe pleine : échange ce Pokémon avec un partenaire.</p>':'<p>'+ (6-team.length)+' emplacements libres dans ton équipe.</p>')+
 (exchanging?'<h2>Choisis un partenaire</h2><p>'+escapeHtml(p.name)+' prendra sa place. Le partenaire choisi ira dans le PC.</p>'+slots()+'<button id="annuler">Annuler l’échange</button>':'')+'</aside>';
}
function render() {
 const data=empty?[]:sorted();
 $('#compteur').textContent=data.length+' Pokémon';
 const list=data.length?'<section class="collection '+(variant==='b'?'grille':'')+'" aria-label="Pokémon du PC">'+data.map(p=>'<article class="carte-pokemon cadre"><button class="selectionner" data-select="'+p.key+'" aria-pressed="'+(p.key===selected)+'">'+sprite(p)+'<div><div class="identite"><strong>'+escapeHtml(p.name)+'</strong>'+marks(p)+'</div><p>N° '+p.id+' · Niveau '+p.level+'</p></div></button><a class="lien" href="'+fiche(p)+'">Ouvre la fiche</a></article>').join('')+'</section>':'<section class="panneau cadre"><h2>Ton PC est vide.</h2><p>Capture des Pokémon pour les ranger ici.</p><a class="lien" href="../combat/b-scene-tactile.html">Pars capturer</a></section>';
 $('#contenu').innerHTML=variant==='c'?'<section class="panneau cadre colonne-equipe"><h2>Équipe · '+team.length+' / 6</h2><p>Choisis un Pokémon dans le PC, puis touche une place libre ou un partenaire pour l’échanger.</p>'+slots()+(empty?'<p>Ton PC est vide. Capture un Pokémon avant de choisir une place.</p>':'')+'</section><div class="colonne-pc">'+detail()+list+'</div>':list+detail();
 document.querySelectorAll('[data-tri]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tri===sort));
}
function transfer(index) {
 const p=current();if(empty||!p){status('Ton PC est vide. Capture un Pokémon pour le placer ici.');return;}
 const old=team[index], position=pc.indexOf(p);
 if(old) {pc[position]=old;team[index]=p;status(p.name+' rejoint l’équipe. '+old.name+' est envoyé au PC.');}
 else {team.push(p);pc.splice(position,1);status(p.name+' rejoint l’équipe.');}
 selected=pc[0]?.key;exchanging=false;render();
}
document.querySelectorAll('[data-tri]').forEach(b=>b.onclick=()=>{sort=b.dataset.tri;render();status('Tri actif : '+b.textContent+'.');});
$('#plein').onclick=()=>{fullDemo=!fullDemo;team.splice(0,team.length,...referenceTeam.map(p=>({...p})));if(fullDemo)team.push(...pc.slice(0,3).map((p,i)=>({...p,key:'demo'+i})));exchanging=fullDemo;$('#plein').setAttribute('aria-pressed',fullDemo);render();status(fullDemo?'Exemple isolé : équipe pleine. Choisis un partenaire à échanger.':'Équipe de référence restaurée.');};
$('#vide').onclick=()=>{empty=!empty;exchanging=false;$('#vide').setAttribute('aria-pressed',empty);render();status(empty?'Exemple isolé : PC vide.':'Retour aux Pokémon du PC.');};
document.querySelectorAll('[data-colonne]').forEach(b=>b.onclick=()=>{document.body.dataset.colonne=b.dataset.colonne;document.querySelectorAll('[data-colonne]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
$('#contenu').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.select){selected=b.dataset.select;render();status(current().name+' sélectionné.');}
 if(b.dataset.favorite){const p=pc.find(p=>p.key===b.dataset.favorite);p.fav=!p.fav;render();status(p.fav?'Ajouté aux favoris.':'Retiré des favoris.');}
 if(b.id==='ajouter'){if(team.length===6){exchanging=true;render();}else transfer(team.length);}
 if(b.dataset.place!==undefined)transfer(+b.dataset.place);
 if(b.id==='annuler'){exchanging=false;render();}
};
render();

