import { test } from "node:test";
import assert from "node:assert/strict";
import * as acces from "../acces.js";

const awa = { id: "u1", role: "commercial" };
const mariama = { id: "u3", role: "responsable" };

const clients = [
  { id: "a", proprietaire: "u1" },
  { id: "b", proprietaire: null },
  { id: "c", proprietaire: "u2" },
  { id: "d" },
  { id: "e", proprietaire: "" },
];

test("clientsSansProprietaire : le responsable voit les clients sans commercial, dans l'ordre", () => {
  assert.deepEqual(acces.clientsSansProprietaire(mariama, clients).map((c) => c.id), ["b", "d", "e"]);
});

test("clientsSansProprietaire : rien quand tous les clients ont un propriétaire", () => {
  assert.deepEqual(acces.clientsSansProprietaire(mariama, [clients[0], clients[2]]), []);
});

test("clientsSansProprietaire : un commercial n'obtient jamais la liste", () => {
  assert.deepEqual(acces.clientsSansProprietaire(awa, clients), []);
  assert.deepEqual(acces.clientsSansProprietaire({ id: "u9", role: "stagiaire" }, clients), []);
});

test("clientsSansProprietaire : utilisateur absent ou clients absents", () => {
  assert.deepEqual(acces.clientsSansProprietaire(undefined, clients), []);
  assert.deepEqual(acces.clientsSansProprietaire(null, clients), []);
  assert.deepEqual(acces.clientsSansProprietaire(mariama, undefined), []);
});

test("peutVoirHistorique : réservé au responsable", () => {
  assert.equal(acces.peutVoirHistorique(mariama), true);
  assert.equal(acces.peutVoirHistorique(awa), false);
  assert.equal(acces.peutVoirHistorique({ id: "u9", role: "stagiaire" }), false);
  assert.equal(acces.peutVoirHistorique(undefined), false);
  assert.equal(acces.peutVoirHistorique(null), false);
});
