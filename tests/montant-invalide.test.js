import { test } from "node:test";
import assert from "node:assert/strict";
import { formaterFCFA, totalParEtape, totalPipeline } from "../tableau.js";

// Non numériques (dont null, vide, booléen : Number() les transformerait en 0 ou 1) et négatifs.
const INVALIDES = ["abc", "12abc", "", "   ", null, undefined, true, NaN, Infinity, -5, "-5"];

const client = (montant_fcfa) => ({ id: "x", etape: "prospect", montant_fcfa });

test("totalPipeline refuse un montant non numérique ou négatif", () => {
  for (const m of INVALIDES) {
    assert.throws(() => totalPipeline([client(100), client(m)]), RangeError, `montant ${String(m)} accepté`);
  }
});

test("totalParEtape refuse un montant non numérique ou négatif", () => {
  for (const m of INVALIDES) {
    assert.throws(() => totalParEtape([client(100), client(m)]), RangeError, `montant ${String(m)} accepté`);
  }
});

test("formaterFCFA refuse un montant non numérique ou négatif (jamais « NaN FCFA »)", () => {
  for (const m of INVALIDES) {
    assert.throws(() => formaterFCFA(m), RangeError, `montant ${String(m)} accepté`);
  }
});

test("le message d'erreur du total cite le client et la valeur fautive", () => {
  assert.throws(() => totalPipeline([{ id: "c99", etape: "gagne", montant_fcfa: "abc" }]), /c99.*"abc"/);
});

test("zéro, nombres et chaînes numériques restent acceptés", () => {
  assert.equal(totalPipeline([client(0), client("90000"), client(250000)]), 340000);
  assert.equal(formaterFCFA("90000"), "90 000 FCFA");
  assert.equal(formaterFCFA(0), "0 FCFA");
});
