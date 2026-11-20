# Retirer l'anniversaire de Daran

Fonctionnalité jetable. Rien d'autre n'est à toucher : pas de migration, pas de version de sauvegarde, pas de donnée dans `data/`.

## Avant de commencer
La constante `COMPTE_DARAN` est déjà renseignée avec le hash SHA-256 de l'e-mail du compte (aucune adresse en clair dans le dépôt).
L'e-mail est lu au moment du renommage auprès du serveur (`/api/auth/get-session`) : il faut être connecté et en ligne. Hors ligne ou autre compte = rien ne se passe.

un hash d'e-mail se retrouve par essai d'adresses : il évite l'adresse en clair, il ne la protège pas contre quelqu'un qui la devine

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

Pour vérifier ou recalculer le hash (e-mail sans espaces, en minuscules) :
```
node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1].replace(/\s/g,'').toLowerCase()).digest('hex'))" "<e-mail>"
```
Test avec la vraie adresse, sans l'écrire dans un fichier : `DARAN_EMAIL_TEST=<e-mail> npx vitest run src/ui/easter-daran/compte-daran.test.ts`.
