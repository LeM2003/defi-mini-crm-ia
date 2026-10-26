// Historique des modifications (qui, quoi, quand).
// Fonctions pures : la date est toujours passée en paramètre, aucun argument n'est modifié.
// Les phrases renvoyées par decrire() sont du texte brut : à afficher avec textContent, jamais en innerHTML.

function estObjetSimple(valeur) {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function estAbsent(valeur) {
  return valeur === null || valeur === undefined;
}

// Le montant d'origine peut être la chaîne "90000" alors que le nouveau est le nombre 90000.
function memeValeur(a, b) {
  if (a === b) return true;
  if (estAbsent(a) || estAbsent(b)) return estAbsent(a) && estAbsent(b);
  return String(a) === String(b);
}

function typeDeLEntree(champsChanges) {
  if (champsChanges.every((champ) => champ === "etape")) return "deplacement";
  if (champsChanges.every((champ) => champ === "proprietaire")) return "reattribution";
  return "fiche";
}

export function creerEntree(utilisateur, client, champs, maintenant) {
  if (!estObjetSimple(utilisateur) || !estObjetSimple(client) || !estObjetSimple(champs)) return null;
  const changements = [];
  for (const champ of Object.keys(champs)) {
    const apres = champs[champ];
    const avant = Object.hasOwn(client, champ) ? client[champ] : undefined;
    if (apres === undefined || memeValeur(avant, apres)) continue;
    changements.push({ champ, avant: estAbsent(avant) ? null : avant, apres });
  }
  if (changements.length === 0) return null;
  return {
    quand: maintenant.toISOString(),
    qui: { id: utilisateur.id, nom: utilisateur.nom },
    client: { id: client.id, entreprise: client.entreprise },
    type: typeDeLEntree(changements.map((changement) => changement.champ)),
    changements,
  };
}

// --- Phrases lisibles : jamais d'exception, une valeur manquante ou illisible devient « ? » ---

function texte(valeur) {
  if (typeof valeur === "string" && valeur !== "") return valeur;
  if (typeof valeur === "number" || typeof valeur === "boolean" || typeof valeur === "bigint") return String(valeur);
  return "?";
}

function valeur(brute, entreGuillemets) {
  if (estAbsent(brute)) return "aucun";
  const t = texte(brute);
  return entreGuillemets && typeof brute === "string" && t !== "?" ? `« ${t} »` : t;
}

function nomProprietaire(id, utilisateurs) {
  if (estAbsent(id)) return "aucun";
  const trouve = Array.isArray(utilisateurs) ? utilisateurs.find((u) => estObjetSimple(u) && u.id === id) : undefined;
  return trouve && typeof trouve.nom === "string" && trouve.nom !== "" ? trouve.nom : texte(id);
}

function segment(changement, utilisateurs) {
  const champ = texte(changement.champ);
  if (changement.champ === "proprietaire") {
    return `${champ} ${nomProprietaire(changement.avant, utilisateurs)} → ${nomProprietaire(changement.apres, utilisateurs)}`;
  }
  return `${champ} ${valeur(changement.avant, true)} → ${valeur(changement.apres, true)}`;
}

export function decrire(entree, utilisateurs) {
  try {
    const e = estObjetSimple(entree) ? entree : {};
    const qui = texte(e.qui?.nom);
    const client = texte(e.client?.entreprise);
    const changements = Array.isArray(e.changements) ? e.changements.filter(estObjetSimple) : [];
    const de = (champ) => changements.find((changement) => changement.champ === champ);
    if (e.type === "deplacement") {
      const changement = de("etape");
      return `${qui} a déplacé ${client} de ${changement ? valeur(changement.avant) : "?"} à ${changement ? valeur(changement.apres) : "?"}.`;
    }
    if (e.type === "reattribution") {
      const changement = de("proprietaire");
      const avant = changement ? nomProprietaire(changement.avant, utilisateurs) : "?";
      const apres = changement ? nomProprietaire(changement.apres, utilisateurs) : "?";
      return `${qui} a réattribué ${client} de ${avant} à ${apres}.`;
    }
    const detail = changements.map((changement) => segment(changement, utilisateurs)).join(" ; ");
    return `${qui} a modifié la fiche de ${client}${detail ? ` : ${detail}` : ""}.`;
  } catch {
    return "Modification illisible.";
  }
}
