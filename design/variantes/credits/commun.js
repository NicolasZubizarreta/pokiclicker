const exemple = {
  titre: 'POKÉ-CLICKER : KANTO ORIGINS',
  message: 'FÉLICITATIONS ! Vous avez vaincu la Ligue, complété le Pokédex et surpassé le Professeur Chen.',
  suite: 'Vous êtes considéré comme le dresseur de légende de KANTO',
  sections: [
    ['CRÉATION & RÉALISATION ;', 'Concept Original Nicolas Zubizarreta', 'Game Design & Équilibrage Nicolas Zubizarreta', 'Programmation Lead Nicolas Zubizarreta', 'Scénario & Dialogues Nicolas Zubizarreta', 'Interface & UI Nicolas Zubizarreta'],
    ['ASSISTANT TECHNIQUE :', 'Gemini Code Assistant', 'Support Syntaxique : VS Code'],
    ["ÉQUIPE D'ASSURANCE QUALITÉ (QA)", 'Daran Jacquet, Bjorn Silvester, Maé François'],
    ['GUEST STAR & REMERCIEMENTS SPÉCIAUX', 'DARAN Pour le don de sa personne. A inspiré et débloqué le skin Pokémon Exclusif "Daran".'],
    ["BASÉ SUR L'UNIVERS DE", 'POKÉMON © Nintendo / Creatures Inc. / GAME FREAK inc. Ceci est un fan-game gratuit réalisé par passion.'],
    ["MERCI D'AVOIR JOUÉ !", 'Votre sauvegarde a été mise à jour. Vous pouvez maintenant retourner explorer Kanto librement.', 'À SUIVRE... ?'],
  ],
  images: [1, 4, 7], duree: 110000,
};
const contenu = document.querySelector('#contenu');
const variante = document.body.dataset.variante;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let page = 0;
let minuterie;
let animation;
const section = ([titre, ...lignes]) => `<section class="section"><h2>${titre}</h2>${lignes.map(l => `<p>${l}</p>`).join('')}</section>`;
function terminer() {
  clearTimeout(minuterie);
  animation?.cancel();
  contenu.innerHTML = '<section class="cadre page-credits"><h1 tabindex="-1">Retour à Kanto</h1><p>Ta sauvegarde est à jour. Tu peux continuer ton aventure.</p><div class="commandes"><button class="action" id="revoir">Revoir les crédits</button><a href="../diplome/a-fenetre.html">Voir le diplôme</a></div></section>';
  contenu.querySelector('h1').focus();
  document.querySelector('#revoir').onclick = () => { page = 0; afficher(); };
}
function afficher() {
  clearTimeout(minuterie);
  animation?.cancel();
  const reduit = variante === 'c' || preference.matches;
  if (reduit) {
    const total = exemple.sections.length + 1;
    contenu.innerHTML = `<section class="cadre page-credits"><p class="doux">Mouvement réduit</p><h1>Crédits de Kanto</h1><p>Page ${page + 1} / ${total}</p><progress value="${page + 1}" max="${total}" aria-label="Progression des crédits"></progress><div tabindex="-1" id="page">${page === 0 ? section([exemple.titre, exemple.message, exemple.suite]) : section(exemple.sections[page - 1])}</div><div class="fin-commandes"><button id="precedent" ${page === 0 ? 'disabled' : ''}>Précédent</button><button class="action" id="suivant">${page === total - 1 ? 'Terminer' : 'Suivant'}</button><button id="passer">Passer</button></div></section>`;
    const suivant = () => { if (page === total - 1) terminer(); else { page++; afficher(); document.querySelector('#page').focus(); } };
    document.querySelector('#suivant').onclick = suivant;
    document.querySelector('#precedent').onclick = () => { page--; afficher(); document.querySelector('#page').focus(); };
    minuterie = setTimeout(suivant, exemple.duree / total);
  } else {
    contenu.innerHTML = `<section class="generique">${variante === 'b' ? '<img class="decor" src="../../../legacy/img/kanto/background/LaboPokemon.png" width="1920" height="1080" alt="">' : ''}<div class="introduction"><h1>${exemple.titre}</h1><p>${exemple.message}</p><p>${exemple.suite}</p>${variante === 'b' ? '<img class="chen" src="../../specimens/assets/v1/SpriteChen1.png" width="120" height="120" alt="Professeur Chen">' : `<div class="flottants" aria-hidden="true">${exemple.images.map(id => `<img src="../../specimens/assets/pokemon/${id}.png" width="96" height="96" alt="">`).join('')}</div>`}</div><div class="lecture">${exemple.sections.map(section).join('')}</div><div class="fin-commandes"><button id="pause" aria-pressed="false">Pause</button><button class="action" id="passer">Passer</button><button id="pages">Lire par pages</button></div></section>`;
    const lecture = document.querySelector('.lecture');
    const ruban = document.createElement('div');
    ruban.append(...lecture.children);
    lecture.append(ruban);
    animation = ruban.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${Math.max(0, ruban.scrollHeight - lecture.clientHeight)}px)` }], { duration: exemple.duree, fill: 'forwards' });
    animation.onfinish = terminer;
    let pause = false;
    document.querySelector('#pause').onclick = e => { pause = !pause; animation[pause ? 'pause' : 'play'](); e.target.textContent = pause ? 'Reprendre' : 'Pause'; e.target.setAttribute('aria-pressed', String(pause)); document.querySelectorAll('.flottants img').forEach(i => { i.style.animationPlayState = pause ? 'paused' : 'running'; }); };
    document.querySelector('#pages').onclick = () => { document.body.dataset.variante = 'c'; location.href = 'c-pages.html'; };
  }
  document.querySelector('#passer').onclick = terminer;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') terminer(); });
preference.addEventListener('change', afficher);
afficher();
