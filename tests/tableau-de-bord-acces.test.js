import { test } from "node:test";
import assert from "node:assert/strict";
import * as acces from "../acces.js";

test("le responsable voit le tableau de bord", () => {
  assert.equal(acces.peutVoirTableauDeBord({ id: "u0", role: "responsable" }), true);
});

test("un commercial ne voit pas le tableau de bord", () => {
  assert.equal(acces.peutVoirTableauDeBord({ id: "u1", role: "commercial" }), false);
});

test("un rôle inconnu ne voit pas le tableau de bord", () => {
  assert.equal(acces.peutVoirTableauDeBord({ id: "u9", role: "stagiaire" }), false);
});

test("sans utilisateur (undefined ou null), pas de tableau de bord et pas d'exception", () => {
  assert.equal(acces.peutVoirTableauDeBord(undefined), false);
  assert.equal(acces.peutVoirTableauDeBord(null), false);
});
