// Maquette jetable : aucune lecture ni écriture de la progression du jeu.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const V = document.body.dataset.v;
const reduit = matchMedia('(prefers-reduced-motion: reduce)');
const duree = nom => {
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  return parseFloat(valeur) * (valeur.endsWith('ms') ? 1 : 1000);
};
const temps = { note: duree('--duree-signal'), pause: duree('--duration-lent'), pas: duree('--duration-normal') };
const noms = { a: 'Écho', b: 'Notes qui tombent', c: 'Souffle' };
const formes = ['●', '■', '▲', '◆'];
const instructions = {
  a: 'Ronflex ronfle une phrase : observe les trous, puis rejoue-la avec les touches 1 à 4. Deux manches, de 3 puis 4 notes.',
  b: 'Joue le trou avec les touches 1 à 4 quand sa note atteint la ligne. Six notes justes sur huit suffisent. Sans chrono, la note attend sur la ligne.',
  c: 'Maintiens le bouton, Espace ou A pour souffler ; relâche pour laisser redescendre la jauge. Garde le trait dans la zone verte pendant 3 secondes cumulées. La zone bouge : suis-la.'
};
const avant = 'Un Ronflex endormi bloque la route de Parmanie. Une Pokéflûte pourrait le réveiller.';
const reveil = 'La mélodie de la Pokéflûte réveille Ronflex ! Il se lève et se prépare au combat.';
const victoire = 'Ronflex s’écarte. La route de Parmanie est libre !';
$('#racine').innerHTML = `<main>
  <details class="outils panneau cadre"><summary>Maquette · ${noms[V]} · Aller à une étape</summary><div class="rangee">${[['avant', 'Dialogue d’avant'], ['jeu', 'Mini-jeu'], ['reveil', 'Réveil'], ['combat', 'Combat'], ['victoire', 'Victoire'], ['arrivee', 'Zone suivante'], ['carte', 'Carte'], ['sac', 'Sac']].map(([e, n]) => `<button data-etape="${e}">${n}</button>`).join('')}<a class="bouton" href="index.html">Variantes</a></div></details>
  <header><p class="doux">Kanto · Un passage à libérer</p><h1 data-titre>Route de Ronflex</h1><p data-sous-titre>Entre la Centrale et l'Arène de Parmanie</p></header>
  <section data-route><div class="scene cadre" aria-label="Ronflex au centre de la route"><img class="decor" src="img/centrale.webp" alt=""><span class="badge">Ronflex · Niv. 45 · <span data-humeur>Endormi</span></span><img class="sprite" src="img/143.png" alt="Ronflex endormi"><span class="sommeil" aria-hidden="true">Zzz</span></div>
    <section class="panneau cadre" data-jeu aria-label="Mini-jeu de Pokéflûte"><p class="doux">Pokéflûte · ${noms[V]}</p><h2>Une mélodie pour Ronflex</h2><p>${instructions[V]}</p>
      ${V === 'a' ? '<p class="partition" data-phrase aria-label="Phrase de Ronflex">Manche 1 · 3 notes</p><div class="rangee"><button data-debut>Commencer</button><button data-ecouter>Réécouter</button></div>' : ''}
      ${V === 'b' ? '<label class="option"><input type="checkbox" data-sans-chrono> Sans chrono</label><div class="piste" aria-label="Partition à quatre colonnes"><div class="colonnes"><span>1 ●</span><span>2 ■</span><span>3 ▲</span><span>4 ◆</span></div><div class="ligne"></div><span class="chute" hidden></span></div><button data-debut>Commencer</button>' : ''}
      ${V === 'c' ? '<div class="jauge" role="meter" aria-label="Niveau de souffle" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="cible" aria-hidden="true"></span><span class="curseur"></span></div><progress max="3" value="0" aria-label="Secondes dans la zone cible"></progress>' : ''}
      ${V !== 'c' ? `<div class="trous" aria-label="Les quatre trous de la Pokéflûte">${[1, 2, 3, 4].map(n => `<button class="trou" data-note="${n}" aria-label="Trou ${n}, ${['rond', 'carré', 'triangle', 'losange'][n - 1]}"><span class="forme" aria-hidden="true"></span>${n}</button>`).join('')}</div>` : ''}
      ${V === 'c' ? '<button class="souffler" data-souffler>Maintenir pour souffler · Espace ou A</button>' : ''}
      <p role="status" data-info>À toi de jouer. Prends ton temps.</p>
    </section>
    <section class="panneau cadre" data-combat hidden><h2>Combat contre Ronflex, niv. 45</h2><p>Le combat est déjà dans le jeu.</p><button data-etape="victoire">Ronflex est battu</button></section>
    <section class="panneau cadre" data-sac hidden><h2>Sac · Pokéflûte</h2><p>À utiliser devant Ronflex.</p></section>
  </section>
  <section data-arrivee hidden><p class="panneau cadre">Zone suivante</p><div class="scene arrivee cadre"><img class="decor" src="img/arene-de-parmanie.webp" alt="Arène de Parmanie"></div><a class="bouton" href="#carte">Voir la Carte</a></section>
  <section data-carte class="panneau cadre" hidden><h2>Zones de la Carte</h2><p class="panneau cadre">Centrale · Accessible</p><div class="panneau cadre terminee" aria-disabled="true"><h3>Route de Ronflex</h3><p>Terminée, plus accessible</p></div><p class="panneau cadre">Arène de Parmanie · Zone actuelle</p><a class="bouton" href="#arrivee">Retour à l’Arène de Parmanie</a></section>
</main>`;
let etat, generation = 0, manche = 0, index = 0, lecture = false, actif = false, note = 0, justes = 0, debutNote = 0;
let souffle = false, niveau = 0, cumul = 0, dernier = 0, origine = 0;
const phrases = [[1, 3, 2], [2, 4, 1, 3]];
const partition = [1, 3, 2, 4, 2, 1, 4, 3];
const info = t => { $('[data-info]').textContent = t; };
const allumer = n => $$('.trou').forEach(b => { b.classList.toggle('actif', Number(b.dataset.note) === n); b.setAttribute('aria-pressed', String(Number(b.dataset.note) === n)); });
const attente = ms => new Promise(resolve => setTimeout(resolve, ms));
function dialogue(texte, suite) {
  const d = document.createElement('dialog'); d.className = 'cadre'; d.setAttribute('aria-label', 'Dialogue de scène');
  d.innerHTML = '<p class="doux">Narration</p><p data-dialogue></p><button>Continuer</button>';
  d.querySelector('[data-dialogue]').textContent = texte;
  d.addEventListener('cancel', e => e.preventDefault());
  d.querySelector('button').onclick = () => { d.close(); d.remove(); suite(); };
  document.body.append(d); d.showModal();
}
function afficher(e) {
  generation++; actif = false; souffle = false; lecture = false; etat = e;
  $$('dialog').forEach(d => d.remove()); document.body.dataset.etat = e;
  const ailleurs = ['arrivee', 'carte'].includes(e);
  $('[data-route]').hidden = ailleurs; $('[data-arrivee]').hidden = e !== 'arrivee'; $('[data-carte]').hidden = e !== 'carte';
  $('[data-titre]').textContent = e === 'arrivee' ? 'Arène de Parmanie' : e === 'carte' ? 'Carte' : 'Route de Ronflex';
  $('[data-sous-titre]').hidden = ailleurs;
  $('[data-jeu]').hidden = e !== 'jeu'; $('[data-combat]').hidden = e !== 'combat'; $('[data-sac]').hidden = e !== 'sac';
  const eveille = ['reveil', 'combat', 'victoire'].includes(e);
  $('[data-humeur]').textContent = eveille ? 'Réveillé' : 'Endormi'; $('.sprite').alt = eveille ? 'Ronflex réveillé' : 'Ronflex endormi'; $('.sommeil').textContent = eveille ? '!' : 'Zzz';
  allumer(0);
  if (e === 'avant') dialogue(avant, () => afficher('jeu'));
  if (e === 'reveil') dialogue(reveil, () => afficher('combat'));
  if (e === 'victoire') dialogue(victoire, () => afficher('arrivee'));
  if (e === 'jeu') {
    manche = 0; index = 0; note = 0; justes = 0; niveau = 0; cumul = 0;
    info('À toi de jouer. Prends ton temps.');
    if (V === 'a') { $('[data-phrase]').textContent = 'Manche 1 · 3 notes'; $('[data-debut]').disabled = false; }
    if (V === 'b') { $('.chute').hidden = true; $('[data-debut]').disabled = false; }
    if (V === 'c') { $('.jauge').style.setProperty('--niveau', 0); $('.jauge').style.setProperty('--cible', .5); $('progress').value = 0; $('.jauge').setAttribute('aria-valuenow', '0'); $('[data-souffler]').setAttribute('aria-pressed', 'false'); }
    ($('[data-debut]') || $('[data-souffler]'))?.focus();
  } else if (ailleurs) { $('[data-titre]').tabIndex = -1; $('[data-titre]').focus(); }
  else if (e === 'combat') $('[data-combat] button').focus();
}
async function ecouter() {
  if (etat !== 'jeu' || V !== 'a') return;
  const g = ++generation; lecture = true; index = 0; $('[data-debut]').disabled = true;
  info(`Manche ${manche + 1} · Ronflex ronfle…`);
  for (const n of phrases[manche]) {
    if (g !== generation) return;
    allumer(n); $('[data-phrase]').textContent = `Manche ${manche + 1} · Trou ${n} ${formes[n - 1]}`;
    await attente(temps.note * 1.5); if (g !== generation) return;
    allumer(0); await attente(temps.pause); if (g !== generation) return;
  }
  lecture = false; $('[data-phrase]').textContent = `À toi · ${phrases[manche].length} notes`;
  info('Rejoue la phrase. Réécouter reste disponible.');
}
const sansChrono = () => reduit.matches || $('[data-sans-chrono]')?.checked;
function prochaineNote() {
  debutNote = performance.now(); $('.chute').hidden = false;
  $('.chute').textContent = `${partition[note]} ${formes[partition[note] - 1]}`;
  $('.chute').style.setProperty('--colonne', partition[note] - 1);
  $('.chute').style.setProperty('--position', sansChrono() ? 1 : 0);
  info(`Note ${note + 1} sur 8 · ${justes} justes${sansChrono() ? ` · Joue le trou ${partition[note]}` : ''}`);
}
function resoudreNote(ok) {
  if (ok) justes++;
  if (++note === partition.length) {
    actif = false; $('.chute').hidden = true;
    if (justes >= 6) afficher('reveil');
    else { info('On recommence · Six notes justes suffisent.'); note = 0; justes = 0; $('[data-debut]').disabled = false; }
  } else prochaineNote();
}
function jouer(n) {
  if (etat !== 'jeu') return;
  if (V === 'a') {
    if (lecture || !$('[data-debut]').disabled) return;
    if (n !== phrases[manche][index]) { info('On recommence la manche, sans pénalité. Réécoute la phrase.'); index = 0; allumer(0); return; }
    allumer(n); index++; info(`${index} sur ${phrases[manche].length} notes justes`);
    if (index === phrases[manche].length) { if (manche === 1) afficher('reveil'); else { manche++; ecouter(); } }
  } else if (V === 'b' && actif) {
    const p = (performance.now() - debutNote) / (temps.note * 1.5);
    resoudreNote(n === partition[note] && (sansChrono() || (p >= .65 && p <= 1.4)));
  } else if (V === 'c') allumer(n);
}
function demarrer() {
  if (V === 'a') return ecouter();
  if (actif) return;
  actif = true; note = 0; justes = 0; $('[data-debut]').disabled = true; prochaineNote();
}
function souffler(on) {
  if (etat !== 'jeu' || V !== 'c') return;
  souffle = on; $('[data-souffler]').setAttribute('aria-pressed', String(on));
  if (on && !actif) { actif = true; origine = performance.now(); dernier = origine; }
}
function tick(t) {
  if (etat === 'jeu' && actif) {
    if (V === 'b' && !sansChrono()) {
      const p = (t - debutNote) / (temps.note * 1.5);
      $('.chute').style.setProperty('--position', Math.min(p, 1.4));
      if (p > 1.4) resoudreNote(false);
    }
    if (V === 'c' && (!reduit.matches || t - dernier >= temps.pas)) {
      const dt = Math.min(t - dernier, temps.pas * 2); dernier = t;
      niveau = Math.max(0, Math.min(1, niveau + (souffle ? 1 : -1) * dt / (temps.note * 9)));
      const cible = reduit.matches ? .5 : .5 + Math.sin((t - origine) / (temps.note * 5 / 6)) * .08;
      if (niveau >= cible && niveau <= cible + .05) cumul += dt;
      $('.jauge').style.setProperty('--niveau', niveau); $('.jauge').style.setProperty('--cible', cible);
      $('.jauge').setAttribute('aria-valuenow', Math.round(niveau * 100));
      $('progress').value = cumul / temps.note;
      info(`${(cumul / temps.note).toFixed(1).replace('.', ',')} / 3 secondes dans la zone · ${Math.round(niveau * 100)} % de souffle`);
      if (cumul >= temps.note * 3) afficher('reveil');
    }
  }
  requestAnimationFrame(tick);
}
document.addEventListener('click', e => {
  const cible = e.target.closest('button'); if (!cible) return;
  if (cible.dataset.etape) afficher(cible.dataset.etape);
  if (cible.dataset.note) jouer(Number(cible.dataset.note));
  if (cible.hasAttribute('data-debut')) demarrer();
  if (cible.hasAttribute('data-ecouter')) ecouter();
});
document.addEventListener('keydown', e => {
  if (etat !== 'jeu' || $('dialog') || e.target.closest('input, summary, [data-etape]')) return;
  if (V !== 'c' && /^[1-4]$/.test(e.key) && !e.repeat) { e.preventDefault(); jouer(Number(e.key)); }
  if (V === 'c' && [' ', 'a', 'A'].includes(e.key)) { e.preventDefault(); souffler(true); }
});
document.addEventListener('keyup', e => { if ([' ', 'a', 'A'].includes(e.key)) souffler(false); });
if (V === 'b') {
  $('[data-sans-chrono]').checked = reduit.matches;
  $('[data-sans-chrono]').onchange = () => { if (actif) prochaineNote(); };
}
if (V === 'c') {
  const b = $('[data-souffler]');
  b.onpointerdown = e => { b.setPointerCapture(e.pointerId); souffler(true); };
  b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => souffler(false);
}
window.addEventListener('blur', () => souffler(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) souffler(false); });
window.addEventListener('hashchange', ouvrirHash);
function ouvrirHash() {
  const h = location.hash.slice(1);
  afficher(['jeu', 'reveil', 'combat', 'victoire', 'arrivee', 'carte', 'sac'].includes(h) ? h : 'avant');
}
ouvrirHash(); requestAnimationFrame(tick);
