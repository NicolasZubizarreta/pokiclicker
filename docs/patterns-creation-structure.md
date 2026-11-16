# Deux patterns de structure pour PokiClicker v2

Atelier 2 du cours SOLID Architecture. Je pars de `docs/anti-patterns.md` (atelier 1) et je cherche deux endroits du code où un pattern de création ou de structure aiderait vraiment. Rien n'est corrigé : ce document décrit ce que je ferais et ce que ça coûterait. Travail fait sur `atelier-2/patterns`, à partir de `atelier-1/diagnostic`. Aucun fichier de code n'a été touché.

Les noms de classes ci-dessous (`ServiceCombat`, `ServeurSauvegarde`…) sont des propositions. Les durées sont mes estimations, je ne les ai pas mesurées.

## Les deux choix en bref

| | Endroit | Problème | Pattern |
|---|---|---|---|
| 1 | `src/ui/store.ts` | God module : porte d'entrée et déroulé des règles dans le même fichier (AP-2, AP-3, AP-7) | Façade |
| 2 | appels au serveur dans `synchro.ts`, `appareil.ts`, `api-compte.ts` | le même appel HTTP recopié 4 fois, et la synchro lit les codes HTTP | Adapter |

Le premier vient directement de l'atelier 1. Le second, je l'ai trouvé en cherchant où le code parle au monde extérieur : il n'est pas dans la liste des anti-patterns.

## 1. Façade sur le store

### Le problème

Les écrans de l'interface (85 fichiers importent `store.ts`) ne parlent qu'au store. C'est déjà une porte d'entrée unique, et c'est une bonne chose. Mais le fichier fait 1278 lignes et expose près de 100 membres (`AffichageJeu`). Surtout, il contient le déroulé du jeu. Dans `traiter` (lignes 321 à 471), quand un combat produit un événement, le store appelle lui-même `appliquerCapture` (l. 344), `appliquerVictoire` (l. 355) et `pension.pondre` (l. 361). Il joue aussi les sons, prépare les messages et décide s'il faut sauvegarder, le tout dans la même boucle.

Les fichiers `store-capture.ts`, `store-boutique.ts` et les autres ne règlent pas ça. Ils contiennent surtout des fonctions `afficherX` qui préparent des données pour l'écran. Le déroulé, lui, est resté dans `store.ts`.

### Le pattern choisi

Une Façade, au sens de la diapo 39 : une porte simple devant plusieurs objets, qui « reste mince, sans règle métier ». Le store garde son rôle de porte d'entrée, avec les mêmes noms pour les écrans. Mais il se contente de passer l'ordre à un service qui porte le déroulé, puis d'exécuter le résultat.

### Pourquoi pas un autre

- Découper en slices zustand. Ça répartit l'état en tranches. Or le store ne garde pas son état dans zustand mais dans une quarantaine de variables internes (`let`), et le vrai problème est le déroulé, pas l'état. Il faudrait en plus modifier les 85 fichiers qui l'importent. La Façade laisse l'interface publique telle quelle.
- Mediator. Il sert quand des objets de même niveau se parlent entre eux. Ici tout converge vers un seul chef d'orchestre : un Mediator ajouterait un objet sans réduire `store.ts`.

### Avant

```text
  écrans (85 fichiers)
        │
        ▼
  ┌─────────────────────────── store.ts (1278 lignes) ──┐
  │  reçoit les ordres                                   │
  │  traiter() : règles du jeu (capture, victoire, ponte)│
  │  + sons + gains + messages + drapeau « sauvegarder » │
  │  afficher() : prépare ~100 données pour les écrans   │
  └──────────────┬───────────────────────────────────────┘
                 ▼
            core/ (capture, recompenses, pension…)
```

```text
traiter():
  pour chaque événement du combat :
    si capture réussie :
        jouer le son, afficher le gain
        region = appliquerCapture(region, ...)
        ajouter les messages, noter dans le Pokédex
    si ennemi vaincu :
        jouer le son, afficher le gain
        region = appliquerVictoire(region, ...)
        si la pension est ouverte : region = pondre(region, ...)
        construire les messages (éclosion, niveau, bonbons...)
        décider s'il faut sauvegarder
```

### Après

```text
  écrans (85 fichiers, inchangés)
        │
        ▼
  ┌──────── store.ts (façade mince) ────────┐
  │  reçoit l'ordre → le passe au service   │
  │  reçoit le résultat → joue, publie      │
  └───────────────┬─────────────────────────┘
                  ▼
          ServiceCombat (nouveau)
          │  déroule capture / victoire / ponte
          │  renvoie { region, sons, gains, messages, sauvegarder }
          ▼
        core/ (inchangé)
```

```text
store.traiter():
  resultat = serviceCombat.traiter(region, evenements)
  region = resultat.region
  pour chaque son de resultat.sons : le jouer
  pour chaque message de resultat.messages : l'afficher
  si resultat.sauvegarder : sauvegarder
```

Le service ne joue aucun son et n'affiche rien : il renvoie ce qu'il faut jouer, et le store l'exécute. Le déroulé peut alors se tester sans interface.

### Ce que ça coûte

- Fichiers en plus : un service (par exemple `service-combat.ts`) et son fichier de test. `store.ts` perd environ 150 lignes, celles de `traiter`. Il reste gros : `afficher` (l. 472 à 601) et le reste n'en sortent pas, sauf si on extrait aussi un service d'affichage.
- Indirection : un appel de plus entre l'écran et la règle. Pour comprendre un combat, il faut ouvrir deux fichiers au lieu d'un, et lire le résultat en deux temps (le service décide, le store exécute).
- Notions à connaître : la Façade et sa règle « mince », la séparation entre décider et exécuter, une fonction qui renvoie un résultat au lieu d'agir.
- Le vrai coût est l'état partagé. `traiter` modifie une quarantaine de variables du store (`region`, `banniere`, `fileEclosions`…). Pour sortir le déroulé, il faut choisir ce que le service reçoit et ce qu'il rend. C'est là que le risque de casser quelque chose se concentre.
- Ce qui réduit le risque : 23 fichiers de tests couvrent déjà le store (`store-capture.test.ts`, `store-pension.test.ts`, `store-sons.test.ts`…). On les relance après chaque petit pas, comme le recommande le cours.
- Estimation : 2 à 4 jours, avec un refactoring par commit.

### Quand je ne le ferais pas

Si `store.ts` ne bougeait presque plus, ça ne vaudrait pas son prix. Il est justifié ici parce que c'est le premier hotspot de l'atelier 1 : 59 commits, complexité 533.

## 2. Adapter sur le serveur

### Le problème

Le même appel au serveur est recopié à quatre endroits : `synchro.ts:91`, `synchro.ts:266`, `appareil.ts:32` et `api-compte.ts:16`. Chaque copie répète l'URL, l'en-tête `Authorization`, `credentials: 'omit'`, `cache: 'no-store'` et le délai de 8 secondes.

Le plus gênant est ailleurs. `synchro.ts` (492 lignes) décide quand envoyer, charger ou signaler une divergence, mais il lit aussi directement les réponses HTTP. Il connaît le statut 409, le code `'ailleurs'` et la forme du JSON (19 lectures de `.status`, `.ok` ou `.json()` dans ce seul fichier). Les tests le montrent : `synchro.test.ts` (820 lignes) cite `fetch` 105 fois et `appareil.test.ts` 21 fois, parce que chaque test doit fabriquer de fausses réponses HTTP à la main.

### Le pattern choisi

Un Adapter, comme sur la diapo 37 : un port qui parle métier, un adapter qui parle fournisseur. La synchro demande « envoyer la partie » ou « lister les parties ». L'adapter HTTP traduit en appels `fetch`, en codes 409 et 404 et en JSON. D'après la diapo 40, c'est le pattern dont l'interface est différente de celle de l'objet enveloppé : le serveur parle en routes et en statuts, la synchro veut parler en parties et en révisions.

### Pourquoi pas un autre

- Une simple fonction utilitaire `appelerServeur()`. C'est l'option la moins chère, et elle supprimerait la copie des quatre blocs. Mais `synchro.ts` continuerait à lire des 409. Je la garderais si le serveur ne changeait jamais et si seule la duplication gênait.
- Decorator. Il ajoute un comportement (nouvelle tentative, journal) avec la même interface. On pourrait en poser un plus tard sur le port pour le délai ou le retry. Il ne traduit rien, donc il ne règle pas le problème d'aujourd'hui.
- Proxy distant. Même structure que le Decorator, mais l'interface exposée est identique à celle de l'objet. Ici elle ne l'est pas.
- Façade. Elle cache plusieurs objets derrière un seul. Ici il n'y a qu'un serveur.

### Avant

```text
  synchro.ts ──────────► fetch(url + '/api/sauvegarde', PUT, en-têtes,
  appareil.ts ─────────►   credentials, cache, délai 8 s...)
  api-compte.ts ───────►        │
                                ▼
                            serveur HTTP
```

```text
synchro.envoyer():
  corps = JSON des changements
  reponse = fetch(url, PUT, en-têtes, délai, keepalive...)
  si statut 200 : lire le JSON, mémoriser les révisions
  sinon si statut 409 :
      si corps.code == 'ailleurs' → statut « ailleurs »
      sinon si conflits[niveau == 'partie', revisionServeur == 0] → partie supprimée
      sinon → divergence
  sinon si statut 404 : ...
```

### Après

```text
  synchro.ts ───► ServeurSauvegarde (port) ◄─── HttpServeurSauvegarde (adapter)
  appareil.ts ──►   envoyer / lister / lire        │
                    / declarerAppareil             ▼
                                              fetch + serveur HTTP
```

```text
port ServeurSauvegarde :
  envoyer(changements)  → 'accepte' | 'ailleurs' | 'partie-supprimee'
                          | 'divergence' | 'hors-ligne'
  lister(appareilId)    → liste de parties
  lire(id)              → une version de la partie
  declarerAppareil(...) → actif oui ou non

adapter HTTP :
  seul endroit qui connaît l'URL, les en-têtes, le délai, 409, 404 et la forme du JSON

synchro.envoyer():
  resultat = serveur.envoyer(changements)
  selon resultat : mettre à jour le statut et la mémoire
```

Je laisse `api-compte.ts` hors du schéma pour ne pas le charger. Il suivrait le même principe avec ses propres erreurs d'authentification (route `/api/auth/`).

### Ce que ça coûte

- Fichiers en plus : deux fichiers de source (le port et l'adapter HTTP) et un faux serveur pour les tests. Trois fichiers à modifier : `synchro.ts` (deux appels), `appareil.ts` et, si on étend, `api-compte.ts`.
- Indirection : un niveau de plus entre la synchro et le réseau. À l'inverse, les quatre copies disparaissent : le code réseau est lu à un seul endroit.
- Notions à connaître : port et adapter (architecture hexagonale), l'injection du port dans la synchro à la place de `urlApi` et `fetch`, un résultat à plusieurs cas typés à la place des codes HTTP.
- Le vrai coût est dans les tests. Il faut réécrire une grande partie des 820 lignes de `synchro.test.ts` pour utiliser le faux serveur. C'est aussi le gain : un test écrit « le serveur répond ailleurs » au lieu de fabriquer une réponse 409 avec un corps JSON.
- Estimation : 2 à 3 jours, dont plus de la moitié pour les tests.

## Ce que ces deux changements ne coûtent pas

Aucune nouvelle dépendance, aucune règle de jeu modifiée, aucun écran changé. L'interface publique du store reste la même pour les 85 fichiers qui l'importent.

## Ce que j'ai laissé de côté

Une Façade en hook pour le composant `Scene` de `EcranCombat.tsx` (AP-5 et AP-10, 17 `useStore` à la suite). C'est plus petit et ça tient dans la même idée que le premier choix. Je l'ai gardé pour plus tard.
