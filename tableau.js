// Indicateurs du tableau de bord.
// Les montants peuvent arriver en chaîne ("90000") : on les convertit avant d'additionner.
const montant = (c) => Number(c.montant_fcfa);

// « 17650000 » -> « 17 650 000 FCFA ». Intl met des espaces insécables : on les remplace par des espaces normaux.
export function formaterFCFA(nombre) {
  return new Intl.NumberFormat("fr-FR").format(nombre).replace(/\s/g, " ") + " FCFA";
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
