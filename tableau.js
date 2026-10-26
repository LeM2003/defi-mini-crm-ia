// Indicateurs du tableau de bord.
export const ETAPES = ["prospect", "qualifie", "proposition", "gagne", "perdu"];

// Un montant est un nombre fini >= 0. Une chaîne numérique ("90000") est convertie ; tout le reste est invalide
// (Number() transformerait null ou "" en 0 sans prévenir). Renvoie le nombre, ou null si le montant est invalide.
function lireMontant(valeur) {
  const nombre = typeof valeur === "string" && valeur.trim() !== "" ? Number(valeur) : valeur;
  return typeof nombre === "number" && Number.isFinite(nombre) && nombre >= 0 ? nombre : null;
}

export function enNombre(valeur) {
  const nombre = lireMontant(valeur);
  if (nombre === null) throw new RangeError(`Montant invalide ${JSON.stringify(valeur)}`);
  return nombre;
}

// Un client au montant invalide est exclu des totaux (jamais de NaN) et signalé par le tableau de bord.
export function montantsInvalides(clients) {
  return clients.filter((c) => lireMontant(c.montant_fcfa) === null).map((c) => ({ id: c.id, valeur: c.montant_fcfa }));
}
const avecMontantValide = (clients) => clients.filter((c) => lireMontant(c.montant_fcfa) !== null);

// « 17650000 » -> « 17 650 000 FCFA ». Intl met des espaces insécables : on les remplace par des espaces normaux.
export function formaterFCFA(valeur) {
  return new Intl.NumberFormat("fr-FR").format(enNombre(valeur)).replace(/\s/g, " ") + " FCFA";
}

export function totalParEtape(clients) {
  const total = {};
  for (const c of avecMontantValide(clients)) {
    total[c.etape] = (total[c.etape] || 0) + lireMontant(c.montant_fcfa);
  }
  return total;
}

export function totalPipeline(clients) {
  return avecMontantValide(clients)
    .filter((c) => c.etape !== "perdu")
    .reduce((somme, c) => somme + lireMontant(c.montant_fcfa), 0);
}
