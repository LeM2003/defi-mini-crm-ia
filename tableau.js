// Indicateurs du tableau de bord.
// Un montant est un nombre fini >= 0. Une chaîne numérique ("90000") est convertie ; tout le reste est refusé
// (Number() transformerait null ou "" en 0 sans prévenir).
function enNombre(valeur, idClient) {
  const nombre = typeof valeur === "string" && valeur.trim() !== "" ? Number(valeur) : valeur;
  if (typeof nombre !== "number" || !Number.isFinite(nombre) || nombre < 0) {
    throw new RangeError(`Montant invalide ${JSON.stringify(valeur)}` + (idClient ? ` (client ${idClient})` : ""));
  }
  return nombre;
}
const montant = (c) => enNombre(c.montant_fcfa, c.id);

// « 17650000 » -> « 17 650 000 FCFA ». Intl met des espaces insécables : on les remplace par des espaces normaux.
export function formaterFCFA(valeur) {
  return new Intl.NumberFormat("fr-FR").format(enNombre(valeur)).replace(/\s/g, " ") + " FCFA";
}

export function totalParEtape(clients) {
  const total = {};
  for (const c of clients) {
    total[c.etape] = (total[c.etape] || 0) + montant(c);
  }
  return total;
}

export function totalPipeline(clients) {
  return clients
    .filter((c) => c.etape !== "perdu")
    .reduce((somme, c) => somme + montant(c), 0);
}
