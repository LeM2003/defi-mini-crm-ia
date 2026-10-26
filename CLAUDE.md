# Règles de travail — défi mini-CRM (Orbus Digital)

## Contexte
- Application statique en JavaScript sans framework (index.html, app.js, acces.js, tableau.js, donnees/).
- On GARDE cette base : pas de framework, pas de build. Publication sur here.now.
- Tests : `npm test` (node --test, dossier tests/). Lancer en local : `npm run serve`.
- Le journal s'appelle JOURNAL-IA.md (pas JOURNAL.md). Le remplir au fil de l'eau.

## Méthode pour chaque défaut (obligatoire)
1. Écrire d'abord le test qui ÉCHOUE, lancer `npm test`, montrer l'échec.
2. Committer le test seul : `test: <défaut> (échoue avant correction)`.
3. Corriger, relancer `npm test`, montrer que tout passe.
4. Committer la correction : `fix: <défaut>`.
5. Ajouter une ligne dans le tableau « défauts » de JOURNAL-IA.md.

## Règles
- Un plan de 10 lignes maximum et mon accord avant de coder une fonctionnalité.
- Petits commits clairs, au moins toutes les 30 minutes. Jamais de squash, jamais de push --force.
- Ne dis jamais « ça marche » sans l'avoir exécuté ; dis ce que tu n'as pas pu tester.
- Pas de dépendance ajoutée, pas de code mort.
- Données affichées avec textContent, jamais injectées en innerHTML (données clients).
- Les droits sont appliqués dans des fonctions pures testées (acces.js), pas seulement dans l'interface.
- Limite à écrire dans le README : sans serveur, les rôles sont simulés côté navigateur.

## Deux agents
- Antigravity relit le code en lecture seule. Il ne modifie aucun fichier.
