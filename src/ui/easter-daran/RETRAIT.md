# Retirer l'anniversaire de Daran

Fonctionnalité jetable. Rien d'autre n'est à toucher : pas de migration, pas de version de sauvegarde, pas de donnée dans `data/`.

## Avant de commencer : renseigner le compte
Le nettoyage ne se lance que si `COMPTE_DARAN` (dans `compte-daran.ts`) est renseigné. Vide, il ne fait rien.
- Dans le jeu connecté avec le compte de Daran : console du navigateur, `localStorage.getItem('pokiclicker.proprietaire')` donne l'identifiant.
- Ou dans la base : `SELECT id, email FROM "user" WHERE email = '<e-mail de Daran>';` (la colonne `id` est aussi `donnees_compte.compte_id`). Copier cette valeur dans `COMPTE_DARAN` (la casse n'a pas d'importance).

## Retrait en deux étapes
1. Supprimer le dossier :
   ```powershell
   Remove-Item -Recurse -Force src/ui/easter-daran
   ```
2. Supprimer chaque ligne marquée `DARAN-TEMP` **et la ligne qui la suit** (6 endroits dans 3 fichiers : `App.tsx`, `FichePokemon.tsx`, `store.ts`). Pour les repérer : `rg -n "DARAN-TEMP" src`. Pour les enlever d'un coup :
   ```powershell
   node -e "const fs=require('fs');for(const f of ['src/ui/App.tsx','src/ui/FichePokemon.tsx','src/ui/store.ts']){const l=fs.readFileSync(f,'utf8').split('\n'),o=[];for(let i=0;i<l.length;i++){if(l[i].includes('DARAN-TEMP')){i++;continue;}o.push(l[i]);}fs.writeFileSync(f,o.join('\n'));}"
   ```
3. Vérifier : `rg "DARAN-TEMP|easter-daran" src` ne renvoie plus rien ; `npx tsc --noEmit -p tsconfig.json` et `npx vitest run src/ui` passent.

## Ce qui reste dans les parties déjà nettoyées
Le drapeau `daran-anniversaire-22` dans `drapeaux` de la région. C'est un texte libre sans effet : on peut le laisser.
