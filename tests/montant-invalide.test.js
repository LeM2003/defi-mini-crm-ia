import { test } from "node:test";
import assert from "node:assert/strict";
import * as tableau from "../tableau.js";

// Non numériques (dont null, vide, booléen : Number() les transformerait en 0 ou 1) et négatifs.
const INVALIDES = ["abc", "12abc", "", "   ", null, undefined, true, NaN, Infinity, -5, "-5"];

const client = (montant_fcfa, id = "x", etape = "prospect") => ({ id, etape, montant_fcfa });

test("totalPipeline exclut un client au montant invalide, sans lever d'erreur ni NaN", () => {
  for (const m of INVALIDES) {
    assert.equal(tableau.totalPipeline([client(100), client(m)]), 100, `montant ${String(m)} compté`);
  }
});

test("totalParEtape exclut un client au montant invalide, sans lever d'erreur ni NaN", () => {
  for (const m of INVALIDES) {
    assert.deepEqual(tableau.totalParEtape([client(100), client(m)]), { prospect: 100 }, `montant ${String(m)} compté`);
  }
});

test("montantsInvalides liste l'id et la valeur de chaque client au montant invalide", () => {
  const clients = [client(100, "c1"), client("abc", "c2"), client(-5, "c3", "perdu"), client("90000", "c4"), client(null, "c5")];
  assert.deepEqual(tableau.montantsInvalides(clients), [
    { id: "c2", valeur: "abc" },
    { id: "c3", valeur: -5 },
    { id: "c5", valeur: null },
  ]);
});

test("montantsInvalides ne signale rien quand tous les montants sont valides", () => {
  assert.deepEqual(tableau.montantsInvalides([client(0), client("90000"), client(250000)]), []);
});

test("formaterFCFA refuse un montant non numérique ou négatif (jamais « NaN FCFA »)", () => {
  for (const m of INVALIDES) {
    assert.throws(() => tableau.formaterFCFA(m), RangeError, `montant ${String(m)} accepté`);
  }
});

test("zéro, nombres et chaînes numériques restent acceptés", () => {
  assert.equal(tableau.totalPipeline([client(0), client("90000"), client(250000)]), 340000);
  assert.equal(tableau.formaterFCFA("90000"), "90 000 FCFA");
  assert.equal(tableau.formaterFCFA(0), "0 FCFA");
});
