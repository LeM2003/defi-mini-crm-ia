import { test } from "node:test";
import assert from "node:assert/strict";
import * as acces from "../acces.js";

const awa = { id: "u1", role: "commercial" };
const ibrahima = { id: "u2", role: "commercial" };
const mariama = { id: "u3", role: "responsable" };
const utilisateurs = [awa, ibrahima, mariama];

const sien = { id: "a", proprietaire: "u1" };
const deLautre = { id: "b", proprietaire: "u2" };
const sansProprietaire = [
  { id: "c", proprietaire: null },
  { id: "d" },
  { id: "e", proprietaire: "" },
];

test("peutModifier : le responsable modifie tous les clients, même sans propriétaire", () => {
  for (const c of [sien, deLautre, ...sansProprietaire]) assert.equal(acces.peutModifier(mariama, c), true, c.id);
});

test("peutModifier : un commercial modifie ses clients", () => {
  assert.equal(acces.peutModifier(awa, sien), true);
});

test("peutModifier : un commercial ne modifie pas les clients des autres", () => {
  assert.equal(acces.peutModifier(awa, deLautre), false);
  assert.equal(acces.peutModifier(ibrahima, sien), false);
});

test("peutModifier : un commercial ne modifie pas un client sans propriétaire", () => {
  for (const c of sansProprietaire) assert.equal(acces.peutModifier(awa, c), false, c.id);
});

test("peutModifier : comparaison stricte, rôle inconnu et valeurs absentes refusés", () => {
  assert.equal(acces.peutModifier({ id: "1", role: "commercial" }, { id: "n", proprietaire: 1 }), false);
  assert.equal(acces.peutModifier({ id: "u1", role: "stagiaire" }, sien), false);
  assert.equal(acces.peutModifier(undefined, sien), false);
  assert.equal(acces.peutModifier(null, sien), false);
  assert.equal(acces.peutModifier(mariama, undefined), false);
  assert.equal(acces.peutModifier(awa, undefined), false);
});

test("peutReattribuer : le responsable réattribue vers un commercial existant", () => {
  assert.equal(acces.peutReattribuer(mariama, sien, "u2", utilisateurs), true);
  assert.equal(acces.peutReattribuer(mariama, sansProprietaire[0], "u1", utilisateurs), true);
});

test("peutReattribuer : un commercial ne réattribue jamais, pas même son propre client", () => {
  assert.equal(acces.peutReattribuer(awa, sien, "u2", utilisateurs), false);
  assert.equal(acces.peutReattribuer(awa, sien, "u1", utilisateurs), false);
  assert.equal(acces.peutReattribuer(awa, deLautre, "u1", utilisateurs), false);
});

test("peutReattribuer : la cible doit être un commercial existant", () => {
  assert.equal(acces.peutReattribuer(mariama, sien, "u9", utilisateurs), false, "inconnu");
  assert.equal(acces.peutReattribuer(mariama, sien, "u1 ", utilisateurs), false, "espace en trop");
  assert.equal(acces.peutReattribuer(mariama, sien, "u3", utilisateurs), false, "responsable");
  assert.equal(acces.peutReattribuer(mariama, sien, null, utilisateurs), false, "null");
  assert.equal(acces.peutReattribuer(mariama, sien, undefined, utilisateurs), false, "undefined");
  assert.equal(acces.peutReattribuer(mariama, sien, "u2", undefined), false, "pas de liste d'utilisateurs");
});

test("peutReattribuer : utilisateur ou client absent refusé", () => {
  assert.equal(acces.peutReattribuer(undefined, sien, "u2", utilisateurs), false);
  assert.equal(acces.peutReattribuer(null, sien, "u2", utilisateurs), false);
  assert.equal(acces.peutReattribuer(mariama, undefined, "u2", utilisateurs), false);
});
