const BaseService = require("./BaseService");
const BrevetRepository = require("../repositories/BrevetRepository");
const { getAdherentForUser } = require("../utils/roleScope");
const { ForbiddenError } = require("../utils/errors");

// Historique des niveaux/brevets obtenus (voir models/Brevet.js) — alimenté
// automatiquement par AdherentService.updateNiveau, jamais de création
// manuelle exposée ici. Lecture seule : président/moniteur consultent tout
// le club (menu "Brevets"), un adhérent ne voit que le sien — même principe
// de scope posé côté service, jamais côté frontend seul, que AdhesionService
// .getAll/FormationService.getAll.
class BrevetService extends BaseService {
  constructor() {
    const repository = new BrevetRepository();
    super(repository);
    this.brevetRepository = repository;
  }

  async getAll(user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent) {
      return await this.brevetRepository.findByAdherent(adherent.num_adherent);
    }
    return await this.brevetRepository.findAllWithAdherent();
  }

  async getByAdherent(num_adherent, user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent && adherent.num_adherent !== num_adherent) {
      throw new ForbiddenError("Accès refusé à ces brevets");
    }
    return await this.brevetRepository.findByAdherent(num_adherent);
  }
}

module.exports = BrevetService;
