// Indicateurs du tableau de bord.
// Les montants peuvent arriver en chaîne ("90000") : on les convertit avant d'additionner.
const montant = (c) => Number(c.montant_fcfa);

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
