const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const paths = ['m3 3 5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6','M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z','M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3','m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17','M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z'];
document.querySelector('nav').innerHTML = ['Combat','Équipe','Shop','Carte','Plus'].map((name,i) => `<button type="button" ${i === 4 ? 'aria-current="page"' : ''}>${svg(`<path d="${paths[i]}"/>`)}${name}</button>`).join('');
document.querySelectorAll('nav button').forEach(button => button.onclick = () => { document.querySelector('#retour').textContent = button.textContent + ' : navigation hors de cette maquette.'; });

const starters = [{id:1,name:'Bulbizarre',type:'Plante · Poison'},{id:4,name:'Salamèche',type:'Feu'},{id:7,name:'Carapuce',type:'Eau'}];
const phrases = ['Bienvenue dans le monde des Pokémon !','Je suis le professeur Chen.','Choisis ton premier partenaire.'];
const ball = svg('<g class="haut"><path d="M3 12a9 9 0 0 1 18 0Z"/></g><path d="M3 12a9 9 0 0 0 18 0"/><circle cx="12" cy="12" r="3"/>');
const portrait = s => `<div class="portrait"><img src="../../specimens/assets/pokemon/${s.id}.png" width="96" height="96" alt="${s.name}"></div>`;
const a = document.body.classList.contains('variante-a');
const b = document.body.classList.contains('variante-b');
let selected = null, visible = 0, line = 0, count = 0, timer;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const choices = document.querySelector('#choix');
choices.classList.toggle('balls',a);
choices.innerHTML = starters.map((s,i) => a ? `<button class="ball" data-starter="${i}" aria-pressed="false">${ball}<span>${s.name}</span></button>` : `<button class="rencontre cadre ${i===0?'visible':''}" data-starter="${i}" aria-pressed="false"><strong>${s.name}</strong><span>${s.type}</span><span class="balle">${ball}</span>${portrait(s)}</button>`).join('');
function select(i) {
 selected = i;
 document.querySelectorAll('[data-starter]').forEach(el => el.setAttribute('aria-pressed',String(Number(el.dataset.starter)===i)));
 if(a) document.querySelector('#apercu').innerHTML = portrait(starters[i]) + `<h2>${starters[i].name}</h2><p>${starters[i].type}</p>`;
 const confirm = document.querySelector('#confirmer');
 confirm.disabled = false;
 confirm.textContent = 'Choisir ' + starters[i].name;
 document.querySelector('#aide').textContent = starters[i].name + ' attend ta confirmation.';
 document.querySelector('#choisi').textContent = '';
}
document.querySelectorAll('[data-starter]').forEach(el => el.onclick = () => select(Number(el.dataset.starter)));
function page(i,focus=false) {
 visible = Math.max(0,Math.min(2,i));
 const els = [...document.querySelectorAll('[data-starter]')];
 els.forEach((el,j) => el.classList.toggle('visible',j===visible));
 if(b) choices.scrollTo({left:els[visible].offsetLeft - els[0].offsetLeft,behavior:'instant'});
 document.querySelector('#position').textContent = (visible+1) + ' / 3';
 document.querySelector('#precedent').disabled = visible===0;
 document.querySelector('#suivant').disabled = visible===2;
 if(focus) els[visible].focus({preventScroll:true});
}
choices.addEventListener('keydown',e => {
 if(e.key==='ArrowRight' || e.key==='ArrowLeft') { e.preventDefault(); page(visible+(e.key==='ArrowRight'?1:-1),true); }
});
if(b) choices.addEventListener('scroll',() => {
 const els = [...choices.children];
 visible = els.reduce((best,el,i) => Math.abs(el.offsetLeft-els[0].offsetLeft-choices.scrollLeft)<Math.abs(els[best].offsetLeft-els[0].offsetLeft-choices.scrollLeft)?i:best,0);
 document.querySelector('#position').textContent = (visible+1)+' / 3';
 document.querySelector('#precedent').disabled = visible===0;
 document.querySelector('#suivant').disabled = visible===2;
});
document.querySelector('#precedent').onclick = () => page(visible-1);
document.querySelector('#suivant').onclick = () => page(visible+1);
function type() {
 clearInterval(timer); count = reduced.matches ? phrases[line].length : 0;
 document.querySelector('#phrase-accessible').textContent = phrases[line];
 function tick() {
  document.querySelector('#phrase').textContent = phrases[line].slice(0,count);
  document.querySelector('#invite').innerHTML = count>=phrases[line].length ? 'Appuie pour continuer '+svg('<path d="m6 9 6 6 6-6"/>') : '';
  if(count>=phrases[line].length) clearInterval(timer);
  count++;
 }
 tick();
 if(!reduced.matches) timer = setInterval(tick,30);
}
function state(name) {
 clearInterval(timer);
 ['dialogue','starter','maman'].forEach(id => document.getElementById(id).hidden = id!==name);
 document.querySelectorAll('[data-etat]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.etat===name)));
 if(name==='dialogue') { line=0; type(); }
 if(name==='starter') { page(visible); document.querySelector('#titre-starter').focus(); }
}
document.querySelectorAll('[data-etat]').forEach(el => el.onclick = () => state(el.dataset.etat));
document.querySelector('#suite').onclick = () => {
 if(count<=phrases[line].length) { clearInterval(timer); count=phrases[line].length+1; document.querySelector('#phrase').textContent=phrases[line]; document.querySelector('#invite').innerHTML='Appuie pour continuer '+svg('<path d="m6 9 6 6 6-6"/>'); }
 else if(line<2) { line++; type(); } else state('starter');
};
document.querySelector('#passer').onclick = () => state('starter');
document.querySelector('#confirmer').onclick = () => {
 document.querySelector('#choisi').textContent = starters[selected].name + ' est ton partenaire ! Choix simulé.';
 document.querySelector('#confirmer').disabled = true;
 document.querySelector('#aide').textContent = 'Choix confirmé. Touche une autre Poké Ball pour réessayer.';
};
document.querySelector('#reposer').onclick = () => {
 document.querySelector('#soin').textContent = 'Tes Pokémon sont en pleine forme !';
 document.querySelector('#reposer').disabled = true;
};
page(0); type();

