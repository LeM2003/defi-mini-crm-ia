import { clientsVisibles, peutModifier, peutReattribuer, peutVoirTableauDeBord } from "./acces.js";
import { ActionRefusee, deplacerClient, etapeVoisine, modifierFiche, reattribuerClient } from "./pipeline.js";
import { appliquerModifications, chargerModifications, enregistrerModification } from "./stockage.js";
import { ETAPES, formaterFCFA, montantsInvalides, totalParEtape, totalPipeline } from "./tableau.js";

// Accéder à localStorage peut lever une exception (données de site bloquées, mode privé…).
function ouvrirStockage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
const stockage = ouvrirStockage();

const [utilisateurs, clientsDeBase] = await Promise.all([
  fetch("donnees/utilisateurs.json").then((r) => r.json()),
  fetch("donnees/clients.json").then((r) => r.json()),
]);
let clients = appliquerModifications(clientsDeBase, chargerModifications(stockage));
let idFiche = null;

const choix = document.getElementById("utilisateur");
for (const u of utilisateurs) choix.add(new Option(`${u.nom} (${u.role})`, u.id));

const erreur = document.getElementById("erreur");
const pipelineEl = document.getElementById("pipeline");
const fiche = document.createElement("section");
fiche.className = "fiche";
pipelineEl.after(fiche);
const montantsInvalidesEl = document.createElement("div");
montantsInvalidesEl.className = "montants-invalides";
document.getElementById("tableau-de-bord").append(montantsInvalidesEl);

function el(balise, classe, texte) {
  const e = document.createElement(balise);
  e.className = classe;
  if (texte !== undefined) e.textContent = texte;
  return e;
}

function bouton(classe, texte, auClic) {
  const b = el("button", classe, texte);
  b.type = "button";
  b.addEventListener("click", auClic);
  return b;
}

// Lance une action : un refus (droits, valeur invalide) s'affiche dans #erreur, sinon on redessine.
function executer(action) {
  erreur.textContent = "";
  try {
    action();
  } catch (e) {
    if (!(e instanceof ActionRefusee)) throw e;
    erreur.textContent = e.message;
    return;
  }
  dessiner();
}

function modifier(client, champs) {
  const enregistre = enregistrerModification(stockage, client.id, champs);
  clients = clients.map((c) => (c.id === client.id ? { ...c, ...champs } : c));
  if (!enregistre) {
    erreur.textContent = "Modification non enregistrée : le stockage du navigateur est indisponible (elle sera perdue au rechargement).";
  }
}

function carte(moi, c, invalides) {
  const invalide = invalides.has(c.id);
  const article = el("article", invalide ? "carte carte-invalide" : "carte");
  const ouvrir = bouton("carte-ouvrir", undefined, () => {
    idFiche = c.id;
    erreur.textContent = "";
    dessiner();
  });
  ouvrir.append(el("span", "carte-entreprise", c.entreprise), " ", el("span", "carte-montant", invalide ? "montant invalide" : formaterFCFA(c.montant_fcfa)));
  article.append(ouvrir);
  if (peutModifier(moi, c)) {
    const actions = el("div", "carte-actions");
    for (const [classe, symbole, libelle, decalage] of [
      ["bouton-etape bouton-precedent", "←", "Étape précédente", -1],
      ["bouton-etape bouton-suivant", "→", "Étape suivante", 1],
    ]) {
      const cible = etapeVoisine(c.etape, decalage);
      const b = bouton(classe, symbole, () => executer(() => modifier(c, deplacerClient(moi, c, cible))));
      b.setAttribute("aria-label", cible ? `${libelle} : ${cible}` : libelle);
      b.disabled = cible === null;
      actions.append(b);
    }
    article.append(actions);
  }
  return article;
}

function dessinerPipeline(moi, visibles, invalides) {
  pipelineEl.replaceChildren(
    ...ETAPES.map((etape) => {
      const colonne = el("section", "colonne");
      colonne.append(el("h2", "colonne-titre", etape));
      for (const c of visibles.filter((x) => x.etape === etape)) colonne.append(carte(moi, c, invalides));
      return colonne;
    })
  );
}

// Tableau de bord : réservé au responsable, rien n'est calculé ni écrit sinon.
function dessinerTableauDeBord(moi) {
  const autorise = peutVoirTableauDeBord(moi);
  const total = document.getElementById("total");
  const parEtape = document.getElementById("par-etape");
  document.getElementById("tableau-de-bord").hidden = !autorise;
  total.textContent = "";
  parEtape.replaceChildren();
  montantsInvalidesEl.replaceChildren();
  if (!autorise) return;
  total.textContent = formaterFCFA(totalPipeline(clients));
  const totaux = totalParEtape(clients);
  for (const etape of ETAPES) {
    const ligne = document.createElement("li");
    ligne.append(el("span", "kpi-stage-name", etape), " ", el("span", "kpi-stage-amount", formaterFCFA(totaux[etape] ?? 0)));
    parEtape.append(ligne);
  }
  const invalides = montantsInvalides(clients);
  if (invalides.length > 0) {
    const liste = el("ul", "montants-invalides-liste");
    for (const { id, valeur } of invalides) liste.append(el("li", "", `${id} : ${JSON.stringify(valeur)}`));
    montantsInvalidesEl.append(el("p", "montants-invalides-titre", "Montants invalides, exclus des totaux :"), liste);
  }
}

function dessinerFiche(moi, visibles) {
  const client = visibles.find((c) => c.id === idFiche);
  fiche.hidden = !client;
  fiche.replaceChildren();
  if (!client) return;

  const modifiable = peutModifier(moi, client);
  const proprietaire = utilisateurs.find((u) => u.id === client.proprietaire)?.nom ?? "aucun";
  const formulaire = el("form", "fiche-formulaire");
  const saisies = {};
  for (const [nom, libelle] of [["contact", "Contact"], ["telephone", "Téléphone"], ["montant_fcfa", "Montant (FCFA)"]]) {
    const saisie = document.createElement("input");
    saisie.name = nom;
    saisie.value = String(client[nom] ?? "");
    saisie.readOnly = !modifiable;
    saisies[nom] = saisie;
    const champ = el("label", "fiche-champ");
    champ.append(el("span", "fiche-libelle", libelle), saisie);
    formulaire.append(champ);
  }
  if (modifiable) {
    const enregistrer = el("button", "bouton-enregistrer", "Enregistrer");
    enregistrer.type = "submit";
    formulaire.append(enregistrer);
    formulaire.addEventListener("submit", (evenement) => {
      evenement.preventDefault();
      const valeurs = { contact: saisies.contact.value, telephone: saisies.telephone.value, montant_fcfa: saisies.montant_fcfa.value };
      executer(() => modifier(client, modifierFiche(moi, client, valeurs)));
    });
  }
  fiche.append(
    el("h2", "fiche-titre", `Fiche : ${client.entreprise}`),
    el("p", "fiche-info", `${client.ville} · étape ${client.etape} · propriétaire : ${proprietaire}`),
    formulaire
  );

  const cibles = utilisateurs.filter((u) => peutReattribuer(moi, client, u.id, utilisateurs));
  if (cibles.length > 0) {
    const selection = document.createElement("select");
    selection.name = "proprietaire";
    if (!client.proprietaire) selection.add(new Option("— sans propriétaire —", ""));
    for (const u of cibles) selection.add(new Option(u.nom, u.id));
    selection.value = client.proprietaire ?? "";
    selection.addEventListener("change", () => executer(() => modifier(client, reattribuerClient(moi, client, selection.value, utilisateurs))));
    const champ = el("label", "fiche-reattribution");
    champ.append(el("span", "fiche-libelle", "Réattribuer à"), selection);
    fiche.append(champ);
  }

  fiche.append(
    bouton("bouton-fermer", "Fermer", () => {
      idFiche = null;
      erreur.textContent = "";
      dessiner();
    })
  );
}

function dessiner() {
  const moi = utilisateurs.find((u) => u.id === choix.value);
  const visibles = clientsVisibles(moi, clients);
  const invalides = new Set(montantsInvalides(clients).map((m) => m.id));
  dessinerPipeline(moi, visibles, invalides);
  dessinerTableauDeBord(moi);
  dessinerFiche(moi, visibles);
}

choix.addEventListener("change", () => {
  idFiche = null;
  erreur.textContent = "";
  dessiner();
});
dessiner();
