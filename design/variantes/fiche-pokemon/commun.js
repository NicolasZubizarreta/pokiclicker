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
let p={...team[0]}, inPc=false, last=false, evolved=false, released=false, tab='resume';
try { const data=JSON.parse(new URLSearchParams(location.search).get('pokemon')); if(data && species[data.id] && typeof data.name==='string') {p={...team[0],...data,name:data.name.slice(0,12)};inPc=String(p.key).startsWith('p');} } catch { status('La fiche demandée est introuvable. Voici Bulbizarre.'); }
const initial={...p};
const types={1:'Plante · Poison',4:'Feu',7:'Eau',16:'Normal · Vol',19:'Normal',25:'Électrik',95:'Roche · Sol'};
function render() {
 if(released) { $('#fiche-contenu').innerHTML='<h2>Ce Pokémon est parti</h2><p>Retourne à ton équipe pour choisir un autre partenaire.</p><a class="lien" href="../equipe/a-liste.html">Retour à l’équipe</a>';return; }
 const locked=last&&!inPc;
 $('#fiche-contenu').innerHTML=(variant==='c'?'<div class="tabs" role="tablist" aria-label="Fiche"><button role="tab" id="tab-resume" aria-controls="resume" aria-selected="'+(tab==='resume')+'" tabindex="'+(tab==='resume'?0:-1)+'" data-tab="resume">Résumé</button><button role="tab" id="tab-gestion" aria-controls="gestion" aria-selected="'+(tab==='gestion')+'" tabindex="'+(tab==='gestion'?0:-1)+'" data-tab="gestion">Actions</button></div>':'')+
 '<div class="contenu"><section id="resume" class="resume" '+(variant==='c'?'role="tabpanel" aria-labelledby="tab-resume" '+(tab!=='resume'?'hidden':''):'')+'><h2>'+escapeHtml(p.name)+'</h2>'+sprite(p,true)+stats(p)+'<p>Types : '+types[p.id]+'</p><p>'+ (inPc?'Dans le PC':'Dans ton équipe')+'</p><h2>Facteurs de DPS</h2><dl><dt>Base</dt><dd>'+(p.shiny?p.dps/1.5:p.dps).toLocaleString('fr-FR')+' DPS</dd><dt>Calcium</dt><dd>× 1 · 0 dose</dd><dt>Shiny</dt><dd>× '+(p.shiny?'1,5':'1')+'</dd><dt>Bonheur</dt><dd>× 1 · 0 / 255</dd></dl>'+(p.shiny?'<p class="doux">Base avant bonus : '+(p.dps/1.5).toLocaleString('fr-FR')+' DPS. Total : '+p.dps+' DPS.</p>':'')+'</section>'+
 '<section id="gestion" class="gestion" '+(variant==='c'?'role="tabpanel" aria-labelledby="tab-gestion" '+(tab!=='gestion'?'hidden':''):'')+'><h2>Prends soin de lui</h2><form id="renommer"><label for="nom">Renomme ton Pokémon</label><input id="nom" maxlength="12" value="'+escapeHtml(p.name)+'" aria-describedby="compteur erreur" required><p id="compteur">'+p.name.length+' / 12 caractères</p><p id="erreur" role="alert"></p><button>Valider</button></form>'+
 '<button id="favori" aria-pressed="'+p.fav+'">'+star+(p.fav?'Retire des favoris':'Ajoute aux favoris')+'</button>'+
 '<button id="transferer" '+(locked?'disabled aria-describedby="raison"':'')+'>'+(inPc?'Mettre dans l’équipe':'Envoyer au PC')+'</button>'+
 (p.id===1?'<section><h2>Évolution</h2><p>Bulbizarre → Herbizarre · Niveau 16</p><button id="evoluer" '+(p.level<16||evolved?'disabled aria-describedby="evolution-raison"':'')+'>Évoluer</button><p id="evolution-raison">'+(evolved?'Évolution simulée. Le sprite d’Herbizarre n’est pas disponible dans ce lot.':p.level<16?'Niveau 16 requis.':'Niveau requis atteint : tu peux le faire évoluer.')+'</p></section>':'')+
 '<button id="relacher" class="destructif" '+(locked?'disabled aria-describedby="raison"':'')+'>Relâcher</button><p id="raison">'+(locked?'Impossible de relâcher ou de ranger le dernier Pokémon de ton équipe.':'Relâcher retire définitivement ce Pokémon. Une confirmation te sera demandée.')+'</p></section></div>';
 $('#nom').oninput=e=>{$('#compteur').textContent=e.target.value.length+' / 12 caractères';$('#erreur').textContent='';};
 $('#renommer').onsubmit=e=>{e.preventDefault(); const name=$('#nom').value.trim();if(!name){$('#erreur').textContent='Entre un nom de 1 à 12 caractères.';return;}p.name=name;render();status('Nouveau nom : '+p.name+'.');};
 $('#favori').onclick=()=>{p.fav=!p.fav;render();status(p.fav?'Ajouté aux favoris.':'Retiré des favoris.');};
 $('#transferer').onclick=()=>{inPc=!inPc;render();status(inPc?'Pokémon envoyé au PC.':'Pokémon placé dans l’équipe.');};
 $('#relacher').onclick=()=>{$('#confirmation-texte').textContent='Tu vas relâcher '+p.name+'. Tu ne pourras pas le récupérer. Confirme seulement si tu veux le laisser partir.';$('#confirmation').showModal();};
 if($('#evoluer'))$('#evoluer').onclick=()=>{evolved=true;render();status('Démonstration : Bulbizarre évolue en Herbizarre.');};
 document.querySelectorAll('[data-tab]').forEach(b=>{b.onclick=()=>{tab=b.dataset.tab;render();$('#tab-'+tab).focus();};b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();tab=tab==='resume'?'gestion':'resume';render();$('#tab-'+tab).focus();}};});
}
$('#fond-equipe').innerHTML='<h2>Ton équipe · 23 DPS</h2>'+team.map((x,i)=>'<button class="cadre" data-partner="'+i+'">'+escapeHtml(x.name)+' · Niveau '+x.level+' · '+x.dps+' DPS</button>').join('');
$('#fond-equipe').onclick=e=>{const b=e.target.closest('[data-partner]');if(b){p={...team[+b.dataset.partner]};released=false;evolved=false;render();if(variant==='b')$('#fiche').showModal();}};
$('#niveau').onclick=()=>{const active=$('#niveau').getAttribute('aria-pressed')!=='true';$('#niveau').setAttribute('aria-pressed',active);p=active?{...team[0],level:16}:{...initial};evolved=false;released=false;render();status(active?'Exemple isolé : Bulbizarre au niveau 16.':'Retour aux données de référence.');};
$('#dernier').onclick=()=>{last=!last;$('#dernier').setAttribute('aria-pressed',last);render();status(last?'Exemple isolé : dernier Pokémon de l’équipe.':'Équipe de référence : trois partenaires.');};
$('#annuler').onclick=()=>$('#confirmation').close();
$('#confirmer').onclick=()=>{released=true;$('#confirmation').close();render();status(p.name+' a été relâché dans cette démonstration.');};
render();
if(variant==='b') { $('#ouvrir').onclick=()=>$('#fiche').showModal();$('#fermer').onclick=()=>$('#fiche').close();$('#fiche').showModal(); }

