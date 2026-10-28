const BackupService = require("../services/BackupService");
const { ValidationError, withStatus } = require("../utils/errors");
const logger = require("../utils/logger");

// Phrase à retaper pour confirmer une restauration (contrôle appliqué ICI,
// pas seulement côté frontend — voir ConfirmerRestauration dans
// ParametresPage.jsx) : une requête forgée directement contre l'API sans
// passer par l'UI ne doit pas pouvoir écraser la base sans cette
// confirmation explicite.
const PHRASE_CONFIRMATION = "RESTAURER";

class BackupController {
  constructor() {
    this.backupService = new BackupService();
  }

  async list(req, res, next) {
    try {
      const snapshots = await this.backupService.lister();
      res.json({ success: true, data: snapshots, count: snapshots.length });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async create(req, res, next) {
    try {
      const snapshot = await this.backupService.creer("manuel");
      logger.info(
        `[identite-service] Sauvegarde manuelle créée par ${req.user?.email || req.user?.id} (id ${snapshot.id}, ${snapshot.taille_octets} octets)`,
      );
      res.status(201).json({
        success: true,
        data: snapshot,
        message: "Sauvegarde créée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async download(req, res, next) {
    try {
      const snapshot = await this.backupService.recuperer(req.params.id);
      const date = new Date(snapshot.created_at).toISOString().slice(0, 10);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sauvegarde-${snapshot.id}-${date}.json"`,
      );
      res.json(snapshot.contenu);
    } catch (error) {
      next(withStatus(error, 404));
    }
  }

  async restore(req, res, next) {
    try {
      if (req.body?.confirmation !== PHRASE_CONFIRMATION) {
        throw new ValidationError(
          `Confirmation invalide : tapez "${PHRASE_CONFIRMATION}" pour valider la restauration.`,
        );
      }
      await this.backupService.restaurer(req.params.id);
      logger.warn(
        `[identite-service] Restauration de la sauvegarde ${req.params.id} déclenchée par ${req.user?.email || req.user?.id}`,
      );
      res.json({
        success: true,
        message: "Base de données restaurée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
    try {
      await this.backupService.supprimer(req.params.id);
      res.json({ success: true, message: "Sauvegarde supprimée avec succès" });
    } catch (error) {
      next(withStatus(error, 404));
    }
  }
}

module.exports = BackupController;
