// Actions sur les clients : déplacement, fiche, réattribution.
// Fonctions pures : elles vérifient les droits (acces.js) et les valeurs, puis renvoient les champs à
// enregistrer. Elles ne modifient jamais le client reçu et lèvent ActionRefusee si l'action est interdite.
import { peutModifier, peutReattribuer } from "./acces.js";
import { ETAPES, enNombre } from "./tableau.js";

export class ActionRefusee extends Error {}

const FORMAT_TELEPHONE = /^\+?[0-9 ]{8,20}$/;

function exiger(autorise, message) {
  if (!autorise) throw new ActionRefusee(message);
}

export function deplacerClient(utilisateur, client, etape) {
  exiger(peutModifier(utilisateur, client), "Vous ne pouvez pas modifier ce client.");
  exiger(ETAPES.includes(etape), `Étape inconnue : ${JSON.stringify(etape)}.`);
  return { etape };
}

export function modifierFiche(utilisateur, client, fiche) {
  exiger(peutModifier(utilisateur, client), "Vous ne pouvez pas modifier ce client.");
  const contact = typeof fiche?.contact === "string" ? fiche.contact.trim() : "";
  const telephone = typeof fiche?.telephone === "string" ? fiche.telephone.trim() : "";
  exiger(contact !== "", "Le contact est obligatoire.");
  exiger(FORMAT_TELEPHONE.test(telephone), "Le téléphone est obligatoire (chiffres, espaces, « + » au début).");
  let montant;
  try {
    montant = enNombre(fiche.montant_fcfa);
  } catch (e) {
    throw new ActionRefusee(`Montant invalide : un nombre positif ou nul est attendu (${e.message}).`);
  }
  return { contact, telephone, montant_fcfa: montant };
}

export function reattribuerClient(utilisateur, client, cibleId, utilisateurs) {
  exiger(
    peutReattribuer(utilisateur, client, cibleId, utilisateurs),
    "Seul le responsable peut réattribuer un client, et uniquement à un commercial existant."
  );
  return { proprietaire: cibleId };
}

// Étape précédente (decalage = -1) ou suivante (+1) ; null aux extrémités ou si l'étape est inconnue.
export function etapeVoisine(etape, decalage) {
  const i = ETAPES.indexOf(etape);
  return i === -1 ? null : (ETAPES[i + decalage] ?? null);
}
