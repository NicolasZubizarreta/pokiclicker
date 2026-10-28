# Essai de Nicolas, 28/10/2026, rapport 2 (notes brutes)

Texte de Nicolas recopié point par point, sans le réduire. Jeu testé sur grand écran, de la Route 1 jusqu'à la Sylphe SARL. Le patch 1 (rapport 1) est commité (36d570c). Ce rapport 2 n'est pas encore traité.

## Ses points, dans son ordre

1. « j'aime pas trop comment sont placés les différents bouton d'action, auto attaque autoclick fauchage capturer etc... ça fait zone de test c'est pas très beau »
2. « Le son au moment du clique c'est horrible on le garde pas quand on spam clique ça bourdonne dans les oreilles »
3. « On doit pouvoir régler le volume du son et de la musique dans les paramètres il est trop fort de base. »
4. « Le PC doit être accessible depuis la barre de navigation pas dans le plus (grisé de base jusqu'à argenta »
5. « Quand on rencontre le premier boss pour la première fois il faudrait avoir un dialogue avec Chen qui nous explique comment fonctionne les zones (10 pokémons bat le boss en 30 secondes pour débloquer la prochaine zone ...) »
6. « Le jeu est beaucoup trop facile au début on a même pas besoin de cliquer après ça a l'air d'aller, mais pour avancer correctement dans le jeu n'oublie pas que les bonus du pokédex et des items du shop doivent être quasiment indispensable là se n'est pas vraiment le cas »
7. « Il manque des notifs quand on débloque le PC ou d'autre fonctionnalité »
8. « Animation des badges elle est bien »
9. « Je viens de remarquer tu as retiré mon guide complet sur le jeu que j'avais fait pour la V1 ? »
10. « Niveau difficulté du jeu a partir de mont sélénite ça va c'est pas trop facile c'est surtout les 2 premières zones en faites ça m'a surpris »
11. « En faite je crois que je préférais l'interface de la V1 ou du moins son agencement je sais plus exactement ce que c'était moyen que tu me montres comme ça si je vois des éléments a reprendre je te dis ? »
12. « L'évolution des pokémons doit être notifier et possible sur l'écran de combat parce que la tu vois mes pokémons sont montés niveau 30 aucun n'a encore évoluer parce que je savais pas qu'il fallait allait dans équipe »
13. « Animation évolution niquel »
14. « Faudrait mettre un sprite de Blue quand y'a les dialogues pour l'aFFronter et aussi une séquence au début qui le présente parce qu'on sait pas qui cest la première qu'il nous déFie »
15. « Les pokémons qu'on a déjà capturé il Faut une petite icone pokéball a côté de leur nom pour montrer qu'ils sont capturés je l'avais Fait sur la V1 »
16. « Le pokéradar sur la V1 j'avais mis une vraie icone sympa la c'est un bouton au milieu de l'écran moche et la liste des pokémons l'étiquette de rareté doit y avoir des couleurs pas tout gris »
17. « VériFie le taux de capture de leveinard jsuis pas sur mais j'ai claqué 20 superball il est pas rentré »
18. « L'argent c'est un petit peu trop dur à avoir je mettrais un x2 sur les gains globaux sinon pour acheter des pokéball et des bonus il Faut rester Farm longtemps sur une zone et du coup l'xp des pokémons augmente trop donc on one shot la zone d'après mais avec toujours pas assez d'argent pour acheter des items »
19. « Comme sur la V1 je veux un petit crayon a côté du nom du pokémon pour pouvoir le renommer sinon on peut pas utiliser les easter egg »
20. « Autoclick (vérrouillé de base) et auto attaque devrait être des icones comme sur ma V1 et plutot placé entre "ton équipe" et le nombre de DPS »
21. « L'arrêt auto icone aussi, Fauche et le poké-radar invisible de base »
22. « Quand on débloque des zones tier comme centre commercial ou casino ce n'est pas notiFié donc si on ouvre pas la carte on le sait jamais »
23. « Le calcium a 20k pas 50k »
24. « Les pierres a 10k »
25. « Le dialogue ronFlex doit apparaitre après avoir battu le boss de la centrale pas au début »
26. « Un truc super important on a pas de sac d'objet ?? »
27. « C'est quoi le taux des légendaires ? Parce qu'en Farmant un moment j'en ai trouvé aucun »
28. « Le Fonctionnement du jeu est mieux mais en Faite l'interFace j'aime pas trop les boutons sont moches les inFos sont chiantes a aller chercher je crois que la dessus je préFérais la V1 tout était a porté de main »
29. « Quand on va a un endroit et que l'animation de vol s'active, le cercle vert qui clignote doit passer en dessous du sprite la il passe pas dessus c'est moche »
30. « La pokéFlute c'est nul ça nous dit même pas comment l'utiliser en plus on clique juste dessus dans équipe et ça marche Faudrait qu'on soit plutot sur une inter zone dédié avec le ronFlex au milieu et on joue de la pokéFlute pour le réveillé »
31. « A partir de la centrale le jeu devient un peu trop dur mes pokémons sont over level je ne peux pas battre les boss sans attaque + et attaque spé + et mon pokédex et aussi assez rempli j'ai capturé tout les pokémons des zones précédentes »
32. « Recharge de Fauchage on met 20 secondes pas 30 »
33. « Au niveau de la diFFiculté comme je disais en haut c'est un peu trop dur mais Faut pas la réduire trop non plus 20% moins dur ou quelque chose comme ça »
34. « Je m'arrête la pour le rapport il est déjà assez costaud je suis a la sylphe SARL donc je te review la suite après avoir corrigé ça »

Deux captures jointes : l'écran de la Route 1 (Piafabec niv. 2, boutons Pokéball ×5, Capturer, Auto-attaque, Auto-clic « Nécessite l'objet Restes », Arrêt auto, Réglages de l'arrêt, Fauchage « Nécessite la CT Fauchage », Poké-Radar « Nécessite le Poké-Radar », bandeau Prof. Chen avec Zone précédente / suivante) et la liste de la Forêt de Jade avec les étiquettes de rareté (Commun, Peu Commun, Rare, Très Rare) toutes grises.

## Traitement

Tickets AA à AL écrits le 28/10 dans `backlog-phase-2.md` (section « Retours d'essai du 28/10/2026 »), en attente de ta validation : rien n'est codé. Correspondance : A (valeurs et règles) = AA, AB ; B (écran de combat) = AD, AE, AF, AG ; C (sons) = AC ; D (narration) = AH, AI, AJ ; E (divers) = AK, AL.

## Vérifications faites dans le code (28/10)

| Point | Constat |
|---|---|
| 9, guide du jeu | Pas retiré : jamais porté. Il est dans `legacy/index.html:800-890` (modale « GUIDE DU JEU », une dizaine de sections). `v1-visuel-a-porter.md` le liste à porter, aucun ticket ne l'a pris. |
| 23, calcium | `data/objets.json` : 50 000, sans inflation par badge. Identique à la V1 (`constants.js:12`). Demande : 20 000. |
| 24, pierres | `data/objets.json` : 10 000 de base, identique à la V1, mais avec inflation de 5 % par badge (`inflationParBadge`). À la Sylphe (6 badges ou plus) elles coûtent déjà plus que 10 000. À trancher : supprimer l'inflation des pierres ou autre chose. |
| 32, Fauchage | `data/reglages.json` : `rechargeFauchageMs` 30 000. Demande : 20 000. |
| 17, Leveinard | Taux de base 30/255 (12 %), apparition 0,05, Très Rare, identique à la V1. Formule : base × facteur PV × coefficient de balle ÷ (1 + niveau/25). Une Super Ball sur un Leveinard niveau 20 à PV pleins fait environ 4 % ; à PV presque nuls, environ 13 %. 20 échecs de suite à PV pleins n'a rien d'anormal. Pas un bug de taux. |
| 27, légendaires | Dans `zones.json` : Mew 0,01, Artikodin 0,02, Électhor 0,05, Mewtwo 0,05, Sulfura 0,05 (poids d'apparition ; capture 3 pour les oiseaux et Mewtwo, 45 pour Mew). À simuler pour donner une probabilité par combat. |
| 18, argent | Capture : or × 2 déjà appliqué (comme la V1). Pas de multiplicateur global. |
| 26, sac | `reglages.json` : « Le Sac s'ouvre à la Route 1 ». Nicolas n'a pas vu de sac : à vérifier dans l'écran de combat. |
