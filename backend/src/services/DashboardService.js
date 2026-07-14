const { Op } = require("sequelize");
const {
  sequelize,
  Adherent,
  Sortie,
  Paiement,
  Formation,
  Plongee,
  Materiel,
} = require("../models");

// Compare la période "du 1er du mois en cours à aujourd'hui" à la période
// équivalente du mois précédent (mêmes bornes en nombre de jours) : comparer
// un mois en cours (partiel) à un mois précédent complet ferait apparaître
// une fausse baisse systématique tant que le mois n'est pas terminé.
function getPeriodBounds() {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastPeriod = new Date(startOfLastMonth);
  endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());
  return { startOfThisMonth, now, startOfLastMonth, endOfLastPeriod };
}

function computeTrend(current, previous) {
  let percent;
  if (previous === 0) {
    percent = current === 0 ? 0 : 100;
  } else {
    percent = ((current - previous) / previous) * 100;
  }
  const rounded = Math.round(percent);
  return {
    current,
    previous,
    trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
    trendUp: rounded >= 0,
  };
}

class DashboardService {
  async countForPeriod(model, dateField, where, start, end) {
    return await model.count({
      where: { ...where, [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }

  async sumForPeriod(model, dateField, valueField, where, start, end) {
    const result = await model.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col(valueField)), "total"]],
      where: { ...where, [dateField]: { [Op.gte]: start, [Op.lte]: end } },
      raw: true,
    });
    return Number(result?.total) || 0;
  }

  async countTrend(model, dateField, where = {}) {
    const { startOfThisMonth, now, startOfLastMonth, endOfLastPeriod } =
      getPeriodBounds();
    const [current, previous] = await Promise.all([
      this.countForPeriod(model, dateField, where, startOfThisMonth, now),
      this.countForPeriod(
        model,
        dateField,
        where,
        startOfLastMonth,
        endOfLastPeriod,
      ),
    ]);
    return computeTrend(current, previous);
  }

  async sumTrend(model, dateField, valueField, where = {}) {
    const { startOfThisMonth, now, startOfLastMonth, endOfLastPeriod } =
      getPeriodBounds();
    const [current, previous] = await Promise.all([
      this.sumForPeriod(
        model,
        dateField,
        valueField,
        where,
        startOfThisMonth,
        now,
      ),
      this.sumForPeriod(
        model,
        dateField,
        valueField,
        where,
        startOfLastMonth,
        endOfLastPeriod,
      ),
    ]);
    return computeTrend(current, previous);
  }

  // Un badge de tendance par carte du dashboard : nombre (ou montant) de la
  // période en cours vs la période équivalente précédente.
  async getTrends() {
    const [adherents, sorties, chiffreAffaires, formations, plongees, materiel] =
      await Promise.all([
        this.countTrend(Adherent, "date_inscription"),
        this.countTrend(Sortie, "date_heure"),
        this.sumTrend(Paiement, "date_paiement", "montant", { statut: "Payé" }),
        this.countTrend(Formation, "date_debut"),
        this.countTrend(Plongee, "date"),
        this.countTrend(Materiel, "date_achat"),
      ]);

    return { adherents, sorties, chiffreAffaires, formations, plongees, materiel };
  }
}

module.exports = DashboardService;
