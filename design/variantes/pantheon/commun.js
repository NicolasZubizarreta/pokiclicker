// Valeurs V1 de data/pantheon.json, recopiées pour cette démo autonome.
const donnees = {
  socles: [{x:.123046875,y:.63671875},{x:.26171875,y:.576171875},{x:.412109375,y:.55078125},{x:.587890625,y:.55078125},{x:.73828125,y:.576171875},{x:.8837890625,y:.634765625}],
  geometrie: { tailleSprite:.15625, decalageBase:.01953125, decalageNiveau:.0341796875, departChute:-.29296875 },
  delais: { fonduNoirMs:1000, fonduRetourMs:1000, entreeChenMs:1600, sortieChenMs:1000, apresChenMs:1000, entrePokemonMs:2000, niveauMs:1000, finalApresEquipeMs:500, defiChenMs:800, annonceJohtoMs:500 },
  effets: { confettiPeriodeMs:50, confettiVieMs:4000, confettiDureeMinMs:2000, confettiDureeMaxMs:4000, feuPeriodeMs:800, feuVieMs:1000 },
  dialogues: ['Splendide ! Simplement splendide !', 'Tu as vaincu le Conseil des 4 et le Maître actuel. Tu es le nouveau Maître de la Ligue de Kanto !', "Mais tu n'as pas gagné seul. Viens avec moi, allons enregistrer tes partenaires au Panthéon."],
  equipe: [{numero:1,nom:'Bulbizarre',niveau:62},{numero:4,nom:'Salamèche',niveau:61},{numero:25,nom:'Pikachu',niveau:64,shiny:true},{numero:7,nom:'Carapuce',niveau:60},{numero:16,nom:'Roucool',niveau:59},{numero:95,nom:'Onix',niveau:63}],
  textes: { titre:'Maître de la Ligue de Kanto', sortir:'Sortir', galerie:'Galerie', navigation:'Variantes du Panthéon', outils:'États de démonstration', pantheon:'Panthéon', honneur:'Hall d’honneur', registre:'Les partenaires de cette victoire', chen:'Professeur Chen', suite:'Continuer', rejouer:'Rejouer', reduit:'Mouvement réduit', niveau:'Niv.', etoile:'★', shiny:'Chromatique', chute:'Enregistrement des partenaires…', final:'Tes partenaires entrent dans la légende.', sortie:'Retour à Bourg Palette — fin de la démonstration.', etats:{dialogue:'Dialogue',chute:'Chute',final:'Final'}, variantes:{'a-fidele':'A · Cérémonie fidèle','b-honneur':'B · Hall d’honneur','c-chen':'C · Plein cadre'} }
};
const {textes:t,delais:d,effets:e,geometrie:g,equipe} = donnees;
const variante = document.body.dataset.variante;
const sprite = p => `/img/sprites/pokemon/${p.numero}.png`;
const identite = p => `${p.nom}${p.shiny ? ` <span class="etoile" aria-label="${t.shiny}">${t.etoile}</span>` : ''}`;
document.querySelector('main').innerHTML = `
<header class="commandes"><nav class="variantes" aria-label="${t.navigation}"><a href="../index.html">${t.galerie}</a>${Object.entries(t.variantes).map(([page,nom]) => `<a href="${page}.html" ${page[0] === variante ? 'aria-current="page"' : ''}>${nom}</a>`).join('')}</nav>
<div class="outils" role="group" aria-label="${t.outils}">${Object.entries(t.etats).map(([etat,nom]) => `<button data-etat="${etat}">${nom}</button>`).join('')}<button id="rejouer">${t.rejouer}</button><button id="reduit" aria-pressed="false">${t.reduit}</button></div></header>
<section class="ceremonie" aria-label="${t.pantheon}"><div class="scene"><div class="monde"><img class="decor" src="/img/scenes/pantheon.webp" alt=""><div class="spot" aria-hidden="true"></div>
${equipe.map((p,i) => { const s = donnees.socles[i]; return `<div class="place" style="left:${s.x*100}%;top:${(s.y-g.tailleSprite+g.decalageBase)*100}%;width:${g.tailleSprite*100}%;--depart:${(g.departChute-s.y+g.tailleSprite-g.decalageBase)/g.tailleSprite*100}%;--niveau:${(g.tailleSprite-g.decalageBase+g.decalageNiveau)/g.tailleSprite*100}%"><img class="pokemon${p.shiny ? ' halo-shiny' : ''}" src="${sprite(p)}" alt="${p.nom}"><div class="identite"><strong>${identite(p)}</strong><span>${t.niveau} ${p.niveau}</span></div></div>`; }).join('')}</div>
<h1 hidden>${t.titre}</h1><button id="sortir" hidden>${t.sortir}</button></div>
<aside class="honneur" aria-label="${t.honneur}"><h2>${t.honneur}</h2><p>${t.registre}</p><ol>${equipe.map(p => `<li><img src="${sprite(p)}" alt=""><strong>${identite(p)}</strong><span>${t.niveau} ${p.niveau}</span></li>`).join('')}</ol></aside>
<div class="dialogue"><img class="chen" src="/img/sprites/chen/chen-2.png" alt="${t.chen}"><div class="bulle"><strong>${t.chen}</strong><p id="parole" aria-hidden="true"></p><button id="suite">${t.suite}</button></div></div><div class="effets" aria-hidden="true"></div><div class="rideau" aria-hidden="true"></div></section><p id="statut" role="status" aria-live="polite" aria-atomic="true"></p>`;
const $ = s => document.querySelector(s);
document.title = t.variantes[Object.keys(t.variantes).find(p => p[0] === variante)];
if (variante === 'a') $('.scene').append($('.dialogue'));
const places = [...document.querySelectorAll('.place')];
const lignes = [...document.querySelectorAll('.honneur li')];
const media = matchMedia('(prefers-reduced-motion: reduce)');
let reduit = media.matches;
const timers = new Set();
let animations = [], texteTimer, suiteTimer, ligne = 0;
const attendre = (fn,ms) => { const id = setTimeout(() => { timers.delete(id); fn(); },ms); timers.add(id); return id; };
const animer = (el,images,options) => { const a = el.animate(images,options); animations.push(a); return a; };
function nettoyer() {
  timers.forEach(clearTimeout); timers.clear();
  animations.forEach(a => a.cancel()); animations = [];
  $('.effets').replaceChildren();
}
function annonce(texte) { $('#statut').textContent = texte; }
function poser(i,instant = false) {
  const place = places[i], s = donnees.socles[i];
  places.forEach(p => p.classList.remove('active'));
  place.classList.add('visible','active');
  $('.monde').style.transformOrigin = `${s.x*100}% ${s.y*100}%`;
  $('.spot').style.left = `${s.x*100}%`; $('.spot').style.top = `${s.y*100}%`;
  // Le carré cover reste aligné avec ses socles ; le panoramique garde l'actif visible sur mobile.
  if (variante === 'c') $('.monde').style.left = `clamp(calc(100vw - max(100vw, 100dvh)), calc(50vw - max(100vw, 100dvh) * ${s.x}), 0px)`;
  if (!instant && !reduit) {
    animer(place.querySelector('img'),[{transform:'translateY(var(--depart))'},{transform:'translateY(0)'}],{duration:d.niveauMs,easing:'cubic-bezier(.55,0,1,1)'});
    if (variante === 'c') animer($('.monde'),[{scale:1},{scale:1.08}],{duration:d.entrePokemonMs,fill:'forwards',easing:'ease-out'});
  }
  const niveau = () => { place.classList.add('nom-visible'); lignes[i].classList.add('visible'); annonce(`${equipe[i].nom}, ${t.niveau} ${equipe[i].niveau}${equipe[i].shiny ? `, ${t.shiny}` : ''}`); };
  if (instant || reduit) niveau(); else attendre(niveau,d.niveauMs);
}
function particules(type) {
  if (reduit || document.body.dataset.etat !== 'final') return;
  const p = document.createElement('i'); p.className = type; p.style.left = `${Math.random()*100}%`;
  p.style.setProperty('--teinte',`var(--color-${['secondaire','primaire','accent'][Math.floor(Math.random()*3)]}-400)`);
  if (type === 'feu') p.style.top = `${15+Math.random()*65}%`;
  const vie = type === 'feu' ? e.feuVieMs : e.confettiVieMs;
  p.style.animationDuration = `${type === 'feu' ? vie : e.confettiDureeMinMs+Math.random()*(e.confettiDureeMaxMs-e.confettiDureeMinMs)}ms`;
  $('.effets').append(p); attendre(() => p.remove(),vie);
  attendre(() => particules(type),type === 'feu' ? e.feuPeriodeMs : e.confettiPeriodeMs);
}
function selection(etat) {
  document.body.dataset.etat = etat;
  document.querySelectorAll('button[data-etat]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.etat === etat)));
}
function final() {
  selection('final'); $('h1').hidden = false; $('#sortir').hidden = false;
  annonce(t.final); particules('confetti'); particules('feu');
}
function chute() {
  selection('chute'); $('.dialogue').hidden = true; annonce(t.chute);
  equipe.forEach((_,i) => attendre(() => poser(i),i*d.entrePokemonMs));
  attendre(final,(equipe.length-1)*d.entrePokemonMs+d.niveauMs+d.finalApresEquipeMs);
}
function parler() {
  clearTimeout(texteTimer); clearTimeout(suiteTimer);
  const texte = donnees.dialogues[ligne]; annonce(texte); $('#parole').textContent = '';
  let n = 0;
  function taper() {
    $('#parole').textContent = texte.slice(0,++n);
    if (n < texte.length) texteTimer = attendre(taper,32);
    else suiteTimer = attendre(suivant,1800);
  }
  taper();
}
function suivant() {
  clearTimeout(texteTimer); clearTimeout(suiteTimer);
  if (++ligne < donnees.dialogues.length) parler();
  else {
    $('#suite').disabled = true;
    animer($('.dialogue'),[{transform:'translateX(0)',opacity:1},{transform:'translateX(-110vw)',opacity:0}],{duration:d.sortieChenMs,fill:'forwards'});
    attendre(chute,d.sortieChenMs+d.apresChenMs);
  }
}
function demarrer(etat = 'dialogue') {
  nettoyer(); selection(etat); ligne = 0;
  document.body.dataset.reduit = String(reduit); $('#reduit').setAttribute('aria-pressed',String(reduit));
  places.forEach(p => p.classList.remove('visible','active','nom-visible'));
  lignes.forEach(p => p.classList.remove('visible'));
  $('.monde').style.left = ''; $('.dialogue').hidden = true; $('h1').hidden = true; $('#sortir').hidden = true;
  $('#suite').disabled = true; $('#parole').textContent = ''; annonce('');
  if (reduit || etat === 'final') { equipe.forEach((_,i) => poser(i,true)); final(); }
  else if (etat === 'chute') chute();
  else {
    animer($('.rideau'),[{opacity:0},{opacity:1},{opacity:0}],{duration:d.fonduNoirMs+d.fonduRetourMs});
    attendre(() => {
      $('.dialogue').hidden = false;
      animer($('.dialogue'),[{transform:'translateX(-110vw)'},{transform:'translateX(0)'}],{duration:d.entreeChenMs});
      attendre(() => { $('#suite').disabled = false; parler(); },d.entreeChenMs);
    },d.fonduNoirMs);
  }
}
document.querySelectorAll('button[data-etat]').forEach(b => b.onclick = () => demarrer(b.dataset.etat));
$('#suite').onclick = suivant; $('#rejouer').onclick = () => demarrer();
$('#reduit').onclick = () => { reduit = !reduit; demarrer(); };
media.onchange = event => { reduit = event.matches; demarrer(); };
$('#sortir').onclick = () => { nettoyer(); selection('sortie'); $('h1').hidden = true; $('#sortir').hidden = true; annonce(t.sortie); $('#rejouer').focus(); };
demarrer();
