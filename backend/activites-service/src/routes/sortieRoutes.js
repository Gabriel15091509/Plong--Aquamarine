const express = require("express");
const router = express.Router();
const SortieController = require("../controllers/SortieController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const sortieController = new SortieController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  sortieController.getAll.bind(sortieController),
);
router.get(
  "/upcoming",
  AuthMiddleware.authenticate,
  sortieController.getUpcomingSorties.bind(sortieController),
);
router.get(
  "/with-inscriptions",
  AuthMiddleware.authenticate,
  sortieController.getSortiesWithInscriptions.bind(sortieController),
);
router.get(
  "/available-places",
  AuthMiddleware.authenticate,
  sortieController.getAvailablePlaces.bind(sortieController),
);
router.get("/stats", sortieController.getStats.bind(sortieController));
router.get("/trend", sortieController.getTrend.bind(sortieController));
router.get("/taux-remplissage", sortieController.getTauxRemplissage.bind(sortieController));
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  sortieController.getById.bind(sortieController),
);
router.get(
  "/:id/details",
  AuthMiddleware.authenticate,
  sortieController.getSortieDetails.bind(sortieController),
);

// Réservé aux participants (SortieService.assertCanAccessPhotos) — le rôle
// générique n'est pas restreint ici (contrairement à /pointage plus bas) :
// un adhérent doit pouvoir y accéder, la restriction fine se fait dans le
// service, qui a besoin de charger la sortie/l'inscription au préalable.
router.get(
  "/:id/photos",
  AuthMiddleware.authenticate,
  sortieController.getPhotos.bind(sortieController),
);
router.post(
  "/:id/photos",
  AuthMiddleware.authenticate,
  sortieController.addPhotos.bind(sortieController),
);
router.delete(
  "/:id/photos/:photoId",
  AuthMiddleware.authenticate,
  sortieController.removePhoto.bind(sortieController),
);

router.get(
  "/:id/meteo",
  AuthMiddleware.authenticate,
  sortieController.getPrevisionMeteo.bind(sortieController),
);

// Annulation manuelle pour météo dangereuse — réservée au président/moniteur
// (même rôle que la modification/suppression d'une sortie), voir
// SortieService.annulerPourMeteo.
router.post(
  "/:id/annuler-meteo",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.annulerPourMeteo.bind(sortieController),
);

// Dates de repli proposées pour une sortie annulée météo — lecture seule,
// même garde d'accès que /:id/meteo (n'importe quel authentifié peut la
// consulter, seul replanifier() ci-dessous est une action de gestion).
router.get(
  "/:id/propositions-reprogrammation",
  AuthMiddleware.authenticate,
  sortieController.getPropositionsReprogrammation.bind(sortieController),
);

// Reprogrammation d'une sortie annulée météo sur une nouvelle date —
// réservée au président/moniteur désigné (voir SortieService.replanifier
// /assertCanManageSortie), même rôle que l'annulation météo ci-dessus.
router.post(
  "/:id/replanifier",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.replanifier.bind(sortieController),
);

router.get(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  sortieController.getPointage.bind(sortieController),
);

// Le rôle générique (président/moniteur) est vérifié ici ; la restriction
// fine "encadrant désigné de CETTE sortie" (SortieService.assertCanManageSortie)
// se fait dans le service, qui a besoin de charger la sortie au préalable.
router.post(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.enregistrerPointage.bind(sortieController),
);

router.put(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.modifierPointage.bind(sortieController),
);

router.delete(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.annulerPointage.bind(sortieController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.validateBeforeCreate.bind(sortieController),
  sortieController.create.bind(sortieController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.update.bind(sortieController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.delete.bind(sortieController),
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post(
  "/bulk-delete",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.bulkDelete.bind(sortieController),
);

module.exports = router;
