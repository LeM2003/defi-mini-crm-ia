// Sauvegarde des modifications utilisateur par-dessus donnees/clients.json.
// Module pur : le stockage (p. ex. localStorage) est toujours passé en paramètre.
// Limite : c'est un stockage local au navigateur, pas une vraie base de données.
import { ETAPES } from "./tableau.js";

export const CLE_STOCKAGE = "mini-crm-modifications-v1";

const CHAMPS_AUTORISES = ["etape", "contact", "telephone", "montant_fcfa", "proprietaire"];

function estObjetSimple(valeur) {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

// Garde uniquement les champs autorisés (propres à l'objet, jamais hérités).
function champsAutorises(champs) {
  const resultat = {};
  if (!estObjetSimple(champs)) return resultat;
  for (const champ of CHAMPS_AUTORISES) {
    if (Object.hasOwn(champs, champ) && champs[champ] !== undefined) resultat[champ] = champs[champ];
  }
  return resultat;
}

// Un id "__proto__" ferait changer le prototype de l'objet au lieu d'ajouter une clé.
function idValide(id) {
  return typeof id === "string" && id !== "" && id !== "__proto__";
}

export function chargerModifications(stockage) {
  const modifications = {};
  let brut;
  try {
    brut = stockage.getItem(CLE_STOCKAGE);
    if (typeof brut !== "string") return modifications;
    brut = JSON.parse(brut);
  } catch {
    return modifications;
  }
  if (!estObjetSimple(brut)) return modifications;
  for (const id of Object.keys(brut)) {
    if (!idValide(id) || !estObjetSimple(brut[id])) continue;
    modifications[id] = champsAutorises(brut[id]);
  }
  return modifications;
}

export function enregistrerModification(stockage, idClient, champs) {
  const filtres = champsAutorises(champs);
  if (!idValide(idClient) || Object.keys(filtres).length === 0) return false;
  const modifications = chargerModifications(stockage);
  const existant = Object.hasOwn(modifications, idClient) ? modifications[idClient] : {};
  modifications[idClient] = { ...existant, ...filtres };
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(modifications));
    return true;
  } catch {
    return false;
  }
}

export function appliquerModifications(clients, modifications) {
  return clients.map((client) => {
    if (!estObjetSimple(modifications) || !Object.hasOwn(modifications, client.id)) return client;
    const filtres = champsAutorises(modifications[client.id]);
    if ("etape" in filtres && !ETAPES.includes(filtres.etape)) delete filtres.etape;
    return { ...client, ...filtres };
  });
}

// --- Historique des modifications (qui, quoi, quand), sous une clé distincte de CLE_STOCKAGE ---

export const CLE_HISTORIQUE = "mini-crm-historique-v1";

const MAX_ENTREES = 200;

function entreeValide(entree) {
  return (
    estObjetSimple(entree) &&
    typeof entree.quand === "string" &&
    estObjetSimple(entree.qui) &&
    estObjetSimple(entree.client) &&
    Array.isArray(entree.changements)
  );
}

export function chargerHistorique(stockage) {
  let brut;
  try {
    brut = stockage.getItem(CLE_HISTORIQUE);
    if (typeof brut !== "string") return [];
    brut = JSON.parse(brut);
  } catch {
    return [];
  }
  if (!Array.isArray(brut)) return [];
  return brut.filter(entreeValide).slice(-MAX_ENTREES);
}

export function enregistrerEntreeHistorique(stockage, entree) {
  if (!entreeValide(entree)) return false;
  const historique = [...chargerHistorique(stockage), entree].slice(-MAX_ENTREES);
  try {
    stockage.setItem(CLE_HISTORIQUE, JSON.stringify(historique));
    return true;
  } catch {
    return false;
  }
}
