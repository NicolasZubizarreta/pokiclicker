# Audit UI A–O (src/ui, niveau racine) — 19/11/2026

Périmètre : fichiers de `src/ui/` dont le nom commence par A, B, C, D, E, F, G, I, J, L, M, N, O (149 fichiers : composants, hooks, utilitaires, CSS, tests). Lecture seule, rien n'a été modifié dans le dépôt. Gravité : 1 critique, 2 notable, 3 mineur. Effort : S, M, L. « À confirmer » = lu dans le code mais non rejoué dans un navigateur.

Les tests (.test.tsx) ont été lus par échantillon (Coquille, EcranCombat, ChoixStarter, CarteKanto, FichePokemon), pas ligne à ligne ; les .css A–O ont été survolés, pas audités un à un. Les candidats qui en dépendent sont marqués.

Bilan honnête : il n'y a aucun défaut de gravité 1 dans ce périmètre. Les classes XSS / postMessage / liens externes sont absentes (voir S-uia-01 à S-uia-04, qui sont des constats négatifs vérifiés par Grep, donc non comptés comme défauts).

---

## 1. BUGS

### B-uia-01 — Sélecteur d'objet laissé ouvert à 0 objet (état Zustand périmé)
- `src/ui/EcranCombat.tsx:255-262`
- Preuve : `const etat = store.getState()` est pris avant l'action ; `etat.utiliserObjet(...)` remplace `sac` dans le store, mais `reste = etat.sac.entrees.find(...)` relit l'ancien objet `etat`.
  Avec 1 bonbon en stock : `reste` vaut 1 après l'usage (devrait être 0), donc `reste <= 0` est faux et `choisirObjet(null)` n'est pas appelé. Le sélecteur « Choisis un Pokémon » reste affiché alors que `stockObjet` (l.245) est à 0 et que plus aucun Pokémon n'est éligible. Seul Annuler ou Échap le ferme.
- Gravité : 2
- Correctif : relire `store.getState().sac` après l'appel (ou fermer quand `stockObjet` tombe à 0 dans un effet).
- Effort : S

### B-uia-02 — Message d'objet identique non ré-annoncé, minuteur non relancé
- `src/ui/EcranCombat.tsx:240-244, 259`
- Preuve : l'effet dépend de `[retour]`. Deux usages successifs qui produisent la même chaîne (`« Bonbon utilisé. »`) ne changent pas `retour` : le minuteur de `annonceMs` n'est pas réarmé, le message disparaît au bout du premier délai et le second usage n'est pas ré-annoncé.
- Gravité : 3
- Correctif : stocker `{ texte, id }` (compteur) dans l'état pour que chaque annonce redémarre le minuteur.
- Effort : S

### B-uia-03 — Même défaut pour `notifier` dans le calque de notifications
- `src/ui/Notifications.tsx:18`
- Preuve : `notifier(annonce)` n'est déclenché que si la valeur change. Deux achats identiques de suite produisent la même `annonce` : une seule notification (à confirmer selon la pile `pileNotifications.ts`, non relue en détail).
- Gravité : 3
- Correctif : horodater ou numéroter les annonces dans le store.
- Effort : S

### B-uia-04 — Gain de casino masqué si le jeu est quitté pendant un tour
- `src/ui/MachineASous.tsx:31-41`, `src/ui/CarteAGratter.tsx:39`, `src/ui/PageCasino.tsx:49-56`
- Preuve : `occuper(gain)` cache le gain affiché (`cache` dans PageCasino). `occuper(null)` est appelé à la fin du tour. Si on change de jeu (`PageCasino.tsx:56`, `cacher(null)` est appelé lors du changement de vue) c'est remis à zéro, mais `nettoyage.current` du composant démonté n'annule pas forcément les minuteurs ; si le retour sur l'ancien jeu intervient avant la fin, `occuper(null)` d'un composant démonté peut revenir après coup et effacer l'état du nouveau jeu (à confirmer).
- Gravité : 3
- Correctif : annuler les minuteurs au démontage et ignorer `occuper` d'un composant démonté.
- Effort : S

### B-uia-05 — `usePluie()` renvoie un objet neuf à chaque rendu : l'effet de CarteAGratter se relance
- `src/ui/CarteAGratter.tsx:26-32`
- Preuve : l'effet liste le retour de `usePluie()` en dépendance ; l'objet est recréé à chaque rendu. L'effet (réinitialisation / abonnement) tourne donc à chaque rendu au lieu d'une fois (à confirmer en comptant les exécutions).
- Gravité : 3
- Correctif : mémoïser l'objet retourné par `usePluie` (`useMemo`/`useRef`).
- Effort : S

### B-uia-06 — Fondu des crédits relancé à chaque rendu du parent
- `src/ui/Credits.tsx:46-50`, `src/ui/Coquille.tsx:158`
- Preuve : l'effet de fondu dépend de `fermerCredits`, flèche créée dans le rendu de Coquille. Tout rendu de Coquille (annonce, DPS qui change) recrée la fonction et relance le minuteur.
- Gravité : 3
- Correctif : stabiliser `fermerCredits` avec `useCallback` ou lire la fonction via une ref.
- Effort : S

### B-uia-07 — Date de diplôme invalide : écran blanc (aucun ErrorBoundary)
- `src/ui/Diplome.tsx:42-44`
- Preuve : `new Intl.DateTimeFormat(...).format(new Date(diplome.date))` lève `RangeError: Invalid time value` si `diplome.date` n'est pas une date valide. `grep ErrorBoundary|componentDidCatch` ne trouve rien dans `src` : l'exception remonte et démonte tout l'arbre React. Provenance de `diplome.date` : sauvegarde locale ou serveur, éditable (à confirmer côté core si la date est validée au chargement).
- Gravité : 2
- Correctif : valider la date au chargement de la sauvegarde ; ajouter un ErrorBoundary racine dans `main.tsx`.
- Effort : S (validation) / M (boundary)

### B-uia-08 — Focus perdu à la fermeture de la fiche de zone de la carte
- `src/ui/CarteKanto.tsx:107, 232`
- Preuve : `origineFocus.current = document.activeElement`. Au clic sur un cercle SVG (non focalisable), `activeElement` est `body` ; à la fermeture `origineFocus.current?.focus()` ne ramène donc le focus nulle part. Au clavier (Entrée sur le repère) c'est correct.
- Gravité : 3
- Correctif : mémoriser le repère cliqué (`event.currentTarget`) plutôt que `activeElement`.
- Effort : S

### B-uia-09 — Double déclenchement possible sur la carte (clic + fin de pointeur)
- `src/ui/CarteKanto.tsx:199-201, 291-292, 309`
- Preuve : sur PC, `onPointerUp={terminer}` appelle `choisirRepere(zoneTouchee.current)` et le halo/cercle a aussi `onClick={() => { if (!glissement.current) choisirRepere(f.zone); }}`. Un même geste peut déclencher les deux ; le second appel réécrit `origineFocus` avec `activeElement`. À confirmer dans un navigateur (capture de pointeur).
- Gravité : 3
- Correctif : n'ouvrir que depuis `onClick`, ou que depuis `terminer`.
- Effort : S

### B-uia-10 — Piège Tab dans une fiche de carte non modale
- `src/ui/CarteKanto.tsx:123-124`
- Preuve : la fiche de zone gère Tab à la main, sans `<dialog>` modale. Le reste de la carte reste atteignable à la souris et les lecteurs d'écran ne savent pas que le contenu derrière est inerte (à confirmer, le détail dépend de l'attribut `inert` utilisé ailleurs).
- Gravité : 3
- Correctif : `inert` sur la carte tant que la fiche est ouverte, ou `<dialog>` modal.
- Effort : M

### B-uia-11 — `aria-label` du repère écrase l'état (« Terminée / fermée / 3 lieux »)
- `src/ui/CarteKanto.tsx:226`
- Preuve : `aria-label` fixe le nom accessible du repère et remplace le contenu texte porteur de l'état (terminée, fermée, nombre de lieux). Le lecteur d'écran n'annonce que le nom de zone.
- Gravité : 3
- Correctif : ajouter l'état au `aria-label` ou utiliser `aria-describedby`.
- Effort : S

### B-uia-12 — « Vol en cours vers undefined… » possible
- `src/ui/CarteKanto.tsx:397`
- Preuve : `carte.formes.find(f => f.zone === vol.cible)?.nom` renvoie `undefined` si la cible n'est pas dans `carte.formes` (zone supprimée, donnée de sauvegarde ancienne) ; le texte annoncé devient « Vol en cours vers … » avec « undefined » rendu en texte vide (React n'affiche pas `undefined`, donc phrase tronquée « Vol en cours vers … »). À confirmer.
- Gravité : 3
- Correctif : repli sur « la destination ».
- Effort : S

### B-uia-13 — Molette de zoom : `deltaMode` ignoré
- `src/ui/CarteKanto.tsx:146-155`
- Preuve : la valeur de `event.deltaY` est utilisée en pixels. Firefox avec `deltaMode = 1` (lignes) donne des deltas de ±3 : zoom quasi nul ; certains pavés tactiles donnent de grosses valeurs : zoom brutal (à confirmer).
- Gravité : 3
- Correctif : normaliser par `deltaMode`.
- Effort : S

### B-uia-14 — Le focus de repli après relâchement vise un `h1` non focalisable
- `src/ui/FichePokemon.tsx:114-117`
- Preuve : `document.querySelector<HTMLElement>('h1')?.focus()`. Les `h1` de l'application (`EcranCombat` PC `h1.sr-only`, CarteKanto) n'ont pas `tabIndex={-1}` : `.focus()` est sans effet, le focus retombe sur `body` après qu'un Pokémon relâché a retiré l'élément d'origine (à confirmer).
- Gravité : 3
- Correctif : `tabIndex={-1}` sur ce `h1`, ou cible explicite fournie par le parent.
- Effort : S

### B-uia-15 — Double restauration du focus dans FichePokemon
- `src/ui/FichePokemon.tsx:106, 114-116`
- Preuve : `onClose` et un effet restaurent chacun le focus ; l'ordre dépend du rendu et l'un peut écraser l'autre.
- Gravité : 3
- Correctif : un seul endroit de restauration.
- Effort : S

### B-uia-16 — Fiche jamais démontée après la première ouverture : abonnements permanents
- `src/ui/EcranCombat.tsx` (état `fiche` jamais remis à `null`), `src/ui/FichePokemon.tsx`
- Preuve : une fois ouverte, la fiche reste montée (dialog fermé) et garde ses `useStore` sur équipe, PC, sac ; `detailDps` et `verifierRelachement` sont recalculés à chaque mise à jour du store (plusieurs fois par seconde en combat). À confirmer par le Profiler.
- Gravité : 3
- Correctif : démonter la fiche à la fermeture (`fiche = null` dans `onClose`).
- Effort : S

### B-uia-17 — Surnom : saisie non bornée dans le champ
- `src/ui/FichePokemon.tsx:155`
- Preuve : `<input>` du surnom sans `maxLength` ; la longueur n'est contrôlée qu'à la soumission côté core (`equipe.ts:32`). L'utilisateur tape 200 caractères, appuie sur Entrée et reçoit une erreur au lieu d'être arrêté en saisie.
- Gravité : 3
- Correctif : `maxLength` aligné sur la constante du core.
- Effort : S

### B-uia-18 — Bouton Poké-Radar désactivé : raison en `title` seulement
- `src/ui/EcranCombat.tsx:173-175`
- Preuve : bouton `disabled` portant `title` pour expliquer pourquoi. Un bouton `disabled` ne prend pas le focus et n'affiche pas de `title` au tactile : la raison est inaccessible au clavier et sur téléphone, public principal du jeu.
- Gravité : 3
- Correctif : `aria-disabled` + message visible ou annoncé.
- Effort : S

### B-uia-19 — Bannière de combat `aria-hidden` : jamais annoncée
- `src/ui/EcranCombat.tsx:163`
- Preuve : bannière marquée `aria-hidden="true"` alors qu'elle contient l'information de zone/ennemi ; pas d'équivalent live (à confirmer qu'aucun autre nœud ne la reprend).
- Gravité : 3
- Correctif : retirer `aria-hidden` ou fournir un équivalent `sr-only`.
- Effort : S

### B-uia-20 — Titre `h2 aria-live` contenant un bouton « Annuler »
- `src/ui/EcranCombat.tsx:266-270`
- Preuve : le `h2` est `aria-live="polite"` et contient le bouton Annuler : chaque changement entre « Ton équipe » / « Choisis un Pokémon » / message fait relire le bouton ; un titre n'est pas une région live.
- Gravité : 3
- Correctif : séparer le titre et une région `role="status"` stable.
- Effort : S

### B-uia-21 — Sprite rendu deux fois et éclat retrouvé par l'ordre DOM
- `src/ui/EcranCombat.tsx:151-156`
- Preuve : le sprite est rendu en version téléphone et PC ; l'éclat est retrouvé par `querySelectorAll('.eclat-touche')[grand ? 1 : 0]`. Si l'ordre ou le nombre de nœuds change, l'animation touche le mauvais élément (et le second est masqué en CSS mais animé quand même).
- Gravité : 3
- Correctif : un seul sprite adaptatif, ou ref par variante.
- Effort : M

### B-uia-22 — Texte de navigation en `role="status"` inséré dynamiquement
- `src/ui/Navigation.tsx:35`, `src/ui/BarreLaterale.tsx:46`, `src/ui/App.tsx:273`
- Preuve : un `role="status"` créé avec son contenu déjà présent n'est pas fiablement annoncé (la région doit exister avant que le texte change). App.tsx:273 affiche aussi un bouton « OK » à l'intérieur d'un `status`.
- Gravité : 3
- Correctif : région `status` permanente et vide qui reçoit le texte.
- Effort : S

### B-uia-23 — Guide « Zone suivante » : sondage toutes les 150 ms
- `src/ui/GuideZoneSuivante.tsx:30`
- Preuve : `setInterval(placer, 150)` avec `getBoundingClientRect()` tant que le guide est actif (≈ 7 lectures de layout par seconde, forçant un reflow) ; la région `aria-live` est insérée avec son contenu (même problème que B-uia-22).
- Gravité : 3
- Correctif : `ResizeObserver` + écoute du scroll, ou `requestAnimationFrame` limité.
- Effort : M

### B-uia-24 — Texte d'objectif qui alterne seul, sans pause
- `src/ui/ObjectifPermanent.tsx:23-27, 35-37`
- Preuve : `setInterval` fait changer le texte du bouton toutes les `objectifs.alternanceMs` ; pas de pause au survol/focus (WCAG 2.2.2) et `aria-label` change en continu.
- Gravité : 3
- Correctif : pause au survol/focus ; pas d'`aria-label` dynamique.
- Effort : S

### B-uia-25 — Bouton d'objectif et carte ennemie se chevauchent possiblement à 390 px
- `src/ui/ObjectifPermanent.tsx:36`
- Preuve : bouton `absolute top-4 right-4 max-w-1/2` (195 px à 390 px) alors que la carte ennemie occupe `w-3/5` en haut de la scène : 195 + 234 > 390. À confirmer par capture.
- Gravité : 3
- Correctif : vérifier la capture 390 px et réserver l'espace.
- Effort : S

### B-uia-26 — Argent tronqué à 390 px
- `src/ui/BandeauHaut.tsx:20, 30-31`
- Preuve : `<dd className="truncate ...">` pour l'argent formaté par `formateurArgent` (non compact) : un joueur avancé (nombres à 10 chiffres + « ₽ ») voit « 1 234 567 8… ». À confirmer par capture.
- Gravité : 3
- Correctif : notation compacte au-delà d'un seuil, ou `title`/`aria-label` avec la valeur complète.
- Effort : S

### B-uia-27 — Badge `cache` encore cliquable
- `src/ui/BoiteBadges.tsx:32`
- Preuve : le badge masqué n'est rendu qu'avec `opacity-0`, il reste focalisable et cliquable (ouvre le détail d'un badge non découvert, à confirmer).
- Gravité : 3
- Correctif : `disabled`/`tabIndex={-1}`/`aria-hidden`.
- Effort : S

### B-uia-28 — `role="status"` mis à jour au survol dans BoiteBadges
- `src/ui/BoiteBadges.tsx:43`
- Preuve : `p role="status"` réécrit à chaque survol/focus : un lecteur d'écran lit chaque badge survolé. Au tactile, `mouseenter` collant laisse un badge « survolé » indéfiniment.
- Gravité : 3
- Correctif : pas de région live sur le survol.
- Effort : S

### B-uia-29 — BadgesTelephone stocke l'objet badge sélectionné (périmé)
- `src/ui/BadgesTelephone.tsx:53`
- Preuve : `selection` contient l'objet badge ; si les badges changent pendant que le détail est ouvert (badge obtenu), le détail affiche l'ancienne version. Stocker l'id.
- Gravité : 3
- Effort : S

### B-uia-30 — Musique : pas de reprise au retour en ligne
- `src/ui/musique.ts:40`
- Preuve : `navigator.onLine === false` coupe la piste ; aucun écouteur `online` ne la relance avant le prochain changement de scène.
- Gravité : 3
- Effort : S

### B-uia-31 — Déverrouillage audio sur la première touche, même non activante
- `src/ui/main.tsx:12-20`
- Preuve : le premier `keydown` (Shift, Ctrl, Tab) appelle `deverrouiller()` et retire les écouteurs ; si le navigateur refuse la lecture (touche non activante), aucun autre geste ne retentera : musique muette jusqu'au changement de scène. À confirmer sur Chrome/Safari.
- Gravité : 3
- Effort : S

### B-uia-32 — Bulletin de mise à jour : jamais d'interrogation périodique
- `src/ui/MiseAJour.tsx`
- Preuve : `useRegisterSW()` sans `onRegisteredSW` + `setInterval(update)`. Un onglet ouvert plusieurs jours ne voit jamais la nouvelle version tant qu'il n'est pas rechargé ; le délai d'affichage 6000 ms est en dur (cf. `reglages.interface.annonceMs`).
- Gravité : 3
- Effort : S

### B-uia-33 — Parsing localStorage à chaque rendu de PartieConnectee
- `src/ui/App.tsx:248-252`
- Preuve : `creerGestionnaire(...)`, `partieCourante()`, `chargerPartie(id)`, `chargerRegion(...)` (lecture + `JSON.parse` de la sauvegarde) s'exécutent dans le corps du composant, donc à chaque rendu de PartieConnectee (états `occupe`, `erreur`, `avis`…). Sauvegarde de plusieurs Ko lue et parsée deux fois par rendu.
- Gravité : 3
- Correctif : `useMemo` sur `[phase, suppression, jeuMonte]`.
- Effort : S

### B-uia-34 — Boutons ✓/✗ de ConfirmationObjet : nom accessible peu clair
- `src/ui/ConfirmationObjet.tsx`
- Preuve : boutons dont l'intitulé est un symbole ; à confirmer qu'ils portent un `aria-label` explicite (lecture rapide).
- Gravité : 3
- Effort : S

### B-uia-35 — Onglets FiltreCategories : focus par `parentElement.children[prochain]`
- `src/ui/FiltreCategories.tsx`
- Preuve : navigation aux flèches basée sur la position des enfants du parent ; tout nœud ajouté au même parent décale l'index. Pas de `aria-controls` / `tabpanel` (le contrôle déclare `role="tab"`).
- Gravité : 3
- Effort : S

### B-uia-36 — GuidePage : `aria-current` booléen rendu « false »
- `src/ui/GuidePage.tsx`
- Preuve : `aria-current={s.id === ouvert}` : React rend `aria-current="false"` pour les autres entrées (valide mais bruyant) ; paragraphes en `key={i}` (l.24, 44) stables seulement tant que la liste ne change pas.
- Gravité : 3
- Effort : S

---

## 2. SÉCURITÉ

Constats négatifs vérifiés par Grep sur `src/ui` (hors tests), pour que personne ne les recherche à nouveau :
- Aucun `dangerouslySetInnerHTML`, aucun `innerHTML`, aucun `eval`/`new Function`. Les créations de nœuds (`DegatsFlottants`, `GainsFlottants`, `Credits`, `casino-interface`) passent par `document.createElement` + `textContent`.
- Aucun `postMessage`, aucun `target="_blank"` / `window.open`.
- Aucune exposition de l'état sur `window` hors `window.pokiJournal` (voir S-uia-06).
- `localStorage` n'est pas lu directement dans les fichiers A–O hors tests : tout passe par l'interface `Stockage`.
- `appareil.ts` : jeton en `Authorization: Bearer`, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'` (bonnes pratiques).

### S-uia-01 — Jeton magique lu dans l'URL, retiré après coup seulement
- `src/ui/App.tsx:280-290`
- Preuve : `parametres.get('token')` lu à l'initialisation, `history.replaceState` après le premier rendu. Entre le chargement et l'effet, le jeton peut partir dans l'en-tête `Referer` d'une ressource tierce (aucune n'est chargée aujourd'hui) et reste dans l'historique de navigation d'avant remplacement (la page d'arrivée est enregistrée avec la requête).
- Gravité : 3
- Correctif : lire et retirer le jeton avant le premier rendu (script inline ou `main.tsx`), jeton à usage unique et court côté serveur.
- Effort : S

### S-uia-02 — Aucune CSP dans `index.html`
- `index.html:1-16` (pas de balise `Content-Security-Policy`) ; en-têtes du serveur de prod non lus (hors périmètre, à confirmer côté Coolify/Caddy)
- Preuve : Grep `Content-Security-Policy|script-src` sur `index.html`, `vite.config.*`, `public/` : aucun résultat. Sans CSP, une XSS dans une autre couche (ou une dépendance) n'est pas contenue.
- Gravité : 2
- Correctif : CSP en en-tête (`default-src 'self'; img-src 'self' data:; connect-src 'self' <api>`), vérifier la compatibilité avec le service worker de la PWA et `%NOM_JEU%`.
- Effort : M

### S-uia-03 — `?debug=carte` actif en production
- `src/ui/CarteKanto.tsx:62`
- Preuve : `new URLSearchParams(window.location.search).get('debug') === 'carte'` sans garde `import.meta.env.DEV` (contrairement à `Coquille.tsx:48` pour `?onglet=carte`). Il suffit d'ajouter le paramètre pour révéler les zones (noms de zones verrouillées, spoil du contenu).
- Gravité : 3
- Correctif : `import.meta.env.DEV &&`.
- Effort : S

### S-uia-04 — Détails d'erreur internes affichés à l'écran
- `src/ui/EcranCombat.tsx:377`
- Preuve : le message d'erreur est affiché après un `\n` (partie « détail » de l'erreur remontée). Si ce détail vient de la couche synchro/serveur, il peut contenir un chemin, un identifiant ou un code interne (à confirmer sur les erreurs réelles).
- Gravité : 3
- Correctif : message utilisateur fixe ; détails dans la console.
- Effort : S

### S-uia-05 — Triche locale : état de jeu et RNG du casino côté client
- `src/ui/MachineASous.tsx`, `CarteAGratter.tsx`, `store.ts` (`actions.jouerMachine/gratter`)
- Preuve : les tirages du casino, les gains et les sauvegardes sont calculés et stockés dans le navigateur ; modifier le `localStorage` ou appeler le module depuis la console donne des jetons. C'est inhérent au design (jeu solo, sauvegarde locale), mais avec comptes en ligne et synchro, les mêmes données montent au serveur sans contrôle d'intégrité (à confirmer côté API, hors périmètre).
- Gravité : 3
- Correctif : documenter le choix ; validation de plausibilité côté serveur si un classement apparaît un jour.
- Effort : L

### S-uia-06 — `window.pokiJournal` exposé en dev
- `src/ui/journal-zones.ts:41-42, 49`
- Preuve : la déclaration globale existe, mais `creerJournalLocal` retourne `null` si `import.meta.env.PROD` (l.49) : pas d'exposition en production. À confirmer que l'assignation à `window.pokiJournal` (hors de ce fichier) est aussi gardée.
- Gravité : 3
- Correctif : garder l'assignation derrière `import.meta.env.DEV`.
- Effort : S

### S-uia-07 — Journal de dev : clés `pokiclicker-dev:*` lues sans validation de taille
- `src/ui/journal-zones.ts:44-98`
- Preuve : le relevé est parsé depuis `localStorage` avec un contrôle de forme très long mais sans limite de taille ni de nombre de visites ; un relevé énorme (ou fabriqué) est parsé en entier à chaque démarrage en dev. Inactif en production.
- Gravité : 3
- Effort : S

### S-uia-08 — Id d'appareil avec repli `Math.random`
- `src/ui/identifiants.ts:2-6`
- Preuve : `globalThis.crypto` absent (contexte non sécurisé HTTP) → identifiant dérivé de `Math.random()` : prévisible. L'id d'appareil sert à l'exclusivité de session (`appareil.ts`) : un id deviné permettrait d'en usurper un autre.
- Gravité : 3
- Correctif : exiger `crypto.getRandomValues` (le jeu est servi en HTTPS).
- Effort : S

### S-uia-09 — Entrées non bornées côté UI
- `src/ui/MiseCasino.tsx` (champ mise), `src/ui/FichePokemon.tsx:155` (surnom)
- Preuve : pas de `maxLength` ni de `max` sur ces champs (voir B-uia-17). Le core valide le surnom ; pour la mise, la validation côté store est à confirmer (non lue).
- Gravité : 3
- Correctif : bornes HTML alignées sur les constantes du core.
- Effort : S

### S-uia-10 — Chemins d'assets construits depuis des surnoms sans liste blanche
- `src/ui/easter-eggs.ts:11-17`, `src/ui/affichage-pokemon.ts`
- Preuve : `photosDe(pokemon.surnom)` renvoie une URL d'image d'après le surnom saisi par le joueur. La liste vient de `core/easter-eggs` (table fixe, pas d'injection de chemin tant que `photosDe` fait une recherche exacte — à confirmer dans le core, hors périmètre).
- Gravité : 3
- Effort : S

### S-uia-11 — Lecture d'`import.meta.env.VITE_API_URL` et URL d'API dans le bundle
- `src/ui/App.tsx`, `src/ui/appareil.ts`, `src/ui/synchro.ts:91, 266`
- Preuve : l'URL d'API est concaténée sans validation ; `urlApi.replace(/\/+$/, '')`. Pas de secret en dur trouvé. Constat : une variable d'environnement mal posée (`http://`) enverrait le jeton Bearer en clair (à confirmer côté build).
- Gravité : 3
- Correctif : refuser une URL non HTTPS hors localhost au démarrage.
- Effort : S

### S-uia-12 — Aucun ErrorBoundary : une exception de rendu détruit la partie affichée
- `src/ui/main.tsx` (aucun résultat de Grep pour `ErrorBoundary`)
- Preuve : tout `throw` pendant un rendu (cf. B-uia-07, `facteurEntier` qui lève si largeur ≤ 0, `Image.tsx`) démonte l'application. La sauvegarde en cours n'est pas perdue mais l'utilisateur voit un écran blanc sans message ni moyen de récupérer.
- Gravité : 2
- Correctif : ErrorBoundary racine avec message et bouton « Recharger ».
- Effort : M

### S-uia-13 — Aucun `rel="noopener"` nécessaire mais aucun lien externe contrôlé non plus
- `src/ui/Credits.tsx`
- Preuve : constat de contrôle : Grep `target="_blank"` ne trouve rien ; aucun lien sortant dans A–O. À conserver comme règle lors d'ajouts (crédits, liens vers sources).
- Gravité : 3
- Effort : S

---

## 3. QUALITÉ

### Q-uia-01 — Motif de dialogue modal copié dans ~14 composants
- `ActionsCombat`, `BadgesTelephone`, `BoiteBadges`, `CarteKanto`, `Credits`, `DialogueScene`, `Diplome`, `FenetreEclosion`, `FenetreEvolution`, `FenetreRadar`, `FenetreRaccourcis`, `FenetreSac`, `FichePokemon` (3×), `ObjectifPermanent`, `ObtentionBadge` (`showModal(` : 29 occurrences dans 25 fichiers de `src/ui`)
- Preuve : même séquence recopiée : `ref` + `showModal()` + `onCancel={e => { e.preventDefault(); fermer(); }}` + `onClose` qui ramène le focus. Les divergences (B-uia-14, B-uia-15) viennent de là.
- Gravité : 2
- Correctif : hook `useDialogueModal()` ou composant `<Fenetre>` unique.
- Effort : M

### Q-uia-02 — `BarreCapture` : code mort
- `src/ui/BarreCapture.tsx`, `src/ui/BarreCapture.test.tsx`
- Preuve : Grep `BarreCapture` sur `src` : seulement le composant et son test. Aucun import dans l'application (remplacé par `LigneCapture`). Un test maintient du code inutilisé.
- Gravité : 3
- Correctif : supprimer le composant et son test.
- Effort : S

### Q-uia-03 — `EcranCombat.tsx` géant
- `src/ui/EcranCombat.tsx` (≈ 380 lignes, 5 composants)
- Preuve : le composant `Equipe` appelle ~25 `useStore`, mélange sélection d'objet, fiche, annonces et mise en page ; `ActionsTelephone` est utilisé aussi sur PC (nom trompeur) ; l'état de la fiche est dupliqué entre `Equipe` et `CombatPC`.
- Gravité : 2
- Correctif : un fichier par composant, un hook `useObjetEnMain`.
- Effort : L

### Q-uia-04 — `PartieConnectee` : ≈ 250 lignes, 12 états
- `src/ui/App.tsx`
- Preuve : phases de vérification / création / reprise / suppression / déconnexion toutes dans un seul composant, avec `jeuDejaMonte` variable de module (l.65) et `jouer()` qui ne met pas `jeuArrete.current` à jour.
- Gravité : 2
- Correctif : machine d'états (reducer) + sous-composants par écran.
- Effort : L

### Q-uia-05 — Logique métier dans l'UI : `appliquer` un objet
- `src/ui/EcranCombat.tsx:253-263`
- Preuve : le choix de l'action selon le type d'objet (`stase`/`pierre`/`jeton`/`utiliserObjet`) et la règle « répétable » (bonbon, calcium, baie) sont codés dans le composant, ce qui a produit B-uia-01.
- Gravité : 2
- Correctif : `store.appliquerObjet(objet, uid)` dans `src/core`, qui renvoie le stock restant.
- Effort : M

### Q-uia-06 — Identifiants de lieux et noms de zones en dur
- `src/ui/Coquille.tsx:99-105` (`'kanto.route-de-ronflex'`), `src/ui/EcranCombat.tsx:54` (`sousTitres` : `'kanto.route-1': 'Jadielle'`), `src/ui/CarteKanto.tsx` (« Céladopole »)
- Preuve : noms de lieux dans le code alors que `CLAUDE.md` impose les données de contenu en JSON dans `data/`.
- Gravité : 2
- Correctif : déplacer dans `data/regions/kanto/*.json`.
- Effort : M

### Q-uia-07 — `mouvementReduit` dupliqué
- `BoiteDialogue.tsx:5`, `casino-interface.tsx:5`, `confettis.ts:25`, `Credits.tsx:17/39`, `EcranCombat.tsx:77/80`, `FenetreEclosion.tsx:17/34`, `PageIntro.tsx`
- Preuve : trois implémentations de `matchMedia('(prefers-reduced-motion: reduce)')` (Grep : `BoiteDialogue`, `confettis`, `PageIntro`) plus des appels dispersés.
- Gravité : 3
- Correctif : exporter `mouvementReduit` depuis un seul module.
- Effort : S

### Q-uia-08 — Chemins d'assets `img/...` en dur
- `FenetreEclosion.tsx:46-48`, `CollectionEclosions.tsx:34`, `ChoixStarter`, `DialogueIntro.tsx:44`, `casino-interface.tsx:30`, `EcranCombat.tsx:177`, `easter-eggs.ts:12`
- Preuve : chemins relatifs construits à la main, alors que `cheminSprite` (`precharger.ts`) et `import.meta.env.BASE_URL` (utilisé dans `Diplome.tsx:37`) existent. Un changement de `base` casse silencieusement ces images.
- Gravité : 2
- Correctif : une fonction `cheminImage(chemin)` unique.
- Effort : M

### Q-uia-09 — Raccourcis clavier codés en dur dans l'affichage
- `BarreLaterale` (index+1), `ActionsCombat` (A/T/R/S), `LigneCapture` (B/C), `BoutonFauchage` (F)
- Preuve : les touches affichées dans `<kbd>` ne viennent pas de `raccourcis.ts` ; changer un raccourci laisse l'étiquette fausse.
- Gravité : 3
- Correctif : lire les libellés depuis `raccourcis.ts`.
- Effort : M

### Q-uia-10 — `BarreLaterale` et `Navigation` dupliquées
- `src/ui/Navigation.tsx`, `src/ui/BarreLaterale.tsx`
- Preuve : entrées et logique Pension dupliquées ; classes `lg:` mortes dans Navigation (la version PC est dans BarreLaterale).
- Gravité : 3
- Correctif : une liste d'entrées commune.
- Effort : M

### Q-uia-11 — `DetailBadge` en deux versions différentes
- `src/ui/BoiteBadges.tsx`, `src/ui/BadgesTelephone.tsx`
- Preuve : deux rendus du détail d'un badge, avec des états et structures différents (cf. B-uia-27 à B-uia-29).
- Gravité : 3
- Effort : M

### Q-uia-12 — Accès direct Centre / Pension / Casino : trois blocs copiés dans CarteKanto
- `src/ui/CarteKanto.tsx`
- Preuve : trois blocs de boutons quasi identiques pour les lieux sans zone, avec chaînes en dur (« Céladopole »).
- Gravité : 3
- Correctif : table de données + boucle.
- Effort : S

### Q-uia-13 — `CarteKanto.tsx` : fichier trop long et mélangeant geste, rendu, a11y
- `src/ui/CarteKanto.tsx` (≈ 400 lignes)
- Preuve : pointeurs, zoom, fiche, vol, Célodopole et debug dans un composant.
- Gravité : 2
- Correctif : extraire `useGestesCarte`, `FicheZone`, `AccesDirects`.
- Effort : L

### Q-uia-14 — `CarteObjet` : deux rendus compact / complet dans un seul composant
- `src/ui/CarteObjet.tsx`
- Preuve : branches compact / non-compact ; espace normal avant « ₽ » dans une branche, ` ` (insécable) dans l'autre (`BandeauHaut.tsx:20` utilise ` `) : texte qui peut passer à la ligne entre le nombre et « ₽ ».
- Gravité : 3
- Effort : S

### Q-uia-15 — Chargement d'images non paresseux dans CollectionEclosions
- `src/ui/CollectionEclosions.tsx:34`
- Preuve : une `<img>` par espèce tirée, sans `loading="lazy"` ni composant `Image` ; plusieurs dizaines d'images au même moment sur mobile.
- Gravité : 3
- Correctif : `loading="lazy"` + `decoding="async"` ou composant partagé.
- Effort : S

### Q-uia-16 — Hacks de types
- `FichePokemon.tsx:124` (`as unknown as Parameters<...>`), `CollectionEclosions.tsx:15` (stats factices pour satisfaire un type), `ObjectifPermanent.tsx:54` (`o.cible as Page`), `Image.tsx` (`largeur as number`)
- Preuve : conversions qui contournent le typage au lieu de corriger le type d'entrée.
- Gravité : 3
- Effort : S

### Q-uia-17 — `Image.tsx` : erreur différente en dev et en prod
- `src/ui/Image.tsx`
- Preuve : en dev l'absence de dimensions lance une exception, en prod le composant renvoie `null` sans rien dire ; `facteurEntier` lève si la largeur est ≤ 0.
- Gravité : 3
- Correctif : même comportement dégradé en dev et prod, avec `console.warn` en dev.
- Effort : S

### Q-uia-18 — Singleton audio créé à l'import
- `src/ui/musique.ts:20`
- Preuve : `creerLecteur = fichier => new Audio(fichier)` sert de valeur par défaut, et le module garde un état global à l'import ; les tests doivent le réinitialiser et un second montage partage l'état.
- Gravité : 3
- Effort : M

### Q-uia-19 — Classes Tailwind répétées
- `ObjectifPermanent.tsx:36, 43, 54`, `Diplome.tsx:34, 49`, `EcranCombat.tsx:269` et autres
- Preuve : `cadre min-h-11 min-w-11 bg-surface px-...` recopié sur des dizaines de boutons ; en particulier le bouton « Fermer » à croix SVG est recopié mot pour mot dans plusieurs fenêtres.
- Gravité : 3
- Correctif : composant `<BoutonFermer>` et classes utilitaires de design système.
- Effort : M

### Q-uia-20 — Boutons « Fermer » en croix SVG copiés
- `ObjectifPermanent.tsx:43-45`, `FenetreSac`, `FenetreRadar`, `FenetreEvolution`, etc.
- Preuve : même `<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" .../>` répété.
- Gravité : 3
- Effort : S

### Q-uia-21 — `GuidePage` : lignes de tutoriels dupliquées PC / téléphone
- `src/ui/GuidePage.tsx`
- Preuve : `listeTutoriels` et `lignesTutoriels` construisent la même liste deux fois, `summary onClick preventDefault` contrôle `open` à la main.
- Gravité : 3
- Effort : S

### Q-uia-22 — Durées d'animation en dur
- `DegatsFlottants.tsx` (500 ms), `GainsFlottants.tsx` (1100 ms), `MiseAJour.tsx` (6000 ms)
- Preuve : valeurs numériques dans les composants alors que `reglages.animations`/`reglages.interface.annonceMs` existent (utilisés par `animations.ts` et `EcranCombat`).
- Gravité : 3
- Effort : S

### Q-uia-23 — `DegatsFlottants` : manipulation DOM directe et couleur lue dans l'équipe
- `src/ui/DegatsFlottants.tsx`, `src/ui/GainsFlottants.tsx`
- Preuve : création de nœuds à la main (contourne React), couleur déduite de `equipe[0].multiplicateur` : si l'équipe change entre l'attaque et l'affichage, la couleur est fausse. Couplage UI → données de l'équipe.
- Gravité : 3
- Effort : M

### Q-uia-24 — `Etapes.tsx` : « 10 » en dur
- `src/ui/Etapes.tsx:5`
- Preuve : `Array.from({ length: 10 })` et `i === 9` pour le boss : le nombre d'étapes devrait venir du core.
- Gravité : 3
- Effort : S

### Q-uia-25 — Commentaire mal placé et espace manquant dans Coquille
- `src/ui/CarteEquipe.tsx:14` (commentaire orphelin), `src/ui/Coquille.tsx` (`...ouvrirPension()}menuPrincipal=` : espace manquant entre props)
- Gravité : 3
- Effort : S

### Q-uia-26 — `aria-label` sur des `div` sans rôle
- `CarteEquipe.tsx:34`, `MachineASous.tsx:50`
- Preuve : un `aria-label` sur un élément sans rôle n'est pas exposé de façon fiable ; `BoutonAction.tsx:26` répète le même texte dans `aria-label` et `aria-describedby` (lu deux fois).
- Gravité : 3
- Effort : S

### Q-uia-27 — `BandeauHaut` : conditions et `dl` redondants
- `src/ui/BandeauHaut.tsx:20-31`
- Preuve : deux `dl` quasi identiques (PC / téléphone) ; `combat && telephone` redondant.
- Gravité : 3
- Effort : S

### Q-uia-28 — Tests fragiles
- `ChoixStarter.test.tsx:59-60` (classe CSS `ring-alerte-base`), `Coquille.test.tsx` (`querySelector('[data-notifications] div[aria-live]...')`, clés `pokiclicker:region:…:kanto` extraites par `startsWith`/`endsWith`), `Coquille.test.tsx:237-281` (modification directe du JSON stocké)
- Preuve : assertions sur classes Tailwind et sur la structure DOM interne ; elles cassent au moindre changement de style sans bug. Lecture par échantillon, d'autres sont probables dans les ~50 fichiers de tests.
- Gravité : 3
- Correctif : `getByRole`, `data-testid` ciblés ; helper de sauvegarde partagé.
- Effort : M

### Q-uia-29 — Tests e2e et unitaires dépendants de sélecteurs `status` ambigus
- `src/ui/Notifications.tsx` + tests
- Preuve : la mission Lot 4 (état du projet) note 15 échecs causés par des sélecteurs `status` rendus ambigus après le calque unique de notifications ; les tests ont été adaptés plutôt que rendus indépendants du nombre de régions `status`.
- Gravité : 3
- Effort : M

### Q-uia-30 — `journal-zones.ts` : validation de forme de 50 lignes illisible
- `src/ui/journal-zones.ts:66-98`
- Preuve : une seule expression booléenne imbriquée valide le relevé ; modifier le schéma oblige à retoucher cette expression à la main ; code de dev dans le bundle de production (garde `import.meta.env.PROD` seulement à l'exécution, le module est quand même importé).
- Gravité : 3
- Correctif : schéma de validation partagé, import dynamique en dev.
- Effort : M

### Q-uia-31 — `Interrupteur`, `FiltreCategories`, `Etapes` : composants génériques réimplémentés ailleurs
- `src/ui/Interrupteur.tsx` (correct, `role="switch"`), mais d'autres pages codent leurs propres bascules (`ReglagesCombat` : à confirmer)
- Gravité : 3
- Effort : S

### Q-uia-32 — Création d'objets `Intl` à chaque rendu
- `src/ui/Diplome.tsx:42`
- Preuve : `new Intl.DateTimeFormat(...)` instancié dans le rendu ; à sortir au niveau du module comme `formateurArgent`.
- Gravité : 3
- Effort : S

---

## Décompte

- BUGS : 36 candidats
- SÉCURITÉ : 13 entrées (dont 4 constats négatifs ; aucun défaut de gravité 1, deux de gravité 2 : CSP absente et pas d'ErrorBoundary)
- QUALITÉ : 32 candidats

Limites : tests et CSS A–O lus par échantillon ; `store.ts`, `precharger.ts`, `raccourcis.ts` et le core lus seulement pour comprendre les appels ; aucun candidat marqué « à confirmer » n'a été rejoué dans un navigateur.
