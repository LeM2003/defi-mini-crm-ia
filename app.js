import { clientsVisibles, peutVoirTableauDeBord } from "./acces.js";
import { formaterFCFA, totalParEtape, totalPipeline } from "./tableau.js";

const ETAPES = ["prospect", "qualifie", "proposition", "gagne", "perdu"];
const [utilisateurs, clients] = await Promise.all([
  fetch("donnees/utilisateurs.json").then((r) => r.json()),
  fetch("donnees/clients.json").then((r) => r.json()),
]);

const choix = document.getElementById("utilisateur");
for (const u of utilisateurs) choix.add(new Option(`${u.nom} (${u.role})`, u.id));

function afficher() {
  const moi = utilisateurs.find((u) => u.id === choix.value);
  const visibles = clientsVisibles(moi, clients);
  const colonnes = document.getElementById("pipeline");
  colonnes.innerHTML = "";
  for (const etape of ETAPES) {
    const col = document.createElement("section");
    col.innerHTML = `<h2>${etape}</h2>`;
    for (const c of visibles.filter((x) => x.etape === etape)) {
      const carte = document.createElement("article");
      carte.textContent = `${c.entreprise} — ${formaterFCFA(c.montant_fcfa)}`;
      col.append(carte);
    }
    colonnes.append(col);
  }
  // Tableau de bord : réservé au responsable, rien n'est calculé ni écrit sinon
  const autorise = peutVoirTableauDeBord(moi);
  document.getElementById("tableau-de-bord").hidden = !autorise;
  const total = document.getElementById("total");
  const parEtape = document.getElementById("par-etape");
  total.textContent = "";
  parEtape.replaceChildren();
  if (autorise) {
    total.textContent = formaterFCFA(totalPipeline(clients));
    const totaux = totalParEtape(clients);
    for (const etape of ETAPES) {
      const ligne = document.createElement("li");
      ligne.textContent = `${etape} : ${formaterFCFA(totaux[etape] ?? 0)}`;
      parEtape.append(ligne);
    }
  }
}
choix.addEventListener("change", afficher);
afficher();
