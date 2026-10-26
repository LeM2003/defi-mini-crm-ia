// Tests du module historique.js : entrées d'historique (qui, quoi, quand) et phrases lisibles.
// Fonctions pures : la date est toujours passée en paramètre.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as historique from "../historique.js";

const MAINTENANT = new Date("2026-03-05T10:30:00.000Z");
const utilisateurs = [
  { id: "u1", nom: "Awa Ndiaye", role: "commercial" },
  { id: "u2", nom: "Ibrahima Sow", role: "commercial" },
  { id: "u3", nom: "Mariama Ba", role: "responsable" },
];
const [awa, , mariama] = utilisateurs;
const pikine = { id: "c1", entreprise: "Pikine Batiment", etape: "prospect", proprietaire: "u1", contact: "Contact 01", telephone: "770000001", montant_fcfa: "90000" };
const niayes = { id: "c2", entreprise: "Niayes Bio", etape: "qualifie", proprietaire: null, contact: "Contact 02", telephone: "770000002", montant_fcfa: 100 };
const baobab = { id: "c3", entreprise: "Baobab Conseil", etape: "gagne", proprietaire: "u1", contact: "Contact 02", telephone: "770000003", montant_fcfa: 250000 };

// Gèle récursivement un objet pour détecter toute mutation (le mode strict des modules lève une erreur).
function geler(valeur) {
  if (typeof valeur === "object" && valeur !== null && !Object.isFrozen(valeur)) {
    Object.freeze(valeur);
    Object.values(valeur).forEach(geler);
  }
  return valeur;
}

// --- creerEntree ---

test("déplacement : une entrée complète avec qui, quoi, quand", () => {
  const entree = historique.creerEntree(awa, pikine, { etape: "qualifie" }, MAINTENANT);
  assert.deepEqual(entree, {
    quand: "2026-03-05T10:30:00.000Z",
    qui: { id: "u1", nom: "Awa Ndiaye" },
    client: { id: "c1", entreprise: "Pikine Batiment" },
    type: "deplacement",
    changements: [{ champ: "etape", avant: "prospect", apres: "qualifie" }],
  });
});

test("réattribution : type reattribution, avant null quand le client n'avait personne", () => {
  const entree = historique.creerEntree(mariama, niayes, { proprietaire: "u1" }, MAINTENANT);
  assert.equal(entree.type, "reattribution");
  assert.deepEqual(entree.qui, { id: "u3", nom: "Mariama Ba" });
  assert.deepEqual(entree.changements, [{ champ: "proprietaire", avant: null, apres: "u1" }]);
});

test("fiche : seuls les champs qui changent apparaissent, type fiche", () => {
  const champs = { contact: "Fatou Diop", telephone: "770000003", montant_fcfa: 300000 };
  const entree = historique.creerEntree(awa, baobab, champs, MAINTENANT);
  assert.equal(entree.type, "fiche");
  assert.deepEqual(entree.changements, [
    { champ: "contact", avant: "Contact 02", apres: "Fatou Diop" },
    { champ: "montant_fcfa", avant: 250000, apres: 300000 },
  ]);
});

test("un seul champ de fiche modifié reste de type fiche", () => {
  const entree = historique.creerEntree(awa, baobab, { telephone: "771111111" }, MAINTENANT);
  assert.equal(entree.type, "fiche");
});

test("étape et propriétaire changés ensemble : type fiche", () => {
  const entree = historique.creerEntree(mariama, pikine, { etape: "gagne", proprietaire: "u2" }, MAINTENANT);
  assert.equal(entree.type, "fiche");
  assert.equal(entree.changements.length, 2);
});

test("étape inchangée dans un lot : seul l'autre champ compte, donc type reattribution", () => {
  const entree = historique.creerEntree(mariama, pikine, { etape: "prospect", proprietaire: "u2" }, MAINTENANT);
  assert.equal(entree.type, "reattribution");
  assert.deepEqual(entree.changements, [{ champ: "proprietaire", avant: "u1", apres: "u2" }]);
});

test("aucun changement : null", () => {
  assert.equal(historique.creerEntree(awa, pikine, { etape: "prospect" }, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, pikine, { etape: "prospect", proprietaire: "u1" }, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, pikine, {}, MAINTENANT), null);
});

test("montant chaîne \"90000\" contre nombre 90000 : pas de changement", () => {
  assert.equal(historique.creerEntree(awa, pikine, { montant_fcfa: 90000 }, MAINTENANT), null);
});

test("montant chaîne contre nombre différent : changement, avant et après gardent leur type", () => {
  const entree = historique.creerEntree(awa, pikine, { montant_fcfa: 95000 }, MAINTENANT);
  assert.deepEqual(entree.changements, [{ champ: "montant_fcfa", avant: "90000", apres: 95000 }]);
});

test("champ absent du client : avant vaut null ; null contre absent n'est pas un changement", () => {
  const sansProprietaire = { id: "c9", entreprise: "Sans Patron" };
  const entree = historique.creerEntree(mariama, sansProprietaire, { proprietaire: "u2" }, MAINTENANT);
  assert.deepEqual(entree.changements, [{ champ: "proprietaire", avant: null, apres: "u2" }]);
  assert.equal(historique.creerEntree(mariama, sansProprietaire, { proprietaire: null }, MAINTENANT), null);
  assert.equal(historique.creerEntree(mariama, niayes, { proprietaire: undefined }, MAINTENANT), null);
});

test("utilisateur ou client absent : null", () => {
  assert.equal(historique.creerEntree(null, pikine, { etape: "gagne" }, MAINTENANT), null);
  assert.equal(historique.creerEntree(undefined, pikine, { etape: "gagne" }, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, null, { etape: "gagne" }, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, undefined, { etape: "gagne" }, MAINTENANT), null);
});

test("champs absent ou invalide : null, sans exception", () => {
  assert.equal(historique.creerEntree(awa, pikine, null, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, pikine, undefined, MAINTENANT), null);
  assert.equal(historique.creerEntree(awa, pikine, "gagne", MAINTENANT), null);
});

test("la date vient du paramètre maintenant (ISO), pas de l'horloge", () => {
  const autre = new Date("2030-12-31T23:59:59.999Z");
  assert.equal(historique.creerEntree(awa, pikine, { etape: "gagne" }, autre).quand, "2030-12-31T23:59:59.999Z");
});

test("aucun argument n'est modifié (objets gelés)", () => {
  const u = geler({ ...awa });
  const c = geler({ ...pikine });
  const champs = geler({ etape: "gagne", montant_fcfa: 95000 });
  const date = new Date(MAINTENANT.getTime());
  const entree = historique.creerEntree(u, c, champs, date);
  assert.ok(entree);
  assert.deepEqual(c, pikine);
  assert.deepEqual(champs, { etape: "gagne", montant_fcfa: 95000 });
  assert.equal(date.getTime(), MAINTENANT.getTime());
});

test("l'entrée est indépendante des arguments (la modifier ne touche pas client ni utilisateur)", () => {
  const c = { ...pikine };
  const u = { ...awa };
  const entree = historique.creerEntree(u, c, { etape: "gagne" }, MAINTENANT);
  entree.client.entreprise = "Autre";
  entree.qui.nom = "Autre";
  assert.equal(c.entreprise, "Pikine Batiment");
  assert.equal(u.nom, "Awa Ndiaye");
});

// --- decrire ---

test("decrire : déplacement", () => {
  const entree = historique.creerEntree(awa, pikine, { etape: "qualifie" }, MAINTENANT);
  assert.equal(historique.decrire(entree, utilisateurs), "Awa Ndiaye a déplacé Pikine Batiment de prospect à qualifie.");
});

test("decrire : réattribution, ids convertis en noms, null devient aucun", () => {
  const entree = historique.creerEntree(mariama, niayes, { proprietaire: "u1" }, MAINTENANT);
  assert.equal(historique.decrire(entree, utilisateurs), "Mariama Ba a réattribué Niayes Bio de aucun à Awa Ndiaye.");
});

test("decrire : réattribution entre deux commerciaux", () => {
  const entree = historique.creerEntree(mariama, pikine, { proprietaire: "u2" }, MAINTENANT);
  assert.equal(historique.decrire(entree, utilisateurs), "Mariama Ba a réattribué Pikine Batiment de Awa Ndiaye à Ibrahima Sow.");
});

test("decrire : id de propriétaire inconnu, l'id lui-même est affiché", () => {
  const entree = historique.creerEntree(mariama, pikine, { proprietaire: "u99" }, MAINTENANT);
  assert.equal(historique.decrire(entree, utilisateurs), "Mariama Ba a réattribué Pikine Batiment de Awa Ndiaye à u99.");
  assert.equal(historique.decrire(entree, []), "Mariama Ba a réattribué Pikine Batiment de u1 à u99.");
});

test("decrire : fiche, un segment par changement séparés par « ; »", () => {
  const champs = { contact: "Fatou Diop", telephone: "770000003", montant_fcfa: 300000 };
  const entree = historique.creerEntree(awa, baobab, champs, MAINTENANT);
  assert.equal(
    historique.decrire(entree, utilisateurs),
    "Awa Ndiaye a modifié la fiche de Baobab Conseil : contact « Contact 02 » → « Fatou Diop » ; montant_fcfa 250000 → 300000."
  );
});

test("decrire : ne contient pas la date", () => {
  const entree = historique.creerEntree(awa, pikine, { etape: "qualifie" }, MAINTENANT);
  assert.ok(!historique.decrire(entree, utilisateurs).includes("2026"));
});

test("decrire : sans liste d'utilisateurs valide, une réattribution affiche les ids", () => {
  const entree = historique.creerEntree(mariama, pikine, { proprietaire: "u2" }, MAINTENANT);
  for (const liste of [undefined, null, "u1"]) {
    assert.equal(historique.decrire(entree, liste), "Mariama Ba a réattribué Pikine Batiment de u1 à u2.");
  }
});

test("decrire : entrée incomplète ou absente, toujours une chaîne, valeurs manquantes en « ? »", () => {
  const cas = [
    undefined, null, {}, [], "texte", 42,
    { type: "deplacement" },
    { type: "reattribution", changements: [] },
    { type: "fiche", qui: null, client: null, changements: null },
    { type: "fiche", changements: [null, 3, {}] },
    { type: "inconnu", qui: { nom: "Awa" }, client: {}, changements: [{ champ: "x" }] },
  ];
  for (const entree of cas) {
    assert.equal(typeof historique.decrire(entree, utilisateurs), "string", JSON.stringify(entree));
  }
  assert.equal(historique.decrire({ type: "deplacement" }, utilisateurs), "? a déplacé ? de ? à ?.");
  assert.equal(historique.decrire({ type: "reattribution", changements: [] }, utilisateurs), "? a réattribué ? de ? à ?.");
});

test("decrire : une entrée à valeurs exotiques ne lève pas d'exception", () => {
  const exotique = {
    type: "fiche",
    qui: { nom: Symbol("x") },
    client: { entreprise: { toString() { throw new Error("piège"); } } },
    changements: [{ champ: "contact", avant: { a: 1 }, apres: [1, 2] }],
  };
  assert.equal(typeof historique.decrire(exotique, utilisateurs), "string");
});

test("decrire : même un getter qui lève ne propage pas d'exception", () => {
  const piege = { type: "deplacement", get qui() { throw new Error("piège"); } };
  assert.equal(historique.decrire(piege, utilisateurs), "Modification illisible.");
});

test("decrire : ne modifie pas l'entrée ni la liste (objets gelés)", () => {
  const entree = geler(historique.creerEntree(mariama, pikine, { proprietaire: "u2" }, MAINTENANT));
  const liste = geler(utilisateurs.map((u) => ({ ...u })));
  assert.equal(typeof historique.decrire(entree, liste), "string");
});

test("decrire : renvoie le texte tel quel, sans HTML ajouté ni échappé (affichage par textContent)", () => {
  const piege = { ...pikine, entreprise: "<b>Pikine</b> & Fils" };
  const entree = historique.creerEntree(awa, piege, { etape: "gagne" }, MAINTENANT);
  assert.equal(historique.decrire(entree, utilisateurs), "Awa Ndiaye a déplacé <b>Pikine</b> & Fils de prospect à gagne.");
});
