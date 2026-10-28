// Couvre uniquement la nouvelle logique d'autorisation de confirmInscription
// (auto-reconfirmation après replanification météo, voir Inscription.
// reconfirmation_requise et SortieService.replanifier) — le reste de la
// méthode (capacité verrouillée par transaction Sequelize, promotion liste
// d'attente...) n'était déjà pas couvert par un test unitaire avant ce
// changement ; ce fichier ne réintroduit un mock de sequelize.transaction
// que pour le seul test qui en a besoin (succès), sans généraliser ce
// pattern au reste du service.
jest.mock("../../src/utils/serviceClients/identiteClient", () => ({
  getAdherentForUser: jest.fn(),
  getMoniteurByUserId: jest.fn(),
  getAdherentById: jest.fn(),
}));
jest.mock("../../src/utils/serviceClients/vieAssociativeClient", () => ({
  checkDossierValidity: jest.fn(),
  checkCertificateStatus: jest.fn(),
}));

const InscriptionService = require("../../src/services/InscriptionService");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../../src/utils/serviceClients/vieAssociativeClient");
const { sequelize } = require("../../src/models");

const service = new InscriptionService();

describe("InscriptionService.confirmInscription — autorisation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getAdherentForUser.mockReset();
  });

  const managerUser = { id: 1, role: "president" };
  const adherentUser = { id: 2, role: "adherent" };

  test("un gestionnaire peut toujours confirmer, reconfirmation_requise ou non", async () => {
    // statut déjà "Confirmée" : le court-circuit juste après les contrôles
    // d'autorisation renvoie l'inscription telle quelle, sans jamais entrer
    // dans la transaction — suffisant pour prouver qu'aucune erreur
    // d'autorisation n'est levée pour un gestionnaire.
    jest.spyOn(service, "getById").mockResolvedValue({
      id_inscription: 1,
      statut: "Confirmée",
      reconfirmation_requise: false,
      num_adherent: "A1",
    });

    const result = await service.confirmInscription(1, managerUser);

    expect(result.statut).toBe("Confirmée");
    expect(identiteClient.getAdherentForUser).not.toHaveBeenCalled();
  });

  test("un adhérent ne peut pas confirmer une inscription 'En attente' ordinaire (reconfirmation_requise=false)", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      id_inscription: 1,
      statut: "En attente",
      reconfirmation_requise: false,
      num_adherent: "A1",
    });

    await expect(service.confirmInscription(1, adherentUser)).rejects.toThrow(
      "Seul un gestionnaire peut confirmer une inscription",
    );
    expect(identiteClient.getAdherentForUser).not.toHaveBeenCalled();
  });

  test("un adhérent ne peut pas reconfirmer l'inscription d'un AUTRE adhérent", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      id_inscription: 1,
      statut: "En attente",
      reconfirmation_requise: true,
      num_adherent: "A1",
    });
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A2" });

    await expect(service.confirmInscription(1, adherentUser)).rejects.toThrow(
      "Accès refusé à cette inscription",
    );
  });

  test("un adhérent peut reconfirmer SA PROPRE inscription remise en attente après replanification météo", async () => {
    const inscription = {
      id_inscription: 1,
      statut: "En attente",
      reconfirmation_requise: true,
      num_adherent: "A1",
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(service, "getById").mockResolvedValue(inscription);
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A1" });
    jest.spyOn(sequelize, "transaction").mockImplementation((cb) => cb({}));
    jest.spyOn(service.waitlistService, "getSortieCapacityLocked").mockResolvedValue({
      placesDisponibles: 3,
    });
    jest.spyOn(service, "assertNoConfirmedOverlap").mockResolvedValue(undefined);
    jest.spyOn(service.waitlistService, "normalizeWaitlistRanks").mockResolvedValue(undefined);

    const result = await service.confirmInscription(1, adherentUser);

    expect(result.statut).toBe("Confirmée");
    expect(result.reconfirmation_requise).toBe(false);
    expect(inscription.save).toHaveBeenCalled();
  });

  test("un adhérent en reconfirmation_requise reste bloqué si plus aucune place n'est disponible", async () => {
    const inscription = {
      id_inscription: 1,
      statut: "En attente",
      reconfirmation_requise: true,
      num_adherent: "A1",
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(service, "getById").mockResolvedValue(inscription);
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A1" });
    jest.spyOn(sequelize, "transaction").mockImplementation((cb) => cb({}));
    jest.spyOn(service.waitlistService, "getSortieCapacityLocked").mockResolvedValue({
      placesDisponibles: 0,
    });

    await expect(service.confirmInscription(1, adherentUser)).rejects.toThrow(
      "Plus de places disponibles",
    );
    expect(inscription.save).not.toHaveBeenCalled();
  });
});

// Régression sécurité : canManageInscriptions (rôle générique) ouvrait la
// gestion d'une inscription (confirmer/annuler/supprimer/modifier) à
// N'IMPORTE QUEL moniteur, y compris sur une sortie confiée à un autre —
// même garde-fou que SortieService.assertCanManageSortie /
// PlongeeService.assertCanManagePlongee, jamais appliqué ici jusqu'ici.
describe("InscriptionService.assertCanManageInscription", () => {
  afterEach(() => {
    identiteClient.getMoniteurByUserId.mockReset();
  });

  const sortieEncadreeParM1 = { encadrants: [10] };
  const inscriptionSurCetteSortie = { sortie: sortieEncadreeParM1 };

  test("le président a toujours accès, sans résoudre de moniteur", async () => {
    await expect(
      service.assertCanManageInscription(inscriptionSurCetteSortie, { id: 1, role: "president" }),
    ).resolves.toBeUndefined();
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });

  test("le trésorier a toujours accès (ne pilote jamais d'encadrement), sans résoudre de moniteur", async () => {
    await expect(
      service.assertCanManageInscription(inscriptionSurCetteSortie, { id: 2, role: "tresorier" }),
    ).resolves.toBeUndefined();
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });

  test("un moniteur NON désigné encadrant de cette sortie est refusé", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

    await expect(
      service.assertCanManageInscription(inscriptionSurCetteSortie, { id: 3, role: "moniteur" }),
    ).rejects.toThrow(/désigné encadrant/);
  });

  test("un moniteur désigné encadrant de cette sortie a accès", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });

    await expect(
      service.assertCanManageInscription(inscriptionSurCetteSortie, { id: 4, role: "moniteur" }),
    ).resolves.toBeUndefined();
  });
});

// Vérifie que le garde-fou ci-dessus est bien branché sur une vraie action
// de gestion — cancelInscription plutôt que confirmInscription/update/delete
// (déjà branchés de façon identique) car c'est la plus simple à isoler sans
// mock de transaction Sequelize supplémentaire.
describe("InscriptionService.cancelInscription — moniteur non encadrant refusé", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockReset();
  });

  test("un moniteur non désigné encadrant de la sortie ne peut pas annuler l'inscription d'un autre", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      id_inscription: 1,
      statut: "Confirmée",
      num_adherent: "A1",
      sortie: { encadrants: [10] },
    });
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

    await expect(
      service.cancelInscription(1, { id: 3, role: "moniteur" }),
    ).rejects.toThrow(/désigné encadrant/);
  });

  test("un moniteur désigné encadrant de la sortie peut annuler l'inscription", async () => {
    const inscription = {
      id_inscription: 1,
      statut: "Confirmée",
      num_adherent: "A1",
      sortie: { encadrants: [10] },
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(service, "getById").mockResolvedValue(inscription);
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });
    jest.spyOn(service.waitlistService, "promoteNextFromWaitlist").mockResolvedValue(undefined);

    const result = await service.cancelInscription(1, { id: 4, role: "moniteur" });

    expect(result.statut).toBe("Annulée");
    expect(inscription.save).toHaveBeenCalled();
  });
});

// Régression : createInscription restait ouverte à tout moniteur (voir
// commentaire d'assertCanManageInscription plus haut) SANS jamais vérifier
// s'il est l'encadrant désigné avant d'accepter le `statut` qu'il choisit —
// un moniteur pouvait donc confirmer/mettre en liste d'attente directement
// une inscription sur une sortie qu'il n'encadre pas. Le statut doit
// désormais être figé à "En attente" pour un moniteur non désigné encadrant.
describe("InscriptionService.createInscription — statut figé pour un moniteur non encadrant", () => {
  const sortieFixture = {
    id_sortie: 1,
    statut: "Planifiée",
    date_heure: "2099-01-01T08:00:00.000Z",
    date_ouverture_inscriptions: null,
    niveau_requis: null,
    profondeur_max: 15,
    type: "Plongée",
    encadrants: [10],
    nb_places: 6,
    tarif_adherent: 0,
  };
  const adherentFixture = { num_adherent: "A1", niveau: "Niveau 2" };

  const setupCommonMocks = () => {
    jest.spyOn(service, "getByAdherentAndSortie").mockResolvedValue(null);
    jest.spyOn(service.sortieService, "getById").mockResolvedValue(sortieFixture);
    identiteClient.getAdherentById.mockResolvedValue(adherentFixture);
    vieAssociativeClient.checkDossierValidity.mockResolvedValue({ valid: true });
    vieAssociativeClient.checkCertificateStatus.mockResolvedValue({ hasValidCertificate: true });
    jest.spyOn(sequelize, "transaction").mockImplementation((cb) => cb({}));
    jest.spyOn(service.waitlistService, "getSortieCapacityLocked").mockResolvedValue({
      placesDisponibles: 5,
    });
    jest.spyOn(service.inscriptionRepository, "create").mockImplementation((data) =>
      Promise.resolve({ id_inscription: 1, ...data }),
    );
    jest.spyOn(service, "assertNoConfirmedOverlap").mockResolvedValue(undefined);
  };

  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockReset();
    identiteClient.getAdherentById.mockReset();
  });

  test("un moniteur NON désigné encadrant de la sortie ne peut pas choisir le statut : figé à 'En attente'", async () => {
    setupCommonMocks();
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

    const result = await service.createInscription({
      num_adherent: "A1",
      id_sortie: 1,
      statut: "Confirmée",
      role: "moniteur",
      user: { id: 3, role: "moniteur" },
    });

    expect(result.statut).toBe("En attente");
    expect(result.rang_liste_attente).toBeNull();
    expect(result.date_confirmation).toBeNull();
  });

  test("un moniteur désigné encadrant de la sortie peut choisir le statut normalement", async () => {
    setupCommonMocks();
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });

    const result = await service.createInscription({
      num_adherent: "A1",
      id_sortie: 1,
      statut: "Confirmée",
      role: "moniteur",
      user: { id: 4, role: "moniteur" },
    });

    expect(result.statut).toBe("Confirmée");
  });

  test("le président peut toujours choisir le statut, sans jamais résoudre de moniteur", async () => {
    setupCommonMocks();

    const result = await service.createInscription({
      num_adherent: "A1",
      id_sortie: 1,
      statut: "Confirmée",
      role: "president",
      user: { id: 1, role: "president" },
    });

    expect(result.statut).toBe("Confirmée");
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });
});

// Régression perf : getAll() ci-dessus recompose `.adherent` de CHAQUE
// inscription par HTTP (withAdherent) — le badge Sidebar.jsx n'a besoin que
// d'un chiffre, pas de ces objets. getPendingCount doit passer par le COUNT
// léger du repository (InscriptionRepository.countPending) et ne jamais
// charger ni enrichir la moindre ligne.
describe("InscriptionService.getPendingCount", () => {
  test("délègue au COUNT léger du repository, sans charger ni enrichir les lignes", async () => {
    jest.spyOn(service.inscriptionRepository, "countPending").mockResolvedValue(5);
    jest.spyOn(service.inscriptionRepository, "findAll");
    jest.spyOn(identiteClient, "getAdherentForUser");

    const count = await service.getPendingCount();

    expect(count).toBe(5);
    expect(service.inscriptionRepository.countPending).toHaveBeenCalled();
    expect(service.inscriptionRepository.findAll).not.toHaveBeenCalled();
    expect(identiteClient.getAdherentForUser).not.toHaveBeenCalled();
  });
});

// Un moniteur ne voit que les inscriptions des sorties dont il est désigné
// encadrant (Sortie.encadrants) ; le président/trésorier voient tout.
describe("InscriptionService — périmètre du moniteur (getAll / getPendingCount)", () => {
  const inscriptions = [
    { id_inscription: 1, statut: "En attente", sortie: { encadrants: [7] } },
    { id_inscription: 2, statut: "En attente", sortie: { encadrants: [8] } },
    { id_inscription: 3, statut: "Confirmée", sortie: { encadrants: [7, 8] } },
    { id_inscription: 4, statut: "En attente", sortie: { encadrants: [] } },
  ];
  const moniteurUser = { id: 10, role: "moniteur" };

  beforeEach(() => {
    identiteClient.getAdherentForUser.mockReset().mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockReset().mockResolvedValue({ id_moniteur: 7 });
    jest.spyOn(service.inscriptionRepository, "findAll").mockResolvedValue(inscriptions);
    jest.spyOn(service.inscriptionRepository, "findPending").mockResolvedValue(
      inscriptions.filter((i) => i.statut === "En attente"),
    );
    jest.spyOn(service.inscriptionRepository, "countPending").mockResolvedValue(3);
  });
  afterEach(() => jest.restoreAllMocks());

  test("getAll : le moniteur n'obtient que les inscriptions de ses sorties", async () => {
    const result = await service.filterForMoniteur(inscriptions, moniteurUser);
    expect(result.map((i) => i.id_inscription)).toEqual([1, 3]);
  });

  test("getAll : un moniteur sans fiche identifiable ne voit rien", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue(null);
    expect(await service.filterForMoniteur(inscriptions, moniteurUser)).toEqual([]);
  });

  test("getPendingCount : un moniteur ne compte que les 'En attente' de ses sorties", async () => {
    expect(await service.getPendingCount(moniteurUser)).toBe(1);
  });

  test("getPendingCount : le président garde le compte global via le COUNT léger", async () => {
    expect(await service.getPendingCount({ id: 1, role: "president" })).toBe(3);
    expect(service.inscriptionRepository.findPending).not.toHaveBeenCalled();
  });
});

describe("InscriptionWaitlistService.cancelOverlappingOthers — annulation auto des chevauchements", () => {
  const sortieConfirmee = {
    id_sortie: 1,
    date_heure: "2026-10-10T09:00:00.000Z",
    duree_estimee: "03:00:00",
  };
  const mk = (id, statut, id_sortie, date_heure, duree_estimee = "02:00:00") => ({
    id_inscription: id,
    id_sortie,
    statut,
    rang_liste_attente: statut === "Liste d'attente" ? 2 : null,
    sortie: { id_sortie, date_heure, duree_estimee },
    save: jest.fn().mockResolvedValue(undefined),
  });

  test("annule les inscriptions en attente / liste d'attente qui chevauchent, pas les autres", async () => {
    const enAttente = mk(10, "En attente", 2, "2026-10-10T10:00:00.000Z");
    const listeAttente = mk(11, "Liste d'attente", 3, "2026-10-10T11:00:00.000Z");
    const autreCreneau = mk(12, "En attente", 4, "2026-10-10T15:00:00.000Z");
    const autreJour = mk(13, "En attente", 5, "2026-10-11T09:00:00.000Z");
    const confirmeeElleMeme = mk(14, "Confirmée", 1, sortieConfirmee.date_heure);
    jest
      .spyOn(service.waitlistService.inscriptionRepository, "findByAdherent")
      .mockResolvedValue([enAttente, listeAttente, autreCreneau, autreJour, confirmeeElleMeme]);
    const normalize = jest
      .spyOn(service.waitlistService, "normalizeWaitlistRanks")
      .mockResolvedValue(undefined);

    const annulees = await service.waitlistService.cancelOverlappingOthers(
      "ADH-1",
      sortieConfirmee,
      14,
    );

    expect(annulees.map((i) => i.id_inscription)).toEqual([10, 11]);
    expect(enAttente.statut).toBe("Annulée");
    expect(listeAttente.statut).toBe("Annulée");
    expect(listeAttente.rang_liste_attente).toBeNull();
    expect(autreCreneau.statut).toBe("En attente");
    expect(autreJour.statut).toBe("En attente");
    expect(confirmeeElleMeme.save).not.toHaveBeenCalled();
    // Seule la sortie dont une liste d'attente a perdu quelqu'un est renumérotée.
    expect(normalize).toHaveBeenCalledTimes(1);
    expect(normalize).toHaveBeenCalledWith(3);
  });

  test("ne fait jamais échouer la confirmation en cas d'erreur", async () => {
    jest
      .spyOn(service.waitlistService.inscriptionRepository, "findByAdherent")
      .mockRejectedValue(new Error("db down"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      service.waitlistService.cancelOverlappingOthers("ADH-1", sortieConfirmee, 1),
    ).resolves.toEqual([]);
  });
});
