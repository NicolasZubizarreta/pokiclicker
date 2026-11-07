/* Maquettes PC : zone compte (hors partie), écran titre et introduction. */
const champ = (id, titre, type, val = "", aide = "", err = "", extra = "") => `<label class="champ ${err ? "en-erreur" : ""}" for="${id}"><span>${titre}</span>
  <span class="zone-saisie"><input id="${id}" type="${type}" value="${esc(val)}" autocomplete="${type === "password" ? "current-password" : "email"}" ${err ? `aria-invalid="true" aria-describedby="${id}-m"` : ""}>${extra}</span>
  ${aide ? `<span class="aide">${aide}</span>` : ""}${err ? `<p class="message erreur" id="${id}-m" role="alert">${ic("alerte")}<span>${err}</span></p>` : ""}</label>`;
const oeil = `<button type="button" class="plaque carre" data-act="oeil" aria-label="Afficher le mot de passe" aria-pressed="false">${ic("oeil")}</button>`;
const formNom = (val = "") => `<label class="champ" for="f-nom"><span>Nom de la partie</span><span class="zone-saisie"><input id="f-nom" type="text" value="${esc(val)}" maxlength="30" autocomplete="off" data-autofocus></span></label>`;
function auth(titre, corps, liens) {
  return `<div class="auth"><div class="visuel"><div class="cadre"><b>PokiClicker</b><span>Ton aventure Pokémon, sur tous tes appareils.</span><span class="doux">Kanto, 151 espèces, une partie qui te suit du PC au téléphone.</span></div></div>
    <div class="formulaire"><h1>${titre}</h1>${corps}<div class="liens">${liens}</div></div></div>`;
}
const lien = (go, t) => `<button type="button" class="lien" data-go="${go}">${t}</button>`;
function ecranConnexion() {
  const err = S.cx === "erreur" ? "E-mail ou mot de passe incorrect." : "";
  const msg = S.cx === "session" ? `<p class="message alerte" role="status">${ic("alerte")}<span>Ta session a expiré. Reconnecte-toi pour retrouver tes parties.</span></p>` : "";
  return auth("Connexion", `${msg}<form data-form="connexion" novalidate style="display:grid;gap:var(--ecart)">${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}${champ("f-mdp", "Mot de passe", "password", err ? "motdepasse" : "", "", err, oeil)}
    <button type="submit" class="plaque action large">Se connecter</button></form>${maq("hors-reseau", "se connecter sans réseau")}`, lien("c-oubli", "Mot de passe oublié") + lien("c-inscription", "Créer un compte"));
}
function ecranInscription() {
  const err = S.ins ? "Le mot de passe doit faire au moins 10 caractères." : "";
  return auth("Créer un compte", `<form data-form="inscription" novalidate style="display:grid;gap:var(--ecart)">${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}${champ("f-mdp", "Mot de passe", "password", S.ins ? "court" : "", "Au moins 10 caractères.", err, oeil)}
    <button type="submit" class="plaque action large">Créer mon compte</button></form>`, lien("c-connexion", "Retour à la connexion"));
}
const ecranOubli = () => auth("Mot de passe oublié", `<p>Écris ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe.</p><form data-form="oubli" novalidate style="display:grid;gap:var(--ecart)">${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}<button type="submit" class="plaque action large">Envoyer le lien</button></form>`, lien("c-connexion", "Retour à la connexion"));
const ecranOubliEnvoye = () => auth("Lien envoyé", `<p class="message succes" role="status">${ic("valide")}<span>Si un compte existe pour leo@exemple.fr, un lien vient d'être envoyé. Regarde aussi dans tes courriers indésirables.</span></p>${maq("go-nouveau", "ouvrir le lien reçu", 'data-go="c-nouveau"')}`, lien("c-connexion", "Retour à la connexion"));
const ecranNouveau = () => auth("Nouveau mot de passe", `<form data-form="nouveau" novalidate style="display:grid;gap:var(--ecart)">${champ("f-mdp", "Nouveau mot de passe", "password", "", "Au moins 10 caractères.", "", oeil)}<button type="submit" class="plaque action large">Enregistrer le mot de passe</button></form>`, lien(S.depuisCompte ? "c-compte" : "c-connexion", S.depuisCompte ? "Annuler" : "Retour à la connexion"));

function carteP(p) {
  const [tag, cls] = TAGS[S.hors ? "local" : p.etat];
  return `<article class="carte-partie cadre" aria-label="${esc(p.nom)}">
    <button type="button" class="ouvrir" data-act="ouvrir" data-id="${p.id}"><span class="nom"><span>${esc(p.nom)}</span> <span class="tag ${cls}">${tag}</span></span>
      <dl><dt>Région</dt><dd>${p.lieu}</dd><dt>Temps de jeu</dt><dd>${p.temps}</dd><dt>Dernière sauvegarde</dt><dd>${p.sauve}</dd></dl></button>
    <div class="actions"><button type="button" class="plaque petite" data-act="renommer" data-id="${p.id}" aria-label="Renommer ${esc(p.nom)}">${ic("crayon")}Renommer</button>
      <button type="button" class="plaque petite" data-act="restaurer" data-id="${p.id}" aria-label="Restaurer une sauvegarde précédente de ${esc(p.nom)}">${ic("disque")}Restaurer</button>
      <button type="button" class="plaque petite danger" data-act="supprimer" data-id="${p.id}" aria-label="Supprimer ${esc(p.nom)}">${ic("corbeille")}Supprimer</button></div></article>`;
}
function ecranParties() {
  const hors = S.hors ? `<p class="message alerte" role="status">${ic("alerte")}<span>Hors connexion : tu vois seulement les parties de cet appareil.</span></p>` : "";
  if (!S.parties.length) return `<div class="titre-page"><h1>Mes parties</h1></div>${hors}<form class="cadre fiche" data-form="creer" novalidate style="max-width:34rem"><h2>Crée ta première partie</h2><p>Une partie garde ta progression. Tu pourras en créer d'autres plus tard.</p>${formNom("Partie de Léo")}<button type="submit" class="plaque action large">Créer la partie</button></form>`;
  return `<div class="titre-page"><h1>Mes parties</h1><span class="doux">Clique une partie pour arriver sur le monde.</span></div>${hors}
    <div class="parties-grille">${S.parties.map(carteP).join("")}<button type="button" class="carte-partie nouvelle plaque" data-go="c-nouvelle" style="flex-direction:column;min-height:14rem">${ic("ajout", "gros")}Nouvelle partie</button></div>`;
}
const ecranNouvelle = () => `<div class="titre-page">${retour("c-parties", "Retour aux parties")}<h1>Nouvelle partie</h1></div>
  <form class="cadre fiche" data-form="creer" novalidate style="max-width:34rem">${formNom("")}<p class="doux">Tu commences à Bourg Palette, dans la région de Kanto.</p><button type="submit" class="plaque action large">Créer la partie</button></form>`;
function ecranCompte() {
  const sk = S.skin ? `<div class="succes obtenu"><span class="corps"><span class="t">Casquette rouge</span><span class="s">Skin d'exemple · équipé</span></span></div>` : `<p class="doux">Aucun skin débloqué pour l'instant.</p>`;
  const tri = [...SUCCES].sort((a, b) => Number(b[3]) - Number(a[3]));
  return `<div class="titre-page"><h1>Mon compte</h1><button type="button" class="plaque" data-act="deco">${ic("sortie")}Se déconnecter</button></div>
    <div class="compte-2"><div style="display:grid;gap:calc(var(--u)*4)"><section class="fiche cadre"><span class="doux">Connecté</span><b>leo@exemple.fr</b>
        <p class="synchro-barre"><span class="sync ${S.sync === "hors" ? "hors" : S.sync === "cours" ? "cours" : ""}"></span><span>${SYNCS[S.sync][0]}</span></p><button type="button" class="plaque" data-act="mdp">Changer mon mot de passe</button></section>
      <section class="fiche cadre" aria-label="Diamants"><span class="doux">Diamants</span><span class="gros-d">${ic("diamant", "gros")} 5</span><span class="doux">Gagnés avec les succès. Ils restent sur ton compte, quelle que soit la partie.</span></section></div>
      <div style="display:grid;gap:calc(var(--u)*3);align-content:start"><h2 class="sous-titre">Succès</h2><div class="liste">${tri.map(([t, d, n, ok]) => `<div class="succes ${ok ? "obtenu" : ""}">${ic("badge")}<span class="corps"><span class="t">${t}</span><span class="s">${d} · +${n} diamants</span></span><span class="tag ${ok ? "" : "neutre"}">${ok ? "Obtenu" : "À obtenir"}</span></div>`).join("")}</div>
      <h2 class="sous-titre">Skins</h2>${sk}</div></div>
    <div class="lot-maquette">${maq("skin", S.skin ? "retirer le skin d'exemple" : "montrer un skin débloqué")}${maq("cycle-sync", "changer l'état de synchronisation")}</div>`;
}
const ONG_COMPTE = [["c-parties", "Parties", "parties"], ["c-compte", "Compte", "compte"], ["c-reglages", "Réglages", "reglages"]];

/* ---------- écran titre et introduction ---------- */
function ecranTitre() {
  return `<div class="titre-ecran"><div class="cadre logo"><b>PokiClicker</b><span>Kanto, ton aventure</span></div>
    <div style="display:flex;gap:var(--ecart);flex-wrap:wrap;justify-content:center"><button type="button" class="plaque action" data-go="intro-maman" data-autofocus style="min-width:12rem">JOUER ${kb("Entrée")}</button><button type="button" class="plaque" data-go="c-connexion">${ic("compte")}Mon compte</button></div></div>`;
}
const decorIntro = (img, corps, cls = "") => `<div class="scene-intro ${cls}" style="background-image:url(${DEC}${img})">${corps}</div>`;
const dlg = (nom, txt, bouton, go) => `<div class="cadre dialogue"><img src="img/chen/SpriteChen1.png" width="120" height="120" alt=""><div><p class="titre">${nom}</p><p>${txt}</p></div><button type="button" class="plaque action" data-go="${go}" data-autofocus>${bouton} <span class="fleche">${ic("chevron")}</span></button></div>`;
function ecranIntro() {
  const p = S.page, suite = (go, t) => `<button type="button" class="maquette" data-go="${go}">Maquette : ${t}</button>`;
  const e = { "intro-maman": ["intro-maman", "Chez Maman", suite("intro-bourg", "sortir vers Bourg Palette")], "intro-bourg": ["intro-bourg", "Bourg Palette avec image mapping", suite("intro-labo", "cliquer le labo du Prof. Chen")], "intro-blue": ["intro-maman", "Chez Blue", suite("intro-bourg", "sortir")],
    "intro-labo": ["intro-labo", "Labo du Prof. Chen, dialogue", suite("intro-starter", "dialogue suivant")], "intro-starter": ["intro-starter", "Choix du starter", suite("lieu-bourg", "choisir un starter (retour au bourg)")] }[p] || ["intro-maman", "", ""];
  return `<div class="inchange plein">${NOTE_INCHANGE}<img src="img/jeu-actuel/${e[0]}.png" alt="${e[1]}"><div class="lot-maquette">${e[2]}</div></div>`;
}
