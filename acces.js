// Règle d'accès du mini-CRM.
// Un commercial ne voit QUE ses propres clients ; le responsable voit tout.
export function clientsVisibles(utilisateur, clients) {
  return clients.filter((c) => utilisateur.role === "responsable" || c.proprietaire === utilisateur.id);
}

// Le tableau de bord (totaux de tout le pipeline) est réservé au responsable.
export function peutVoirTableauDeBord(utilisateur) {
  return utilisateur?.role === "responsable";
}
