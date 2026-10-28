// checkPrerequis ne vérifiait qu'un plancher minimum (PREREQUIS_FORMATION
// .niveauMin) — rien ne garantissait que le niveau visé fasse réellement
// progresser l'adhérent. Un Niveau 3 pouvait être inscrit à une formation
// N1 (niveauMin: null, donc aucun plancher), ou un Niveau 2 réinscrit à une
// nouvelle formation N2 qu'il avait déjà. Corrigé en comparant niveau_vise
// (traduit via NIVEAU_OBTENU, ex. "N2" -> "Niveau 2") au niveau actuel de
// l'adhérent sur la même échelle (NIVEAU_ORDER), plutôt qu'une égalité de
// chaîne entre deux vocabulaires différents ("N2" !== "Niveau 2") qui
// aurait toujours échoué silencieusement.
jest.mock("../src/utils/serviceClients/identiteClient");
jest.mock("../src/utils/serviceClients/activitesClient");
jest.mock("../src/utils/serviceClients/vieAssociativeClient");

const FormationService = require("../src/services/FormationService");
const identiteClient = require("../src/utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../src/utils/serviceClients/vieAssociativeClient");

const service = new FormationService();

describe("FormationService.checkPrerequis — niveau visé vs niveau actuel", () => {
  beforeEach(() => {
    vieAssociativeClient.checkDossierValidity.mockResolvedValue({ valid: true, missing: [] });
  });

  test("refuse une formation N1 pour un adhérent déjà Niveau 3 (aucun plancher ne le bloquait avant)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 3",
      nb_plongees_total: 50,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N1", "Bearer x");

    expect(errors).toContain(
      "L'adhérent a déjà le niveau Niveau 3 : le niveau visé (Niveau 1) doit être strictement supérieur",
    );
  });

  test("refuse de réinscrire à une formation N2 un adhérent déjà Niveau 2", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 2",
      nb_plongees_total: 50,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N2", "Bearer x");

    expect(errors).toContain(
      "L'adhérent a déjà le niveau Niveau 2 : le niveau visé (Niveau 2) doit être strictement supérieur",
    );
  });

  test("accepte une formation N2 pour un adhérent Niveau 1 (progression normale)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 1",
      nb_plongees_total: 20,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N2", "Bearer x");

    expect(errors).not.toEqual(
      expect.arrayContaining([expect.stringContaining("doit être strictement supérieur")]),
    );
  });

  test("n'applique pas ce contrôle à un adhérent sans niveau connu (jamais licencié)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: null,
      nb_plongees_total: 6,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N1", "Bearer x");

    expect(errors).not.toEqual(
      expect.arrayContaining([expect.stringContaining("doit être strictement supérieur")]),
    );
  });
});

// Badge Sidebar : doit passer par le COUNT léger du repository (voir
// FormationRepository.countPretesATerminer), jamais par un findAll().
describe("FormationService.getPretesATerminerCount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("délègue au COUNT léger du repository", async () => {
    jest.spyOn(service.formationRepository, "countPretesATerminer").mockResolvedValue(3);

    const result = await service.getPretesATerminerCount();

    expect(service.formationRepository.countPretesATerminer).toHaveBeenCalled();
    expect(result).toBe(3);
  });
});

// Régression : FormationList.jsx désactive déjà Modifier/Supprimer pour une
// formation "Terminée" (et maintenant "Abandonnée"), mais rien côté serveur
// n'empêchait jusqu'ici un appel API direct de contourner ce verrou purement
// visuel — voir assertFormationModifiable.
describe("FormationService.assertFormationModifiable", () => {
  test.each(["Terminée", "Abandonnée"])(
    "lève pour une formation déjà %s",
    (statut) => {
      expect(() => service.assertFormationModifiable({ statut })).toThrow(/plus modifiable/);
    },
  );

  test.each(["En cours", "Ajournée", "Suspendue"])(
    "ne lève pas pour une formation %s (pause, pas une fin de parcours)",
    (statut) => {
      expect(() => service.assertFormationModifiable({ statut })).not.toThrow();
    },
  );
});

describe("FormationService.update / delete — verrou une fois clôturée", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(["Terminée", "Abandonnée"])(
    "update refuse de modifier une formation %s",
    async (statut) => {
      jest.spyOn(service.formationRepository, "findById").mockResolvedValue({ statut, num_adherent: "ADH-1" });

      await expect(
        service.update(1, { commentaire_moniteur: "x" }, { role: "president" }),
      ).rejects.toThrow(/plus modifiable/);
    },
  );

  test.each(["Terminée", "Abandonnée"])(
    "delete refuse de supprimer une formation %s",
    async (statut) => {
      jest.spyOn(service.formationRepository, "findById").mockResolvedValue({ statut, num_adherent: "ADH-1" });

      await expect(service.delete(1, { role: "president" })).rejects.toThrow(/plus modifiable/);
    },
  );

  test("update reste possible sur une formation Ajournée", async () => {
    jest.spyOn(service.formationRepository, "findById").mockResolvedValue({
      statut: "Ajournée",
      num_adherent: "ADH-1",
      montant_total: 0,
      montant_paye: 0,
    });
    jest.spyOn(service.seanceRepository, "findByFormation").mockResolvedValue([]);
    jest.spyOn(service.formationRepository, "update").mockResolvedValue({ statut: "Ajournée" });
    jest.spyOn(service, "syncAdherentStatutFormation").mockResolvedValue(undefined);

    await expect(
      service.update(1, { commentaire_moniteur: "reprise" }, { role: "president" }),
    ).resolves.toBeDefined();
  });
});

describe("FormationService — paiement avant le début de la formation", () => {
  const jour = (delta) => {
    const d = new Date();
    d.setDate(d.getDate() + delta);
    return d;
  };

  test("accepte un paiement avant le début", () => {
    expect(() =>
      service.assertPaiementAvantDebut({ statut: "En cours", date_debut: jour(3) }),
    ).not.toThrow();
  });

  test("accepte un paiement le jour même du début", () => {
    expect(() =>
      service.assertPaiementAvantDebut({ statut: "En cours", date_debut: new Date() }),
    ).not.toThrow();
  });

  test("refuse un paiement une fois la formation commencée", () => {
    expect(() =>
      service.assertPaiementAvantDebut({ statut: "En cours", date_debut: jour(-2) }),
    ).toThrow(/avant son début/);
  });

  test("refuse un paiement sur une formation terminée, même si la date est future", () => {
    expect(() =>
      service.assertPaiementAvantDebut({ statut: "Terminée", date_debut: jour(5) }),
    ).toThrow(/avant son début/);
  });

  test("enregistrerPaiement est refusé pour une formation déjà commencée", async () => {
    jest.spyOn(service.formationRepository, "findById").mockResolvedValue({
      statut: "En cours",
      date_debut: jour(-10),
      montant_total: 200,
      montant_paye: 50,
      num_adherent: "ADH-1",
    });
    await expect(service.enregistrerPaiement(1, { montant: 50 }, { role: "tresorier" })).rejects.toThrow(
      /avant son début/,
    );
  });
});
