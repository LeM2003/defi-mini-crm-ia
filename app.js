import { clientsVisibles, peutVoirTableauDeBord } from "./acces.js";
import { totalParEtape, totalPipeline } from "./tableau.js";

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
      carte.textContent = `${c.entreprise} — ${c.montant_fcfa} FCFA`;
      col.append(carte);
    }
    colonnes.append(col);
  }
  // Tableau de bord : réservé au responsable, rien n'est calculé ni écrit sinon
  const autorise = peutVoirTableauDeBord(moi);
  document.getElementById("tableau-de-bord").hidden = !autorise;
  document.getElementById("total").textContent = autorise ? totalPipeline(clients) + " FCFA" : "";
  document.getElementById("par-etape").textContent = autorise ? JSON.stringify(totalParEtape(clients)) : "";
}
choix.addEventListener("change", afficher);
afficher();
