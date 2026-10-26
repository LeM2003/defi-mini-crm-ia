import { test } from "node:test";
import assert from "node:assert/strict";
import * as tableau from "../tableau.js";

test("formaterFCFA sépare les milliers par des espaces et ajoute FCFA", () => {
  assert.equal(tableau.formaterFCFA(17650000), "17 650 000 FCFA");
  assert.equal(tableau.formaterFCFA(1250000), "1 250 000 FCFA");
  assert.equal(tableau.formaterFCFA(90000), "90 000 FCFA");
});

test("formaterFCFA : petits montants et zéro", () => {
  assert.equal(tableau.formaterFCFA(0), "0 FCFA");
  assert.equal(tableau.formaterFCFA(999), "999 FCFA");
  assert.equal(tableau.formaterFCFA(1000), "1 000 FCFA");
});

test("formaterFCFA utilise des espaces normaux (U+0020), pas des espaces insécables", () => {
  const texte = tableau.formaterFCFA(17650000);
  assert.ok(!/[  ]/.test(texte), "espace insécable trouvée");
  assert.equal(texte.split(" ").length, 4);
});
