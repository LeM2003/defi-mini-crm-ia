// Règle d'accès du mini-CRM.
// Un commercial ne voit QUE ses propres clients ; le responsable voit tout.
export function clientsVisibles(utilisateur, clients) {
  return clients.filter((c) => utilisateur.role === "responsable" || c.proprietaire === utilisateur.id);
}

// Le tableau de bord (totaux de tout le pipeline) est réservé au responsable.
export function peutVoirTableauDeBord(utilisateur) {
  return utilisateur?.role === "responsable";
}

// Le responsable modifie tout ; un commercial modifie seulement ses clients (jamais un client sans propriétaire).
export function peutModifier(utilisateur, client) {
  if (!utilisateur || !client) return false;
  if (utilisateur.role === "responsable") return true;
  return utilisateur.role === "commercial" && client.proprietaire === utilisateur.id;
}

// Seul le responsable réattribue, et uniquement vers un commercial qui existe.
export function peutReattribuer(utilisateur, client, cibleId, utilisateurs) {
  if (utilisateur?.role !== "responsable" || !client) return false;
  return Boolean(utilisateurs?.some((u) => u.id === cibleId && u.role === "commercial"));
}
