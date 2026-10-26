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

## Les erreurs de l'IA que j'ai repérées

* 

## Les défauts trouvés dans le code et les données de départ

|Défaut|Où|Pourquoi c'est un problème|Ma correction|Le test qui le prouve|
|-|-|-|-|-|
|Un commercial voit les clients sans propriétaire (7 clients : c06, c07, c11, c19, c25, c28, c29)|acces.js ligne 5 (`\|\| !c.proprietaire`) ; comparaison `==` au lieu de `===`|Fuite de données clients : Awa voyait 22 clients dont 7 qui ne sont pas à elle, Ibrahima 14 dont les mêmes 7. Le commentaire du fichier disait le contraire du code.|Suppression de la clause `!c.proprietaire`, comparaison stricte `===`|tests/acces.test.js (3 tests sur 4 échouaient avant la correction)|

## Ce que je ferais avec plus de temps

* 

