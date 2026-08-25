const BaseRepository = require("./BaseRepository");
const { Sortie, Inscription } = require("../models");
const { Op } = require("sequelize");

class SortieRepository extends BaseRepository {
  constructor() {
    super(Sortie);
  }

  async findAll() {
    return await this.model.findAll({
      order: [["date_heure", "ASC"]],
    });
  }

  async findById(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
    });
  }

  async findUpcoming() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_heure: { [Op.gte]: today },
        statut: { [Op.in]: ["Planifiée", "En cours"] },
      },
      order: [["date_heure", "ASC"]],
    });
  }

  // Légère (pas d'infos adhérent) : utilisée pour calculer le nombre de
  // places restantes sans exposer les coordonnées des inscrits à toute
  // personne consultant la liste des sorties.
  async findAllWithInscriptionCounts() {
    return await this.model.findAll({
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          attributes: ["id_inscription", "statut"],
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  async findUpcomingWithInscriptionCounts() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_heure: { [Op.gte]: today },
        statut: { [Op.in]: ["Planifiée", "En cours"] },
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          attributes: ["id_inscription", "statut"],
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // Adherent (identite-service) a quitté ce schéma : plus d'include imbriqué
  // ici — voir SortieService qui recompose `.inscriptions[].adherent` via
  // identiteClient après cet appel.
  async findAllWithInscriptions() {
    return await this.model.findAll({
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  async findByIdWithPointage(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  async findByIdWithInscriptions(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  // Sorties du lendemain (jour calendaire), avec inscriptions incluses —
  // base du rappel 24h avant sortie (CDC 3.2.2).
  async findDemainAvecInscriptions() {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
    return await this.model.findAll({
      where: {
        date_heure: { [Op.between]: [debut, fin] },
        statut: { [Op.ne]: "Annulée" },
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  // Sorties "Planifiée" localisées (latitude/longitude renseignées — voir le
  // commentaire du modèle Sortie sur pourquoi le lieu texte seul ne suffit
  // pas) dans les `withinDays` prochains jours — base de la vérification
  // météo automatique (SortieService.verifierMeteoEtAnnulerSiDangereux).
  async findPlanifieesAVenirAvecCoordonnees(withinDays) {
    const now = new Date();
    const limite = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return await this.model.findAll({
      where: {
        statut: "Planifiée",
        date_heure: { [Op.gte]: now, [Op.lte]: limite },
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // Sorties "Planifiée" dans les `withinDays` prochains jours, pas encore
  // signalées comme sans inscription (alerte_sans_inscription_envoyee) —
  // voir SortieService.alerterSortiesSansInscription. Le comptage réel des
  // inscriptions (hors "Annulée") se fait côté service, pas ici : filtrer
  // sur une jointure comptée serait plus lourd que de le faire en JS sur un
  // jeu de résultats déjà réduit à quelques sorties par jour.
  async findPlanifieesSansAlerteInscriptionAvant(withinDays) {
    const now = new Date();
    const limite = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return await this.model.findAll({
      where: {
        statut: "Planifiée",
        date_heure: { [Op.gte]: now, [Op.lte]: limite },
        alerte_sans_inscription_envoyee: false,
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // Sorties "Planifiée" dans les `withinDays` prochains jours, pas encore
  // signalées comme sous-remplies (alerte_remplissage_envoyee) — voir
  // SortieService.alerterSortiesSousRemplies. Même construction que
  // findPlanifieesSansAlerteInscriptionAvant ci-dessus (le calcul du taux de
  // remplissage réel se fait côté service via attachCapacity, pas ici).
  async findPlanifieesSansAlerteRemplissageAvant(withinDays) {
    const now = new Date();
    const limite = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return await this.model.findAll({
      where: {
        statut: "Planifiée",
        date_heure: { [Op.gte]: now, [Op.lte]: limite },
        alerte_remplissage_envoyee: false,
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // Toutes les sorties non annulées autres que `id_sortie_exclue`, allégé
  // aux seuls champs nécessaires au test de chevauchement horaire
  // (sortieOverlap.sortiesSeChevauchent) — utilisé pour proposer des dates
  // de remplacement à une sortie annulée qui ne chevauchent aucune autre
  // sortie existante.
  async findAutresPourChevauchement(id_sortie_exclue) {
    return await this.model.findAll({
      where: {
        id_sortie: { [Op.ne]: id_sortie_exclue },
        statut: { [Op.ne]: "Annulée" },
      },
      attributes: ["id_sortie", "date_heure", "duree_estimee"],
    });
  }

  // Fait passer automatiquement "Planifiée" -> "En cours" toute sortie dont
  // l'heure de départ est atteinte — jusqu'ici un passage 100% manuel (et en
  // pratique jamais fait : aucun bouton dédié dans l'UI, seul le champ
  // générique "Statut" du formulaire de modification permettait de le faire,
  // uniquement tant que la sortie était encore "Planifiée"). Voir
  // SortieService.demarrerSortiesEchues (appelée en tâche de fond,
  // app.js:startBackgroundJobs). Ne touche jamais "Terminée"/"Annulée", qui
  // restent des décisions humaines (cf. l'alerte needsStatusUpdate de
  // SortieDetails.jsx).
  async demarrerSortiesEchues() {
    const now = new Date();
    const [count] = await this.model.update(
      { statut: "En cours" },
      { where: { date_heure: { [Op.lte]: now }, statut: "Planifiée" } },
    );
    return count;
  }

  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }

  // Verrou pessimiste ("SELECT ... FOR UPDATE") sur la ligne de la sortie,
  // à tenir le temps de compter les inscriptions Confirmée puis d'écrire la
  // nouvelle inscription/le nouveau statut dans la même transaction —
  // empêche deux confirmations concurrentes de lire toutes les deux
  // "1 place restante" et de faire passer nb_inscrits au-dessus de
  // nb_places (vérifié "check-then-act" sans verrou jusqu'ici). Sans
  // include (comme findById avec `options.lock` dans InscriptionRepository) :
  // Postgres/Sequelize ignore silencieusement FOR UPDATE sur une requête
  // avec jointure.
  async lockForCapacityCheck(id, transaction) {
    return await this.model.findOne({
      where: { id_sortie: id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
}

module.exports = SortieRepository;
