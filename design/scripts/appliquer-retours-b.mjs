// Applique au backlog de la phase 2 les choix de Nicolas sur les variantes (docs/projet/choix-variantes-b.md).
// Insère « Retours de Nicolas » avant les critères de chaque ticket concerné, ajoute des critères, crée le ticket Z.
import { readFileSync, writeFileSync } from 'node:fs';

const chemin = 'docs/projet/backlog-phase-2.md';
let texte = readFileSync(chemin, 'utf8');
const REF = 'Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).';

const retours = {
  D: {
    retour: `Ajout (24/10) : les **icônes officielles d'objets** que Nicolas veut retrouver (20 PNG de PokeAPI/sprites/items, voir \`v1-visuel-a-porter.md\` § 5), les **artworks des trois starters** (normal et shiny), l'image d'une Poké Ball et le **sprite animé de Roucarnage** du vol sont des ressources externes dans la V1 : on les rapatrie en local, avec le même accord à demander au moment du téléchargement. Rien ne se charge depuis Internet en V2.`,
    criteres: [
      "- [ ] Étant donné les icônes d'objets, les artworks des starters, la Poké Ball et l'oiseau du vol listés dans `v1-visuel-a-porter.md`, quand le pipeline d'images s'exécute, alors ils sont dans `public/img/` aux bons formats, avec leurs tailles dans `data/images.json`, et aucune URL externe ne subsiste dans le code.",
    ],
  },
  G: {
    retour: `**Choix de Nicolas (24/10).** Variante **A** (carte plein cadre) + la **barre « Ton voyage »** de la variante C. La fiche de la zone est **dans la carte** mais ne doit pas cacher le bas : fiche plus petite, ou carte plus grande avec un emplacement réservé. Au clic, afficher le **numéro de zone** (pour savoir quand on y accède). **Pas de tracé de chemin.** La carte actuelle est « pourrie » : on reprend **la carte de la V1** (\`legacy/img/kanto/kanto.png\`, 24 zones en image mapping SVG, coordonnées en pixels natifs d'une image 1920 × 1080 à convertir en pourcentages) avec ses **animations** : téléportation « vol Gen 1 » (3,8 s : dresseur animé, overlay en télé CRT, oiseau, changement de zone derrière l'overlay), clignotement vert du tutoriel, pulsation de la zone actuelle, et une **vraie animation de déblocage d'une zone** (la V1 n'en avait pas sur la carte). Détail : \`v1-visuel-a-porter.md\` § 1. ${REF}`,
    criteres: [
      "- [ ] Étant donné la carte de la V1, quand je la compare à la V2, alors les 24 zones sont aux mêmes endroits (coordonnées de `MAP_DATA` converties en pourcentages, test sur chaque zone) avec leur forme (rectangle, cercle, polygone), et les zones qui se chevauchent gardent l'ordre de la V1.",
      "- [ ] Étant donné un clic sur une zone, quand la fiche s'ouvre, alors elle affiche le nom, « Zone N », la miniature du décor et le bouton « Y aller » (ou « Bloquée » avec la raison), dans la carte, sans cacher le bas de la carte ; Céladopole propose Arène, Centre commercial et Casino.",
      "- [ ] Étant donné « Y aller », quand je valide, alors l'animation de vol de la V1 se joue (≈ 3,8 s, dresseur animé, overlay en télé CRT, oiseau), le changement de zone a lieu derrière l'overlay et un second clic pendant l'animation est ignoré ; avec `prefers-reduced-motion`, la zone change avec un simple fondu.",
      "- [ ] Étant donné une zone qui vient d'être débloquée, quand je rouvre la carte, alors une animation de déblocage (propre à la V2) la fait passer du gris à sa couleur, après le message « Zone débloquée ! » de la V1.",
      "- [ ] Étant donné la barre « Ton voyage », quand je regarde la carte, alors elle montre la progression (badges sur 8, zone actuelle) ; la Route 1 clignote en vert tant qu'elle n'a pas été visitée (tutoriel de la V1).",
    ],
  },
  H: {
    retour: `**Choix de Nicolas (24/10).** Page Équipe : variante **A** (liste + détail). Fiche Pokémon : variante **B** (fenêtre superposée, pas une page) ; à corriger par rapport à la maquette : le défilement doit marcher quand le curseur est sur la fiche, l'étoile « Retire des favoris » doit être alignée avec son texte, la fiche affiche le **nom de l'espèce** en plus du surnom. Reprendre de la V1 : anneau de bonheur (\`conic-gradient\`), détail des bonus de dégâts, menu contextuel au clic droit (Résumé, Retirer l'objet). ${REF}`,
    criteres: [
      "- [ ] Étant donné la fiche d'un Pokémon surnommé, quand je l'ouvre, alors elle montre le surnom ET le nom de l'espèce ; l'étoile « favori » est alignée avec son texte ; je peux faire défiler la fiche à la molette ou au doigt, curseur posé dessus.",
      "- [ ] Étant donné la fiche ouverte, quand je la ferme (bouton, touche Échap ou toucher à côté), alors je reviens à la liste de l'équipe sans perdre ma place ; le fond ne défile pas derrière.",
    ],
  },
  I: {
    retour: `**Choix de Nicolas (24/10).** PC : variante **B** (grille + détail). Ajouts demandés : une **barre de recherche** (par nom ou numéro), un **tri par shiny**, et sur PC la **liste de l'équipe à droite, au-dessus de la fiche du Pokémon** (équipe d'abord, fiche en dessous, défilement si c'est trop grand). Pokédex : celui de la V1 (grille de 151, silhouettes, paliers) dans Plus. ${REF}`,
    criteres: [
      "- [ ] Étant donné 30 Pokémon dans le PC, quand je tape une partie d'un nom ou un numéro dans la recherche, alors la grille ne garde que les correspondances (sans tenir compte des accents ni de la casse) ; effacer la recherche rétablit tout.",
      "- [ ] Étant donné le tri, quand je choisis « Shiny », alors les shiny passent en premier, puis l'ordre par numéro ; la liste de l'équipe est affichée à droite au-dessus de la fiche (sur mobile, au-dessus de la grille ou dans un onglet).",
    ],
  },
  L: {
    retour: `**Choix de Nicolas (24/10).** Shop : variante **B** (cartes produit) avec le **tri par catégorie** de C ; mieux aligner les éléments ; **supprimer** la case « Prépare ta route » et le message « Il te manque X pièces » (un bouton grisé suffit) ; **pas de panier**. Sac : **aucune variante ne convient** : il faut des **icônes officielles comme en V1** (20 PNG PokeAPI à rapatrier, voir ticket D), des **cases bien plus petites** sans vide inutile, le **filtre par catégorie** de C, et un **système d'utilisation des objets refait**. Pour l'utilisation, reprendre le mode de la V1 (\`v1-visuel-a-porter.md\` § 8) : clic sur l'objet → « Sélectionne un Pokémon », lignes d'équipe qui pulsent (cibles valides vertes, invalides grisées, clic ailleurs = annulation), sélecteur − / n / + pour Bonbon et Calcium, confirmation pour pierres et Jeton Shiny, pastilles de compte à rebours sous les PV pour les objets à durée, bouton CT Fauchage dans l'en-tête de l'équipe. Trois variantes du **nouveau** Sac sont à proposer à Nicolas avant le code. ${REF}`,
    criteres: [
      "- [ ] Étant donné le Shop, quand je regarde un objet trop cher, alors son bouton est grisé sans autre message ; il n'y a ni panier ni case « Prépare ta route » ; le tri par catégorie (Balles, Soins, Équipement) fonctionne.",
      "- [ ] Étant donné le Sac, quand je l'ouvre, alors chaque objet a son icône officielle (fichier local) dans une case compacte, groupée par catégorie avec un filtre ; aucune icône n'est chargée depuis Internet.",
      "- [ ] Étant donné un Bonbon ou un Calcium, quand je l'utilise, alors le mode de sélection de la V1 s'enclenche (message, lignes d'équipe en surbrillance, annulation d'un clic ailleurs) puis le sélecteur − / n / + avec confirmation ; les valeurs et messages sont ceux de la V1.",
    ],
    effort: [/Fourchette : 3 jours\. Risque : bonus d'objets dispersés/, "Fourchette : 3 à 4 jours (le Sac est à refaire). Risque : bonus d'objets dispersés"],
  },
  N: {
    retour: `**Choix de Nicolas (24/10).** Page Plus : variante **C** (tableau de bord). Reprendre de la V1 le **carnet de badges** (« Boîte à badges » : 8 cercles en grille de 4, obtenu = fond clair avec halo doré, non obtenu = silhouette grisée, effet au survol) et **l'animation d'obtention d'un badge** (message « Badge X obtenu ! », la boîte s'ouvre à 1,2 s, le badge « claque » à 2 s : échelle 5 → 1 → 1,4 → 1 en 1,2 s). Nicolas : « je veux garder toutes les animations que j'avais faites ; tu peux les retravailler, mais pas les supprimer ». ${REF}`,
    criteres: [
      "- [ ] Étant donné un boss d'arène vaincu, quand le badge est obtenu, alors se joue la séquence de la V1 (message, ouverture de la boîte à badges à 1,2 s, badge qui « claque » à 2 s, ≈ 3,2 s au total), comparée à `badge-slam` de la V1 (mêmes étapes et durées) ; avec `prefers-reduced-motion`, le badge apparaît sans mouvement.",
      "- [ ] Étant donné la page Plus, quand je l'ouvre, alors je vois le tableau de bord de la variante C (progression, Pokédex n / 151, badges n / 8) et la boîte à badges de la V1 avec l'effet au survol.",
    ],
  },
  P: {
    retour: `**Choix de Nicolas (24/10).** Les trois maquettes d'intro sont **refusées** (« vides et moches »). On reprend l'**intro jouable de la V1** (\`v1-visuel-a-porter.md\` § 3) : écran titre, on se réveille **Chez Maman** (« Il n'y a rien à faire ici, sortons. »), on sort, on se **balade dans Bourg Palette sur l'image avec zones cliquables** (Chez Maman, Chez Blue et son gag, Labo de Chen qui clignote en vert, Pension plus tard, Bateau), on entre au **Labo** : Chen glisse de la droite, dialogue en machine à écrire (30 ms par caractère, ▼ qui rebondit, trois sprites de Chen), **le cadenas du sac se brise** et +5 Pokéballs, **la carte se débloque** (bouton qui rebondit), puis le **choix du starter** (trois Poké Balls, l'artwork apparaît au survol, ×1,5 au choix, bouton « Choisir X »), sortie du labo qui clignote, carte, vol, Route 1. La télé de Chez Maman (easter egg Daran) est reprise dans le ticket W. Ce ticket devient gros : à découper en P1 (scènes de Bourg Palette navigables) et P2 (dialogue de Chen et choix du starter) au moment du lancement. ${REF}`,
    criteres: [
      "- [ ] Étant donné une partie neuve, quand je clique sur JOUER, alors je me réveille Chez Maman avec le message de la V1 ; la sortie est signalée en vert pulsant ; la transition entre scènes est un voile noir de 300 ms.",
      "- [ ] Étant donné Bourg Palette, quand je survole ou touche une zone, alors elle réagit comme dans la V1 (Chez Maman, Chez Blue avec son texte, Labo qui clignote en vert tant que non visité, Pension verrouillée avec la raison, Bateau gris) ; les zones sont en pourcentages de l'image et suivent le redimensionnement de la fenêtre.",
      "- [ ] Étant donné le dialogue de Chen, quand il se joue, alors Chen glisse en 1,5 s, la boîte apparaît à 1,6 s, le texte s'écrit à 30 ms par caractère, un toucher pendant l'écriture n'avance pas la ligne, les cadenas et la carte réagissent aux mêmes lignes qu'en V1.",
    ],
    effort: [/Fourchette : 3 jours\. Risque : l'équipe de départ change/, "Fourchette : 5 jours (4 à 5 si découpé en P1 et P2). Risque : l'équipe de départ change"],
  },
};

const blocs = texte.split(/^(?=## [A-Z]\. `)/m);
const sortie = blocs.map(bloc => {
  const id = /^## ([A-Z])\. `/.exec(bloc)?.[1];
  const r = id && retours[id];
  if (!r) return bloc;
  let b = bloc;
  if (!b.includes('### Retours de Nicolas')) {
    b = b.replace('### Critères d\'acceptation', `### Retours de Nicolas (24/10)\n${r.retour}\n\n### Critères d'acceptation`);
    b = b.replace('\n### Hors périmètre', `\n${r.criteres.join('\n')}\n\n### Hors périmètre`);
    // les critères ajoutés suivent immédiatement la dernière case : on retire la ligne vide en trop
    b = b.replace(/\n\n(- \[ \] Étant donné[^\n]*)\n(- \[ \] )/g, '\n$1\n$2');
  }
  if (r.effort) b = b.replace(r.effort[0], r.effort[1]);
  return b;
});
texte = sortie.join('');

const ticketZ = `## Z. \`feat(v1): reprendre les animations, les sons et les finitions visuelles de la V1\`

Labels : \`type:feat\`, \`etat:idee\`, \`est:3-4\`, \`prio:2\` · branche : \`v2\` · \`agent-ok\` : oui

### Histoire
En tant que joueur de la V1, je veux retrouver les animations, les sons et les petits effets que j'aimais afin que la V2 ait la même âme que mon jeu.

### Contexte
Demande de Nicolas (24/10) : « la V1 c'est l'idéal de mon jeu : le visuel, les animations, les easter eggs, c'est pile ce que j'aimais ». Inventaire complet dans \`docs/projet/v1-visuel-a-porter.md\` § 4 et § 7. Ce ticket couvre le **transversal** qui n'appartient à aucune page : animations du combat, de la capture, de l'évolution, du shiny, de la victoire ; sons ; finitions. Les animations propres à une page (vol de la carte, badge, intro, Panthéon, casino) sont dans le ticket de leur page. Chaque animation est reprise avec ses durées de la V1, retravaillée seulement pour respecter \`design/DESIGN.md\` (propriétés \`transform\` et \`opacity\`, pas de \`steps()\` sur un sprite, \`prefers-reduced-motion\`). Fichiers : \`src/ui/animations/\` (nouveau), \`src/ui/sons.ts\` (nouveau), \`data/animations.json\` (durées).

### Critères d'acceptation
- [ ] Étant donné l'inventaire de la V1, quand j'ouvre \`docs/projet/v1-visuel-a-porter.md\`, alors chaque animation du § 4 a un état : reprise (avec le ticket qui la porte), retravaillée (avec la raison) ou écartée par Nicolas ; aucune n'est supprimée sans son accord.
- [ ] Étant donné un Pokémon sauvage, quand il est à l'écran, alors il flotte doucement (3 s en boucle) ; à chaque toucher, il tremble 0,3 s avec un éclat blanc ; les nombres de dégâts sont verts si le premier Pokémon de l'équipe est efficace et rouges sinon.
- [ ] Étant donné une capture, quand la balle est lancée, alors le sprite devient une silhouette noire qui tremble pendant 1 s avant le résultat ; l'évolution fait clignoter en blanc 3 s en alternant les deux formes toutes les 150 ms ; un shiny a son halo doré et la bannière « Shiny apparu ! Auto stoppé ! » qui rebondit 3 s.
- [ ] Étant donné les sons, quand je clique, tue un ennemi, capture, monte de niveau ou range un Pokémon au PC, alors le son de la V1 correspondant se joue (cinq tons courts synthétisés par la Web Audio, sans fichier ni bibliothèque), un interrupteur « Son » dans Plus les coupe, et rien ne se joue avant le premier geste du joueur (règle des navigateurs).
- [ ] Étant donné \`prefers-reduced-motion\`, quand une animation devrait se jouer, alors elle est remplacée par un changement d'état instantané ou un fondu, sans perdre l'information.
- [ ] Étant donné les finitions de la V1 (contour noir des textes, verre dépoli des panneaux, étoiles ✦, message « Recherche en cours… » entre deux ennemis), quand je les compare, alors chacune est reprise ou écartée par Nicolas, notée dans l'inventaire.

### Hors périmètre
Animations propres à une page (carte, badges, intro, Panthéon, casino, générique : dans leurs tickets), easter eggs de renommage (ticket W), musique (la V1 n'en a pas).

### Vérification
\`npm test -- animations sons\` ; captures et vidéos courtes de chaque animation comparées à la V1 par Claude ; essai de Nicolas.

### Effort et risques
Fourchette : 3 à 4 jours. Risque : fluidité (règle de DESIGN.md, 59 images/s au repos) : mesurer avec le test de fluidité après chaque ajout. Dépend de : H (équipe et combat étoffé), J (capture), K (évolution).

---

`;
texte = texte.replace(/^## Y\. `/m, `${ticketZ}## Y. \``);
texte = texte.replace('| Jalon | Y |', '| Transversal | Z |\n| Jalon | Y |');
texte = texte.replace(/Dépend de : A à W\./, 'Dépend de : A à X et Z.');
writeFileSync(chemin, texte);
console.log('Backlog mis à jour.');
