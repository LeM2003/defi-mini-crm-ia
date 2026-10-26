import { test } from "node:test";
import assert from "node:assert/strict";
import { clientsVisibles } from "../acces.js";

const awa = { id: "u1", role: "commercial" };
const clients = [
  { id: "a", proprietaire: "u1" },
  { id: "b", proprietaire: "u2" },
  { id: "c", proprietaire: null },
  { id: "d" },
  { id: "e", proprietaire: "" },
];

test("un commercial voit ses clients et aucun autre", () => {
  assert.deepEqual(clientsVisibles(awa, clients).map((c) => c.id), ["a"]);
});

test("un commercial ne voit pas les clients sans propriétaire", () => {
  const ids = clientsVisibles(awa, clients).map((c) => c.id);
  for (const orphelin of ["c", "d", "e"]) assert.ok(!ids.includes(orphelin), `${orphelin} ne doit pas être visible`);
});

test("le responsable voit aussi les clients sans propriétaire", () => {
  const ids = clientsVisibles({ id: "u3", role: "responsable" }, clients).map((c) => c.id);
  assert.deepEqual(ids, ["a", "b", "c", "d", "e"]);
});

test("la comparaison du propriétaire est stricte (pas de coercition de type)", () => {
  const visibles = clientsVisibles({ id: "1", role: "commercial" }, [{ id: "n", proprietaire: 1 }]);
  assert.equal(visibles.length, 0);
});
