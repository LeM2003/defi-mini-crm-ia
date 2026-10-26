# Journal d'usage de l'IA

*À remplir au fil de l'eau, pas à la fin. Soyez honnête : une erreur de l'IA que vous avez repérée compte plus qu'un code parfait
dont vous ne savez pas d'où il vient.*

* **Nom :Mouhamadou Diouf** 
* **Outil(s) d'IA utilisé(s), et pour quoi :Claude Code (écriture du code et des tests), Antigravity (relecture indépendante du code), Claude (plan, lecture du code, vérification)**
* **Heure de départ :09 h 40**

## Chronologie

|Heure|Ce que j'ai demandé à l'IA (en résumé)|Ce qu'elle a produit|Ce que j'ai vérifié, corrigé ou refusé|
|-|-|-|-|
| 9 h 42 | Lire tout le code et lister les défauts, sans coder | 16 points classés par gravité, dont mes 4 soupçons confirmés par exécution | J’ai recalculé les totaux à la main (17 650 000 FCFA) : ses chiffres sont justes. J’ai tranché ses 3 questions. |
| 9 h 48 – 9 h 50 | Se diviser en 3 sous-agents pour les défauts 2 (tableau de bord), 3 (montants dans tableau.js) et 4 (données clients.json), chacun avec la méthode « test qui échoue → commit → correction → commit » | 3 sous-agents ont travaillé **en parallèle**, chacun dans son propre worktree git et sa propre branche : 8 commits en tout (2 + 2 + 4), aucun push. Elle a ensuite fusionné les 3 branches dans `main` par des commits de fusion normaux (sans squash ni rebase). | J’ai demandé de vérifier : pour chaque défaut, le commit de test est bien AVANT le commit de correction, il échoue quand on le rejoue seul (`npm test`), et tout passe au commit de correction. `npm test` sur `main` : 15 tests sur 15. Vérifié dans le navigateur : Awa (16 clients, tableau de bord masqué), Mariama (30 clients, total de 17650000 FCFA). **À noter :** l’IA avait fusionné avant ma consigne de vérification, et elle a supprimé les branches avant de rejouer les tests ; les commits sont restés dans l’historique, la vérification a donc pu se faire après coup. Le total s’affiche sans espaces (`17650000 FCFA`) : le format lisible reste à faire. |
| 9 h 57 | Publier la version actuelle sur here.now et vérifier qu’elle s’ouvre et charge les données | Publication anonyme (sans compte) de 6 fichiers seulement : `index.html`, `app.js`, `acces.js`, `tableau.js` et les 2 JSON de `donnees/`. Site : https://sacred-pagoda-9adh.here.now/ (en ligne 24 h, jusqu’au 27/10 à 09 h 57 UTC). | Les 6 fichiers répondent 200 avec le bon type ; les 5 fichiers JS et JSON sont identiques à ceux du dépôt (comparaison de hash). `index.html` diffère seulement par des balises `og:` / `twitter:` ajoutées par la plateforme. Dans le navigateur, le site affiche 3 utilisateurs et, pour Awa, Ibrahima et Mariama, 16, 7 et 30 clients, avec le tableau de bord masqué pour les commerciaux. **Non vérifié :** la capture d’écran du site publié a échoué (délai dépassé), la vérification s’est faite par lecture de la page. Le lien de réclamation du site n’est pas dans ce dépôt public. |
| 10 h 02 | Fonction `formaterFCFA(nombre)` dans tableau.js (« 17 650 000 FCFA », espaces normaux) avec son test, et liste lisible des totaux par étape à la place du JSON | Test d’abord (3 tests, ils échouaient : `formaterFCFA is not a function`), puis `formaterFCFA` avec `Intl.NumberFormat("fr-FR")` dont les espaces insécables sont remplacés par des espaces normaux. `app.js` l’utilise pour les cartes et le total ; les étapes sont une liste `<ul>` remplie avec `textContent`. | 18 tests sur 18. Dans le navigateur (serveur local) : Mariama voit `17 650 000 FCFA` et 5 lignes d’étapes, aucune espace insécable ni `NaN` dans la page. **Choisi par l’IA, non demandé :** les étapes sans client s’affichent à 0 FCFA, dans l’ordre du pipeline. **Pas encore fait :** les noms d’étapes restent sans accents (« qualifie »), et le site publié n’est pas encore mis à jour. |

## Les erreurs de l'IA que j'ai repérées

* 

## Les défauts trouvés dans le code et les données de départ

|Défaut|Où|Pourquoi c'est un problème|Ma correction|Le test qui le prouve|
|-|-|-|-|-|
|Un commercial voit les clients sans propriétaire (7 clients : c06, c07, c11, c19, c25, c28, c29)|acces.js ligne 5 (`\|\| !c.proprietaire`) ; comparaison `==` au lieu de `===`|Fuite de données clients : Awa voyait 22 clients dont 7 qui ne sont pas à elle, Ibrahima 14 dont les mêmes 7. Le commentaire du fichier disait le contraire du code.|Suppression de la clause `!c.proprietaire`, comparaison stricte `===`|tests/acces.test.js (3 tests sur 4 échouaient avant la correction)|
|Le tableau de bord est visible de tout le monde|app.js (appel des totaux sans contrôle du rôle), index.html (bloc affiché en dur), acces.js (aucune règle)|Un commercial voyait le total et la répartition de tous les clients, y compris ceux des autres (17 650 000 FCFA, alors que ses propres clients pèsent moins).|Fonction pure `peutVoirTableauDeBord` dans acces.js (responsable uniquement) ; app.js masque le bloc (`hidden`) et ne calcule ni n’écrit les totaux sinon|tests/tableau-de-bord-acces.test.js (4 tests échouaient avant la correction : `peutVoirTableauDeBord is not a function`)|
|Un montant en chaîne de caractères fausse les totaux (code)|tableau.js lignes 5 et 13 (`+` sur `montant_fcfa`)|Avec une chaîne (`"90000"`), le `+` concatène : le total du pipeline donnait `"2900000900007500…"` au lieu de 17 650 000.|`Number()` appliqué à chaque montant dans `totalPipeline` et `totalParEtape`|tests/tableau.test.js (3 tests échouaient avant la correction)|
|Trois montants stockés en chaîne dans les données (c04, c12, c25)|donnees/clients.json lignes 39, 119 et 249|Source des totaux faux : `"90000"`, `"750000"` et `"150000"` au lieu de nombres.|Les 3 valeurs sont devenues des nombres|tests/donnees.test.js, « chaque montant_fcfa est un nombre fini strictement positif » (échouait sur c04 avant la correction)|
|Propriétaire `"u1 "` avec une espace en trop (c16)|donnees/clients.json ligne 160|Avec la comparaison stricte, c16 (Yoff Digital) devenait invisible pour son propriétaire Awa ; seul le responsable le voyait.|`"u1 "` remplacé par `"u1"`|tests/donnees.test.js, « tout propriétaire non nul existe dans utilisateurs.json » (échouait sur c16 avant la correction)|

## Ce que je ferais avec plus de temps

* 

