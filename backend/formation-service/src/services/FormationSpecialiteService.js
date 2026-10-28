const BaseService = require("./BaseService");
const FormationSpecialiteRepository = require("../repositories/FormationSpecialiteRepository");
const identiteClient = require("../utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const { isNiveauCompatible } = require("../utils/roleScope");

const TYPES_SPECIALITE = [
  "Nitrox",
  "Plongée profonde",
  "Plongée nocturne",
  "Photo sous-marine",
];

// Prérequis unique pour les 4 spécialités (contrairement aux niveaux N1-N4 qui
// ont chacun leurs propres seuils) — niveau 2 minimum, cohérent avec les
// pratiques réelles des fédérations de plongée.
const NIVEAU_MIN_SPECIALITE = "Niveau 2";

class FormationSpecialiteService extends BaseService {
  constructor() {
    const repository = new FormationSpecialiteRepository();
    super(repository);
    this.formationSpecialiteRepository = repository;
  }

  async getByAdherent(num_adherent) {
    return await this.formationSpecialiteRepository.findByAdherent(num_adherent);
  }

  async getByMoniteur(id_moniteur) {
    return await this.formationSpecialiteRepository.findByMoniteur(id_moniteur);
  }

  // Une spécialité clôturée ("Terminée" : acquise, "Abandonnée" : parcours
  // arrêté) ne doit plus pouvoir être modifiée ni supprimée — même principe
  // que FormationService.assertFormationModifiable (verrou une fois l'état
  // final atteint, "En cours" restant seul état encore modifiable).
  // Contrairement à une formation (séances/compétences à vérifier avant de
  // clôturer via une route dédiée), une spécialité n'a aucun sous-critère à
  // contrôler : la transition vers "Terminée"/"Abandonnée" elle-même reste
  // donc accessible depuis le formulaire d'édition générique — seul un
  // retour en arrière une fois close est bloqué.
  assertSpecialiteModifiable(specialite) {
    if (specialite.statut === "Terminée" || specialite.statut === "Abandonnée") {
      throw new Error(
        `Cette spécialité est ${specialite.statut === "Terminée" ? "terminée" : "abandonnée"} : elle n'est plus modifiable.`,
      );
    }
  }

  async update(id, data) {
    const specialite = await this.formationSpecialiteRepository.findById(id);
    if (!specialite) throw new Error("Spécialité non trouvée");
    this.assertSpecialiteModifiable(specialite);
    return await this.formationSpecialiteRepository.update(id, data);
  }

  async delete(id) {
    const specialite = await this.formationSpecialiteRepository.findById(id);
    if (!specialite) throw new Error("Spécialité non trouvée");
    this.assertSpecialiteModifiable(specialite);
    return await this.formationSpecialiteRepository.delete(id);
  }

  async validateData(data, authHeader) {
    const errors = [];
    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.id_moniteur) errors.push("Le moniteur est requis");
    if (!data.type_specialite) errors.push("Le type de spécialité est requis");
    if (data.type_specialite && !TYPES_SPECIALITE.includes(data.type_specialite)) {
      errors.push(`Spécialité invalide (attendu : ${TYPES_SPECIALITE.join(", ")})`);
    }
    if (!data.date_debut) errors.push("La date de début est requise");

    if (data.num_adherent) {
      const prerequisErrors = await this.checkPrerequis(data.num_adherent, authHeader);
      errors.push(...prerequisErrors);
    }

    if (data.id_moniteur) {
      const moniteur = await identiteClient.getMoniteurById(data.id_moniteur, authHeader);
      if (!moniteur) errors.push("Moniteur introuvable");
    }

    return errors;
  }

  async checkPrerequis(num_adherent, authHeader) {
    const errors = [];

    const adherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!adherent) return ["Adhérent introuvable"];

    if (!isNiveauCompatible(adherent.niveau, NIVEAU_MIN_SPECIALITE)) {
      errors.push(`Niveau insuffisant (niveau minimum requis : ${NIVEAU_MIN_SPECIALITE})`);
    }

    const dossier = await vieAssociativeClient.checkDossierValidity(num_adherent, authHeader);
    if (!dossier.valid) {
      errors.push(`Dossier d'adhésion incomplet (manquant : ${dossier.missing.join(", ")})`);
    }

    return errors;
  }
}

module.exports = FormationSpecialiteService;
module.exports.TYPES_SPECIALITE = TYPES_SPECIALITE;
