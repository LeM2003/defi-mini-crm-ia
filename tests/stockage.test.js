// Tests du module stockage.js : modifications utilisateur sauvegardées par-dessus clients.json.
// Le stockage est toujours un faux objet passé en paramètre (jamais le vrai localStorage).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as stockage from "../stockage.js";

function fauxStockage(initial = {}) {
  const donnees = new Map(Object.entries(initial));
  return {
    donnees,
    getItem: (cle) => (donnees.has(cle) ? donnees.get(cle) : null),
    setItem: (cle, valeur) => donnees.set(cle, String(valeur)),
  };
}

const stockageSansLecture = { getItem() { throw new Error("lecture interdite"); }, setItem() {} };
const stockagePlein = { getItem: () => null, setItem() { throw new Error("quota dépassé"); } };
const avec = (json) => fauxStockage({ [stockage.CLE_STOCKAGE]: json });

test("la clé de stockage est celle de l'API convenue", () => {
  assert.equal(stockage.CLE_STOCKAGE, "mini-crm-modifications-v1");
});

// --- chargerModifications / enregistrerModification ---

test("aller-retour : enregistrer puis charger redonne la modification", () => {
  const s = fauxStockage();
  assert.equal(stockage.enregistrerModification(s, "c1", { etape: "gagne" }), true);
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("rien d'enregistré : charger renvoie un objet vide", () => {
  assert.deepEqual(stockage.chargerModifications(fauxStockage()), {});
});

test("deux enregistrements successifs sur le même client sont fusionnés", () => {
  const s = fauxStockage();
  stockage.enregistrerModification(s, "c1", { etape: "qualifie" });
  stockage.enregistrerModification(s, "c1", { telephone: "770000000", etape: "gagne" });
  stockage.enregistrerModification(s, "c2", { proprietaire: "u2" });
  assert.deepEqual(stockage.chargerModifications(s), {
    c1: { etape: "gagne", telephone: "770000000" },
    c2: { proprietaire: "u2" },
  });
});

test("les cinq champs autorisés sont conservés", () => {
  const s = fauxStockage();
  const champs = { etape: "perdu", contact: "Awa", telephone: "77", montant_fcfa: 1500, proprietaire: "u3" };
  stockage.enregistrerModification(s, "c1", champs);
  assert.deepEqual(stockage.chargerModifications(s), { c1: champs });
});

test("les champs non autorisés sont filtrés à l'enregistrement", () => {
  const s = fauxStockage();
  stockage.enregistrerModification(s, "c1", { id: "x", entreprise: "Pirate", ville: "Dakar", etape: "gagne", autre: 1 });
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("les champs non autorisés déjà présents dans le stockage sont filtrés au chargement", () => {
  const s = avec(JSON.stringify({ c1: { etape: "gagne", entreprise: "Pirate", id: "x" } }));
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("enregistrer sans aucun champ autorisé n'écrit rien et renvoie false", () => {
  const s = fauxStockage();
  assert.equal(stockage.enregistrerModification(s, "c1", { entreprise: "Pirate" }), false);
  assert.equal(s.donnees.size, 0);
});

test("stockage absent : charger renvoie {} et enregistrer renvoie false, sans lever", () => {
  for (const absent of [undefined, null]) {
    assert.deepEqual(stockage.chargerModifications(absent), {});
    assert.equal(stockage.enregistrerModification(absent, "c1", { etape: "gagne" }), false);
  }
});

test("getItem qui lève : charger renvoie {}", () => {
  assert.deepEqual(stockage.chargerModifications(stockageSansLecture), {});
});

test("getItem qui lève : enregistrer ne lève pas", () => {
  assert.doesNotThrow(() => stockage.enregistrerModification(stockageSansLecture, "c1", { etape: "gagne" }));
});

test("JSON corrompu : charger renvoie {}", () => {
  assert.deepEqual(stockage.chargerModifications(avec("{pas du json")), {});
});

test("JSON corrompu : un nouvel enregistrement repart de zéro et réussit", () => {
  const s = avec("{pas du json");
  assert.equal(stockage.enregistrerModification(s, "c1", { etape: "gagne" }), true);
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("JSON valide mais pas un objet simple : charger renvoie {}", () => {
  for (const json of ["[]", '[{"etape":"gagne"}]', "42", '"texte"', "null", "true"]) {
    assert.deepEqual(stockage.chargerModifications(avec(json)), {}, json);
  }
});

test("une entrée qui n'est pas un objet est ignorée, les autres sont gardées", () => {
  const s = avec(JSON.stringify({ c1: "gagne", c2: null, c3: 5, c4: ["etape"], c5: { etape: "gagne" } }));
  assert.deepEqual(stockage.chargerModifications(s), { c5: { etape: "gagne" } });
});

test("setItem qui lève (quota, mode privé) : enregistrer renvoie false sans lever", () => {
  assert.equal(stockage.enregistrerModification(stockagePlein, "c1", { etape: "gagne" }), false);
});

test("enregistrer ne modifie pas l'objet champs reçu", () => {
  const champs = { etape: "gagne", entreprise: "Pirate" };
  stockage.enregistrerModification(fauxStockage(), "c1", champs);
  assert.deepEqual(champs, { etape: "gagne", entreprise: "Pirate" });
});

// --- appliquerModifications ---

const clients = [
  { id: "c1", entreprise: "Alpha", ville: "Dakar", etape: "prospect", montant_fcfa: 1000, proprietaire: "u1" },
  { id: "c2", entreprise: "Beta", ville: "Thiès", etape: "qualifie", montant_fcfa: 2000, proprietaire: "u2" },
];

test("appliquer renvoie un nouveau tableau avec une copie du client modifié", () => {
  const resultat = stockage.appliquerModifications(clients, { c1: { etape: "gagne", contact: "Awa" } });
  assert.notEqual(resultat, clients);
  assert.notEqual(resultat[0], clients[0]);
  assert.deepEqual(resultat[0], { ...clients[0], etape: "gagne", contact: "Awa" });
});

test("appliquer ne mute ni les clients ni les modifications", () => {
  const modifications = { c1: { etape: "gagne", entreprise: "Pirate" } };
  const clientsAvant = structuredClone(clients);
  const modificationsAvant = structuredClone(modifications);
  stockage.appliquerModifications(clients, modifications);
  assert.deepEqual(clients, clientsAvant);
  assert.deepEqual(modifications, modificationsAvant);
});

test("un client sans modification est renvoyé tel quel", () => {
  const resultat = stockage.appliquerModifications(clients, { c1: { etape: "gagne" } });
  assert.equal(resultat[1], clients[1]);
  assert.equal(resultat.length, 2);
});

test("une modification sur un id inconnu est ignorée (aucun client créé)", () => {
  const resultat = stockage.appliquerModifications(clients, { fantome: { etape: "gagne" } });
  assert.deepEqual(resultat, clients);
});

test("une étape invalide est ignorée, les autres champs sont appliqués", () => {
  const resultat = stockage.appliquerModifications(clients, { c1: { etape: "inconnue", contact: "Awa" } });
  assert.equal(resultat[0].etape, "prospect");
  assert.equal(resultat[0].contact, "Awa");
});

test("une étape qui n'est pas du texte est ignorée", () => {
  for (const etape of [null, 3, {}, ["gagne"]]) {
    const resultat = stockage.appliquerModifications(clients, { c1: { etape } });
    assert.equal(resultat[0].etape, "prospect", JSON.stringify(etape));
  }
});

test("chaque étape valide est appliquée", () => {
  for (const etape of ["prospect", "qualifie", "proposition", "gagne", "perdu"]) {
    assert.equal(stockage.appliquerModifications(clients, { c2: { etape } })[1].etape, etape);
  }
});

test("les champs non autorisés ne sont pas appliqués", () => {
  const resultat = stockage.appliquerModifications(clients, { c1: { id: "x", entreprise: "Pirate", ville: "Paris", proprietaire: "u9" } });
  assert.deepEqual(resultat[0], { ...clients[0], proprietaire: "u9" });
});

test("modifications absentes ou invalides : les clients sont renvoyés inchangés", () => {
  for (const mods of [undefined, null, {}, "texte", 5, []]) {
    assert.deepEqual(stockage.appliquerModifications(clients, mods), clients);
  }
});

test("une entrée de modifications qui n'est pas un objet est ignorée", () => {
  assert.deepEqual(stockage.appliquerModifications(clients, { c1: "gagne", c2: null }), clients);
});

test("enregistrer puis appliquer : la modification survit au rechargement", () => {
  const s = fauxStockage();
  stockage.enregistrerModification(s, "c2", { etape: "perdu" });
  const resultat = stockage.appliquerModifications(clients, stockage.chargerModifications(s));
  assert.equal(resultat[1].etape, "perdu");
  assert.equal(resultat[0].etape, "prospect");
});

// --- pollution de prototype ---

test("un JSON stocké avec __proto__ ne pollue pas Object.prototype", () => {
  const s = avec('{"__proto__": {"etape": "gagne", "pollue": true}, "c1": {"__proto__": {"pollue": true}, "etape": "gagne"}}');
  const modifications = stockage.chargerModifications(s);
  stockage.appliquerModifications(clients, modifications);
  assert.equal({}.pollue, undefined);
  assert.equal({}.etape, undefined);
  assert.equal(Object.getPrototypeOf(modifications), Object.prototype);
  assert.deepEqual(modifications, { c1: { etape: "gagne" } });
});

test("enregistrer avec l'id __proto__ ou des champs __proto__/constructor ne pollue rien", () => {
  const s = fauxStockage();
  stockage.enregistrerModification(s, "__proto__", { etape: "gagne" });
  stockage.enregistrerModification(s, "c1", JSON.parse('{"__proto__": {"pollue": true}, "constructor": {"pollue": true}, "etape": "gagne"}'));
  stockage.appliquerModifications(clients, stockage.chargerModifications(s));
  assert.equal({}.pollue, undefined);
  assert.equal({}.etape, undefined);
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("un client dont l'id est constructor ou toString n'hérite de rien d'Object.prototype", () => {
  const speciaux = [{ id: "constructor", etape: "prospect" }, { id: "toString", etape: "prospect" }];
  assert.deepEqual(stockage.appliquerModifications(speciaux, {}), speciaux);
  assert.deepEqual(stockage.appliquerModifications(speciaux, { constructor: { etape: "gagne" } }), [
    { id: "constructor", etape: "gagne" },
    { id: "toString", etape: "prospect" },
  ]);
});
