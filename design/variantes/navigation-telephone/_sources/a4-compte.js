function ecranAilleurs() {
  const p = partie(S.cible) || S.parties[0] || { nom: "Ta partie", lieu: "Kanto", sauve: "il y a peu" };
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="c-parties" aria-label="Retour">${PK.ic("retour")}</button><h1>Partie ouverte ailleurs</h1></div>
    <section class="fiche cadre"><span class="gros">${esc(p.nom)}</span>
      <p class="message info" role="status">${PK.ic("telephone")}<span>Cette partie est ouverte sur un autre appareil. Là-bas, elle en est à ${p.lieu}, sauvegardée ${p.sauve}.</span></p>
      <h2 class="sous-titre">Si tu la reprends ici</h2>
      <ul class="reprise-liste">
        <li>${PK.ic("valide")}<span>Tu repars <b>exactement là où la partie en était sur l'autre appareil</b> : même zone, même étape, mêmes Pokémon.</span></li>
        <li>${PK.ic("telephone")}<span>La partie se ferme sur l'autre appareil, qui affiche « Partie reprise ailleurs ».</span></li>
        <li>${PK.ic("disque")}<span>Il n'y a toujours qu'une seule sauvegarde : rien n'est copié, rien n'est à choisir.</span></li>
      </ul>
      <button type="button" class="plaque action large" data-act="reprendre">Reprendre ici</button><button type="button" class="plaque large" data-go="c-parties">Pas maintenant</button></section>`;
}
/* Écran vu sur l'AUTRE appareil, quand quelqu'un reprend la partie ailleurs */
function ecranRepriseAilleurs() {
  const p = partie(S.cible) || S.parties[1] || { nom: "Partie test" };
  return `${marqueJeu}<section class="notif-autre cadre" role="alert">${PK.ic("telephone")}<span class="gros">Partie reprise ailleurs</span>
    <p>« ${esc(p.nom)} » vient d'être reprise sur un autre appareil. Elle est fermée ici.</p>
    <p class="doux">Ta progression est sauvegardée : l'autre appareil repart exactement là où tu en étais. Il n'y a toujours qu'une seule sauvegarde.</p>
    <button type="button" class="plaque action large" data-go="c-parties">Voir mes parties</button></section>`;
}
function ecranSupprimee() {
  const p = partie(S.cible) || S.parties[0] || { nom: "Ta partie" };
  const v = (titre, reg, sauve, temps) => `<section class="version cadre"><h2>${titre}</h2><dl><dt>Région</dt><dd>${reg}</dd><dt>Dernière sauvegarde</dt><dd>${sauve}</dd><dt>Temps de jeu</dt><dd>${temps}</dd></dl></section>`;
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="c-parties" aria-label="Retour">${PK.ic("retour")}</button><h1>Partie supprimée ailleurs</h1></div>
    <section class="fiche cadre"><span class="gros">${esc(p.nom)}</span><p class="message alerte">${PK.ic("alerte")}<span>Cette partie a été supprimée sur un autre appareil. Tu peux la garder ou l'abandonner.</span></p>
      ${v("Sur cet appareil", "Kanto · Céladopole", "samedi, 18 h 20", "6 h 48")}
      <button type="button" class="plaque action large" data-act="garder">La garder</button><button type="button" class="plaque danger large" data-act="abandonner">L'abandonner</button></section>`;
}
