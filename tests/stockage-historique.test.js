// Tests de l'historique dans stockage.js : chargerHistorique et enregistrerEntreeHistorique.
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
const avec = (json) => fauxStockage({ [stockage.CLE_HISTORIQUE]: json });

function entree(numero = 1) {
  return {
    quand: new Date(Date.UTC(2026, 2, 5, 10, 0, numero)).toISOString(),
    qui: { id: "u1", nom: "Awa Ndiaye" },
    client: { id: "c1", entreprise: "Pikine Batiment" },
    type: "deplacement",
    changements: [{ champ: "etape", avant: "prospect", apres: `etape-${numero}` }],
  };
}

test("la clé de l'historique est celle de l'API convenue et diffère de celle des modifications", () => {
  assert.equal(stockage.CLE_HISTORIQUE, "mini-crm-historique-v1");
  assert.notEqual(stockage.CLE_HISTORIQUE, stockage.CLE_STOCKAGE);
});

// --- chargerHistorique ---

test("rien d'enregistré : charger renvoie un tableau vide", () => {
  assert.deepEqual(stockage.chargerHistorique(fauxStockage()), []);
});

test("aller-retour : enregistrer puis charger redonne l'entrée", () => {
  const s = fauxStockage();
  assert.equal(stockage.enregistrerEntreeHistorique(s, entree(1)), true);
  assert.deepEqual(stockage.chargerHistorique(s), [entree(1)]);
});

test("les entrées restent dans l'ordre chronologique d'enregistrement", () => {
  const s = fauxStockage();
  for (const n of [1, 2, 3]) stockage.enregistrerEntreeHistorique(s, entree(n));
  assert.deepEqual(stockage.chargerHistorique(s), [entree(1), entree(2), entree(3)]);
});

test("l'écriture se fait en JSON sous CLE_HISTORIQUE", () => {
  const s = fauxStockage();
  stockage.enregistrerEntreeHistorique(s, entree(1));
  assert.deepEqual([...s.donnees.keys()], [stockage.CLE_HISTORIQUE]);
  assert.deepEqual(JSON.parse(s.donnees.get(stockage.CLE_HISTORIQUE)), [entree(1)]);
});

test("stockage absent : charger renvoie [] et enregistrer renvoie false, sans exception", () => {
  for (const absent of [undefined, null, {}, "texte"]) {
    assert.deepEqual(stockage.chargerHistorique(absent), []);
    assert.equal(stockage.enregistrerEntreeHistorique(absent, entree(1)), false);
  }
});

test("getItem qui lève : charger renvoie []", () => {
  assert.deepEqual(stockage.chargerHistorique(stockageSansLecture), []);
});

test("JSON invalide : charger renvoie []", () => {
  for (const json of ["{pas du json", "", "undefined", "[1, 2"]) {
    assert.deepEqual(stockage.chargerHistorique(avec(json)), [], json);
  }
});

test("JSON valide mais qui n'est pas un tableau : charger renvoie []", () => {
  for (const json of ["{}", "null", "42", "\"texte\"", "true", JSON.stringify({ 0: entree(1), length: 1 })]) {
    assert.deepEqual(stockage.chargerHistorique(avec(json)), [], json);
  }
});

test("valeur stockée qui n'est pas une chaîne : charger renvoie []", () => {
  const s = { getItem: () => 42, setItem() {} };
  assert.deepEqual(stockage.chargerHistorique(s), []);
});

test("les éléments invalides sont ignorés, les valides conservés dans l'ordre", () => {
  const sansQuand = { ...entree(2) };
  delete sansQuand.quand;
  const mauvais = [
    null, 7, "texte", [], [entree(9)],
    sansQuand,
    { ...entree(3), quand: 123 },
    { ...entree(4), qui: "Awa" },
    { ...entree(5), qui: null },
    { ...entree(6), client: [] },
    { ...entree(7), changements: {} },
    { ...entree(8), changements: "etape" },
  ];
  const json = JSON.stringify([entree(1), ...mauvais, entree(10)]);
  assert.deepEqual(stockage.chargerHistorique(avec(json)), [entree(1), entree(10)]);
});

test("charger ne garde que les 200 dernières entrées", () => {
  const toutes = Array.from({ length: 250 }, (_, i) => entree(i + 1));
  const chargees = stockage.chargerHistorique(avec(JSON.stringify(toutes)));
  assert.equal(chargees.length, 200);
  assert.deepEqual(chargees[0], entree(51));
  assert.deepEqual(chargees[199], entree(250));
});

// --- enregistrerEntreeHistorique ---

test("entrée invalide : false et rien d'écrit", () => {
  const s = fauxStockage();
  const sansQuand = { ...entree(1) };
  delete sansQuand.quand;
  for (const invalide of [null, undefined, "texte", 3, [], {}, sansQuand, { ...entree(1), qui: null }, { ...entree(1), client: "c1" }, { ...entree(1), changements: null }]) {
    assert.equal(stockage.enregistrerEntreeHistorique(s, invalide), false, JSON.stringify(invalide));
  }
  assert.equal(s.donnees.size, 0);
});

test("setItem qui lève (quota) : false, sans exception", () => {
  assert.equal(stockage.enregistrerEntreeHistorique(stockagePlein, entree(1)), false);
});

test("getItem qui lève : l'enregistrement repart de zéro sans lever", () => {
  const ecrits = [];
  const s = { getItem() { throw new Error("lecture interdite"); }, setItem: (cle, v) => ecrits.push([cle, v]) };
  assert.equal(stockage.enregistrerEntreeHistorique(s, entree(1)), true);
  assert.deepEqual(JSON.parse(ecrits[0][1]), [entree(1)]);
});

test("historique existant corrompu : il est remplacé par la nouvelle entrée", () => {
  const s = avec("{pas du json");
  assert.equal(stockage.enregistrerEntreeHistorique(s, entree(1)), true);
  assert.deepEqual(stockage.chargerHistorique(s), [entree(1)]);
});

test("éléments invalides déjà stockés : écartés lors d'un nouvel enregistrement", () => {
  const s = avec(JSON.stringify([entree(1), null, { quand: 1 }]));
  stockage.enregistrerEntreeHistorique(s, entree(2));
  assert.deepEqual(JSON.parse(s.donnees.get(stockage.CLE_HISTORIQUE)), [entree(1), entree(2)]);
});

test("plafond : à 200 entrées, la plus ancienne est supprimée à chaque ajout", () => {
  const s = fauxStockage();
  for (let n = 1; n <= 200; n++) stockage.enregistrerEntreeHistorique(s, entree(n));
  assert.equal(stockage.chargerHistorique(s).length, 200);
  assert.equal(stockage.enregistrerEntreeHistorique(s, entree(201)), true);
  const apres = stockage.chargerHistorique(s);
  assert.equal(apres.length, 200);
  assert.deepEqual(apres[0], entree(2));
  assert.deepEqual(apres[199], entree(201));
});

test("plafond : un historique stocké trop long est ramené à 200 dès l'ajout suivant", () => {
  const toutes = Array.from({ length: 260 }, (_, i) => entree(i + 1));
  const s = avec(JSON.stringify(toutes));
  stockage.enregistrerEntreeHistorique(s, entree(261));
  const ecrit = JSON.parse(s.donnees.get(stockage.CLE_HISTORIQUE));
  assert.equal(ecrit.length, 200);
  assert.deepEqual(ecrit[0], entree(62));
  assert.deepEqual(ecrit[199], entree(261));
});

test("l'entrée passée en paramètre n'est pas modifiée (objet gelé)", () => {
  const gelee = Object.freeze({ ...entree(1), qui: Object.freeze({ id: "u1", nom: "Awa" }), changements: Object.freeze([]) });
  assert.equal(stockage.enregistrerEntreeHistorique(fauxStockage(), gelee), true);
});

// --- indépendance des deux clés ---

test("enregistrer une modification ne touche pas l'historique", () => {
  const s = fauxStockage();
  stockage.enregistrerEntreeHistorique(s, entree(1));
  const avant = s.donnees.get(stockage.CLE_HISTORIQUE);
  stockage.enregistrerModification(s, "c1", { etape: "gagne" });
  assert.equal(s.donnees.get(stockage.CLE_HISTORIQUE), avant);
  assert.deepEqual(stockage.chargerHistorique(s), [entree(1)]);
});

test("enregistrer une entrée d'historique ne touche pas les modifications", () => {
  const s = fauxStockage();
  stockage.enregistrerModification(s, "c1", { etape: "gagne" });
  const avant = s.donnees.get(stockage.CLE_STOCKAGE);
  stockage.enregistrerEntreeHistorique(s, entree(1));
  assert.equal(s.donnees.get(stockage.CLE_STOCKAGE), avant);
  assert.deepEqual(stockage.chargerModifications(s), { c1: { etape: "gagne" } });
});

test("des modifications corrompues n'empêchent pas l'historique, et inversement", () => {
  const s = fauxStockage({ [stockage.CLE_STOCKAGE]: "{pas du json", [stockage.CLE_HISTORIQUE]: "[pas du json" });
  assert.equal(stockage.enregistrerEntreeHistorique(s, entree(1)), true);
  assert.deepEqual(stockage.chargerHistorique(s), [entree(1)]);
  assert.equal(s.donnees.get(stockage.CLE_STOCKAGE), "{pas du json");
  assert.deepEqual(stockage.chargerModifications(s), {});
});
