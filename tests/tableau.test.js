import { test } from "node:test";
import assert from "node:assert/strict";
import { totalParEtape, totalPipeline } from "../tableau.js";

test("totalPipeline additionne nombres et chaînes en une somme numérique exacte", () => {
  const clients = [
    { id: "a", etape: "gagne", montant_fcfa: 150000 },
    { id: "b", etape: "proposition", montant_fcfa: "90000" },
    { id: "c", etape: "prospect", montant_fcfa: 250000 },
    { id: "d", etape: "negociation", montant_fcfa: "7500" },
  ];
  const total = totalPipeline(clients);
  assert.equal(typeof total, "number");
  assert.equal(total, 497500);
});

test("totalParEtape additionne numériquement une chaîne dans une étape", () => {
  const clients = [
    { id: "a", etape: "gagne", montant_fcfa: 150000 },
    { id: "b", etape: "gagne", montant_fcfa: "90000" },
    { id: "c", etape: "prospect", montant_fcfa: "7500" },
    { id: "d", etape: "prospect", montant_fcfa: 2500 },
    { id: "e", etape: "proposition", montant_fcfa: 100000 },
  ];
  const totaux = totalParEtape(clients);
  assert.deepEqual(totaux, { gagne: 240000, prospect: 10000, proposition: 100000 });
  for (const valeur of Object.values(totaux)) assert.equal(typeof valeur, "number");
});

test("un client perdu est exclu du pipeline mais compté dans son étape", () => {
  const clients = [
    { id: "a", etape: "gagne", montant_fcfa: 100000 },
    { id: "b", etape: "perdu", montant_fcfa: "50000" },
    { id: "c", etape: "perdu", montant_fcfa: 25000 },
  ];
  assert.equal(totalPipeline(clients), 100000);
  assert.deepEqual(totalParEtape(clients), { gagne: 100000, perdu: 75000 });
});

test("avec uniquement des nombres, les totaux sont corrects", () => {
  const clients = [
    { id: "a", etape: "gagne", montant_fcfa: 150000 },
    { id: "b", etape: "prospect", montant_fcfa: 250000 },
    { id: "c", etape: "perdu", montant_fcfa: 10000 },
  ];
  assert.equal(totalPipeline(clients), 400000);
  assert.deepEqual(totalParEtape(clients), { gagne: 150000, prospect: 250000, perdu: 10000 });
});
