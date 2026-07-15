const formationClient = require("../utils/serviceClients/formationClient");
const materielClient = require("../utils/serviceClients/materielClient");
const paiementClient = require("../utils/serviceClients/paiementClient");
const identiteClient = require("../utils/serviceClients/identiteClient");
const activitesClient = require("../utils/serviceClients/activitesClient");

class DashboardService {
  // Un badge de tendance par carte du dashboard : nombre (ou montant) de la
  // période en cours vs la période équivalente précédente. Chaque tendance
  // vient désormais de son microservice respectif par HTTP (plus aucun
  // modèle de ce dashboard ne vit dans ce process) — si un service est
  // indisponible, on dégrade silencieusement plutôt que de faire planter
  // tout le dashboard.
  async getTrends() {
    const degradedTrend = { current: 0, previous: 0, trend: "+0%", trendUp: true };
    const [adherents, sorties, chiffreAffaires, formations, plongees, materiel] =
      await Promise.all([
        identiteClient.getTrend().catch(() => degradedTrend),
        activitesClient.getSortiesTrend().catch(() => degradedTrend),
        paiementClient.getTrend().catch(() => degradedTrend),
        formationClient.getTrend().catch(() => degradedTrend),
        activitesClient.getPlongeesTrend().catch(() => degradedTrend),
        materielClient.getTrend().catch(() => degradedTrend),
      ]);

    return { adherents, sorties, chiffreAffaires, formations, plongees, materiel };
  }
}

module.exports = DashboardService;
