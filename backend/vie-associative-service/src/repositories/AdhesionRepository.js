const BaseRepository = require('./BaseRepository');
const { Adhesion } = require('../models');
const { Op } = require('sequelize');

class AdhesionRepository extends BaseRepository {
  constructor() {
    super(Adhesion);
  }

  async findActiveAdhesions() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_debut: { [Op.lte]: today },
        date_fin: { [Op.gte]: today },
        statut_paiement: 'Payé'
      }
    });
  }

  async findExpiringAdhesions(days = 30) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    return await this.model.findAll({
      where: {
        date_fin: {
          [Op.between]: [today, futureDate]
        },
        statut_paiement: 'Payé'
      }
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_debut', 'DESC']]
    });
  }

  // Cherche une adhésion existante du même type, pour le même adhérent,
  // dont la période [date_debut, date_fin] chevauche celle donnée —
  // condition d'intersection classique de deux intervalles fermés
  // (A.debut <= B.fin ET A.fin >= B.debut). Les entrées "Rejeté" sont
  // ignorées : jamais actives, elles ne bloquent rien. `excludeId` sert à
  // ne pas se comparer à soi-même lors d'une modification.
  async findOverlapping(num_adherent, type, date_debut, date_fin, excludeId = null) {
    const where = {
      num_adherent,
      type,
      statut_validation: { [Op.ne]: 'Rejeté' },
      date_debut: { [Op.lte]: date_fin },
      date_fin: { [Op.gte]: date_debut },
    };
    if (excludeId) {
      where.id_adhesion = { [Op.ne]: excludeId };
    }
    return await this.model.findOne({ where });
  }

  // Adhésion "Club" déjà en base pour cet adhérent, pas encore
  // intégralement réglée ("En attente"/"Partiel" — "Annulé" est exclu : un
  // abandon ne bloque pas un renouvellement) — voir
  // AdhesionService.assertPreviousClubImpayee, qui s'en sert pour bloquer la
  // création d'une NOUVELLE adhésion Club tant que la précédente n'est pas
  // soldée. La plus ancienne d'abord (ORDER BY date_fin ASC) : c'est celle
  // que l'adhérent doit régler en premier.
  async findUnpaidClub(num_adherent) {
    return await this.model.findOne({
      where: {
        num_adherent,
        type: 'Club',
        statut_paiement: { [Op.in]: ['En attente', 'Partiel'] },
      },
      order: [['date_fin', 'ASC']],
    });
  }

  // Une ligne Adhesion (n'importe quel adhérent) qui porte déjà ce n° de
  // licence FFESM pour un AUTRE adhérent que celui donné — le n° de licence
  // est délivré une seule fois par la fédération à une personne, jamais
  // partagé (voir le même principe sur Adherent.num_licence_ffesm,
  // identite-service). `excludeId` sert à ne pas se comparer à soi-même
  // lors d'une modification.
  async findOtherAdherentWithLicence(num_licence_ffesm, num_adherent, excludeId = null) {
    const where = {
      num_licence_ffesm,
      num_adherent: { [Op.ne]: num_adherent },
    };
    if (excludeId) {
      where.id_adhesion = { [Op.ne]: excludeId };
    }
    return await this.model.findOne({ where });
  }

  // Adhérents Club distincts pour une année donnée — base du calcul du taux
  // de renouvellement (CDC 3.6.2).
  async findNumAdherentsClubByAnnee(annee) {
    const rows = await this.model.findAll({
      where: { type: 'Club', annee_adhesion: annee },
      attributes: ['num_adherent'],
      group: ['num_adherent'],
      raw: true,
    });
    return rows.map((r) => r.num_adherent);
  }

  // Badge Sidebar ("adhésions en attente de validation") : COUNT léger côté
  // serveur — même motif que InscriptionRepository.countPending.
  async countEnAttenteValidation() {
    return await this.model.count({
      where: { soumis_par_adherent: true, statut_validation: 'En attente' },
    });
  }

  async getAdhesionStats() {
    const stats = await this.model.findAll({
      attributes: [
        'type',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_adhesion')), 'count'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('montant')), 'total_amount']
      ],
      group: ['type']
    });
    return stats;
  }
}

module.exports = AdhesionRepository;
