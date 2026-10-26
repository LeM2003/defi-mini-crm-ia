// Tests sur les données : clients.json doit être cohérent (types, propriétaires existants).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clients = JSON.parse(readFileSync(new URL("../donnees/clients.json", import.meta.url), "utf8"));
const utilisateurs = JSON.parse(readFileSync(new URL("../donnees/utilisateurs.json", import.meta.url), "utf8"));

test("chaque montant_fcfa de clients.json est un nombre fini strictement positif", () => {
  for (const client of clients) {
    const m = client.montant_fcfa;
    assert.ok(
      typeof m === "number" && Number.isFinite(m) && m > 0,
      `client ${client.id} : montant_fcfa invalide ${JSON.stringify(m)} (type ${typeof m})`
    );
  }
});

test("tout propriétaire non nul de clients.json existe dans utilisateurs.json", () => {
  const ids = new Set(utilisateurs.map((u) => u.id));
  for (const client of clients) {
    if (client.proprietaire === null) continue;
    assert.ok(
      ids.has(client.proprietaire),
      `client ${client.id} : propriétaire inexistant ${JSON.stringify(client.proprietaire)}`
    );
  }
});
