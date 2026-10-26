import { test } from "node:test";
import assert from "node:assert/strict";
import * as pipeline from "../pipeline.js";

const awa = { id: "u1", role: "commercial" };
const ibrahima = { id: "u2", role: "commercial" };
const mariama = { id: "u3", role: "responsable" };
const utilisateurs = [awa, ibrahima, mariama];

const sien = Object.freeze({ id: "a", etape: "prospect", contact: "Contact 01", telephone: "+221 77 000 01 11", montant_fcfa: 150000, proprietaire: "u1" });
const deLautre = Object.freeze({ ...sien, id: "b", proprietaire: "u2" });
const orphelin = Object.freeze({ ...sien, id: "c", proprietaire: null });

const refuse = (fn, message) => assert.throws(fn, (e) => e instanceof pipeline.ActionRefusee && (!message || message.test(e.message)), String(message));

test("ActionRefusee est une erreur", () => {
  assert.ok(new pipeline.ActionRefusee("x") instanceof Error);
});

test("deplacerClient : le responsable déplace n'importe quel client", () => {
  for (const c of [sien, deLautre, orphelin]) assert.deepEqual(pipeline.deplacerClient(mariama, c, "gagne"), { etape: "gagne" });
});

test("deplacerClient : un commercial déplace ses clients, vers n'importe quelle étape", () => {
  for (const etape of ["prospect", "qualifie", "proposition", "gagne", "perdu"]) {
    assert.deepEqual(pipeline.deplacerClient(awa, sien, etape), { etape });
  }
});

test("deplacerClient : refusé pour un client d'un autre commercial ou sans propriétaire", () => {
  refuse(() => pipeline.deplacerClient(awa, deLautre, "gagne"));
  refuse(() => pipeline.deplacerClient(awa, orphelin, "gagne"));
  refuse(() => pipeline.deplacerClient(undefined, sien, "gagne"));
});

test("deplacerClient : étape inconnue refusée, même pour le responsable", () => {
  for (const etape of ["archive", "", undefined, null, "Gagne"]) refuse(() => pipeline.deplacerClient(mariama, sien, etape), /étape/i);
});

test("modifierFiche : renvoie les champs nettoyés, montant en nombre", () => {
  const champs = pipeline.modifierFiche(awa, sien, { contact: "  Fatou Diop ", telephone: " +221 77 123 45 67 ", montant_fcfa: "90000" });
  assert.deepEqual(champs, { contact: "Fatou Diop", telephone: "+221 77 123 45 67", montant_fcfa: 90000 });
});

test("modifierFiche : le responsable modifie un client sans propriétaire, un commercial non", () => {
  const fiche = { contact: "Fatou Diop", telephone: "+221 77 123 45 67", montant_fcfa: 1000 };
  assert.equal(pipeline.modifierFiche(mariama, orphelin, fiche).montant_fcfa, 1000);
  refuse(() => pipeline.modifierFiche(awa, orphelin, fiche));
  refuse(() => pipeline.modifierFiche(awa, deLautre, fiche));
  refuse(() => pipeline.modifierFiche(ibrahima, sien, fiche));
});

test("modifierFiche : montant non numérique ou négatif refusé", () => {
  for (const m of ["abc", -5, "-5", "", "   ", null, undefined, NaN]) {
    refuse(() => pipeline.modifierFiche(awa, sien, { contact: "Fatou", telephone: "+221 77 123 45 67", montant_fcfa: m }), /montant/i);
  }
});

test("modifierFiche : contact et téléphone obligatoires, téléphone de forme valide", () => {
  const base = { contact: "Fatou", telephone: "+221 77 123 45 67", montant_fcfa: 1 };
  for (const contact of ["", "   ", undefined, null]) refuse(() => pipeline.modifierFiche(awa, sien, { ...base, contact }), /contact/i);
  for (const telephone of ["", "   ", undefined, null, "abc", "12", "+221 77 <b>", "77 12 34 56 78 90 12 34 56 78 90"]) {
    refuse(() => pipeline.modifierFiche(awa, sien, { ...base, telephone }), /téléphone/i);
  }
  assert.equal(pipeline.modifierFiche(awa, sien, { ...base, telephone: "77 123 45 67" }).telephone, "77 123 45 67");
});

test("reattribuerClient : le responsable réattribue vers un commercial", () => {
  assert.deepEqual(pipeline.reattribuerClient(mariama, sien, "u2", utilisateurs), { proprietaire: "u2" });
  assert.deepEqual(pipeline.reattribuerClient(mariama, orphelin, "u1", utilisateurs), { proprietaire: "u1" });
});

test("reattribuerClient : refusé à un commercial, ou vers une cible invalide", () => {
  refuse(() => pipeline.reattribuerClient(awa, sien, "u2", utilisateurs));
  refuse(() => pipeline.reattribuerClient(mariama, sien, "u3", utilisateurs));
  refuse(() => pipeline.reattribuerClient(mariama, sien, "u9", utilisateurs));
  refuse(() => pipeline.reattribuerClient(mariama, sien, null, utilisateurs));
});

test("etapeVoisine : étape précédente ou suivante, null aux extrémités", () => {
  assert.equal(pipeline.etapeVoisine("prospect", 1), "qualifie");
  assert.equal(pipeline.etapeVoisine("gagne", 1), "perdu");
  assert.equal(pipeline.etapeVoisine("proposition", -1), "qualifie");
  assert.equal(pipeline.etapeVoisine("prospect", -1), null);
  assert.equal(pipeline.etapeVoisine("perdu", 1), null);
  assert.equal(pipeline.etapeVoisine("inconnue", 1), null);
});
